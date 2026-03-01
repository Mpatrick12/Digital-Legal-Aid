/**
 * importPenalCode.js
 *
 * Bulk-imports all 1,142 articles from Documents/parsedLaws.json
 * (parsed from the official Rwanda Penal Code — Law No. 68/2018,
 * Official Gazette no. Special of 27/09/2018) into the LegalContent
 * MongoDB collection.
 *
 * Handles:
 *  - Deduplication: parsedLaws.json contains French + English duplicate
 *    entries for the same article number; we keep the best English one.
 *  - Field mapping from parsedLaws.json schema → LegalContent schema
 *  - Upsert by articleNumber so re-runs are safe
 *
 * Run from project root:
 *   node backend/data/importPenalCode.js
 */

import 'dotenv/config'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import mongoose from 'mongoose'
import LegalContent from '../src/models/LegalContent.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI not set in .env')
  process.exit(1)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Given multiple entries with the same article_number, pick the best one.
 * Preference order:
 *   1. Entry whose english_text does NOT start with a French word/pattern
 *   2. Entry with the longest kinyarwanda_text (most complete)
 *   3. First entry
 */
function pickBestEntry(entries) {
  const frenchMarkers = /^(toute|tout|les |le |la |une |un |lorsqu|lorsque|dans |il |elle |si |au |aux |du |des |Dès|À|En )/i
  const english = entries.filter(e => !frenchMarkers.test((e.english_text || '').trim()))
  const pool = english.length > 0 ? english : entries
  // Among candidates pick the one with the most Kinyarwanda text
  return pool.reduce((best, cur) =>
    (cur.kinyarwanda_text || '').length > (best.kinyarwanda_text || '').length ? cur : best
  )
}

/**
 * Maps a parsedLaws.json article object to the LegalContent mongoose document shape.
 */
function mapToSchema(a) {
  // reporting_steps: array of { step_number, description } (strings)
  const reportingSteps = (a.reporting_steps || []).map(s => ({
    stepNumber: s.step_number,
    description: {
      en: s.description || '',
      rw: '' // parsedLaws.json has no Kinyarwanda step text
    }
  }))

  // required_evidence: array of strings
  const requiredEvidence = (a.required_evidence || []).map(ev => ({
    en: typeof ev === 'string' ? ev : (ev.en || ''),
    rw: typeof ev === 'object' ? (ev.rw || '') : ''
  }))

  // tags: crime type slug + first 5 keywords
  const crimeSlug = (a.crime_type || 'other').toLowerCase().replace(/\s+/g, '-')
  const tags = [crimeSlug, ...((a.keywords || []).slice(0, 5))]
    .filter((v, i, arr) => v && arr.indexOf(v) === i) // unique, no empty

  return {
    crimeType: a.crime_type || 'Other',
    articleNumber: a.article_number,
    originalText: {
      en: a.english_text || '',
      rw: a.kinyarwanda_text || ''
    },
    simplifiedExplanation: {
      en: a.simplified_english || a.english_text || '',
      rw: '' // not available in parsedLaws.json
    },
    reportingSteps,
    requiredEvidence,
    whereToReport: {
      en: a.where_to_report || 'Nearest Police Station — Rwanda National Police: 112',
      rw: ''
    },
    tags,
    keywords: a.keywords || []
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function importAll() {
  // Load source file (relative to project root regardless of cwd)
  const jsonPath = resolve(__dirname, '../../Documents/parsedLaws.json')
  const raw = JSON.parse(readFileSync(jsonPath, 'utf8'))
  const all = raw.articles

  console.log(`📄  Loaded ${all.length} raw entries from parsedLaws.json`)
  console.log(`    Source: ${raw.metadata.source} — parsed ${raw.metadata.parsed_at}`)

  // ── Deduplicate by article_number ──────────────────────────────────────────
  const grouped = {}
  for (const a of all) {
    const key = a.article_number
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(a)
  }

  const unique = Object.values(grouped).map(pickBestEntry)
  console.log(`🔍  After deduplication: ${unique.length} unique articles`)

  // ── Connect ───────────────────────────────────────────────────────────────
  await mongoose.connect(MONGODB_URI)
  console.log('✅  Connected to MongoDB\n')

  // ── Upsert in batches of 100 ──────────────────────────────────────────────
  const BATCH = 100
  let inserted = 0
  let updated = 0
  let errors = 0

  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH)
    const ops = batch.map(a => {
      const doc = mapToSchema(a)
      return {
        updateOne: {
          filter: { articleNumber: doc.articleNumber },
          update: { $set: doc },
          upsert: true
        }
      }
    })

    try {
      const result = await LegalContent.bulkWrite(ops, { ordered: false })
      inserted += result.upsertedCount
      updated  += result.modifiedCount
      process.stdout.write(`\r  Progress: ${Math.min(i + BATCH, unique.length)}/${unique.length} articles processed...`)
    } catch (err) {
      console.error(`\n  ⚠️  Batch ${i}–${i + BATCH} error:`, err.message)
      errors++
    }
  }

  console.log('\n')

  // ── Summary ───────────────────────────────────────────────────────────────
  const total = await LegalContent.countDocuments()
  const byCrime = await LegalContent.aggregate([
    { $group: { _id: '$crimeType', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])

  console.log(`✅  Import complete!`)
  console.log(`   ➕ Inserted : ${inserted}`)
  console.log(`   🔄 Updated  : ${updated}`)
  if (errors) console.log(`   ⚠️  Batches with errors: ${errors}`)
  console.log(`   📚 Total articles in DB: ${total}`)
  console.log('\n   Distribution by crime type:')
  byCrime.forEach(r => console.log(`     ${r._id.padEnd(20)} ${r.count}`))
}

importAll()
  .catch(err => {
    console.error('❌  Import failed:', err)
    process.exit(1)
  })
  .finally(() => mongoose.disconnect())
