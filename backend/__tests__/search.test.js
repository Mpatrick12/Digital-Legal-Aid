import request from 'supertest'
import express from 'express'
import searchRoutes from '../src/routes/search.js'
import LegalContent from '../src/models/LegalContent.js'
import SearchLog from '../src/models/SearchLog.js'

// Mock dependencies
jest.mock('../src/models/LegalContent.js')
jest.mock('../src/models/SearchLog.js')
jest.mock('../src/config/logger.js', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

// Create test app
const createTestApp = () => {
  const app = express()
  app.use(express.json())
  app.use('/api/search', searchRoutes)
  return app
}

describe('Search API', () => {
  let app

  beforeEach(() => {
    app = createTestApp()
    jest.clearAllMocks()
  })

  describe('GET /api/search', () => {
    it('should return search results for valid query', async () => {
      const mockResults = [
        {
          _id: '123',
          crimeType: 'Theft',
          articleNumber: 'Art. 166',
          simplifiedExplanation: { en: 'Taking property without permission' },
          reportingSteps: [{ description: { en: 'Go to police' } }],
          requiredEvidence: [{ en: 'List of items' }],
          whereToReport: { en: 'Police station' },
          tags: ['theft']
        }
      ]

      LegalContent.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockResults)
      })

      LegalContent.countDocuments.mockResolvedValue(1)
      SearchLog.create.mockResolvedValue({})
      LegalContent.updateMany.mockResolvedValue({})

      const res = await request(app)
        .get('/api/search?q=theft&lang=en')
        .expect(200)

      expect(res.body.status).toBe('success')
      expect(res.body.data).toBeDefined()
      expect(res.body.data.length).toBeGreaterThan(0)
    })

    it('should return 400 for missing query parameter', async () => {
      const res = await request(app)
        .get('/api/search')
        .expect(400)

      expect(res.body.status).toBe('fail')
    })

    it('should handle search with pagination', async () => {
      LegalContent.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      })

      LegalContent.countDocuments.mockResolvedValue(0)
      SearchLog.create.mockResolvedValue({})

      const res = await request(app)
        .get('/api/search?q=assault&page=2&limit=5')
        .expect(200)

      expect(res.body.pagination).toBeDefined()
      expect(res.body.pagination.currentPage).toBe(2)
    })

    it('should default to English language when not specified', async () => {
      LegalContent.find.mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      })

      LegalContent.countDocuments.mockResolvedValue(0)
      SearchLog.create.mockResolvedValue({})

      const res = await request(app)
        .get('/api/search?q=test')
        .expect(200)

      expect(res.body).toBeDefined()
    })
  })
})
