import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()
await mongoose.connect(process.env.MONGODB_URI)
const { default: LC } = await import('./src/models/LegalContent.js')
const d = await LC.findOne({ articleNumber: 'Article 167' }).lean()
const raw = d.originalText?.rw || ''
const si = raw.indexOf('A r ti c le 167 :')
const blockRaw = raw.slice(si)
const skip = 20
const am = blockRaw.slice(skip).search(/[\u00c0-\u024f]/)
const endIdx = am >= 0 ? am + skip : blockRaw.length
const rawBlock = blockRaw.slice(0, endIdx).replace(/[;\s,]+$/, '').trim()
console.log('endIdx:', endIdx, '  am:', am,  '  blockRaw.len:', blockRaw.length)
console.log('rawBlock.length:', rawBlock.length)
console.log('BLOCK:', rawBlock)
await mongoose.disconnect()
