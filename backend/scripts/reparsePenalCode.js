/**
 * Re-parse the Penal Code 2018 PDF and update LegalContent records
 * with clean English text extracted directly from the PDF.
 *
 * Strategy:
 *  1. Parse the full PDF text
 *  2. Find every "Article N:" occurrence followed by English content
 *  3. For each, pick the version with the lowest French-accent score
 *  4. Update the DB record's originalText.en with clean text
 */

import pdf from 'pdf-parse/lib/pdf-parse.js'
import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

import LegalContent from '../src/models/LegalContent.js'

// ── HELPERS ──────────────────────────────────────────────────────────────────

const frScore = (text) => (text.match(/[éèêëàâùûüïîôœçÉÈÊËÀÂÙÛÜÏÎÔŒÇ]/g) || []).length

const EN_WORDS = /\b(the|of|any|person|shall|liable|law|offence|offense|imprisonment|fine|penalty|penalties|convicted|commit|punished|section|article|following|unless|court|judge|sentence|years|months|theft|stealing|assault|violence|murder|fraud|drug|whoever|when|where|which|who|that|this|these|those|such|under|upon|within|without|against|between|before|after|by|from|into|through|during)\b/gi
const enScore = (text) => (text.match(EN_WORDS) || []).length

// Net score: positive = English, negative = French
const netScore = (text) => enScore(text) - frScore(text) * 0.5

// Clean extracted text: collapse multiple spaces/newlines, trim
const cleanText = (text) =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')        // collapse horizontal whitespace
    .replace(/\n{3,}/g, '\n\n')     // max 2 consecutive newlines
    .replace(/- \n/g, '')           // join hyphenated line breaks
    .trim()

// ── PARSE PDF ─────────────────────────────────────────────────────────────────

console.log('Reading PDF...')
const pdfPath = path.join(__dirname, '../../Documents/penalcode2018.pdf')
const buf = fs.readFileSync(pdfPath)
const { text: rawText } = await pdf(buf)
console.log(`PDF parsed: ${rawText.length} chars`)

// ── EXTRACT ALL ARTICLE SECTIONS ──────────────────────────────────────────────

// Match "Article N:" or "Article N\n" where N is a number (or "One"/"Premier")
// Also match "Article One" specially
const ARTICLE_RE = /\bArticle\s+(One|Premier|[\d]+)\s*[:.\n]/gi

const matches = []
let m
while ((m = ARTICLE_RE.exec(rawText)) !== null) {
  const numStr = m[1].toLowerCase()
  const num = numStr === 'one' || numStr === 'premier' ? 1 : parseInt(numStr, 10)
  if (!isNaN(num) && num >= 1 && num <= 340) {
    matches.push({ num, index: m.index, raw: m[0] })
  }
}
console.log(`Found ${matches.length} Article markers in PDF`)

// For each article number, collect all text blocks
const articleBlocks = {}   // { num: [{ text, frScore }] }

for (let i = 0; i < matches.length; i++) {
  const { num, index } = matches[i]
  const nextIdx = matches[i + 1] ? matches[i + 1].index : Math.min(index + 3000, rawText.length)
  const block = cleanText(rawText.slice(index, nextIdx))
  if (block.length < 30) continue

  if (!articleBlocks[num]) articleBlocks[num] = []
  articleBlocks[num].push({ text: block, fr: frScore(block) })
}

console.log(`Unique article numbers found: ${Object.keys(articleBlocks).length}`)

// For each article, pick the block with the highest net English score + longest text
const bestBlocks = {}
for (const [numStr, blocks] of Object.entries(articleBlocks)) {
  // Sort by net score (EN words - FR accents*0.5), then by length
  const sorted = [...blocks].sort((a, b) => {
    const scoreDiff = netScore(b.text) - netScore(a.text)
    if (Math.abs(scoreDiff) > 1) return scoreDiff
    return b.text.length - a.text.length
  })
  bestBlocks[numStr] = sorted[0]
}

// ── UPDATE DATABASE ───────────────────────────────────────────────────────────

await mongoose.connect(process.env.MONGODB_URI)
console.log('Connected to MongoDB')

const existingArticles = await LegalContent.find({ sourceDocument: 'Penal Code 2018' })
  .select('_id articleNumber originalText')

console.log(`\nProcessing ${existingArticles.length} DB articles...`)

let updated = 0, skipped = 0, noImprovement = 0

for (const dbArt of existingArticles) {
  // Parse number from "Article 167" → 167
  const numMatch = dbArt.articleNumber.match(/\d+/)
  if (!numMatch) { skipped++; continue }
  const num = parseInt(numMatch[0], 10)

  const best = bestBlocks[num]
  if (!best) { skipped++; continue }

  const currentText = dbArt.originalText?.en || ''
  const currentNet = netScore(currentText)
  const newNet = netScore(best.text)

  // Skip if current text is already good English (net > 5)
  if (currentNet >= 5 && frScore(currentText) <= 5) {
    noImprovement++
    continue
  }

  // Skip if new text isn't actually better
  if (newNet <= currentNet && currentNet > 0) {
    noImprovement++
    continue
  }

  // Only update if new text has real content
  if (best.text.length < 80) { skipped++; continue }

  await LegalContent.updateOne(
    { _id: dbArt._id },
    { $set: { 'originalText.en': best.text } }
  )
  updated++

  if (updated <= 5) {
    console.log(`\nUpdated ${dbArt.articleNumber}: netScore ${currentNet.toFixed(1)}→${newNet.toFixed(1)}`)
    console.log('  New text:', best.text.slice(0, 150))
  }
}

console.log(`\n✓ Done: ${updated} updated, ${noImprovement} already good, ${skipped} skipped`)
await mongoose.disconnect()
