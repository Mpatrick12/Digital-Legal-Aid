import { AppError, errorHandler, catchAsync } from '../src/middleware/errorHandler.js'

describe('Error Handler Middleware', () => {
  describe('AppError', () => {
    it('should create an operational error with correct properties', () => {
      const error = new AppError('Not found', 404)
      
      expect(error.message).toBe('Not found')
      expect(error.statusCode).toBe(404)
      expect(error.status).toBe('fail')
      expect(error.isOperational).toBe(true)
    })

    it('should set status to error for 5xx codes', () => {
      const error = new AppError('Server error', 500)
      
      expect(error.status).toBe('error')
    })

    it('should set status to fail for 4xx codes', () => {
      const error = new AppError('Bad request', 400)
      
      expect(error.status).toBe('fail')
    })
  })

  describe('errorHandler', () => {
    let req, res, next

    beforeEach(() => {
      req = {}
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      next = jest.fn()
      process.env.NODE_ENV = 'development'
    })

    it('should handle operational errors in development', () => {
      const error = new AppError('Test error', 400)
      
      errorHandler(error, req, res, next)
      
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'fail',
          message: 'Test error'
        })
      )
    })

    it('should hide error details in production for non-operational errors', () => {
      process.env.NODE_ENV = 'production'
      const error = new Error('Programming error')
      error.statusCode = 500
      
      errorHandler(error, req, res, next)
      
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Something went wrong'
      })
    })

    it('should show operational errors in production', () => {
      process.env.NODE_ENV = 'production'
      const error = new AppError('User not found', 404)
      
      errorHandler(error, req, res, next)
      
      expect(res.json).toHaveBeenCalledWith({
        status: 'fail',
        message: 'User not found'
      })
    })
  })

  describe('catchAsync', () => {
    it('should catch async errors and pass to next', async () => {
      const error = new Error('Async error')
      const asyncFn = jest.fn().mockRejectedValue(error)
      const req = {}
      const res = {}
      const next = jest.fn()

      const wrappedFn = catchAsync(asyncFn)
      await wrappedFn(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })

    it('should not call next if no error occurs', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success')
      const req = {}
      const res = {}
      const next = jest.fn()

      const wrappedFn = catchAsync(asyncFn)
      await wrappedFn(req, res, next)

      expect(next).not.toHaveBeenCalled()
    })
  })
})
