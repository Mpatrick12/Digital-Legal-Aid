import mongoose from 'mongoose'

const articleSchema = new mongoose.Schema({
  number: String,
  title: String,
  text: String
}, { _id: false })

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
  gazetteNumber: String,      // short gazette number e.g. "21bis"
  publicationDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    enum: ['Law', 'Presidential Order', 'Ministerial Order', 'Prime Minister Order', 'Special Edition', 'Other'],
    required: true
  },
  documentType: {
    type: String,
    enum: ['Official Gazette', 'Supplement', 'Special Edition'],
    default: 'Official Gazette'
  },
  languages: {
    type: [String],
    default: ['en']
  },
  extractedText: {
    en: String,
    rw: String,
    fr: String
  },
  textPreview: String,         // first 500 chars for quick display
  articles: [articleSchema],   // parsed individual articles
  articleCount: {
    type: Number,
    default: 0
  },
  isScannedPdf: {              // true if no extractable text
    type: Boolean,
    default: false
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
  description: String,        // human-readable purpose of this law
  sourceDocument: String,     // matches LegalContent.sourceDocument e.g. 'Penal Code 2018'
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
  },
  viewCount: {
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
