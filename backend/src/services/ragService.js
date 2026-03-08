/**
 * ragService.js
 *
 * RAG (Retrieval Augmented Generation) service.
 * 1. retrieveRelevantArticles(query)  — fetches top matching legal articles from MongoDB
 * 2. generateLegalResponse(query, articles, language) — calls Groq (Llama 3) with context
 */

import Groq from 'groq-sdk'
import { Translate } from '@google-cloud/translate/build/src/v2/index.js'
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

// ─── Translation layer ────────────────────────────────────────────────────────

// ─── Google Cloud Translation client (lazy) ─────────────────────────────────
let _googleTranslate = null
function getGoogleTranslate() {
  if (!_googleTranslate) {
    if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
      throw new Error('GOOGLE_TRANSLATE_API_KEY is not set in environment variables')
    }
    _googleTranslate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY })
  }
  return _googleTranslate
}

// Terms that must never be translated — extracted before translation, restored after
const PROTECTED_TERMS = [
  { pattern: /Article\s+\d+/gi, key: 'ARTICLE' },
  { pattern: /Rwanda National Police/gi, key: 'RNP' },
  { pattern: /Isange One Stop Centre/gi, key: 'ISANGE' },
  { pattern: /Rwanda Penal Code/gi, key: 'RPC' },
  { pattern: /\b112\b/g, key: 'EMERGENCY' },
]

function protectTerms(text) {
  const map = {}
  let protected_ = text
  PROTECTED_TERMS.forEach(({ pattern, key }) => {
    let i = 0
    protected_ = protected_.replace(pattern, (match) => {
      // Use HTML span with notranslate — Google Cloud Translation never touches these
      const id = `${key}${i++}`
      map[id] = match
      return `<span class="notranslate" id="${id}">${match}</span>`
    })
  })
  return { protected_, map }
}

function restoreTerms(text, map) {
  // Strip the span wrapper but keep the inner content,
  // then replace any leftover id refs just in case
  let restored = text.replace(/<span[^>]*id="([^"]+)"[^>]*>(.*?)<\/span>/gi, (_, id, inner) => {
    return map[id] || inner
  })
  return restored
}

/**
 * Translate text using Google Cloud Translation API.
 * Protects article numbers and proper nouns from being altered.
 * Falls back to original text on any error so the app never breaks.
 */
