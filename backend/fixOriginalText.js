/**
 * Migration: extract clean English article text from originalText.rw
 *
 * The PDF-parsed rw field contains trilingual text:
 *   [Kinyarwanda] [English OCR - spaced chars] [French] [Kinyarwanda]
 *
 * This script extracts the English block, cleans OCR artifacts, and writes
 * the result to originalText.en.
 *
 * Run: node fixOriginalText.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

await mongoose.connect(process.env.MONGODB_URI)
const { default: LegalContent } = await import('./src/models/LegalContent.js')

// ---------------------------------------------------------------------------
// OCR cleaning — targeted word replacements + single-char-run collapse.
// We avoid generic "collapse all short tokens" regexes because those merge
// real English words like "or in a" -> "orina".
// ---------------------------------------------------------------------------
function cleanOcr(text) {
  let s = text

  // Collapse runs of ONLY isolated single characters.
  // e.g. "t h e f t" -> "theft"  (safe: English never has 4+ consecutive 1-char words)
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\b([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z])\b/g, '$1$2$3$4$5$6$7$8')
    s = s.replace(/\b([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z])\b/g, '$1$2$3$4$5$6$7')
    s = s.replace(/\b([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z])\b/g, '$1$2$3$4$5$6')
    s = s.replace(/\b([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z])\b/g, '$1$2$3$4$5')
    s = s.replace(/\b([A-Za-z]) ([A-Za-z]) ([A-Za-z]) ([A-Za-z])\b/g, '$1$2$3$4')
    s = s.replace(/\b([A-Za-z]) ([A-Za-z]) ([A-Za-z])\b/g, '$1$2$3')
  }

  // Targeted fixes for the most common OCR artifacts in the Rwanda Penal Code PDF
  const fixes = [
    [/\bthe\s+f\s*t\b/gi, 'theft'],
    [/\bthef\s+t\b/gi, 'theft'],
    [/\bthro\s+u\s*g\s*h\b/gi, 'through'],
    [/\bthroug\s+h\b/gi, 'through'],
    [/\bburgl\s+a\s*r\s*y\b/gi, 'burglary'],
    [/\bburgl\s+ary\b/gi, 'burglary'],
    [/\bc\s*l\s*imb\s*i\s*ng\b/gi, 'climbing'],
    [/\bcli\s*mb\s*ing\b/gi, 'climbing'],
    [/\bA r ti c le\b/g, 'Article'],
    [/\bA r t i c l e\b/g, 'Article'],
    [/\bAr ti c le\b/g, 'Article'],
    [/\bAgg\s+r\s+av\s+a\s+t\s+i\s+n\s+g\b/g, 'Aggravating'],
    [/\bAggrav\s+a\s+t\s+i\s+ng\b/g, 'Aggravating'],
    [/\bc\s+ir\s+c\s+u\s+m\s+stanc\s+e\s+s\b/gi, 'circumstances'],
    [/\bcircum\s*stanc\s*es\b/gi, 'circumstances'],
    [/\bim\s+p\s*r\s*is\s+on\b/gi, 'imprison'],
    [/\bp\s+e\s+r\s*s\s+on\b/gi, 'person'],
    [/\bRw\s+a\s*nd\s+a\s*n\b/gi, 'Rwandan'],
    [/\block\s+e\s*d\b/gi, 'locked'],
    [/\bloc\s+a\s*t\s*e\s*d\b/gi, 'located'],
    [/\bm\s+i\s*l\s*l\s*i\s*on\b/gi, 'million'],
    [/\bp\s*e\s*n\s*al\s*t\s*y\b/gi, 'penalty'],
    [/\bsen\s+t\s*enc\s*e\b/gi, 'sentence'],
    [/\boff\s*end\s*er\b/gi, 'offender'],
    [/\boff\s*enc\s*e\b/gi, 'offence'],
    [/\bthe the\s+ft\b/gi, 'the theft'],
  ]
  for (const [re, rep] of fixes) s = s.replace(re, rep)

  s = s.replace(/Official Gazette no\. Special of [^\n]{0,60}/g, '')
  s = s.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  return s
}

// ---------------------------------------------------------------------------
// Extract the English article block from the trilingual rw field
// ---------------------------------------------------------------------------
function extractEnglishBlock(raw, articleNum) {
  if (!raw || raw.length < 100) return null
  const num = String(articleNum).replace(/^Article\s+/i, '').trim()

  // Find where this article's OCR header starts
  const headerVariants = [
    'A r ti c le ' + num + ' :',
    'A r t i c l e ' + num + ' :',
    'Ar ti c le ' + num + ' :',
    'Article ' + num + ' :',
  ]
  let startIdx = -1
  for (const v of headerVariants) {
    const i = raw.indexOf(v)
    if (i >= 0 && (startIdx < 0 || i < startIdx)) startIdx = i
  }
  if (startIdx < 0) return null

  const blockRaw = raw.slice(startIdx)

  // ----- Find the French boundary using plain indexOf -----
  // Accented chars NEVER appear in English OCR; they reliably mark French onset.
  // Also use known French sentence starters in this corpus.
  const frenchMarkers = [
    '\u00e9t\u00e9 ',        // "été "
    'Toute personne',
    "l'auteur",
    "d'un emprisonnement",
    'est passible',
    'les peines',
    ' du vol',
    'Section 2 : Vol',
    'Section 3 : Vol',
    'Section 2 : De',
    'Article ' + num + ' : ',   // clean French version of same article
  ]

  let endIdx = blockRaw.length
  const skip = 20  // skip past the header itself

  for (const marker of frenchMarkers) {
    const i = blockRaw.indexOf(marker, skip)
    if (i > skip && i < endIdx) endIdx = i
  }

  // Stop at the first accented character (é è à ê â etc.) — these never appear
  // in the English OCR text of this PDF
  const accentSearch = blockRaw.slice(skip)
  const accentMatch = accentSearch.search(/[\u00c0-\u024f]/)
  if (accentMatch >= 0 && accentMatch + skip < endIdx) {
    endIdx = accentMatch + skip
  }

  const rawBlock = blockRaw.slice(0, endIdx).replace(/[;\s,]+$/, '').trim()
  if (rawBlock.length < 30) return null

  const cleaned = cleanOcr(rawBlock)
  return cleaned.trim() || null
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const all = await LegalContent.find({}).lean()
let updated = 0, skipped = 0

for (const doc of all) {
  const raw = doc.originalText?.rw || ''
  if (raw.length < 100) { skipped++; continue }

  const extracted = extractEnglishBlock(raw, doc.articleNumber)
  if (!extracted || extracted.length < 60) { skipped++; continue }

  await LegalContent.updateOne(
    { _id: doc._id },
    { $set: { 'originalText.en': extracted } }
  )
  const preview = extracted.slice(0, 120).replace(/\s+/g, ' ')
  console.log('\u2705 ' + doc.articleNumber + ': "' + preview + '..."')
  updated++
}

console.log('\nDone. Updated: ' + updated + ', Skipped: ' + skipped)
await mongoose.disconnect()
