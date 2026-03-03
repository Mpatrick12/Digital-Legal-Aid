/**
 * parseAllDocs.js
 *
 * Multi-document PDF parser for Digital Legal Aid Rwanda.
 * Loops through ALL PDFs in /Documents, detects document type,
 * extracts and parses articles, and saves a combined parsedLaws.json.
 *
 * Usage:
 *   node backend/parseAllDocs.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pdf from 'pdf-parse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DOCUMENTS_DIR = path.join(__dirname, '..', 'Documents')
const OUTPUT_PATH   = path.join(DOCUMENTS_DIR, 'parsedLaws.json')

// ─── Document Type Detection ─────────────────────────────────────────────────

function detectDocumentType(filename, text) {
  const f = filename.toLowerCase()
  const t = text.toLowerCase()

  // Most specific filename checks first
  if (f.includes('penalcode') || f.includes('68_2018') || f.includes('penal_code'))
    return 'Penal Code 2018'

  if (f.includes('genderbased') || f.includes('gender_based') || f.includes('gbv') ||
      f.includes('prevention and punishment'))
    return 'GBV Law'

  if (f.includes('criminal_procedure') || f.includes('criminal procedure') ||
      f.includes('law relating to the criminal'))
    return 'Criminal Procedure'

  // 2023 amendment — check filename date/law-number patterns BEFORE text content
  if (f.includes('05.12.2023') || f.includes('059_2023') || f.includes('imiburanishirize') ||
      f.includes('2023'))
    return 'Penal Code Amendment 2023'

  // GBV via text content (fallback after filename checks)
  if (t.includes('gender-based violence') || t.includes('isange one stop centre') ||
      t.includes('59/2008'))
    return 'GBV Law'

  // Criminal Procedure via text (fallback)
  if (t.includes('criminal procedure') || t.includes('code of criminal procedure'))
    return 'Criminal Procedure'

  return 'General Gazette'
}

// ─── Crime Keywords ──────────────────────────────────────────────────────────

const CRIME_KEYWORDS = {
  'Theft':           ['theft','steal','stolen','stealing','robbery','burglary','larceny',
                      'ubujura','kwiba','umunyabujura'],
  'Assault':         ['assault','battery','bodily harm','physical violence','attack','beating',
                      'gukubita','ihohoterwa ry\'umubiri','gutera'],
  'GBV':             ['gender-based violence','gbv','domestic violence','rape','sexual assault',
                      'sexual violence','sexual harassment','defilement',
                      'gufata ku ngufu','ihohoterwa rishingiye ku gitsina','isange'],
  'Murder':          ['murder','homicide','killing','manslaughter','intentional killing',
                      'ubwicanyi','kwicana','urupfu'],
  'Fraud':           ['fraud','forgery','deception','false pretenses','embezzlement',
                      'scam','cheating','misrepresentation','uburiganya','guriganya'],
  'Property Damage': ['property damage','destruction','vandalism','arson','damage to property',
                      'gusenyera','gutwika','kurimbura umutungo'],
  'Drug':            ['drug','narcotic','substance','cannabis','cocaine','trafficking',
                      'ibiyobyabwenge','gucuruza imiti'],
  'Corruption':      ['corruption','bribery','bribe','abuse of power',
                      'ruswa','gutunga ruswa','gusaba ruswa']
}

const REPORTING_LOCATIONS = {
  'Theft':           'Nearest Police Station (Rwanda National Police) or Toll-Free: 112',
  'Assault':         'Nearest Police Station or Isange One Stop Centre for violence cases',
  'GBV':             'Isange One Stop Centre (at major hospitals) or Rwanda National Police: 112',
  'Murder':          'Rwanda National Police immediately: 112',
  'Fraud':           'Rwanda National Police or Rwanda Investigation Bureau (RIB)',
  'Property Damage': 'Nearest Police Station — Rwanda National Police',
  'Drug':            'Rwanda National Police: 112 or Rwanda Investigation Bureau (RIB)',
  'Corruption':      'Rwanda Investigation Bureau (RIB) or Ombudsman Office',
  'Other':           'Nearest Police Station — Rwanda National Police: 112'
}

const REPORTING_STEPS = {
  'Theft':    ['Go to the nearest police station and report the theft.',
               'Provide a detailed description of what was stolen and when.',
               'Bring any witnesses who saw the crime happen.',
               'Request a Police Abstract (official report document).',
               'Follow up regularly on your case progress.'],
  'Assault':  ['Seek immediate medical attention if injured.',
               'Report the assault to the nearest police station.',
               'Describe the attacker and what happened in detail.',
               'Gather witness contact information if possible.',
               'Obtain a medical report documenting your injuries.'],
  'GBV':      ['Go to the Isange One Stop Centre at the nearest referral hospital.',
               'You will receive free medical care, counseling, and legal support.',
               'A trained officer will take your statement confidentially.',
               'You do NOT need to go to a police station first.',
               'Your identity will be protected throughout the process.'],
  'Murder':   ['Call Rwanda National Police immediately: 112.',
               'Do not touch or move anything at the scene.',
               'Secure the scene and wait for police to arrive.',
               'Provide your full statement to the responding officers.'],
  'Fraud':    ['Collect all evidence: messages, receipts, contracts, screenshots.',
               'Report to Rwanda National Police or Rwanda Investigation Bureau (RIB).',
               'Provide a detailed written account of the fraud.',
               'Bring all documents and evidence when you report.'],
  'Other':    ['Report the incident to the nearest police station.',
               'Provide a full account of what happened.',
               'Bring any available evidence or witnesses.',
               'Request a Police Abstract (official report).',
               'Seek legal aid at the nearest Legal Aid Forum Rwanda office.']
}

const REQUIRED_EVIDENCE = {
  'Theft':    ['Description of stolen items (type, value, date stolen)',
               'Witness statements if available',
               'Security camera footage if available',
               'Any receipts or proof of ownership'],
  'Assault':  ['Medical report documenting injuries',
               'Photos of injuries','Witness statements',
               'Any weapon used (do not handle — report to police)'],
  'GBV':      ['Medical examination at Isange One Stop Centre',
               'Your statement (given confidentially)',
               'Witness statements if any',
               'Any threatening messages or communications'],
  'Murder':   ['Do not disturb the crime scene','Names of witnesses',
               'Any known information about suspects',
               'Security footage if available'],
  'Fraud':    ['All written communications (emails, texts, letters)',
               'Receipts or proof of payment','Contracts or agreements',
               'Bank statements showing transactions'],
  'Property Damage': ['Photos of damaged property','Proof of ownership',
               'Estimated repair cost / valuation','Witness statements'],
  'Drug':     ['Description of what you witnessed',
               'Location and time details',
               'Any physical evidence (do not handle — inform police)'],
  'Corruption':['Any written demands for bribes','Witness statements',
               'Audio or video recordings (if legally obtained)',
               'Documentary evidence of abuse of power'],
  'Other':    ['Written account of what happened','Witness names and contacts',
               'Any physical evidence','Photos or recordings if available']
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectCrimeType(text) {
  const lower = text.toLowerCase()
  let best = null, bestScore = 0
  for (const [crimeType, kws] of Object.entries(CRIME_KEYWORDS)) {
    const score = kws.reduce((s, kw) => s + (lower.includes(kw.toLowerCase()) ? 1 : 0), 0)
    if (score > bestScore) { bestScore = score; best = crimeType }
  }
  return bestScore > 0 ? best : 'Other'
}

function simplifyText(rawText, crimeType) {
  const sentences = rawText.replace(/\s+/g, ' ').split(/[.!?]/)
    .map(s => s.trim()).filter(s => s.length > 20).slice(0, 3)
  if (!sentences.length)
    return `This article covers legal provisions related to ${crimeType.toLowerCase()} under Rwandan law.`
  return sentences.join('. ') + '.'
}

function extractKeywords(text, crimeType) {
  const kws = new Set([crimeType.toLowerCase()])
  const lower = text.toLowerCase()
  ;(CRIME_KEYWORDS[crimeType] || []).forEach(kw => { if (lower.includes(kw.toLowerCase())) kws.add(kw.toLowerCase()) })
  ;(text.match(/\b[A-Z][a-z]{3,}\b/g) || []).slice(0, 5).forEach(t => kws.add(t.toLowerCase()))
  return [...kws]
}

function splitBilingualText(fullText) {
  const rwIdx = fullText.search(/ingingo\s+ya\s+\d+/i)
  if (rwIdx > 1000)
    return { englishSection: fullText.substring(0, rwIdx), kinyarwandaSection: fullText.substring(rwIdx) }
  return { englishSection: fullText, kinyarwandaSection: '' }
}

function parseEnglishArticles(text) {
  const pattern = /(?:^|\n)\s*(?:Article|Art\.?|Section)\s+(\d+(?:\s*bis)?)\s*[:.—\-]?\s*/gi
  const matches = [...text.matchAll(pattern)]
  return matches.map((m, i) => {
    const articleNumber = m[1].trim().replace(/\s+/g, '')
    const start = m.index + m[0].length
    const end   = i + 1 < matches.length ? matches[i + 1].index : text.length
    const articleText = text.substring(start, end).trim()
    return articleText.length > 30 ? { articleNumber, text: articleText } : null
  }).filter(Boolean)
}

