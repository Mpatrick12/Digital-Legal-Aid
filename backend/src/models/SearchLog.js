import mongoose from 'mongoose'

const searchLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  query: {
    type: String,
    required: true
  },
  resultsCount: Number,
  clickedResult: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LegalContent'
  },
  language: String,
  ipAddress: String,
  userAgent: String
}, {
  timestamps: true
})

export default mongoose.model('SearchLog', searchLogSchema)
