import mongoose from 'mongoose'

const gazetteDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  documentNumber: {
    type: String,
    required: true,
    unique: true
  },
  publicationDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['Law', 'Presidential Order', 'Ministerial Order', 'Prime Minister Order', 'Other'],
    required: true
  },
  documentType: {
    type: String,
    enum: ['Official Gazette', 'Supplement', 'Special Edition'],
    default: 'Official Gazette'
  },
  extractedText: {
    en: String,
    rw: String,
    fr: String
  },
  summary: {
    en: String,
    rw: String
  },
  pdfFileName: String,
  pdfUrl: String,
  fileSize: Number,
  pageCount: Number,
  tags: [String],
  relatedLaws: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LegalContent'
  }],
  downloadCount: {
    type: Number,
    default: 0
  },
  searchCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
})

// Text search index
gazetteDocumentSchema.index({
  title: 'text',
  documentNumber: 'text',
  'extractedText.en': 'text',
  'extractedText.rw': 'text',
  'summary.en': 'text',
  tags: 'text'
})

export default mongoose.model('GazetteDocument', gazetteDocumentSchema)
