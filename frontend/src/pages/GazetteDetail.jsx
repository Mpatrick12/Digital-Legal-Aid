import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import './GazetteDetail.css'

const LANG_LABEL = { rw: 'Kinyarwanda', en: 'English', fr: 'Français' }

export default function GazetteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [doc, setDoc]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [activeLang, setActiveLang] = useState('en')
  const [activeArt, setActiveArt]   = useState(null)
  const [feedback, setFeedback]     = useState(null) // 'yes'|'no'|null
  const [searchTerm, setSearchTerm] = useState('')
  const [searchHits, setSearchHits] = useState([])
  const [hitIdx, setHitIdx]         = useState(0)
  const articleRefs = useRef({})

  /* ── Fetch document ── */
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
    if (!searchTerm || !doc) { setSearchHits([]); return }
    const term = searchTerm.toLowerCase()
    const hits = (doc.articles || [])
      .filter(a => (a.text || '').toLowerCase().includes(term) || (a.title || '').toLowerCase().includes(term))
      .map(a => a.number)
    setSearchHits(hits)
    setHitIdx(0)
    if (hits.length) scrollToArt(hits[0])
  }, [searchTerm, doc])

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
    const msg = `Can you explain Article ${artNum} of "${doc?.title}" and what it means for ordinary citizens?`
    window.dispatchEvent(new CustomEvent('openChat', { detail: { message: msg, autoSend: true } }))
  }

  /* ── Feedback ── */
  function sendFeedback(val) {
    setFeedback(val)
    if (val === 'no') {
      window.dispatchEvent(new CustomEvent('openChat', { detail: { message: `I need help understanding "${doc?.title}"`, autoSend: true } }))
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

  const articles = doc.articles || []
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
        <a className="download-btn" href={`${API_BASE_URL}/api/gazette/${id}/download`} target="_blank" rel="noreferrer">
          ↓ Download PDF
        </a>
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
          {articles.length > 0 && (
            <div className="sidebar-card toc-card">
              <h3 className="toc-heading">Table of Contents</h3>
              <ul className="toc-list">
                {articles.map(a => (
                  <li key={a.number}
                    className={'toc-item' + (activeArt === String(a.number) ? ' toc-active' : '')}
                    onClick={() => scrollToArt(a.number)}>
                    <span className="toc-num">Art. {a.number}</span>
                    <span className="toc-txt">{a.title || `Article ${a.number}`}</span>
                  </li>
                ))}
              </ul>
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
          {articles.length > 0 ? (
            <div className="articles-list">
              {articles.map(a => (
                <section
                  key={a.number}
                  className={'article-section' + (searchHits.includes(a.number) ? ' search-hit' : '')}
                  data-artnum={a.number}
                  ref={el => articleRefs.current[a.number] = el}
                >
                  <div className="article-header">
                    <div>
                      <span className="article-badge">Article {a.number}</span>
                      {a.title && <h3 className="article-title">{a.title}</h3>}
                    </div>
                    <button className="ask-ai-btn" onClick={() => askAI(a.number)}>
                      🤖 Ask AI
                    </button>
                  </div>
                  <div
                    className="article-body"
                    dangerouslySetInnerHTML={{ __html: highlight(a.text || '') }}
                  />
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
