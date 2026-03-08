import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import './GazetteDetail.css'

const CRIME_COLORS = {
  Theft:           '#f59e0b',
  Assault:         '#ef4444',
  GBV:             '#ec4899',
  Fraud:           '#8b5cf6',
  Murder:          '#dc2626',
  Drug:            '#10b981',
  Corruption:      '#f97316',
  'Property Damage':'#64748b',
  Other:           '#94a3b8',
}

const LANG_LABEL = { rw: 'Kinyarwanda', en: 'English', fr: 'Français' }

// Collapse PDF extraction artifacts: runs of 3+ space-separated single chars
// e.g. "f t c a r r ied" → "ftcarried", "b e tw ee n" → "between"
const fixPdfSpacing = (text) => {
  if (!text) return ''
  let prev
  do {
    prev = text
    // Collapse 3+ consecutive single-char tokens (definitely artifacts)
    text = text.replace(/\b([a-z] ){2,}[a-z]\b/g, m => m.replace(/ /g, ''))
    // Collapse 3-token runs of ≤3-char tokens when none are common real words
    text = text.replace(/\b([a-zA-Z]{1,3}) ([a-zA-Z]{1,3}) ([a-zA-Z]{2,3})\b/g, (m, a, b, c) => {
      const REAL = new Set(['the','and','for','are','was','not','all','can','but','had','her','his','how','its','our','out','who','will','with','have','this','from','they','been','that','were','said','into','each','than','then','when','them','some','more','also'])
      const real = [a, b, c].filter(p => REAL.has(p.toLowerCase())).length
      return real === 0 ? a + b + c : m
    })
  } while (prev !== text)
  return text
}

