import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config({ path: '/home/mitali/Digital-Legal-Aid/backend/.env' })

const articleSchema = new mongoose.Schema({ number: String, title: String, text: String }, { _id: false })
const GazetteDocument = mongoose.model('GazetteDocument', new mongoose.Schema({
  extractedText: { en: String, rw: String, fr: String },
  articles: [articleSchema],
  articleCount: Number,
  textPreview: String
}, { strict: false }))

function parseArticles(text) {
  if (!text) return []
  const articles = []
  // Match "Article N°123" or "Article 123" patterns
  const pattern = /Article\s+(?:N[°o]?\s*)?(\d+)[:\s]+([^\n]{0,120})\n([\s\S]{50,2000}?)(?=Article\s+(?:N[°o]?\s*)?\d+|$)/gi
  let match
  while ((match = pattern.exec(text)) !== null && articles.length < 500) {
    articles.push({
      number: match[1].trim(),
      title: match[2].trim().replace(/\.$/, ''),
      text: match[3].trim().slice(0, 1500)
    })
  }
  return articles
}

await mongoose.connect(process.env.MONGODB_URI)
console.log('Connected')

const docs = await GazetteDocument.find({ $or: [{ articleCount: 0 }, { articleCount: { $exists: false } }] })
console.log(`Found ${docs.length} docs to re-parse`)

for (const doc of docs) {
  const text = doc.extractedText?.en || doc.extractedText?.rw || doc.extractedText?.fr || ''
  if (!text) { console.log('  skip', doc._id, '— no text'); continue }
  
  const articles = parseArticles(text)
  doc.articles = articles
  doc.articleCount = articles.length
  if (!doc.textPreview) doc.textPreview = text.slice(0, 500)
  await doc.save()
  console.log(`  ✓ ${doc.title} → ${articles.length} articles parsed`)
  if (articles.length > 0) {
    console.log(`    First: Article ${articles[0].number} — ${articles[0].title}`)
    console.log(`    Last:  Article ${articles[articles.length-1].number} — ${articles[articles.length-1].title}`)
  }
}

await mongoose.disconnect()
console.log('Done')
