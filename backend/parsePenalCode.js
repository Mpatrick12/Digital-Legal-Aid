/**
 * parsePenalCode.js
 * 
 * Parses a Rwanda Penal Code PDF and extracts individual articles.
 * Saves output to parsedLaws.json in the project root /documents folder.
 * 
 * Usage:
 *   node backend/parsePenalCode.js [path-to-pdf]
 * 
 * Default PDF location: ./documents/penal_code.pdf
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pdf from 'pdf-parse'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ─── Configuration ────────────────────────────────────────────────────────────

const DEFAULT_PDF_PATH = path.join(__dirname, '..', 'Documents', 'penalcode2018.pdf')
const OUTPUT_PATH = path.join(__dirname, '..', 'Documents', 'parsedLaws.json')

// Crime type detection keywords (English + Kinyarwanda)
const CRIME_KEYWORDS = {
  'Theft': [
    'theft', 'steal', 'stolen', 'stealing', 'robbery', 'burglary', 'larceny',
    'ubujura', 'kwiba', 'umunyabujura'
  ],
  'Assault': [
    'assault', 'battery', 'bodily harm', 'physical violence', 'attack', 'beating',
    'gukubita', 'ihohoterwa ry\'umubiri', 'gutera'
  ],
  'GBV': [
    'gender-based violence', 'gbv', 'domestic violence', 'rape', 'sexual assault',
    'sexual violence', 'sexual harassment', 'defilement',
    'gufata ku ngufu', 'ihohoterwa rishingiye ku gitsina', 'indangagaciro'
  ],
  'Murder': [
    'murder', 'homicide', 'killing', 'manslaughter', 'intentional killing',
    'ubwicanyi', 'kwicana', 'urupfu'
  ],
  'Fraud': [
    'fraud', 'forgery', 'deception', 'false pretenses', 'embezzlement',
    'scam', 'cheating', 'misrepresentation',
    'uburiganya', 'gukurura', 'guriganya'
  ],
  'Property Damage': [
    'property damage', 'destruction', 'vandalism', 'arson', 'damage to property',
    'gusenyera', 'gutwika', 'kurimbura umutungo'
  ],
  'Drug': [
    'drug', 'narcotic', 'substance', 'cannabis', 'cocaine', 'trafficking',
    'ibiyobyabwenge', 'gucuruza imiti'
  ],
  'Corruption': [
    'corruption', 'bribery', 'bribe', 'abuse of power', 'embezzlement',
    'ruswa', 'gutunga ruswa', 'gusaba ruswa'
  ]
}

// Reporting location templates
const REPORTING_LOCATIONS = {
  'Theft':           'Nearest Police Station (Rwanda National Police) or Toll-Free: 112',
  'Assault':         'Nearest Police Station or Isange One Stop Centre for violence cases',
  'GBV':             'Isange One Stop Centre (Hospitals) or Rwanda National Police: 112',
  'Murder':          'Rwanda National Police immediately: 112',
  'Fraud':           'Rwanda National Police or Rwanda Investigation Bureau (RIB)',
  'Property Damage': 'Nearest Police Station — Rwanda National Police',
  'Drug':            'Rwanda National Police: 112 or Rwanda Investigation Bureau (RIB)',
  'Corruption':      'Rwanda Investigation Bureau (RIB) or Ombudsman Office',
  'Other':           'Nearest Police Station — Rwanda National Police: 112'
}

// Reporting steps templates
const REPORTING_STEPS = {
  'Theft': [
    'Go to the nearest police station and report the theft.',
    'Provide a detailed description of what was stolen and when.',
    'Bring any witnesses who saw the crime happen.',
    'Request a Police Abstract (official report document).',
    'Follow up regularly on your case progress.'
  ],
  'Assault': [
    'Seek immediate medical attention if injured.',
    'Report the assault to the nearest police station.',
    'Describe the attacker and what happened in detail.',
    'Gather witness contact information if possible.',
    'Obtain a medical report documenting your injuries.',
    'Request a Police Abstract for your records.'
  ],
  'GBV': [
    'Go to the Isange One Stop Centre at the nearest referral hospital.',
    'You will receive free medical care, counseling, and legal support.',
    'A trained officer will take your statement confidentially.',
    'You do NOT need to go to a police station first.',
    'Your identity will be protected throughout the process.'
  ],
  'Murder': [
    'Call Rwanda National Police immediately: 112.',
    'Do not touch or move anything at the scene.',
    'Secure the scene and wait for police to arrive.',
    'Provide your full statement to the responding officers.'
  ],
  'Fraud': [
    'Collect all evidence: messages, receipts, contracts, screenshots.',
    'Report to Rwanda National Police or Rwanda Investigation Bureau (RIB).',
    'Provide a detailed written account of the fraud.',
    'Bring all documents and evidence when you report.'
  ],
  'Other': [
    'Report the incident to the nearest police station.',
    'Provide a full account of what happened.',
    'Bring any available evidence or witnesses.',
    'Request a Police Abstract (official report).',
    'Seek legal aid at the nearest Legal Aid Forum Rwanda office.'
  ]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Detect crime type from article text based on keyword matching.
 */