export default function GazetteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [doc, setDoc]               = useState(null)
  const [articles, setArticles]     = useState([])      // from LegalContent via /:id/articles
  const [artLoading, setArtLoading] = useState(false)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [activeLang, setActiveLang] = useState('en')
  const [activeArt, setActiveArt]   = useState(null)
  const [feedback, setFeedback]     = useState(null) // 'yes'|'no'|null
  const [searchTerm, setSearchTerm] = useState('')
  const [searchHits, setSearchHits] = useState([])
  const [hitIdx, setHitIdx]         = useState(0)
  const articleRefs = useRef({})

  /* ── Fetch document metadata ── */
  useEffect(() => {
    setLoading(true)
    axios.get(`${API_BASE_URL}/api/gazette/${id}`)
      .then(r => {
        const doc = r.data.data || r.data
        setDoc(doc)
        const langs = doc.languages || ['en']
        setActiveLang(langs[0])
      })
      .catch(() => setError('Could not load document.'))
      .finally(() => setLoading(false))
  }, [id])

  /* ── Fetch articles from LegalContent ── */
  useEffect(() => {
    setArtLoading(true)
    axios.get(`${API_BASE_URL}/api/gazette/${id}/articles`)
      .then(r => {
        const arts = r.data.data?.articles || []
        // Ensure numeric sort on frontend too
        const parseNum = s => parseInt((s || '').replace(/\D/g, ''), 10) || 0
        arts.sort((a, b) => parseNum(a.number) - parseNum(b.number))
        setArticles(arts)
      })
      .catch(() => setArticles([]))
      .finally(() => setArtLoading(false))
  }, [id])

  /* ── Scroll to article from URL hash (#Article%20182) ── */
  useEffect(() => {
    if (artLoading || !articles.length) return
    const hash = decodeURIComponent(location.hash.replace(/^#/, ''))
    if (!hash) return
    // articleNumber format is "Article 182" — hash may be full or just "182"
    const target = articles.find(a =>
      a.number === hash ||
      a.number === `Article ${hash}` ||
      String(a.number).replace(/^Article\s*/i, '') === hash
    )
    if (target) {
      // Slight delay so the DOM has rendered
      setTimeout(() => {
        scrollToArt(target.number)
        // Briefly highlight it
        const el = articleRefs.current[target.number]
        if (el) {
          el.classList.add('hash-highlight')
          setTimeout(() => el.classList.remove('hash-highlight'), 2500)
        }
      }, 200)
    }
  }, [articles, artLoading, location.hash])

  /* ── Auto-highlight first article in viewport ── */
  useEffect(() => {
    if (!doc?.articles?.length) return
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) setActiveArt(e.target.dataset.artnum)
      })
    }, { threshold: 0.4 })
    Object.values(articleRefs.current).forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [doc])

  /* ── In-doc search ── */
  useEffect(() => {
    if (!searchTerm) { setSearchHits([]); return }
    const term = searchTerm.toLowerCase()
    const hits = articles
      .filter(a => (a.text || '').toLowerCase().includes(term) || (a.title || '').toLowerCase().includes(term))
      .map(a => a.number)
    setSearchHits(hits)
    setHitIdx(0)
    if (hits.length) scrollToArt(hits[0])
  }, [searchTerm, articles])

  function scrollToArt(num) {
    const el = articleRefs.current[num]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function cycleHit(dir) {
    const next = (hitIdx + dir + searchHits.length) % searchHits.length
    setHitIdx(next)
    scrollToArt(searchHits[next])
  }

  /* ── Ask AI ── */
  function askAI(artNum) {
    const article = articles.find(a => String(a.number) === String(artNum))
    // artNum is already "Article 16" format — don't prepend "Article" again
    const artText = article?.text ? article.text.slice(0, 220) : ''
    let msg
    if (artText) {
      msg = `${artNum} of "${doc?.title}" states: "${artText}". What does this mean for ordinary citizens and what are their rights or obligations?`
    } else {
      msg = `Explain the legal rights of a citizen under ${artNum} of "${doc?.title}" in Rwanda.`
    }
    window.dispatchEvent(new CustomEvent('openChat', { detail: { message: msg, autoSend: true } }))
  }

  /* ── Feedback ── */
  function sendFeedback(val) {
    setFeedback(val)
    if (val === 'no') {
      const msg = doc?.title
        ? `I was reading "${doc.title}" and need help understanding it. Can you explain what it means and how it affects me?`
        : `I need help understanding this legal document. What are my rights?`
      window.dispatchEvent(new CustomEvent('openChat', { detail: { message: msg, autoSend: true } }))
    }
  }

  /* ── Text for active language tab ── */
  function langText() {
    if (!doc) return ''
    // extractedText is { en, rw, fr } on the model
    if (doc.extractedText?.[activeLang]) return doc.extractedText[activeLang]
    // fallback: any language
    if (doc.extractedText) {
      const any = doc.extractedText.en || doc.extractedText.rw || doc.extractedText.fr
      if (any) return any
    }
    return doc.textPreview || ''
  }

  /* ── Highlight search hits in text ── */
  function highlight(text) {
    if (!searchTerm) return text
    const re = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(re, '<mark class="inline-mark">$1</mark>')
  }

  if (loading) return (
    <div className="detail-loading">
      <div className="spinner-ring" /><p>Loading document…</p>
    </div>
  )
  if (error) return (
    <div className="detail-error">
      <p>{error}</p>
      <button onClick={() => navigate('/gazette')}>← Back to Library</button>
    </div>
  )
  if (!doc) return null

  const langs    = doc.languages || ['en']

  return (
    <div className="gazette-detail-page">

      {/* ── Top bar ── */}
      <div className="detail-topbar">
        <button className="back-btn" onClick={() => navigate('/gazette')}>← Library</button>
        <div className="topbar-meta">
          <span className="topbar-cat">{doc.category}</span>
          {doc.gazetteNumber && <span className="topbar-gaz">Gazette {doc.gazetteNumber}</span>}
        </div>
        {doc.pdfUrl && doc.pdfUrl.startsWith('http') ? (
          <a className="download-btn" href={doc.pdfUrl} target="_blank" rel="noreferrer">
            ↓ Download PDF
          </a>
        ) : (
          <a className="download-btn download-btn--external"
             href="https://www.minijust.gov.rw/laws-and-regulations"
             target="_blank" rel="noreferrer"
             title="Official copies available on MINIJUST">
            ↗ View on MINIJUST
          </a>
        )}
      </div>

      {/* ── Main layout ── */}
      <div className="detail-layout">

        {/* LEFT: Sidebar */}
        <aside className="doc-sidebar">
          {/* Metadata card */}
          <div className="sidebar-card meta-card">
            <h2 className="meta-title">{doc.title}</h2>
            {doc.publicationDate && (
              <p className="meta-row"><span>Published</span> {new Date(doc.publicationDate).toLocaleDateString('en-RW', { year:'numeric', month:'long', day:'numeric' })}</p>
            )}
            {doc.documentNumber && (
              <p className="meta-row"><span>Doc №</span> {doc.documentNumber}</p>
            )}
            {doc.articleCount > 0 && (
              <p className="meta-row"><span>Articles</span> {doc.articleCount}</p>
            )}
            {doc.viewCount > 0 && (
              <p className="meta-row"><span>Views</span> {doc.viewCount.toLocaleString()}</p>
            )}
          </div>

          {/* In-doc search */}
          <div className="sidebar-card search-card">
            <div className="sidebar-search-row">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search within document…"
                className="sidebar-search-input"
              />
              {searchTerm && (
                <button className="search-nav-btn" onClick={() => setSearchTerm('')}>✕</button>
              )}
            </div>
            {searchHits.length > 0 && (
              <div className="search-hit-row">
                <span>{hitIdx + 1}/{searchHits.length} matches</span>
                <button onClick={() => cycleHit(-1)}>▲</button>
                <button onClick={() => cycleHit(1)}>▼</button>
              </div>
            )}
            {searchTerm && searchHits.length === 0 && (
              <p className="no-hits">No matches found</p>
            )}
          </div>

          {/* Table of contents */}
          {(artLoading || articles.length > 0) && (
            <div className="sidebar-card toc-card">
              <h3 className="toc-heading">Table of Contents</h3>
              {artLoading ? (
                <p className="toc-loading">Loading articles…</p>
              ) : (
                <ul className="toc-list">
                  {articles.map(a => (
                    <li key={a.number}
                      className={'toc-item' + (activeArt === String(a.number) ? ' toc-active' : '')}
                      onClick={() => scrollToArt(a.number)}>
                      <span className="toc-num">{a.number}</span>
                      {a.crimeType && a.crimeType !== 'Other' && (
                        <span className="toc-badge" style={{ background: CRIME_COLORS[a.crimeType] + '22', color: CRIME_COLORS[a.crimeType] }}>{a.crimeType}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </aside>

        {/* RIGHT: Main reader */}
        <main className="doc-main">

          {/* Language tabs */}
          {langs.length > 1 && (
            <div className="lang-tabs">
              {langs.map(l => (
                <button
                  key={l}
                  className={'lang-tab' + (activeLang === l ? ' active' : '')}
                  onClick={() => setActiveLang(l)}
                >{LANG_LABEL[l] || l}</button>
              ))}
            </div>
          )}

          {/* Article sections */}
          {artLoading ? (
            <div className="articles-loading"><div className="spinner-ring" /><p>Loading articles…</p></div>
          ) : articles.length > 0 ? (
            <div className="articles-list">
              {articles.map(a => (
                <section
                  key={a.number}
                  id={`art-${String(a.number).replace(/\s+/g, '-').toLowerCase()}`}
                  className={'article-section' + (searchHits.includes(a.number) ? ' search-hit' : '')}
                  data-artnum={a.number}
                  ref={el => articleRefs.current[a.number] = el}
                >
                  <div className="article-header">
                    <div className="article-header-left">
                      <span className="article-badge">{a.number}</span>
                      {a.crimeType && (
                        <span
                          className="crime-badge"
                          style={{ background: CRIME_COLORS[a.crimeType] + '22', color: CRIME_COLORS[a.crimeType], border: `1px solid ${CRIME_COLORS[a.crimeType]}44` }}
                        >{a.crimeType}</span>
                      )}
                    </div>
                    <button className="ask-ai-btn" onClick={() => askAI(a.number)}>
                      🤖 Ask AI
                    </button>
                  </div>
                  <div
                    className="article-body"
                    dangerouslySetInnerHTML={{ __html: highlight(fixPdfSpacing(a.text || '')) }}
                  />
                  {a.simplified && (
                    <details className="simplified-wrap">
                      <summary>💡 Plain language explanation</summary>
                      <p className="simplified-text">{a.simplified}</p>
                    </details>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <div className="doc-fulltext">
              <div
                className="fulltext-body"
                dangerouslySetInnerHTML={{ __html: highlight(langText()) }}
              />
            </div>
          )}

          {/* Feedback bar */}
          <div className="feedback-bar">
            {feedback === null ? (
              <>
                <span className="feedback-label">Was this document helpful?</span>
                <button className="feedback-btn yes" onClick={() => sendFeedback('yes')}>👍 Yes</button>
                <button className="feedback-btn no" onClick={() => sendFeedback('no')}>👎 No — Ask AI</button>
              </>
            ) : feedback === 'yes' ? (
              <span className="feedback-thanks">Thank you! We're glad it helped. 🎉</span>
            ) : (
              <span className="feedback-thanks">Opening AI assistant for you…</span>
            )}
          </div>

          {/* Related links */}
          <div className="detail-footer">
            <Link to="/gazette" className="footer-link">← Back to Gazette Library</Link>
            <Link to="/search" className="footer-link">Search Legal Database →</Link>
          </div>
        </main>
      </div>
    </div>
  )
}
