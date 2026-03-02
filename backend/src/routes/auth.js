import express from 'express'
import jwt from 'jsonwebtoken'
import { body, validationResult } from 'express-validator'
import User from '../models/User.js'

const router = express.Router()

// Sign Up
router.post('/signup', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').trim().notEmpty(),
  body('district').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, password, district } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Create user
    const user = new User({ name, email, password, district })
    await user.save()

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        district: user.district,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
})

// Sign In
router.post('/signin', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        district: user.district,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Signin error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

// Admin Login — separate credentials stored in .env
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body
    const validUsername = process.env.ADMIN_USERNAME || 'admin'
    const validPassword = process.env.ADMIN_PASSWORD || 'admin123'

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' })
    }

    if (username !== validUsername || password !== validPassword) {
      return res.status(401).json({ message: 'Invalid admin credentials' })
    }

    const token = jwt.sign(
      { userId: 'admin', role: 'admin', username },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    )

    res.json({
      token,
      user: { id: 'admin', name: 'Administrator', role: 'admin', username }
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

export default router
