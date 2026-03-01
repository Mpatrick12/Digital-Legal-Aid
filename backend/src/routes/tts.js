import express from 'express'
import { body, validationResult } from 'express-validator'
import { generateSpeech } from '../services/ttsService.js'
import { catchAsync, AppError } from '../middleware/errorHandler.js'

const router = express.Router()

// POST /api/tts/speak
// Body: { text: string, language: 'en' | 'rw' }
// Returns: { audio: base64string } for English, or { audio: null } for Kinyarwanda
router.post(
  '/speak',
  [
    body('text')
      .trim()
      .notEmpty().withMessage('text is required')
      .isLength({ max: 2000 }).withMessage('text must be under 2000 characters'),
    body('language')
      .optional()
      .isIn(['en', 'rw']).withMessage('language must be en or rw')
  ],
  catchAsync(async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg, 400)

    const { text, language = 'en' } = req.body

    // Kinyarwanda — no ElevenLabs support; tell the client to use browser TTS
    if (language !== 'en') {
      return res.json({ status: 'success', data: { audio: null, useBrowserFallback: true } })
    }

    const audio = await generateSpeech(text, language)
    res.json({ status: 'success', data: { audio, useBrowserFallback: false } })
  })
)

export default router
