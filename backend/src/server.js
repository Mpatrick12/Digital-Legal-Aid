import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import helmet from 'helmet'
import path from 'path'
import authRoutes from './routes/auth.js'
import legalContentRoutes from './routes/legalContent.js'
import searchRoutes from './routes/search.js'
import gazetteRoutes from './routes/gazette.js'
import debugRoutes from './routes/debug.js'
import analyticsRoutes from './routes/analytics.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger, logger } from './config/logger.js'
import { apiLimiter } from './middleware/rateLimiter.js'

dotenv.config()

const app = express()

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))

// CORS
app.use(cors())

// Body parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging
app.use(requestLogger)

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'))

// Rate limiting for API routes
app.use('/api/', apiLimiter)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/legal-content', legalContentRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/gazette', gazetteRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/debug', debugRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Digital Legal Aid API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  })
})

// Global error handler (must be last)
app.use(errorHandler)

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/digital-legal-aid'

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('✅ Connected to MongoDB', { uri: MONGODB_URI.replace(/\/\/.*@/, '//***@') })
  })
  .catch(err => {
    logger.error('❌ MongoDB connection error:', { error: err.message })
    process.exit(1)
  })

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server gracefully')
  await mongoose.connection.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing server gracefully')
  await mongoose.connection.close()
  process.exit(0)
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`, { 
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  })
})
