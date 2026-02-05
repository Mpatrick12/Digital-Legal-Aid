import express from 'express'
import GazetteDocument from '../models/GazetteDocument.js'

const router = express.Router()

// Get database stats
router.get('/stats', async (req, res) => {
  try {
    const totalDocs = await GazetteDocument.countDocuments()
    const recentDocs = await GazetteDocument.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title documentNumber createdAt')

    res.json({
      totalDocuments: totalDocs,
      recentUploads: recentDocs
    })
  } catch (error) {
    console.error('Stats error:', error)
    res.status(500).json({ message: 'Failed to fetch stats' })
  }
})

// Get full document details for debugging
router.get('/documents', async (req, res) => {
  try {
    const docs = await GazetteDocument.find()
    res.json({ count: docs.length, documents: docs })
  } catch (error) {
    console.error('Debug documents error:', error)
    res.status(500).json({ message: 'Failed to fetch documents' })
  }
})

export default router
