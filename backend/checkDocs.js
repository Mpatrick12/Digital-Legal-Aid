import mongoose from 'mongoose'
import dotenv from 'dotenv'
import GazetteDocument from './src/models/GazetteDocument.js'

dotenv.config()

async function checkDocs() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    const docs = await GazetteDocument.find()
    console.log(`📚 Total documents: ${docs.length}\n`)

    if (docs.length === 0) {
      console.log('❌ No documents in database')
    } else {
      docs.forEach((doc, idx) => {
        console.log(`\n--- Document ${idx + 1} ---`)
        console.log('Title:', doc.title)
        console.log('Document Number:', doc.documentNumber)
        console.log('Category:', doc.category)
        console.log('Publication Date:', doc.publicationDate)
        console.log('Text Length:', doc.extractedText?.en?.length || 0, 'characters')
        console.log('Tags:', doc.tags || [])
        console.log('File:', doc.pdfFileName)
      })
    }

    // Test text search
    console.log('\n\n🔍 Testing text search for "law"...')
    const searchResults = await GazetteDocument.find({ $text: { $search: 'law' } })
    console.log(`Found ${searchResults.length} results`)

    await mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkDocs()
