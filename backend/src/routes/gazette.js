import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import pdf from 'pdf-parse'
import GazetteDocument from '../models/GazetteDocument.js'
import LegalContent    from '../models/LegalContent.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { 
  gazetteUploadValidation, 
  gazetteSearchValidation, 
  mongoIdValidation 
} from '../middleware/validators.js'
import { catchAsync, AppError } from '../middleware/errorHandler.js'
import { uploadLimiter } from '../middleware/rateLimiter.js'
import { paginate, paginatedResponse } from '../utils/pagination.js'
import logger from '../config/logger.js'

const router = express.Router()

// Synonym mapping for better search results
const synonymMap = {
  'theft': ['stolen', 'stole', 'steal', 'thieves', 'thief', 'robbed', 'robbery', 'burglary', 'ubujura'],
  'assault': ['hit', 'attacked', 'beaten', 'battery', 'violence', 'fight', 'gukubita'],
  'violence': ['GBV', 'domestic abuse', 'assault', 'ihohoterwa'],
  'rape': ['sexual assault', 'sexual violence', 'GBV', 'gufata ku ngufu'],
  'fraud': ['scam', 'deception', 'cheat', 'deceive', 'uburiganya'],
  'murder': ['killed', 'homicide', 'killing', 'ubwicanyi'],
  'drug': ['drugs', 'narcotics', 'substance', 'ibiyobyabwenge'],
  'corruption': ['bribery', 'bribe', 'ruswa'],
  'property': ['land', 'house', 'building', 'estate', 'umutungo']
}

// Expand query with synonyms
const expandQueryWithSynonyms = (query) => {
  const terms = query.toLowerCase().split(/\s+/)
  const expandedTerms = new Set(terms)
  
  terms.forEach(term => {
    Object.entries(synonymMap).forEach(([key, synonyms]) => {
      if (key === term || synonyms.includes(term)) {
        expandedTerms.add(key)
        synonyms.forEach(syn => expandedTerms.add(syn))
      }
    })
  })
  
  return Array.from(expandedTerms).join(' ')
}

// ── Article parsing ────────────────────────────────────────────
const parseArticles = (text) => {
  const articles = []
  // Match "Article N°123", "Article 123:", "ARTICLE 12" etc.
  const regex = /(?:Article|ARTICLE)\s+(?:N[o°]?\s*)?(\d+)\s*[:\-\.]/g
  const matches = [...text.matchAll(regex)]

  matches.forEach((match, i) => {
    const start = match.index
    const end = matches[i + 1] ? matches[i + 1].index : Math.min(start + 1500, text.length)
    const body = text.substring(start, end).trim()
    articles.push({
      number: match[1],
      title: `Article ${match[1]}`,
      text: body.slice(0, 1200)
    })
  })
  return articles
}

// ── Trilingual split ───────────────────────────────────────────
// Gazettes are typically laid out in 3 columns or 3 sequential blocks
const splitTrilingual = (text) => {
  // Look for explicit language headers
  const enMarker = text.search(/\bENGLISH\s+VERSION\b|\bTRANSLATION\b/i)
  const frMarker = text.search(/\bFRENCH\s+VERSION\b|\bVERSION\s+FRANÇAISE\b/i)
  const rwMarker = text.search(/\bKINYARWANDA\b|\bIKINYARWANDA\b/i)

  if (enMarker !== -1 && frMarker !== -1) {
    const parts = [enMarker, frMarker, rwMarker !== -1 ? rwMarker : -1].sort((a,b) => a-b).filter(x => x !== -1)
    if (parts.length >= 2) {
      return {
        rw: rwMarker !== -1 ? text.substring(rwMarker, parts[parts.indexOf(rwMarker) + 1] || text.length) : text.slice(0, Math.floor(text.length / 3)),
        en: text.substring(parts[0], parts[1]),
        fr: text.substring(parts[parts.length - 1])
      }
    }
  }

  // Fallback: split into thirds (common for columnar PDFs after extraction)
  const third = Math.floor(text.length / 3)
  // Heuristic: French text has lots of accents, English is middle or identifiable
  const part1 = text.slice(0, third)
  const part2 = text.slice(third, third * 2)
  const part3 = text.slice(third * 2)

  const accentCount = (s) => (s.match(/[éèêëàâùûüïîôœç]/g) || []).length
  const parts = [part1, part2, part3]
  // Sort by accent count: fewest = English, medium = Kinyarwanda, most = French
  const sorted = [...parts].sort((a, b) => accentCount(a) - accentCount(b))

  return { en: sorted[0], rw: sorted[1], fr: sorted[2] }
}

