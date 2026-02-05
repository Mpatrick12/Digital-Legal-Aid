import express from 'express'
import LegalContent from '../models/LegalContent.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Get all legal content (paginated)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, crimeType, lang = 'en' } = req.query
    
    const query = crimeType ? { crimeType } : {}
    
    const content = await LegalContent.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ viewCount: -1 })

    const count = await LegalContent.countDocuments(query)

    res.json({
      content: content.map(item => ({
        id: item._id,
        crimeType: item.crimeType,
        articleNumber: item.articleNumber,
        explanation: item.simplifiedExplanation[lang],
        reportingSteps: item.reportingSteps.map(step => step.description[lang])
      })),
      totalPages: Math.ceil(count / limit),
      currentPage: page
    })
  } catch (error) {
    console.error('Get content error:', error)
    res.status(500).json({ message: 'Failed to fetch content' })
  }
})

// Get single legal content by ID
router.get('/:id', async (req, res) => {
  try {
    const { lang = 'en' } = req.query
    const content = await LegalContent.findById(req.params.id)

    if (!content) {
      return res.status(404).json({ message: 'Content not found' })
    }

    // Increment view count
    content.viewCount += 1
    await content.save()

    res.json({
      id: content._id,
      crimeType: content.crimeType,
      articleNumber: content.articleNumber,
      originalText: content.originalText[lang],
      explanation: content.simplifiedExplanation[lang],
      reportingSteps: content.reportingSteps.map(step => ({
        stepNumber: step.stepNumber,
        description: step.description[lang]
      })),
      requiredEvidence: content.requiredEvidence.map(e => e[lang]),
      whereToReport: content.whereToReport[lang],
      viewCount: content.viewCount
    })
  } catch (error) {
    console.error('Get content error:', error)
    res.status(500).json({ message: 'Failed to fetch content' })
  }
})

// Create legal content (admin only)
router.post('/', authenticate, async (req, res) => {
  try {
    const content = new LegalContent(req.body)
    await content.save()
    res.status(201).json(content)
  } catch (error) {
    console.error('Create content error:', error)
    res.status(500).json({ message: 'Failed to create content' })
  }
})

export default router
