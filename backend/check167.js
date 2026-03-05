import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
await mongoose.connect(process.env.MONGODB_URI)
const { default: LC } = await import('./src/models/LegalContent.js')
const d = await LC.findOne({ articleNumber: 'Article 167' }).lean()
console.log('=== originalText.en ===')
console.log(d.originalText?.en || '(empty)')
await mongoose.disconnect()
