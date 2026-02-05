import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import pdf from 'pdf-parse'
import GazetteDocument from '../models/GazetteDocument.js'
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

// Configure multer for PDF uploads
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

// Upload and process PDF
router.post('/upload', 
  authenticate, 
  uploadLimiter,
  upload.single('pdf'), 
  gazetteUploadValidation,
  catchAsync(async (req, res) => {
    const { title, documentNumber, publicationDate, category, tags } = req.body

    if (!req.file) {
      throw new AppError('PDF file required', 400)
    }

    logger.info('Processing PDF upload', { 
      filename: req.file.originalname, 
      size: req.file.size 
    })

    // Extract text from PDF
    const dataBuffer = fs.readFileSync(req.file.path)
    const pdfData = await pdf(dataBuffer)

    logger.info('PDF text extracted', { 
      pageCount: pdfData.numpages, 
      textLength: pdfData.text.length 
    })

    // Create document record
    const gazetteDoc = new GazetteDocument({
      title,
      documentNumber,
      publicationDate,
      category,
      extractedText: {
        en: pdfData.text // Store extracted text
      },
      pdfFileName: req.file.filename,
      pdfUrl: `/uploads/gazettes/${req.file.filename}`,
      fileSize: req.file.size,
      pageCount: pdfData.numpages,
      tags: tags ? tags.split(',').map(t => t.trim()) : []
    })

    await gazetteDoc.save()

    logger.info('Gazette document uploaded successfully', { 
      id: gazetteDoc._id, 
      documentNumber 
    })

    res.status(201).json({
      status: 'success',
      message: 'Gazette document uploaded successfully',
      data: {
        id: gazetteDoc._id,
        title: gazetteDoc.title,
        documentNumber: gazetteDoc.documentNumber,
        pageCount: gazetteDoc.pageCount,
        fileSize: gazetteDoc.fileSize
      }
    })
  })
)

// Search gazette documents
router.get('/search', gazetteSearchValidation, catchAsync(async (req, res) => {
  const { q, category, year, page = 1, limit = 10 } = req.query

  let query = {}

  // Text search
  if (q) {
    query.$text = { $search: q }
  }

  // Filter by category
  if (category) {
    query.category = category
  }

  // Filter by year
  if (year) {
    const startDate = new Date(`${year}-01-01`)
    const endDate = new Date(`${year}-12-31`)
    query.publicationDate = { $gte: startDate, $lte: endDate }
  }

  logger.info('Gazette search request', { query: q, category, year, page })

  const { results, pagination } = await paginate(
    GazetteDocument,
    query,
    {
      page,
      limit,
      sort: q ? { score: { $meta: 'textScore' } } : { publicationDate: -1 },
      select: '-extractedText'
    }
  )

  const formattedResults = results.map(doc => ({
    id: doc._id,
    title: doc.title,
    documentNumber: doc.documentNumber,
    publicationDate: doc.publicationDate,
    category: doc.category,
    pageCount: doc.pageCount,
    tags: doc.tags
  }))

  res.json(paginatedResponse(
    formattedResults,
    pagination,
    `Found ${results.length} gazette documents`
  ))
}))

// Get single document with full text
router.get('/:id', mongoIdValidation, catchAsync(async (req, res) => {
  const document = await GazetteDocument.findById(req.params.id)

  if (!document) {
    throw new AppError('Document not found', 404)
  }

  // Increment search count
  document.searchCount += 1
  await document.save()

  logger.info('Gazette document accessed', { id: document._id, documentNumber: document.documentNumber })

  res.json({
    status: 'success',
    data: {
      id: document._id,
      title: document.title,
      documentNumber: document.documentNumber,
      publicationDate: document.publicationDate,
      category: document.category,
      extractedText: document.extractedText,
      summary: document.summary,
      pageCount: document.pageCount,
      tags: document.tags,
      pdfUrl: document.pdfUrl,
      downloadCount: document.downloadCount,
      searchCount: document.searchCount
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

// Get all documents (admin/browse)
router.get('/', catchAsync(async (req, res) => {
  const { page = 1, limit = 20, category } = req.query

  const query = category ? { category } : {}

  const { results, pagination } = await paginate(
    GazetteDocument,
    query,
    {
      page,
      limit,
      sort: '-publicationDate',
      select: '-extractedText'
    }
  )

  const formattedResults = results.map(doc => ({
    id: doc._id,
    title: doc.title,
    documentNumber: doc.documentNumber,
    publicationDate: doc.publicationDate,
    category: doc.category,
    pageCount: doc.pageCount,
    fileSize: doc.fileSize,
    tags: doc.tags
  }))

  res.json(paginatedResponse(
    formattedResults,
    pagination,
    'Gazette documents retrieved successfully'
  ))
}))

export default router