// ── Snippet extractor for search results ──────────────────────
const getSnippet = (text, query, length = 300) => {
  if (!text) return ''
  const lower = text.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return text.slice(0, length) + (text.length > length ? '…' : '')
  const start = Math.max(0, idx - 80)
  const end = Math.min(text.length, idx + length)
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
}


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/gazettes'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'))
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
})

// Upload and process PDF (Admin only)
router.post('/upload', 
  authenticate, 
  authorize('admin'),
  uploadLimiter,
  upload.single('pdf'), 
  gazetteUploadValidation,
  catchAsync(async (req, res) => {
    const { title, documentNumber, publicationDate, category, tags, gazetteNumber, languages } = req.body

    if (!req.file) {
      throw new AppError('PDF file required', 400)
    }

    // ── Duplicate check ──────────────────────────────────────
    const existing = await GazetteDocument.findOne({
      documentNumber: documentNumber.trim()
    })
    if (!existing) {
      // Also check by gazetteNumber + publicationDate
      const existingByDate = gazetteNumber && publicationDate
        ? await GazetteDocument.findOne({ gazetteNumber: gazetteNumber.trim(), publicationDate: new Date(publicationDate) })
        : null
      if (existingByDate) {
        fs.unlinkSync(req.file.path) // clean up uploaded file
        return res.status(409).json({
          status: 'error',
          message: 'This gazette has already been uploaded (same number and date)'
        })
      }
    } else {
      fs.unlinkSync(req.file.path)
      return res.status(409).json({
        status: 'error',
        message: `Gazette with document number "${documentNumber}" already exists`
      })
    }

    logger.info('Processing PDF upload', { filename: req.file.originalname, size: req.file.size })

    // ── Extract text ─────────────────────────────────────────
    const dataBuffer = fs.readFileSync(req.file.path)
    const pdfData = await pdf(dataBuffer)
    const fullText = pdfData.text || ''
    const isScannedPdf = fullText.trim().length < 200

    logger.info('PDF text extracted', { pageCount: pdfData.numpages, textLength: fullText.length, isScanned: isScannedPdf })

    // ── Trilingual split ─────────────────────────────────────
    const textParts = fullText.length > 500 ? splitTrilingual(fullText) : { en: fullText, rw: fullText, fr: fullText }

    // ── Article parsing ──────────────────────────────────────
    const articles = parseArticles(fullText)
    const langList = languages
      ? (Array.isArray(languages) ? languages : languages.split(',').map(l => l.trim()))
      : ['en']

    // ── Save document ────────────────────────────────────────
    const gazetteDoc = new GazetteDocument({
      title,
      documentNumber,
      gazetteNumber: gazetteNumber || documentNumber,
      publicationDate,
      category,
      languages: langList,
      extractedText: {
        en: textParts.en,
        rw: textParts.rw,
        fr: textParts.fr
      },
      textPreview: fullText.slice(0, 500),
      articles,
      articleCount: articles.length,
      isScannedPdf,
      pdfFileName: req.file.filename,
      pdfUrl: `/uploads/gazettes/${req.file.filename}`,
      fileSize: req.file.size,
      pageCount: pdfData.numpages,
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
    })

    await gazetteDoc.save()

    logger.info('Gazette uploaded successfully', { id: gazetteDoc._id, documentNumber, articleCount: articles.length })

    res.status(201).json({
      status: 'success',
      message: `Gazette uploaded. ${articles.length} articles indexed.`,
      data: {
        id: gazetteDoc._id,
        title: gazetteDoc.title,
        documentNumber: gazetteDoc.documentNumber,
        pageCount: gazetteDoc.pageCount,
        articleCount: articles.length,
        textPreview: fullText.slice(0, 500),
        isScannedPdf,
        hasText: !isScannedPdf,
        fileSize: gazetteDoc.fileSize
      }
    })
  })
)