function detectCrimeType(text) {
  const lower = text.toLowerCase()
  let bestMatch = null
  let bestScore = 0

  for (const [crimeType, keywords] of Object.entries(CRIME_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) score++
    }
    if (score > bestScore) {
      bestScore = score
      bestMatch = crimeType
    }
  }

  return bestScore > 0 ? bestMatch : 'Other'
}

/**
 * Generate a simplified plain-English explanation for an article.
 */
function simplifyText(rawText, crimeType) {
  const sentences = rawText
    .replace(/\s+/g, ' ')
    .split(/[.!?]/)
    .map(s => s.trim())
    .filter(s => s.length > 20)
    .slice(0, 3)

  if (sentences.length === 0) {
    return `This article covers legal provisions related to ${crimeType.toLowerCase()} under Rwandan law.`
  }

  return sentences.join('. ') + '.'
}

/**
 * Extract keywords from article text for better search indexing.
 */
function extractKeywords(text, crimeType) {
  const keywords = new Set()

  // Add crime type as keyword
  keywords.add(crimeType.toLowerCase())

  // Add matched crime keywords
  const lower = text.toLowerCase()
  if (CRIME_KEYWORDS[crimeType]) {
    for (const kw of CRIME_KEYWORDS[crimeType]) {
      if (lower.includes(kw.toLowerCase())) {
        keywords.add(kw.toLowerCase())
      }
    }
  }

  // Extract capitalized terms (likely proper nouns / legal terms)
  const capitalizedTerms = text.match(/\b[A-Z][a-z]{3,}\b/g) || []
  capitalizedTerms.slice(0, 5).forEach(t => keywords.add(t.toLowerCase()))

  return Array.from(keywords)
}

/**
 * Get required evidence list for a crime type.
 */
function getRequiredEvidence(crimeType) {
  const evidence = {
    'Theft': [
      'Description of stolen items (type, value, date stolen)',
      'Witness statements if available',
      'Security camera footage if available',
      'Any receipts or proof of ownership'
    ],
    'Assault': [
      'Medical report documenting injuries',
      'Photos of injuries',
      'Witness statements',
      'Any weapon used (do not handle — report to police)'
    ],
    'GBV': [
      'Medical examination at Isange One Stop Centre',
      'Your statement (given confidentially)',
      'Witness statements if any',
      'Any threatening messages or communications'
    ],
    'Murder': [
      'Do not disturb the crime scene',
      'Names of witnesses',
      'Any known information about suspects',
      'Security footage if available'
    ],
    'Fraud': [
      'All written communications (emails, texts, letters)',
      'Receipts or proof of payment',
      'Contracts or agreements',
      'Bank statements showing transactions'
    ],
    'Property Damage': [
      'Photos of damaged property',
      'Proof of ownership',
      'Estimated repair cost / valuation',
      'Witness statements'
    ],
    'Drug': [
      'Description of what you witnessed',
      'Location and time details',
      'Any physical evidence (do not handle — inform police)'
    ],
    'Corruption': [
      'Any written demands for bribes',
      'Witness statements',
      'Audio or video recordings (if legally obtained)',
      'Documentary evidence of abuse of power'
    ],
    'Other': [
      'Written account of what happened',
      'Witness names and contacts',
      'Any physical evidence',
      'Photos or recordings if available'
    ]
  }
  return evidence[crimeType] || evidence['Other']
}

/**
 * Split raw PDF text into English and Kinyarwanda sections.
 * Rwanda Penal Code PDFs typically have bilingual content —
 * Kinyarwanda articles start with "Ingingo ya".
 */
function splitBilingualText(fullText) {
  // Try to find the boundary between languages
  // Common pattern: Kinyarwanda section often starts mid-document
  const rwandaMarker = /ingingo\s+ya\s+\d+/i
  const rwandaIndex = fullText.search(rwandaMarker)

  if (rwandaIndex > 1000) {
    return {
      englishSection: fullText.substring(0, rwandaIndex),
      kinyarwandaSection: fullText.substring(rwandaIndex)
    }
  }

  // If not clearly separated, treat the whole thing as English  
  return {
    englishSection: fullText,
    kinyarwandaSection: ''
  }
}

/**
 * Parse individual English articles from text.
 * Matches: "Article 1:" / "Article 1." / "ARTICLE 1" / "Art. 1"
 */
function parseEnglishArticles(text) {
  const articlePattern = /(?:^|\n)\s*(?:Article|Art\.?)\s+(\d+(?:\s*bis)?)\s*[:.—\-]?\s*/gi
  const articles = []
  const matches = [...text.matchAll(articlePattern)]

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const articleNumber = match[1].trim().replace(/\s+/g, '')
    const startIndex = match.index + match[0].length
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : text.length
    const articleText = text.substring(startIndex, endIndex).trim()

    if (articleText.length > 30) {
      articles.push({ articleNumber, text: articleText })
    }
  }

  return articles
}