function parseKinyarwandaArticles(text) {
  const pattern = /(?:^|\n)\s*Ingingo\s+ya\s+(\d+(?:\s*bis)?|mbere|kabiri|gatatu)\s*[:.—\-]?\s*/gi
  const ordinals = { 'mbere': '1', 'kabiri': '2', 'gatatu': '3' }
  const matches = [...text.matchAll(pattern)]
  return matches.map((m, i) => {
    let articleNumber = m[1].trim()
    articleNumber = ordinals[articleNumber.toLowerCase()] || articleNumber
    const start = m.index + m[0].length
    const end   = i + 1 < matches.length ? matches[i + 1].index : text.length
    const articleText = text.substring(start, end).trim()
    return articleText.length > 30 ? { articleNumber, text: articleText } : null
  }).filter(Boolean)
}

// ─── Per-document parser ──────────────────────────────────────────────────────

async function parseSinglePdf(pdfPath) {
  const filename = path.basename(pdfPath)
  const dataBuffer = fs.readFileSync(pdfPath)
  const pdfData = await pdf(dataBuffer)
  const fullText = pdfData.text || ''
  const docType  = detectDocumentType(filename, fullText)

  // Always parse English articles on the full text (so we don't lose content from
  // multi-column / trilingual PDFs where the bilingual split may cut off too early)
  const englishArticles = parseEnglishArticles(fullText)

  // Kinyarwanda articles — look in the whole text as well
  const kinyarwandaArticles = parseKinyarwandaArticles(fullText)
  const rwMap = new Map(kinyarwandaArticles.map(a => [a.articleNumber, a.text]))

  const articles = englishArticles.map(enArt => {
    const crimeType = detectCrimeType(enArt.text)
    const rwText    = rwMap.get(enArt.articleNumber) || ''
    return {
      article_number:    `Article ${enArt.articleNumber}`,
      source_document:   docType,
      source_filename:   filename,
      crime_type:        crimeType,
      english_title:     `${crimeType} — Article ${enArt.articleNumber} (${docType})`,
      english_text:      enArt.text.replace(/\s+/g, ' ').trim(),
      kinyarwanda_text:  rwText.replace(/\s+/g, ' ').trim(),
      simplified_english: simplifyText(enArt.text, crimeType),
      reporting_steps:   (REPORTING_STEPS[crimeType] || REPORTING_STEPS['Other'])
                           .map((d, i) => ({ step_number: i + 1, description: d })),
      required_evidence: REQUIRED_EVIDENCE[crimeType] || REQUIRED_EVIDENCE['Other'],
      where_to_report:   REPORTING_LOCATIONS[crimeType] || REPORTING_LOCATIONS['Other'],
      keywords:          extractKeywords(enArt.text, crimeType),
      relevant_for_citizens: true
    }
  })

  return { filename, docType, pages: pdfData.numpages, articles }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('━'.repeat(60))
  console.log('  Digital Legal Aid — Multi-Document PDF Parser')
  console.log('━'.repeat(60) + '\n')

  const pdfFiles = fs.readdirSync(DOCUMENTS_DIR)
    .filter(f => f.toLowerCase().endsWith('.pdf'))
    .map(f => path.join(DOCUMENTS_DIR, f))

  if (!pdfFiles.length) {
    console.error(`❌ No PDF files found in ${DOCUMENTS_DIR}`)
    process.exit(1)
  }

  console.log(`📂 Found ${pdfFiles.length} PDF(s) in Documents/\n`)

  const allArticles = []
  const summaryRows = []

  for (const pdfPath of pdfFiles) {
    const fname = path.basename(pdfPath)
    process.stdout.write(`⏳ Parsing: ${fname} ... `)
    try {
      const { docType, pages, articles } = await parseSinglePdf(pdfPath)
      allArticles.push(...articles)
      summaryRows.push({ fname, docType, articles: articles.length, pages })
      console.log(`✅ ${articles.length} articles (${pages} pages) → [${docType}]`)
    } catch (err) {
      console.log(`❌ FAILED — ${err.message}`)
    }
  }

  // ── Print summary ──────────────────────────────────────────────────────────
  console.log('\n' + '━'.repeat(60))
  console.log('  PARSING SUMMARY')
  console.log('━'.repeat(60))
  for (const row of summaryRows) {
    const label = `✅ ${row.fname}`.slice(0, 50).padEnd(52)
    console.log(`${label} → ${String(row.articles).padStart(4)} articles  [${row.docType}]`)
  }
  console.log('━'.repeat(60))
  console.log(`   TOTAL: ${allArticles.length} articles ready for MongoDB`)
  console.log('━'.repeat(60) + '\n')

  // ── Source distribution ────────────────────────────────────────────────────
  const bySource = {}
  allArticles.forEach(a => { bySource[a.source_document] = (bySource[a.source_document] || 0) + 1 })
  console.log('📊 Articles per document:')
  Object.entries(bySource).forEach(([src, n]) => console.log(`   ${src.padEnd(35)} ${n}`))
  console.log()

  // ── Save output ────────────────────────────────────────────────────────────
  const output = {
    metadata: {
      parsed_at: new Date().toISOString(),
      total_articles: allArticles.length,
      documents: summaryRows.map(r => ({ file: r.fname, type: r.docType, articles: r.articles }))
    },
    articles: allArticles
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8')
  console.log(`💾 Saved ${allArticles.length} articles to Documents/parsedLaws.json`)
  console.log('\n🚀 Next step:')
  console.log('   node backend/seedLegalContent.js --clear\n')
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message)
  process.exit(1)
})
