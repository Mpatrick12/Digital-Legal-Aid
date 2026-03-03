import mongoose from 'mongoose'

const legalContentSchema = new mongoose.Schema({
  crimeType: {
    type: String,
    required: true,
    enum: ['Theft', 'Assault', 'GBV', 'Fraud', 'Property Damage', 'Murder', 'Drug', 'Corruption', 'Other']
  },
  articleNumber: {
    type: String,
    required: true
  },
  originalText: {
    en: String,
    rw: String
  },
  simplifiedExplanation: {
    en: String,
    rw: String
  },
  reportingSteps: [{
    stepNumber: Number,
    description: {
      en: String,
      rw: String
    }
  }],
  requiredEvidence: [{
    en: String,
    rw: String
  }],
  whereToReport: {
    en: String,
    rw: String
  },
  relatedArticles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LegalContent'
  }],
  tags: [String],
  keywords: [String],
  sourceDocument: {
    type: String,
    default: 'Penal Code 2018'
  },
  relevantForCitizens: {
    type: Boolean,
    default: true
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Text index for search
legalContentSchema.index({ 
  crimeType: 'text', 
  'originalText.en': 'text',
  'originalText.rw': 'text',
  'simplifiedExplanation.en': 'text',
  'simplifiedExplanation.rw': 'text',
  tags: 'text',
  sourceDocument: 'text'
})

export default mongoose.model('LegalContent', legalContentSchema)
