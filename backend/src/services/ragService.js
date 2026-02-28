/**
 * ragService.js
 *
 * RAG (Retrieval Augmented Generation) service.
 * 1. retrieveRelevantArticles(query)  — fetches top matching legal articles from MongoDB
 * 2. generateLegalResponse(query, articles, language) — calls Groq (Llama 3) with context
 */

import Groq from 'groq-sdk'
import LegalContent from '../models/LegalContent.js'
import logger from '../config/logger.js'

// ─── Groq client (lazy — instantiated on first use so dotenv has loaded) ─────

let _groq = null
function getGroqClient() {
  if (!_groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in environment variables')
    }
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return _groq
}

// ─── Synonym map (same as search route — kept in sync) ───────────────────────

const synonymMap = {
  'theft':      ['stolen', 'stole', 'steal', 'thieves', 'thief', 'robbed', 'robbery', 'burglary', 'ubujura', 'kwiba'],
  'assault':    ['hit', 'attacked', 'beaten', 'beat', 'beating', 'battery', 'violence', 'fight', 'hurt', 'harmed', 'gukubita', 'gutera'],
  'violence':   ['gbv', 'domestic abuse', 'assault', 'ihohoterwa'],
  'rape':       ['sexual assault', 'sexual violence', 'gbv', 'gufata ku ngufu'],
  'fraud':      ['scam', 'deception', 'cheat', 'deceive', 'uburiganya', 'guriganya'],
  'murder':     ['killed', 'homicide', 'killing', 'ubwicanyi', 'kwicana'],
  'drug':       ['drugs', 'narcotics', 'substance', 'ibiyobyabwenge'],
  'corruption': ['bribery', 'bribe', 'ruswa', 'gutunga ruswa'],
  'property':   ['land', 'house', 'building', 'estate', 'umutungo'],
  'gbv':        ['gender-based violence', 'domestic violence', 'rape', 'sexual assault', 'ihohoterwa rishingiye ku gitsina']
}

function expandQuery(query) {
  const terms = query.toLowerCase().split(/\s+/)
  const expanded = new Set(terms)
  terms.forEach(term => {
    Object.entries(synonymMap).forEach(([key, syns]) => {
      if (key === term || syns.some(s => s === term)) {
        expanded.add(key)
        syns.forEach(s => expanded.add(s))
      }
    })
  })
  return Array.from(expanded).join(' ')
}

// ─── Step 1: Retrieve relevant articles ──────────────────────────────────────

/**
 * Searches MongoDB for the most relevant legal articles for a user query.
 * Uses MongoDB text search + keyword expansion.
 *
 * @param {string} userQuery  - The raw user message
 * @param {number} topK       - How many articles to return (default 5)
 * @returns {Array}           - Array of LegalContent documents
 */
