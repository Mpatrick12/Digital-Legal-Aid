import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { body, validationResult } from 'express-validator'
import { ragPipeline } from '../services/ragService.js'
import Conversation from '../models/Conversation.js'
import { authenticate } from '../middleware/auth.js'
import { catchAsync, AppError } from '../middleware/errorHandler.js'
import { apiLimiter } from '../middleware/rateLimiter.js'
import logger from '../config/logger.js'

const router = express.Router()

// Per-chat rate limiter (more generous than the default API limiter)
// Reuse apiLimiter — already applied globally, but chat is included anyway

// ─── POST /api/chat/message ───────────────────────────────────────────────────
// Works for BOTH guests (no auth) and logged-in users.
// Body: { message, language?, sessionId?, conversationHistory? }

router.post(
  '/message',
  [
    body('message')
      .trim()
      .notEmpty().withMessage('Message is required')
      .isLength({ max: 1500 }).withMessage('Message must be under 1500 characters'),
    body('language')
      .optional()
      .isIn(['en', 'rw']).withMessage('Language must be en or rw'),
    body('sessionId')
      .optional({ nullable: true })
      .isString(),
    body('conversationHistory')
      .optional()
      .isArray()
  ],
  catchAsync(async (req, res) => {
    // Validate input
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400)
    }

    const { message, language = 'en', conversationHistory = [] } = req.body

    // Session ID: use provided or generate new
    let sessionId = req.body.sessionId
    if (!sessionId) {
      sessionId = uuidv4()
    }

    // Resolve userId if authenticated (optional — guests have no token)
    let userId = null
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken')
        const decoded = jwt.default.verify(
          authHeader.replace('Bearer ', ''),
          process.env.JWT_SECRET
        )
        userId = decoded.userId
      } catch {
        // Token invalid or expired — treat as guest, no error thrown
      }
    }

    logger.info('Chat message received', {
      sessionId,
      userId,
      language,
      messageLength: message.length
    })

    // ── Run the RAG pipeline ──────────────────────────────────────────────────
    // Build history in Groq's expected format: [{role, content}]
    const formattedHistory = conversationHistory
      .filter(m => m.role && m.content)
      .map(m => ({ role: m.role, content: m.content }))

    const { response, sources } = await ragPipeline(message, language, formattedHistory)

    // ── Persist conversation to MongoDB ───────────────────────────────────────
    try {
      let conversation = await Conversation.findOne({ sessionId })

      if (!conversation) {
        conversation = new Conversation({ sessionId, userId, language })
      }

      // Append the user message and assistant response
      conversation.messages.push({ role: 'user', content: message })
      conversation.messages.push({ role: 'assistant', content: response, sources })
      conversation.language = language

      // Keep only last 50 messages to prevent unbounded growth
      if (conversation.messages.length > 50) {
        conversation.messages = conversation.messages.slice(-50)
      }

      await conversation.save()
    } catch (dbErr) {
      // Non-fatal — log but don't fail the response
      logger.error('Failed to persist conversation', { error: dbErr.message })
    }

    res.json({
      status: 'success',
      data: {
        response,
        sources,
        sessionId,
        language
      }
    })
  })
)

// ─── GET /api/chat/history/:sessionId ────────────────────────────────────────
// Returns conversation history for a session.
// Authenticated route — but also allows guest session lookup by sessionId.

router.get(
  '/history/:sessionId',
  catchAsync(async (req, res) => {
    const { sessionId } = req.params

    const conversation = await Conversation.findOne({ sessionId })
      .select('messages language createdAt lastActive')
      .lean()

    if (!conversation) {
      return res.json({
        status: 'success',
        data: { messages: [], sessionId }
      })
    }

    res.json({
      status: 'success',
      data: {
        sessionId,
        language: conversation.language,
        messages: conversation.messages,
        startedAt: conversation.createdAt,
        lastActive: conversation.lastActive
      }
    })
  })
)

// ─── GET /api/chat/user-history ───────────────────────────────────────────────
// Returns all past conversations for a logged-in user.

router.get(
  '/user-history',
  authenticate,
  catchAsync(async (req, res) => {
    const conversations = await Conversation.find({ userId: req.userId })
      .select('sessionId language lastActive messages')
      .sort('-lastActive')
      .limit(20)
      .lean()

    // Return a summary — first user message per conversation as preview
    const summaries = conversations.map(c => ({
      sessionId: c.sessionId,
      language: c.language,
      lastActive: c.lastActive,
      messageCount: c.messages.length,
      preview: c.messages.find(m => m.role === 'user')?.content || ''
    }))

    res.json({
      status: 'success',
      data: { conversations: summaries }
    })
  })
)

export default router
