import express from 'express'
import LegalContent from '../models/LegalContent.js'
import SearchLog from '../models/SearchLog.js'
import { searchValidation } from '../middleware/validators.js'
import { catchAsync } from '../middleware/errorHandler.js'
import { searchLimiter } from '../middleware/rateLimiter.js'
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

// Natural language search
router.get('/', searchLimiter, searchValidation, catchAsync(async (req, res) => {
  const { q, lang = 'en', page = 1, limit = 10 } = req.query

  logger.info('Search request received', { query: q, lang, page, limit })

  // Expand search query with synonyms
  const expandedQuery = expandQueryWithSynonyms(q)
  logger.info('Expanded search query', { original: q, expanded: expandedQuery })
  
  // Build MongoDB text search query
  const searchQuery = {
    $text: { $search: expandedQuery }
  }

  // Execute paginated search with text score
  const { results, pagination } = await paginate(
    LegalContent,
    searchQuery,
    {
      page,
      limit,
      sort: { score: { $meta: 'textScore' } },
      select: `crimeType articleNumber simplifiedExplanation reportingSteps requiredEvidence whereToReport tags`
    }
  )

  // Log search asynchronously (don't await)
  SearchLog.create({
    query: q,
    resultsCount: results.length,
    language: lang,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  }).catch(err => logger.error('Failed to log search', { error: err.message }))

  // Increment view counts asynchronously
  if (results.length > 0) {
    LegalContent.updateMany(
      { _id: { $in: results.map(r => r._id) } },
      { $inc: { viewCount: 1 } }
    ).catch(err => logger.error('Failed to update view counts', { error: err.message }))
  }

  // Format response
  const formattedResults = results.map(item => ({
    id: item._id,
    crimeType: item.crimeType,
    articleNumber: item.articleNumber,
    explanation: item.simplifiedExplanation[lang] || item.simplifiedExplanation.en,
    reportingSteps: item.reportingSteps.map(step => step.description[lang] || step.description.en),
    requiredEvidence: item.requiredEvidence.map(e => e[lang] || e.en),
    whereToReport: item.whereToReport[lang] || item.whereToReport.en,
    tags: item.tags
  }))

  logger.info('Search completed', { 
    query: q, 
    resultsFound: results.length,
    page: pagination.currentPage 
  })

  res.json(paginatedResponse(
    formattedResults,
    pagination,
    `Found ${results.length} results for "${q}"`
  ))
}))

export default router
