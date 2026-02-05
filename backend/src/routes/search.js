import express from 'express'
import LegalContent from '../models/LegalContent.js'
import SearchLog from '../models/SearchLog.js'

const router = express.Router()

// Natural language search
router.get('/', async (req, res) => {
  try {
    const { q, lang = 'en' } = req.query

    if (!q) {
      return res.status(400).json({ message: 'Search query required' })
    }

    // Simple keyword matching (can be enhanced with NLP)
    const searchTerms = q.toLowerCase()
    
    const query = {
      $or: [
        { crimeType: new RegExp(searchTerms, 'i') },
        { tags: new RegExp(searchTerms, 'i') },
        { [`simplifiedExplanation.${lang}`]: new RegExp(searchTerms, 'i') }
      ]
    }

    const results = await LegalContent.find(query).limit(10)

    // Log search
    await SearchLog.create({
      query: q,
      resultsCount: results.length,
      language: lang,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    })

    // Increment view counts
    if (results.length > 0) {
      await LegalContent.updateMany(
        { _id: { $in: results.map(r => r._id) } },
        { $inc: { viewCount: 1 } }
      )
    }

    res.json({
      query: q,
      count: results.length,
      results: results.map(item => ({
        id: item._id,
        crimeType: item.crimeType,
        articleNumber: item.articleNumber,
        explanation: item.simplifiedExplanation[lang],
        reportingSteps: item.reportingSteps.map(step => step.description[lang]),
        requiredEvidence: item.requiredEvidence.map(e => e[lang]),
        whereToReport: item.whereToReport[lang]
      }))
    })
  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({ message: 'Search failed' })
  }
})

export default router