async function translateWithGoogle(text, targetLang) {
  if (!text || !text.trim()) return text

  // Protect terms that must not be mangled by translation
  const { protected_, map } = protectTerms(text)

  try {
    const [translated] = await getGoogleTranslate().translate(protected_, {
      to: targetLang,
      format: 'html'   // tells Google to leave HTML tags (including our notranslate spans) intact
    })
    const restored = restoreTerms(translated, map)
    // Decode HTML entities that Google introduces when using format:'html'
    const decoded = restored
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
    logger.info('Google translation succeeded', { targetLang, chars: text.length })
    return decoded
  } catch (err) {
    logger.warn('Google translation failed — using original text', { targetLang, error: err.message })
    return text
  }
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
// Score how relevant an article is to the user query (0–1)
function scoreRelevance(article, query) {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  if (!queryWords.length) return 1
  const haystack = [
    article.originalText?.en || '',
    article.simplifiedExplanation?.en || '',
    (article.keywords || []).join(' '),
    (article.tags || []).join(' '),
    article.crimeType || ''
  ].join(' ').toLowerCase()
  const matches = queryWords.filter(w => haystack.includes(w)).length
  return matches / queryWords.length
}

export async function retrieveRelevantArticles(userQuery, topK = 5) {
  try {
    const expandedQuery = expandQuery(userQuery)
    logger.info('RAG retrieval', { original: userQuery, expanded: expandedQuery })

    // Fetch more candidates so we can filter by relevance
    const FETCH_K = topK * 3

    // Primary: MongoDB full-text search scored by relevance
    const textResults = await LegalContent.find(
      { $text: { $search: expandedQuery } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(FETCH_K)
      .select('crimeType articleNumber sourceDocument simplifiedExplanation originalText reportingSteps requiredEvidence whereToReport tags keywords')
      .lean()

    if (textResults.length > 0) {
      // Filter to minimum 30% relevance, then take topK highest scoring
      const scored = textResults
        .map(a => ({ ...a, _relevance: scoreRelevance(a, userQuery) }))
        .filter(a => a._relevance >= 0.3)
        .sort((a, b) => b._relevance - a._relevance)
        .slice(0, topK)

      // If filtering was too aggressive, fall back to top results without filter
      const final = scored.length > 0 ? scored : textResults.slice(0, topK)
      logger.info('RAG text search found results', { fetched: textResults.length, afterFilter: final.length })
      return final
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
      .limit(FETCH_K)
      .select('crimeType articleNumber sourceDocument simplifiedExplanation originalText reportingSteps requiredEvidence whereToReport tags keywords')
      .lean()

    const scoredFallback = fallbackResults
      .map(a => ({ ...a, _relevance: scoreRelevance(a, userQuery) }))
      .filter(a => a._relevance >= 0.3)
      .sort((a, b) => b._relevance - a._relevance)
      .slice(0, topK)

    const finalFallback = scoredFallback.length > 0 ? scoredFallback : fallbackResults.slice(0, topK)
    logger.info('RAG fallback regex search', { count: finalFallback.length })
    return finalFallback
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
  const VISIT_MSG = 'Please visit your nearest police station or call Rwanda National Police: 112.'
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
const GROQ_MODEL         = 'llama-3.3-70b-versatile'                    // primary — best quality
const GROQ_MODEL_FALLBACK = 'meta-llama/llama-4-scout-17b-16e-instruct'  // fallback when 70B is rate-limited

export async function generateLegalResponse(
  userQuery,
  retrievedArticles,
  language = 'en',
  conversationHistory = []
) {
  // This function always generates in English.
  // The ragPipeline() caller handles translation to/from Kinyarwanda.
  const contextBlock = retrievedArticles.length > 0
    ? retrievedArticles.map((article, i) => {
        const rawLawText = article.originalText?.en || ''
        // Truncate to 500 chars then clean repeated phrases
        const lawText = cleanRepetitiveLines(
          rawLawText.length > 500 ? rawLawText.slice(0, 500) + '…' : rawLawText
        )

        const rawExplanation = article.simplifiedExplanation?.en || ''
        const explanation = cleanRepetitiveLines(
          rawExplanation.length > 500 ? rawExplanation.slice(0, 500) + '…' : rawExplanation
        )

        const steps = (article.reportingSteps || [])
          .map(s => `  ${s.stepNumber}. ${s.description?.en || ''}`)
          .join('\n')

        const evidence = (article.requiredEvidence || [])
          .map(e => `  - ${e.en || ''}`)
          .join('\n')

        const whereToReport = article.whereToReport?.en || ''

        return `
[LEGAL ARTICLE ${i + 1}]
Reference: ${article.articleNumber} | Source: ${article.sourceDocument || 'Rwandan Law'} | Crime Type: ${article.crimeType}
${lawText ? `Exact Law Text: "${lawText}"` : ''}
${explanation ? `Plain Explanation: ${explanation}` : ''}
${steps ? `Reporting Steps:\n${steps}` : ''}
${evidence ? `Required Evidence:\n${evidence}` : ''}
${whereToReport ? `Where to Report: ${whereToReport}` : ''}
`.trim()
      }).join('\n\n---\n\n')
    : 'No specific legal articles were found for this query.'

  const hasContext = retrievedArticles.length > 0

  // Always generate in English — translation to RW is handled in ragPipeline()
  const systemPrompt = hasContext ? `You are a compassionate and knowledgeable legal aid officer in Rwanda.
You work at a legal aid center and someone has just walked in needing help.
Talk to them like a real person — warm, clear, and reassuring.

YOUR PERSONALITY:
- Empathetic and calm. The person may be scared or confused.
- Speak directly to them using "you" — like a real conversation
- Never say "Step 1", "Step 2" — just talk naturally
- Never narrate what you're doing ("Let me cite the law...") — just do it

HOW TO STRUCTURE YOUR RESPONSE:
1. Start by acknowledging what happened to them in one sentence
2. Tell them clearly what the law says about their situation — mention the specific article number naturally in the sentence, like "Under Article 167 of the Rwanda Penal Code..."
3. Tell them exactly what to do RIGHT NOW — be specific and practical
4. Mention the punishment the offender faces under the cited article. IMPORTANT: If the user asks about punishment, penalty, sentence, or fine — you MUST state the EXACT imprisonment term (number of years) AND the EXACT fine amount in RWF as written in the legal articles below. Never say vaguely "faces imprisonment" — always give the specific numbers (e.g. "3 to 5 years imprisonment and a fine of 500,000 to 1,000,000 RWF"). If no specific numbers appear in the context, say the offence carries serious penalties under Rwandan law.
5. Tell them what to bring or prepare
6. End with the emergency contact: Rwanda National Police: 112

STRICT RULES:
- ONLY use information from the legal articles provided below
- Never invent laws, article numbers, or procedures not in the context
- Keep the response under 200 words
- Do not use bullet points with numbers like "1. 2. 3." — write in natural flowing sentences or short paragraphs
- RESPOND IN ENGLISH ONLY. Do not use Kiswahili, French, or Kinyarwanda.
- If you don't have enough information, say "Please visit your nearest police station or call 112 for immediate help"

LEGAL CONTEXT FROM RWANDA PENAL CODE:
${contextBlock}

Remember: You are talking to a real person who needs real help right now. Be human.`

  : `You are a knowledgeable legal aid officer in Rwanda with broad expertise across all areas of Rwandan law — including labour law, land law, family law, tax law, commercial law, administrative law, and constitutional rights.
You work at a legal aid center and someone has just walked in needing help on a topic outside criminal law.
Talk to them like a real person — warm, clear, and practical.

YOUR PERSONALITY:
- Empathetic and calm. The person may be confused or worried.
- Speak directly to them using "you" — like a real conversation
- Never narrate what you're doing — just answer

HOW TO STRUCTURE YOUR RESPONSE:
1. Acknowledge their situation briefly
2. Explain what Rwandan law generally says about this — reference the relevant Rwandan law or institution by name where possible (e.g. "Under the Rwanda Labour Code...", "The Rwanda Revenue Authority (RRA)...", "The Rwanda Land Authority...")
3. Tell them what to do practically — which institution to contact, what documents to bring
4. Keep it under 200 words

IMPORTANT DISCLAIMER RULE:
- You do not have the specific statute text for this topic in your database
- End your response with this exact sentence on a new line: "⚠️ This is general legal guidance. For advice specific to your situation, consult a licensed advocate or visit your nearest legal aid clinic."

STRICT RULES:
- Use your knowledge of Rwandan law — but be honest when uncertain
- Never invent article numbers you are not sure of
- RESPOND IN ENGLISH ONLY`

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
    uiLang: language,
    historyLength: conversationHistory.length
  })

  const callGroq = async (msgs, model = GROQ_MODEL) => {
    try {
      return await getGroqClient().chat.completions.create({
        model,
        messages: msgs,
        temperature: 0.1,
        max_tokens: 512,
        top_p: 0.85
      })
    } catch (err) {
      if (err?.status === 429 && model === GROQ_MODEL) {
        logger.warn(`${GROQ_MODEL} rate-limited — falling back to ${GROQ_MODEL_FALLBACK}`)
        return getGroqClient().chat.completions.create({
          model: GROQ_MODEL_FALLBACK,
          messages: msgs,
          temperature: 0.1,
          max_tokens: 512,
          top_p: 0.85
        })
      }
      throw err
    }
  }

  let completion = await callGroq(messages)
  let rawResponse = completion.choices[0]?.message?.content || ''

  // Language guard — if model returned Kiswahili, retry once with stricter prompt
  if (containsKiswahili(rawResponse)) {
    logger.warn('Kiswahili detected in response — retrying with stricter prompt')
    const stricterSystem = `CRITICAL INSTRUCTION: You MUST respond in ENGLISH ONLY.\nKiswahili is STRICTLY FORBIDDEN. French is STRICTLY FORBIDDEN.\n\n${systemPrompt}`
    const retryMessages = [{ role: 'system', content: stricterSystem }, ...messages.slice(1)]
    completion = await callGroq(retryMessages)
    rawResponse = completion.choices[0]?.message?.content || ''
  }

  // Post-process: truncate if any sentence is repeated 3+ times
  const responseText = deduplicateResponse(rawResponse)

  logger.info('Groq response received', {
    tokens: completion.usage?.total_tokens,
    model: GROQ_MODEL,
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
  // Detect actual language from the message text (overrides UI toggle)
  const detectedLang = detectLanguage(userQuery, language)

  // Short-circuit: greetings and small-talk — no AI or DB call needed
  if (isGreeting(userQuery)) {
    return { response: GREETING_REPLIES[detectedLang] || GREETING_REPLIES.en, sources: [] }
  }
  const smallTalkReply = getSmallTalkReply(userQuery, detectedLang)
  if (smallTalkReply) {
    return { response: smallTalkReply, sources: [] }
  }

  // ── Translation pipeline ──────────────────────────────────────────────────
  // If the user wrote in Kinyarwanda:
  //   1. Translate their query to English (better RAG search + AI accuracy)
  //   2. Run RAG + AI fully in English
  //   3. Translate the English response back to Kinyarwanda
  //
  // This means the AI always reasons in English (where it's strong) and the
  // user always sees their own language (via clean translation).

  let queryForAI = userQuery
  if (detectedLang === 'rw') {
    logger.info('Kinyarwanda query detected — translating to English for RAG')
    queryForAI = await translateWithGoogle(userQuery, 'en')
    logger.info('Translated query', { original: userQuery, translated: queryForAI })
  }

  const articles = await retrieveRelevantArticles(queryForAI)
  const englishResponse = await generateLegalResponse(queryForAI, articles, 'en', history)

  // Translate English response to Kinyarwanda if that's what the user needs
  let finalResponse = englishResponse
  if (detectedLang === 'rw') {
    logger.info('Translating English response to Kinyarwanda')
    finalResponse = await translateWithGoogle(englishResponse, 'rw')
  }

  // Return cleaned source list for citation display in the UI
  const sources = articles.map(a => ({
    articleNumber: a.articleNumber,
    crimeType: a.crimeType,
    summary: a.simplifiedExplanation?.en || a.originalText?.en || '',
    lawText: a.originalText?.en || '',
    explanation: a.simplifiedExplanation?.en || a.originalText?.en || '',
    whereToReport: a.whereToReport?.en || '',
    reportingSteps: (a.reportingSteps || []).map(s => s.description?.en || s).filter(Boolean),
    requiredEvidence: (a.requiredEvidence || []).map(e => e.en || e).filter(Boolean)
  }))

  return { response: finalResponse, sources }
}