export async function retrieveRelevantArticles(userQuery, topK = 5) {
  try {
    const expandedQuery = expandQuery(userQuery)
    logger.info('RAG retrieval', { original: userQuery, expanded: expandedQuery })

    // Primary: MongoDB full-text search scored by relevance
    const textResults = await LegalContent.find(
      { $text: { $search: expandedQuery } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(topK)
      .select('crimeType articleNumber simplifiedExplanation originalText reportingSteps requiredEvidence whereToReport tags keywords')
      .lean()

    if (textResults.length > 0) {
      logger.info('RAG text search found results', { count: textResults.length })
      return textResults
    }

    // Fallback: regex search on crimeType and tags if text index returns nothing
    const terms = userQuery.toLowerCase().split(/\s+/)
    const regexOr = terms.map(t => ({
      $or: [
        { crimeType: { $regex: t, $options: 'i' } },
        { tags: { $regex: t, $options: 'i' } },
        { keywords: { $regex: t, $options: 'i' } }
      ]
    }))

    const fallbackResults = await LegalContent.find({ $and: regexOr })
      .limit(topK)
      .select('crimeType articleNumber simplifiedExplanation originalText reportingSteps requiredEvidence whereToReport tags keywords')
      .lean()

    logger.info('RAG fallback regex search', { count: fallbackResults.length })
    return fallbackResults
  } catch (error) {
    logger.error('RAG retrieval error', { error: error.message })
    return []
  }
}

// ─── Context cleaning helpers ─────────────────────────────────────────────────

/**
 * Remove any line where the exact same phrase (≥4 words) appears more than twice.
 * This catches the "urukiko rwa polisi ruri mu Rwanda" style looping DB content.
 */
function cleanRepetitiveLines(text, maxPhraseRepeat = 2) {
  const lines = text.split('\n')
  const phraseCount = {}

  // Count every 4-word window across all lines
  lines.forEach(line => {
    const words = line.trim().split(/\s+/)
    for (let i = 0; i <= words.length - 4; i++) {
      const phrase = words.slice(i, i + 4).join(' ').toLowerCase()
      phraseCount[phrase] = (phraseCount[phrase] || 0) + 1
    }
  })

  // Keep a line only if none of its 4-word phrases exceed the repeat cap
  const cleaned = lines.filter(line => {
    const words = line.trim().split(/\s+/)
    for (let i = 0; i <= words.length - 4; i++) {
      const phrase = words.slice(i, i + 4).join(' ').toLowerCase()
      if (phraseCount[phrase] > maxPhraseRepeat) return false
    }
    return true
  })

  return cleaned.join('\n')
}

/**
 * Truncate AI response if it repeats the same sentence 3+ times.
 * Sentences are split on . ! ?
 */
function deduplicateResponse(text) {
  const VISIT_MSG = 'Baza polisi yo hafi yawe kugirango ubone amakuru arambuye.'
  const sentences = text.split(/(?<=[.!?])\s+/)
  const seen = {}
  const result = []

  for (const sentence of sentences) {
    const key = sentence.trim().toLowerCase()
    if (!key) continue
    seen[key] = (seen[key] || 0) + 1
    if (seen[key] >= 3) {
      // Repetition threshold hit — truncate here
      result.push(VISIT_MSG)
      return result.join(' ')
    }
    result.push(sentence.trim())
  }

  return result.join(' ')
}

// ─── Step 2: Generate AI response using retrieved articles ───────────────────

/**
 * Sends the user query + retrieved legal articles to Groq (Llama 3)
 * and returns a friendly, step-by-step legal guidance response.
 *
 * @param {string} userQuery          - The user's original message
 * @param {Array}  retrievedArticles  - Articles from retrieveRelevantArticles()
 * @param {string} language           - 'en' (English) or 'rw' (Kinyarwanda)
 * @param {Array}  conversationHistory - Previous messages [{role, content}]
 * @returns {string}                  - AI-generated response text
 */
export async function generateLegalResponse(
  userQuery,
  retrievedArticles,
  language = 'en',
  conversationHistory = []
) {
  // Build the context block from retrieved articles
  // — each article text is capped at 500 chars and repetitive lines are stripped
  const contextBlock = retrievedArticles.length > 0
    ? retrievedArticles.map((article, i) => {
        const rawLawText = article.originalText?.[language]
          || article.originalText?.en
          || ''
        // Truncate to 500 chars then clean repeated phrases
        const lawText = cleanRepetitiveLines(
          rawLawText.length > 500 ? rawLawText.slice(0, 500) + '…' : rawLawText
        )

        const rawExplanation = article.simplifiedExplanation?.[language]
          || article.simplifiedExplanation?.en
          || ''
        const explanation = cleanRepetitiveLines(
          rawExplanation.length > 500 ? rawExplanation.slice(0, 500) + '…' : rawExplanation
        )

        const steps = (article.reportingSteps || [])
          .map(s => `  ${s.stepNumber}. ${s.description?.[language] || s.description?.en || ''}`)
          .join('\n')

        const evidence = (article.requiredEvidence || [])
          .map(e => `  - ${e[language] || e.en || ''}`)
          .join('\n')

        const whereToReport = article.whereToReport?.[language]
          || article.whereToReport?.en
          || ''

        return `
[LEGAL ARTICLE ${i + 1}]
Reference: ${article.articleNumber} | Crime Type: ${article.crimeType}
${lawText ? `Exact Law Text: "${lawText}"` : ''}
${explanation ? `Plain Explanation: ${explanation}` : ''}
${steps ? `Reporting Steps:\n${steps}` : ''}
${evidence ? `Required Evidence:\n${evidence}` : ''}
${whereToReport ? `Where to Report: ${whereToReport}` : ''}
`.trim()
      }).join('\n\n---\n\n')
    : 'No specific legal articles were found for this query.'

  // System prompt — single strict version, language determined by user's message
  const systemPrompt = `You are a professional Rwandan legal aid assistant. Your job is to help people understand their rights under Rwandan law.

LANGUAGE RULE — MOST IMPORTANT:
- Detect the language the user is writing in (English or Kinyarwanda)
- Respond ENTIRELY in that same language
- NEVER mix languages in a single response
- NEVER add translations or parenthetical explanations like (meaning: ...)
- If the user writes in Kinyarwanda, your ENTIRE response must be in Kinyarwanda only
- If the user writes in English, your ENTIRE response must be in English only

CONTENT RULES:
- Answer based on the legal articles provided below
- If the context has no relevant info, say clearly: "I don't have specific information on that — please visit your nearest police station"
- NEVER repeat the same sentence more than once
- Keep responses under 150 words
- Be direct, warm, and practical
- End with one clear action step

CONTEXT FROM RWANDAN LAW:
${contextBlock}`

  // Build messages array for Groq
  const messages = [
    { role: 'system', content: systemPrompt },
    // Include last 4 exchanges of history for context (avoid token overflow)
    ...conversationHistory.slice(-8),
    { role: 'user', content: userQuery }
  ]

  logger.info('Calling Groq API', {
    model: 'llama-3.1-8b-instant',
    articlesProvided: retrievedArticles.length,
    language,
    historyLength: conversationHistory.length
  })

  const completion = await getGroqClient().chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
    temperature: 0.3,       // Low temperature = more factual, less creative
    max_tokens: 1024,
    top_p: 0.9
  })

  const rawResponse = completion.choices[0]?.message?.content || ''

  // Post-process: truncate if any sentence is repeated 3+ times
  const responseText = deduplicateResponse(rawResponse)

  logger.info('Groq response received', {
    tokens: completion.usage?.total_tokens,
    rawLength: rawResponse.length,
    cleanedLength: responseText.length,
    wasTruncated: responseText.length < rawResponse.length
  })

  return responseText
}

