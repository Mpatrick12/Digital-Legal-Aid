import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import pdf from 'pdf-parse'
import GazetteDocument from '../models/GazetteDocument.js'
import { authenticate, authorize } from '../middleware/auth.js'

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
router.post('/upload', authenticate, upload.single('pdf'), async (req, res) => {
  try {
    const { title, documentNumber, publicationDate, category, tags } = req.body

    if (!req.file) {
      return res.status(400).json({ message: 'PDF file required' })
    }

    // Extract text from PDF
    const dataBuffer = fs.readFileSync(req.file.path)
    const pdfData = await pdf(dataBuffer)

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

    res.status(201).json({
      message: 'Gazette document uploaded successfully',
      document: {
        id: gazetteDoc._id,
        title: gazetteDoc.title,
        documentNumber: gazetteDoc.documentNumber,
        pageCount: gazetteDoc.pageCount
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ message: 'Failed to upload document', error: error.message })
  }
})

// Search gazette documents
router.get('/search', async (req, res) => {
  try {
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

    const documents = await GazetteDocument.find(query)
      .select('-extractedText') // Don't return full text in list
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ publicationDate: -1 })

    const count = await GazetteDocument.countDocuments(query)

    res.json({
      documents: documents.map(doc => ({
        id: doc._id,
        title: doc.title,
        documentNumber: doc.documentNumber,
        publicationDate: doc.publicationDate,
        category: doc.category,
        pageCount: doc.pageCount,
        tags: doc.tags
      })),
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalDocuments: count
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ message: 'Search failed' })
  }
})

// Get single document with full text
router.get('/:id', async (req, res) => {
  try {
    const document = await GazetteDocument.findById(req.params.id)

    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
    }

    // Increment search count
    document.searchCount += 1
    await document.save()

    res.json({
      id: document._id,
      title: document.title,
      documentNumber: document.documentNumber,
      publicationDate: document.publicationDate,
      category: document.category,
      extractedText: document.extractedText,
      summary: document.summary,
      pageCount: document.pageCount,
      tags: document.tags,
      pdfUrl: document.pdfUrl
    })
  } catch (error) {
    console.error('Get document error:', error)
    res.status(500).json({ message: 'Failed to fetch document' })
  }
})

// Download PDF
router.get('/:id/download', async (req, res) => {
  try {
    const document = await GazetteDocument.findById(req.params.id)

    if (!document) {
      return res.status(404).json({ message: 'Document not found' })
    }

    const filePath = path.join(process.cwd(), 'uploads', 'gazettes', document.pdfFileName)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'PDF file not found' })
    }

    // Increment download count
    document.downloadCount += 1
    await document.save()

    res.download(filePath, `${document.documentNumber}.pdf`)
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ message: 'Failed to download document' })
  }
})

// Get all documents (admin/browse)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query

    const query = category ? { category } : {}

    const documents = await GazetteDocument.find(query)
      .select('-extractedText')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ publicationDate: -1 })

    const count = await GazetteDocument.countDocuments(query)

    res.json({
      documents: documents.map(doc => ({
        id: doc._id,
        title: doc.title,
        documentNumber: doc.documentNumber,
        publicationDate: doc.publicationDate,
        category: doc.category,
        pageCount: doc.pageCount,
        fileSize: doc.fileSize,
        tags: doc.tags
      })),
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalDocuments: count
    })
  } catch (error) {
    console.error('Get documents error:', error)
    res.status(500).json({ message: 'Failed to fetch documents' })
  }
})

export default router