// ── Article-level search across all laws ─────────────────────────────────────
// GET /api/gazette/articles/search?q=theft+penalty
// Returns articles from LegalContent grouped by source document
router.get('/articles/search', catchAsync(async (req, res) => {
  const { q } = req.query
  if (!q || !q.trim()) {
    return res.json({ status: 'success', data: { totalArticles: 0, groups: [] } })
  }

  const expandedQ = expandQueryWithSynonyms(q.toLowerCase())
  const terms     = expandedQ.split(/\s+/).filter(Boolean)

  // Each term must match somewhere in the article (AND logic across terms)
  // For each term, at least one field must contain it
  const andConditions = terms.map(t => {
    const re = new RegExp(t, 'i')
    return {
      $or: [
        { 'originalText.en':          re },
        { 'simplifiedExplanation.en': re },
        { tags:                       re },
        { crimeType:                  re },
      ]
    }
  })

  const articles = await LegalContent.find({ $and: andConditions })
    .select('articleNumber crimeType originalText simplifiedExplanation tags sourceDocument').limit(60)

  if (!articles.length) {
    return res.json({ status: 'success', data: { totalArticles: 0, groups: [] } })
  }

  // Fetch gazette documents to get IDs/titles for each sourceDocument
  const sourceDocs = [...new Set(articles.map(a => a.sourceDocument))]
  const gazetteMap = {}
  const gazettes   = await GazetteDocument.find({ sourceDocument: { $in: sourceDocs } })
    .select('_id title sourceDocument documentNumber')
  gazettes.forEach(g => { gazetteMap[g.sourceDocument] = g })

  // Group articles by sourceDocument
  const groups = {}
  articles.forEach(a => {
    const src = a.sourceDocument || 'Unknown'
    if (!groups[src]) groups[src] = []
    const text   = a.originalText?.en || ''
    const snippet = getSnippet(text, q, 250) || text.slice(0, 250)
    groups[src].push({
      id:            a._id,
      articleNumber: a.articleNumber,
      crimeType:     a.crimeType,
      title:         `${a.articleNumber} — ${a.crimeType}`,
      snippet,
      tags:          a.tags || [],
    })
  })

  const result = Object.entries(groups).map(([src, arts]) => {
    const gazette = gazetteMap[src]
    return {
      sourceDocument: src,
      gazetteId:      gazette?._id || null,
      gazetteTitle:   gazette?.title || src,
      gazetteNumber:  gazette?.documentNumber || '',
      matchingArticles: arts.slice(0, 10),
      totalMatches:   arts.length,
    }
  })

  res.json({
    status: 'success',
    data: { totalArticles: articles.length, groups: result }
  })
}))

// ── Articles for a specific gazette (from LegalContent by sourceDocument) ─────
// GET /api/gazette/:id/articles
router.get('/:id/articles', mongoIdValidation, catchAsync(async (req, res) => {
  const gazette = await GazetteDocument.findById(req.params.id).select('sourceDocument title')
  if (!gazette) throw new AppError('Document not found', 404)

  const articles = await LegalContent
    .find({ sourceDocument: gazette.sourceDocument })
    .select('articleNumber crimeType originalText simplifiedExplanation tags keywords')

  // Sort numerically by extracting the number from e.g. "Article 167"
  const parseNum = s => parseInt((s || '').replace(/\D/g, ''), 10) || 0
  articles.sort((a, b) => parseNum(a.articleNumber) - parseNum(b.articleNumber))

  const formatted = articles.map(a => ({
    id:            a._id,
    number:        a.articleNumber, // keep 'number' key so GazetteDetail doesn't need big changes
    articleNumber: a.articleNumber,
    crimeType:     a.crimeType,
    title:         a.articleNumber,
    text:          a.originalText?.en || '',
    simplified:    a.simplifiedExplanation?.en || '',
    tags:          a.tags || [],
  }))

  res.json({
    status:   'success',
    data: {
      sourceDocument: gazette.sourceDocument,
      gazettTitle:    gazette.title,
      articles:       formatted,
      total:          formatted.length,
    }
  })
}))

