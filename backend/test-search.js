import mongoose from 'mongoose'
import GazetteDocument from './src/models/GazetteDocument.js'

async function testSearch() {
  try {
    await mongoose.connect('mongodb://localhost:27017/digital-legal-aid')
    console.log('Connected to MongoDB\n')

    // Test 1: Search for "theft"
    console.log('=== Testing search for: "theft" ===')
    const results1 = await GazetteDocument.find({ $text: { $search: 'theft' } })
    console.log('Results found:', results1.length)
    if (results1.length > 0) {
      console.log('Title:', results1[0].title)
    }

    // Test 2: Search for "law"
    console.log('\n=== Testing search for: "law" ===')
    const results2 = await GazetteDocument.find({ $text: { $search: 'law' } })
    console.log('Results found:', results2.length)
    if (results2.length > 0) {
      console.log('Title:', results2[0].title)
    }

    // Test 3: Search for "notaire"  
    console.log('\n=== Testing search for: "notaire" ===')
    const results3 = await GazetteDocument.find({ $text: { $search: 'notaire' } })
    console.log('Results found:', results3.length)
    if (results3.length > 0) {
      console.log('Title:', results3[0].title)
    }

    // Test 4: Get all documents
    console.log('\n=== Getting all documents ===')
    const allDocs = await GazetteDocument.find({})
    console.log('Total documents:', allDocs.length)
    if (allDocs.length > 0) {
      console.log('First doc title:', allDocs[0].title)
      console.log('Has extracted text:', !!allDocs[0].extractedText)
      console.log('Extracted text length:', allDocs[0].extractedText?.en?.length || 0)
    }

    await mongoose.connection.close()
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

testSearch()