/**
 * Parse Kinyarwanda articles.
 * Matches: "Ingingo ya 1:" / "Ingingo ya mbere"
 */
function parseKinyarwandaArticles(text) {
  const articlePattern = /(?:^|\n)\s*Ingingo\s+ya\s+(\d+(?:\s*bis)?|mbere|kabiri|gatatu)\s*[:.—\-]?\s*/gi
  const articles = []
  const matches = [...text.matchAll(articlePattern)]

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    let articleNumber = match[1].trim()

    // Normalize Kinyarwanda ordinals to numbers
    const ordinalMap = { 'mbere': '1', 'kabiri': '2', 'gatatu': '3' }
    articleNumber = ordinalMap[articleNumber.toLowerCase()] || articleNumber

    const startIndex = match.index + match[0].length
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : text.length
    const articleText = text.substring(startIndex, endIndex).trim()

    if (articleText.length > 30) {
      articles.push({ articleNumber, text: articleText })
    }
  }

  return articles
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

async function parsePenalCode(pdfPath) {
  console.log('━'.repeat(60))
  console.log('  Digital Legal Aid — Rwanda Penal Code Parser')
  console.log('━'.repeat(60))
  console.log(`\n📄 Reading PDF: ${pdfPath}\n`)

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ PDF file not found: ${pdfPath}`)
    console.error(`   Please place your PDF in: ${path.join(__dirname, '..', 'Documents')}`)
    process.exit(1)
  }

  // Extract text from PDF
  const dataBuffer = fs.readFileSync(pdfPath)
  let pdfData
  try {
    pdfData = await pdf(dataBuffer)
  } catch (err) {
    console.error('❌ Failed to parse PDF:', err.message)
    process.exit(1)
  }

  console.log(`✅ PDF loaded: ${pdfData.numpages} pages, ${pdfData.text.length} characters\n`)

  const fullText = pdfData.text

  // Split into language sections
  const { englishSection, kinyarwandaSection } = splitBilingualText(fullText)
  console.log(`🌐 English section: ${englishSection.length} chars`)
  console.log(`🌐 Kinyarwanda section: ${kinyarwandaSection.length} chars\n`)

  // Parse articles from both sections
  const englishArticles = parseEnglishArticles(englishSection)
  const kinyarwandaArticles = parseKinyarwandaArticles(
    kinyarwandaSection.length > 100 ? kinyarwandaSection : fullText
  )

  console.log(`📋 English articles found: ${englishArticles.length}`)
  console.log(`📋 Kinyarwanda articles found: ${kinyarwandaArticles.length}\n`)

  // Build a lookup map for Kinyarwanda articles
  const rwMap = new Map()
  kinyarwandaArticles.forEach(a => rwMap.set(a.articleNumber, a.text))

  // Build structured dataset
  const parsedArticles = []

  for (const enArt of englishArticles) {
    const crimeType = detectCrimeType(enArt.text)

    // Only include crime-relevant articles (filter out procedural/administrative ones)
    // We still include "Other" if the article is long enough to be substantive
    const rwText = rwMap.get(enArt.articleNumber) || ''

    const article = {
      article_number: `Article ${enArt.articleNumber}`,
      crime_type: crimeType,
      english_title: `${crimeType} — Article ${enArt.articleNumber}`,
      english_text: enArt.text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim(),
      kinyarwanda_text: rwText
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim(),
      simplified_english: simplifyText(enArt.text, crimeType),
      reporting_steps: (REPORTING_STEPS[crimeType] || REPORTING_STEPS['Other']).map(
        (step, i) => ({ step_number: i + 1, description: step })
      ),
      required_evidence: getRequiredEvidence(crimeType),
      where_to_report: REPORTING_LOCATIONS[crimeType] || REPORTING_LOCATIONS['Other'],
      keywords: extractKeywords(enArt.text, crimeType)
    }

    parsedArticles.push(article)
  }

  // Summary stats
  const crimeDistribution = {}
  parsedArticles.forEach(a => {
    crimeDistribution[a.crime_type] = (crimeDistribution[a.crime_type] || 0) + 1
  })

  console.log('📊 Crime type distribution:')
  Object.entries(crimeDistribution).forEach(([type, count]) => {
    console.log(`   ${type.padEnd(20)} ${count} articles`)
  })

  // Save to JSON
  const output = {
    metadata: {
      source: path.basename(pdfPath),
      parsed_at: new Date().toISOString(),
      total_articles: parsedArticles.length,
      pages: pdfData.numpages,
      crime_distribution: crimeDistribution
    },
    articles: parsedArticles
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf8')

  console.log(`\n✅ Saved ${parsedArticles.length} articles to:`)
  console.log(`   ${OUTPUT_PATH}`)
  console.log('\n🚀 Next step: run the seeder to load into MongoDB:')
  console.log('   node backend/seedLegalContent.js\n')

  return parsedArticles
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

const pdfPath = process.argv[2] || DEFAULT_PDF_PATH
parsePenalCode(pdfPath)
