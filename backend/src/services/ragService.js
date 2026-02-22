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
  const contextBlock = retrievedArticles.length > 0
    ? retrievedArticles.map((article, i) => {
        const lawText = article.originalText?.[language]
          || article.originalText?.en
          || ''

        const explanation = article.simplifiedExplanation?.[language]
          || article.simplifiedExplanation?.en
          || ''

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

  // System prompt
  const systemPrompt = language === 'rw'
    ? `Uri inzobere mu mategeko y'u Rwanda. Gusubiza neza no ku buryo bw'itegeko.

ITEGEKO UGOMBA GUKURIKIZA:
1. Soma neza ikibazo cy'umuturage hanyuma usesengure icyaha cyakozwe.
2. Vuga neza ingingo (Article) ihuye n'ikibazo, uhite UYISHYIRAMO: **[Ingingo ya X]**: "[ubusobanuro bwayo nyine]"
3. Vuga igihano: imyaka y'igifungo cyangwa inzigo nk'uko itegeko rivuga.
4. Tanga intambwe 4-6 zo gutunga ikibazo NONAHA, zitangira ku guhita ujya polisi.
5. NTUZASANGE interuro nk'izi: "Mbabarira", "Ni ikibazo gihambaye", "Nzagufasha" — tangira igisubizo KIRI KU MUTWE.
6. Niba ikibazo kitandikirwa mu mategeko watanzwe, bivuge nti: "Amategeko atanzwe ntareba ikibazo cyanyu. Jya polisi yo hafi."
7. Rangiza na: "Ihutirwa: Polisi y'Igihugu cy'u Rwanda — 112"

AMAKURU Y'AMATEGEKO:
${contextBlock}`
    : `You are a strict legal reference tool for Rwanda. Analyse the user's situation and deliver precise legal information — nothing more, nothing less.

MANDATORY RULES — NO EXCEPTIONS:
1. FIRST LINE must identify the crime: e.g. "This constitutes [Crime Type] under the Rwanda Penal Code."
2. IMMEDIATELY quote the applicable article: **Article [number]** (Rwanda Penal Code): "[exact article text from sources]"
3. State the PENALTY explicitly — imprisonment term and/or fine exactly as written in the law.
4. Give exactly 4-6 numbered steps the person must take RIGHT NOW (start from: go to nearest police station).
5. DO NOT open with sympathy or filler: no "I'm sorry", "Don't worry", "I'm here to help", "As a Legal Aid Assistant". Start with the legal analysis directly.
6. DO NOT invent articles, penalties, or facts not present in the provided legal texts.
7. If the situation is not covered by the provided articles, say exactly: "The provided articles do not directly address this situation. Visit the nearest police station or Legal Aid Forum Rwanda."
8. Final line must be: "Emergency: Rwanda National Police — 112"

LEGAL ARTICLES TO USE (ONLY THESE — DO NOT GO OUTSIDE THESE):
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

  const responseText = completion.choices[0]?.message?.content || ''

  logger.info('Groq response received', {
    tokens: completion.usage?.total_tokens,
    responseLength: responseText.length
  })

  return responseText
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