// ─── Greeting short-circuit ───────────────────────────────────────────────────

const GREETING_PATTERNS = /^\s*(hello|hi|hey|hie|howdy|sup|yo|good\s*(morning|afternoon|evening|day)|muraho|mwaramutse|mwiriwe|bonjour|salut|hola|ciao|greetings|what'?s\s*up|how\s*are\s*you|how\s*r\s*u)\s*[!?.]*\s*$/i

const GREETING_REPLIES = {
  en: "Hey! I'm your Legal Aid Assistant, powered by the Rwanda Penal Code. What can I help you with today?",
  rw: "Muraho! Ndi Umufasha wawe w'Amategeko, bishingiye ku Mategeko y'u Rwanda. Nakugira inkunga iki uyu munsi?"
}

// Catch meta/conversational messages that are NOT legal questions
const SMALLTALK_PATTERNS = [
  // Language permission questions
  { re: /kinyarwanda/i, reply: { en: "Of course! Feel free to write in Kinyarwanda. I\'ll respond in Kinyarwanda too. What happened?", rw: "Yego! Andika mu Kinyarwanda, nzasubiza mu Kinyarwanda. Ni iki cyabaye?" } },
  // English permission questions
  { re: /can i (speak|ask|write|talk).*english/i, reply: { en: "Yes, go ahead in English. What can I help you with?", rw: "Yego, andika mu Cyongereza. Nakugira inkunga iki?" } },
  // Thanks
  { re: /^\s*(thank(s| you)|merci|murakoze|asante|urakoze)\s*[!.]*\s*$/i, reply: { en: "You're welcome. Is there anything else I can help you with?", rw: "Ntacyo. Hari ikindi nakugira inkunga?" } },
  // OK / understood
  { re: /^\s*(ok(ay)?|got it|understood|alright|sure|fine|noted)\s*[!.]*\s*$/i, reply: { en: "Great. What would you like to know?", rw: "Nziza. Ni iki ushaka kumenya?" } }
]

function isGreeting(query) {
  return GREETING_PATTERNS.test(query.trim())
}

function getSmallTalkReply(query, language) {
  for (const { re, reply } of SMALLTALK_PATTERNS) {
    if (re.test(query.trim())) {
      return reply[language] || reply.en
    }
  }
  return null
}

// ─── Combined RAG pipeline ────────────────────────────────────────────────────

/**
 * Full RAG pipeline: retrieve + generate in one call.
 *
 * @param {string} userQuery
 * @param {string} language  - 'en' | 'rw'
 * @param {Array}  history   - [{role, content}]
 * @returns {{ response: string, sources: Array }}
 */
export async function ragPipeline(userQuery, language = 'en', history = []) {
  // Short-circuit: greetings and small-talk — no AI or DB call needed
  if (isGreeting(userQuery)) {
    return { response: GREETING_REPLIES[language] || GREETING_REPLIES.en, sources: [] }
  }
  const smallTalkReply = getSmallTalkReply(userQuery, language)
  if (smallTalkReply) {
    return { response: smallTalkReply, sources: [] }
  }

  const articles = await retrieveRelevantArticles(userQuery)
  const response = await generateLegalResponse(userQuery, articles, language, history)

  // Return cleaned source list for citation display in the UI
  const sources = articles.map(a => ({
    articleNumber: a.articleNumber,
    crimeType: a.crimeType,
    summary: a.simplifiedExplanation?.[language] || a.simplifiedExplanation?.en || '',
    lawText: a.originalText?.[language] || a.originalText?.en || ''
  }))

  return { response, sources }
}
