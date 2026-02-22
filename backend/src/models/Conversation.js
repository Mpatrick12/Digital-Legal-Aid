import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  sources: [{
    articleNumber: String,
    crimeType: String,
    summary: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  }
})

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null   // null = guest user
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  language: {
    type: String,
    enum: ['en', 'rw'],
    default: 'en'
  },
  messages: [messageSchema],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Auto-update lastActive on save
conversationSchema.pre('save', function (next) {
  this.lastActive = new Date()
  next()
})

export default mongoose.model('Conversation', conversationSchema)