// Search gazette documents (full-text with snippets)
router.get('/search', gazetteSearchValidation, catchAsync(async (req, res) => {
  const { q, category, year, language, sort = 'relevance', page = 1, limit = 10 } = req.query

  let query = {}

  if (q) {
    const expandedQuery = expandQueryWithSynonyms(q)
    query.$text = { $search: expandedQuery }
    logger.info('Expanded search query', { original: q, expanded: expandedQuery })
  }

  if (category) query.category = category
  if (language) query.languages = language

  if (year) {
    query.publicationDate = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`)
    }
  }

  const sortOption = sort === 'relevance' && q
    ? { score: { $meta: 'textScore' } }
    : sort === 'downloads' ? { downloadCount: -1 }
    : { publicationDate: -1 }

  const { results, pagination } = await paginate(
    GazetteDocument,
    query,
    { page, limit, sort: sortOption, select: 'title documentNumber publicationDate category tags downloadCount articleCount fileSize languages textPreview extractedText' }
  )

  const formattedResults = results.map(doc => {
    const snippet = q
      ? (getSnippet(doc.extractedText?.en, q) || getSnippet(doc.extractedText?.rw, q) || doc.textPreview || '')
      : (doc.textPreview || '')
    return {
      id: doc._id,
      title: doc.title,
      documentNumber: doc.documentNumber,
      publicationDate: doc.publicationDate,
      category: doc.category,
      tags: doc.tags,
      downloadCount: doc.downloadCount || 0,
      articleCount: doc.articleCount || 0,
      languages: doc.languages || ['en'],
      snippet,
      searchTerm: q || ''
    }
  })

  res.json(paginatedResponse(formattedResults, pagination, `Found ${results.length} gazette documents`))
}))

// Get single document with full text
router.get('/:id', mongoIdValidation, catchAsync(async (req, res) => {
  const document = await GazetteDocument.findById(req.params.id)

  if (!document) {
    throw new AppError('Document not found', 404)
  }

  // Increment view count
  document.viewCount = (document.viewCount || 0) + 1
  document.searchCount += 1
  await document.save()

  logger.info('Gazette document accessed', { id: document._id, documentNumber: document.documentNumber })

  res.json({
    status: 'success',
    data: {
      id: document._id,
      title: document.title,
      documentNumber: document.documentNumber,
      gazetteNumber: document.gazetteNumber,
      publicationDate: document.publicationDate,
      category: document.category,
      languages: document.languages,
      extractedText: document.extractedText,
      textPreview: document.textPreview,
      articles: document.articles || [],
      articleCount: document.articleCount || 0,
      isScannedPdf: document.isScannedPdf,
      summary: document.summary,
      pageCount: document.pageCount,
      tags: document.tags,
      pdfUrl: document.pdfUrl,
      downloadCount: document.downloadCount,
      viewCount: document.viewCount,
      searchCount: document.searchCount,
      description: document.description,
      sourceDocument: document.sourceDocument,
    }
  })
}))

// Download PDF
router.get('/:id/download', mongoIdValidation, catchAsync(async (req, res) => {
  const document = await GazetteDocument.findById(req.params.id)

  if (!document) {
    throw new AppError('Document not found', 404)
  }

  const filePath = path.join(process.cwd(), 'uploads', 'gazettes', document.pdfFileName)

  if (!fs.existsSync(filePath)) {
    logger.error('PDF file not found on disk', { 
      documentId: document._id, 
      expectedPath: filePath 
    })
    throw new AppError('PDF file not found', 404)
  }

  // Increment download count
  document.downloadCount += 1
  await document.save()

  logger.info('Gazette PDF downloaded', { 
    id: document._id, 
    documentNumber: document.documentNumber 
  })

  res.download(filePath, `${document.documentNumber.replace(/[\/\\]/g, '-')}.pdf`)
}))

// Get all documents (browse — supports q, category, year, language, sort)
router.get('/', catchAsync(async (req, res) => {
  const { page = 1, limit = 20, category, year, language, q, sort = 'newest' } = req.query

  const query = {}
  if (category) query.category = category
  if (language) query.languages = language
  if (year) {
    query.publicationDate = {
      $gte: new Date(`${year}-01-01`),
      $lte: new Date(`${year}-12-31`)
    }
  }
  if (q) {
    const expanded = expandQueryWithSynonyms(q)
    query.$text = { $search: expanded }
  }

  const sortOption = (q && sort === 'relevance')
    ? { score: { $meta: 'textScore' } }
    : sort === 'downloads' ? { downloadCount: -1 }
    : { publicationDate: -1 }

  const { results, pagination } = await paginate(
    GazetteDocument,
    query,
    { page, limit, sort: sortOption, select: 'title documentNumber gazetteNumber publicationDate category tags downloadCount articleCount fileSize languages textPreview' }
  )

  const formattedResults = results.map(doc => ({
    id: doc._id,
    title: doc.title,
    documentNumber: doc.documentNumber,
    gazetteNumber: doc.gazetteNumber,
    publicationDate: doc.publicationDate,
    category: doc.category,
    tags: doc.tags,
    downloadCount: doc.downloadCount || 0,
    articleCount: doc.articleCount || 0,
    fileSize: doc.fileSize,
    languages: doc.languages || ['en'],
    snippet: doc.textPreview || ''
  }))

  res.json(paginatedResponse(formattedResults, pagination, 'Gazette documents retrieved'))
}))

export default router
