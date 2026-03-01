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

// ─── Language detection ──────────────────────────────────────────────────────

// Common Kinyarwanda words — if several appear in the message it's RW
const RW_WORDS = new Set([
  'ndashaka','icyabaye','ndi','kandi','ubu','ikibazo','muraho','mwaramutse','mwiriwe',
  'polisi','amategeko','gutunga','inzirakarengane','uburenganzira','ntacyo','yego',
  'oya','agatoki','ibyo','ibi','izi','abo','iki','nka','ngo','ariko','cyane',
  'gukora','gusubiza','kumenya','baza','njye','twe','mwe','buri','hari','nta',
  'uko','ukuri','wawe','bawe','kawe','zawe','nawe','kwe','bwe','nke'
])

/**
 * Auto-detect language from message text.
 * Returns 'rw' if enough Kinyarwanda tokens found, else falls back to supplied language.
 */
function detectLanguage(text, fallback = 'en') {
  const tokens = text.toLowerCase().split(/\s+/)
  const rwCount = tokens.filter(t => RW_WORDS.has(t.replace(/[^a-z']/g, ''))).length
  // 2+ RW words in the message = treat as Kinyarwanda
  return rwCount >= 2 ? 'rw' : fallback
}

// Common Kiswahili markers — if these appear heavily in AI output it's wrong
const SWAHILI_MARKERS = [
  'ninaweza','tafadhali','kwa nini','unarudishwa','ndabona','ndiwe','tuelewe',
  'kinafanyika','nakujua','kujua','kusaidia','nitasaidia','asante','karibu',
  'habari','mambo','sawa','kwamba','kama','lakini','hivyo','hapa','wewe'
]

function containsKiswahili(text) {
  const lower = text.toLowerCase()
  const hits = SWAHILI_MARKERS.filter(w => lower.includes(w)).length
  return hits >= 2  // 2+ Swahili words = likely wrong language
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
const GROQ_MODEL = 'llama-3.3-70b-versatile'

export async function generateLegalResponse(
  userQuery,
  retrievedArticles,
  language = 'en',
  conversationHistory = []
) {
  // Auto-detect actual language from the user's text — overrides UI toggle
  const detectedLang = detectLanguage(userQuery, language)
  // Build the context block from retrieved articles
  // — use detectedLang for article text so context matches response language
  // — each article text is capped at 500 chars and repetitive lines are stripped
  const contextBlock = retrievedArticles.length > 0
    ? retrievedArticles.map((article, i) => {
        const rawLawText = article.originalText?.[detectedLang]
          || article.originalText?.en
          || ''
        // Truncate to 500 chars then clean repeated phrases
        const lawText = cleanRepetitiveLines(
          rawLawText.length > 500 ? rawLawText.slice(0, 500) + '…' : rawLawText
        )

        const rawExplanation = article.simplifiedExplanation?.[detectedLang]
          || article.simplifiedExplanation?.en
          || ''
        const explanation = cleanRepetitiveLines(
          rawExplanation.length > 500 ? rawExplanation.slice(0, 500) + '…' : rawExplanation
        )

        const steps = (article.reportingSteps || [])
          .map(s => `  ${s.stepNumber}. ${s.description?.[detectedLang] || s.description?.en || ''}`)
          .join('\n')

        const evidence = (article.requiredEvidence || [])
          .map(e => `  - ${e[detectedLang] || e.en || ''}`)
          .join('\n')

        const whereToReport = article.whereToReport?.[detectedLang]
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

  const langLabel = detectedLang === 'rw' ? 'Kinyarwanda' : 'English'
  const langEnforcement = detectedLang === 'rw'
    ? 'The user is writing in KINYARWANDA. Your ENTIRE response MUST be in Kinyarwanda. Not English. Not Kiswahili. Not French. Kinyarwanda ONLY.'
    : 'The user is writing in ENGLISH. Your ENTIRE response MUST be in English. Not Kiswahili. Not French. Not Kinyarwanda. English ONLY.'

  // System prompt — strict, language-explicit, Kiswahili explicitly banned
  const systemPrompt = `You are a professional Rwandan legal aid assistant. Your job is to help people understand their legal rights under Rwandan law.

=== LANGUAGE ENFORCEMENT (NON-NEGOTIABLE) ===
${langEnforcement}

REQUIRED OUTPUT LANGUAGE: ${langLabel}
FORBIDDEN LANGUAGES: Kiswahili, Swahili, French, any other language.
Do NOT mix languages. Do NOT add translations. Do NOT add parenthetical explanations.
Every single word in your response must be ${langLabel}.

=== HOW TO STRUCTURE EVERY RESPONSE ===
Step 1 — State the crime: Identify what crime this is under Rwandan law (one sentence).
Step 2 — Cite the law: ALWAYS quote the exact article. Format: "Article [number] of the Rwanda Penal Code states: \"[exact quote from the context]\"" — do this even if only part of the article is relevant.
Step 3 — State the penalty: Tell the user exactly what punishment the law prescribes (imprisonment term, fine, or both).
Step 4 — Action steps: Give 2–3 clear numbered steps the person should take RIGHT NOW.
Step 5 — End with the emergency line: "Rwanda National Police: 112"

=== RULES ===
- NEVER skip article citation. If you do not cite an article, your response is wrong.
- NEVER invent articles or penalties not in the provided context.
- If context has no relevant article, say exactly: ${detectedLang === 'rw' ? '"Nta makuru arambuye mfite kuri ubu — baza polisi yo hafi yawe (112)."' : '"I don\'t have a specific article for that — please visit your nearest police station or call 112."'}
- NEVER repeat the same sentence.
- Keep response under 200 words.

=== CONTEXT FROM RWANDAN LAW ===
${contextBlock}`

  // Build messages array for Groq
  const messages = [
    { role: 'system', content: systemPrompt },
    // Include last 4 exchanges of history for context (avoid token overflow)
    ...conversationHistory.slice(-8),
    { role: 'user', content: userQuery }
  ]

  logger.info('Calling Groq API', {
    model: GROQ_MODEL,
    articlesProvided: retrievedArticles.length,
    detectedLang,
    uiLang: language,
    historyLength: conversationHistory.length
  })

  const callGroq = (msgs) => getGroqClient().chat.completions.create({
    model: GROQ_MODEL,
    messages: msgs,
    temperature: 0.1,   // Very low — deterministic, follows instructions strictly
    max_tokens: 512,    // Enforce brevity
    top_p: 0.85
  })

  let completion = await callGroq(messages)
  let rawResponse = completion.choices[0]?.message?.content || ''

  // Language guard — if model returned Kiswahili, retry once with even stricter prompt
  if (containsKiswahili(rawResponse)) {
    logger.warn('Kiswahili detected in response — retrying with stricter prompt', { detectedLang })
    const stricterSystem = `CRITICAL INSTRUCTION: You MUST respond in ${langLabel} ONLY.\nKiswahili is STRICTLY FORBIDDEN. French is STRICTLY FORBIDDEN.\nIf you are unsure of a word in ${langLabel}, use a simpler word. NEVER switch to another language.\n\n${systemPrompt}`
    const retryMessages = [{ role: 'system', content: stricterSystem }, ...messages.slice(1)]
    completion = await callGroq(retryMessages)
    rawResponse = completion.choices[0]?.message?.content || ''
  }

  // Post-process: truncate if any sentence is repeated 3+ times
  const responseText = deduplicateResponse(rawResponse)

  logger.info('Groq response received', {
    tokens: completion.usage?.total_tokens,
    model: GROQ_MODEL,
    detectedLang,
    rawLength: rawResponse.length,
    cleanedLength: responseText.length
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
