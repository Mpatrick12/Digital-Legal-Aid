import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import authRoutes from './routes/auth.js'
import legalContentRoutes from './routes/legalContent.js'
import searchRoutes from './routes/search.js'
import gazetteRoutes from './routes/gazette.js'
import debugRoutes from './routes/debug.js'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/legal-content', legalContentRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/gazette', gazetteRoutes)
app.use('/api/debug', debugRoutes)

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/digital-legal-aid'

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err))

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Digital Legal Aid API is running' })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
