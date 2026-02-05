import { paginate, paginatedResponse } from '../src/utils/pagination.js'

// Mock Mongoose model
const createMockModel = (results, total) => {
  const queryChain = {
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(results)
  }

  return {
    find: jest.fn(() => queryChain),
    countDocuments: jest.fn().mockResolvedValue(total)
  }
}

describe('Pagination Utility', () => {
  describe('paginate', () => {
    it('should paginate results correctly', async () => {
      const mockResults = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]
      const mockModel = createMockModel(mockResults, 10)

      const result = await paginate(mockModel, {}, { page: 1, limit: 2 })

      expect(result.results).toEqual(mockResults)
      expect(result.pagination.currentPage).toBe(1)
      expect(result.pagination.totalPages).toBe(5)
      expect(result.pagination.totalItems).toBe(10)
      expect(result.pagination.hasNextPage).toBe(true)
      expect(result.pagination.hasPrevPage).toBe(false)
    })

    it('should handle last page correctly', async () => {
      const mockResults = [{ id: 10, name: 'Last item' }]
      const mockModel = createMockModel(mockResults, 10)

      const result = await paginate(mockModel, {}, { page: 5, limit: 2 })

      expect(result.pagination.hasNextPage).toBe(false)
      expect(result.pagination.hasPrevPage).toBe(true)
      expect(result.pagination.nextPage).toBe(null)
      expect(result.pagination.prevPage).toBe(4)
    })

    it('should apply query filters', async () => {
      const mockModel = createMockModel([], 0)
      const query = { category: 'Law' }

      await paginate(mockModel, query, { page: 1, limit: 10 })

      expect(mockModel.find).toHaveBeenCalledWith(query)
    })

    it('should apply sorting', async () => {
      const mockModel = createMockModel([], 0)

      await paginate(mockModel, {}, { page: 1, limit: 10, sort: '-createdAt' })

      const queryChain = mockModel.find()
      expect(queryChain.sort).toHaveBeenCalledWith('-createdAt')
    })

    it('should handle empty results', async () => {
      const mockModel = createMockModel([], 0)

      const result = await paginate(mockModel, {}, { page: 1, limit: 10 })

      expect(result.results).toEqual([])
      expect(result.pagination.totalPages).toBe(0)
      expect(result.pagination.totalItems).toBe(0)
    })
  })

  describe('paginatedResponse', () => {
    it('should format response correctly', () => {
      const data = [{ id: 1 }, { id: 2 }]
      const pagination = {
        currentPage: 1,
        totalPages: 5,
        totalItems: 10
      }

      const response = paginatedResponse(data, pagination, 'Success')

      expect(response.status).toBe('success')
      expect(response.message).toBe('Success')
      expect(response.count).toBe(2)
      expect(response.pagination).toEqual(pagination)
      expect(response.data).toEqual(data)
    })

    it('should use default message', () => {
      const response = paginatedResponse([], {})

      expect(response.message).toBe('Success')
    })
  })
})
