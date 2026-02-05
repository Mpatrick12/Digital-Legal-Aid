import mongoose from 'mongoose'

const caseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  caseNumber: {
    type: String,
    unique: true
  },
  crimeType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Reported', 'Under Investigation', 'In Court', 'Closed'],
    default: 'Reported'
  },
  description: String,
  reportedDate: {
    type: Date,
    default: Date.now
  },
  updates: [{
    status: String,
    description: String,
    updatedBy: String,
    timestamp: Date
  }]
}, {
  timestamps: true
})

export default mongoose.model('Case', caseSchema)
