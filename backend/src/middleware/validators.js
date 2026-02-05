import { body, param, query, validationResult } from 'express-validator'
import { AppError } from './errorHandler.js'

export const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      status: 'fail',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    })
  }
  next()
}

// Auth validators
export const signupValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),
  body('district')
    .notEmpty()
    .withMessage('District is required'),
  validate
]

export const signinValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
]

// Gazette validators
export const gazetteUploadValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Title must be 5-500 characters'),
  body('documentNumber')
    .trim()
    .notEmpty()
    .withMessage('Document number is required')
    .matches(/^N°\s*\d+\/\d{4}$/)
    .withMessage('Document number must match format: N° XX/YYYY'),
  body('publicationDate')
    .isISO8601()
    .withMessage('Valid date required (ISO 8601 format)'),
  body('category')
    .isIn(['Law', 'Presidential Order', 'Ministerial Order', 'Prime Minister Order', 'Other'])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a comma-separated string'),
  validate
]

export const gazetteSearchValidation = [
  query('q')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Search query must be 2-200 characters'),
  query('category')
    .optional()
    .isIn(['Law', 'Presidential Order', 'Ministerial Order', 'Prime Minister Order', 'Other'])
    .withMessage('Invalid category'),
  query('year')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('Year must be between 1900 and 2100'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
]

export const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid document ID'),
  validate
]

// Search validators
export const searchValidation = [
  query('q')
    .notEmpty()
    .withMessage('Search query required')
    .isString()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Search query must be 2-200 characters'),
  query('lang')
    .optional()
    .isIn(['en', 'rw'])
    .withMessage('Language must be "en" or "rw"'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validate
]
