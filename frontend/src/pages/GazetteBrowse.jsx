import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Scale, BookOpen, Search, Download, Calendar, Filter,
  SlidersHorizontal, X, ChevronDown
} from 'lucide-react'
import axios from 'axios'
import './GazetteBrowse.css'

const CATEGORIES = ['All', 'Law', 'Presidential Order', 'Ministerial Order', 'Prime Minister Order', 'Special Edition', 'Other']const YEARS = Array.from({ length: 26 }, (_, i) => String(2024 - i))
const SORT_OPTIONS = [
  { value: 'newest',    label: 'Newest first' },
  { value: 'relevance', label: 'Most relevant' },
  { value: 'downloads', label: 'Most downloaded' }
]
const LANG_OPTIONS = [
  { value: '', label: 'All languages' },
  { value: 'en', label: 'English' },
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'fr', label: 'French' }
]

const CAT_COLORS = {
  'Law': '#2563eb',
  'Presidential Order': '#7c3aed',
  'Ministerial Order': '#0891b2',
  'Prime Minister Order': '#ea580c',
  'Special Edition': '#be185d',
  'Other': '#64748b'
}

// Highlight search term inside a snippet
function Snippet({ text, term }) {
  if (!text) return null
  if (!term) return <span>{text}</span>
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return (
    <span>
      {parts.map((p, i) =>
        p.toLowerCase() === term.toLowerCase()
          ? <mark key={i} className="snippet-mark">{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </span>
  )
}

export default function GazetteBrowse() {
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [liveQuery, setLiveQuery] = useState('')
  const [showRecent, setShowRecent] = useState(false)
  const [recentSearches, setRecentSearches] = useState(
    () => JSON.parse(localStorage.getItem('recentGazetteSearches') || '[]')
  )
  const searchInputRef = useRef(null)
  const [filters, setFilters] = useState({ category: '', year: '', language: '', sort: 'newest' })
  const [documents, setDocuments]         = useState([])
  const [articleGroups, setArticleGroups] = useState([]) // article-level search results
  const [totalArticleHits, setTotalArticleHits] = useState(0)
  const [dbTotal, setDbTotal]             = useState(0)
  const [loading, setLoading]             = useState(true)
  const [showFilters, setShowFilters]     = useState(false)
  const [user, setUser]                   = useState(null)

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    setUser(userData)
    fetchDocuments()
  }, [filters])

  // Debounce: trigger search 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (liveQuery !== query) {
        setQuery(liveQuery)
        fetchDocuments(liveQuery)
        if (liveQuery.trim()) saveRecentSearch(liveQuery.trim())
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [liveQuery])

  const fetchDocuments = useCallback(async (q = query) => {
    setLoading(true)
    try {
      // Always load the document list for the library view
      const params = new URLSearchParams()
      if (q) params.append('q', q)
      if (filters.category && filters.category !== 'All') params.append('category', filters.category)
      if (filters.year) params.append('year', filters.year)
      if (filters.language) params.append('language', filters.language)
      params.append('sort', filters.sort)
      params.append('limit', '24')

      const docsRes = await axios.get(`/api/gazette?${params}`)
      const docs    = docsRes.data.data || docsRes.data.results || []
      setDocuments(docs)

      // When there's a query, also do article-level search
      if (q && q.trim()) {
        const artRes = await axios.get(`/api/gazette/articles/search?q=${encodeURIComponent(q)}`)
        const groups = artRes.data.data?.groups || []
        setArticleGroups(groups)
        setTotalArticleHits(artRes.data.data?.totalArticles || 0)
      } else {
        setArticleGroups([])
        setTotalArticleHits(0)
      }

      // Get total gazette count
      const statsRes = await axios.get('/api/debug/stats').catch(() => ({ data: {} }))
      setDbTotal(statsRes.data.totalDocuments || docs.length)
    } catch {
      setDocuments([])
      setArticleGroups([])
    } finally {
      setLoading(false)
    }
  }, [filters, query])

  const saveRecentSearch = (term) => {
    if (!term) return
    const updated = [term, ...recentSearches.filter(r => r !== term)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentGazetteSearches', JSON.stringify(updated))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setQuery(liveQuery)
    fetchDocuments(liveQuery)
    if (liveQuery.trim()) saveRecentSearch(liveQuery.trim())
    setShowRecent(false)
  }

  const clearSearch = () => {
    setLiveQuery('')
    setQuery('')
    fetchDocuments('')
    setShowRecent(false)
  }

  const pickRecent = (term) => {
    setLiveQuery(term)
    setQuery(term)
    fetchDocuments(term)
    setShowRecent(false)
    searchInputRef.current?.focus()
  }

  const openChatWithQuery = () => {
    window.dispatchEvent(new CustomEvent('openChat', { detail: { message: liveQuery || query, autoSend: true } }))
  }

  const setFilter = (key, val) => setFilters(p => ({ ...p, [key]: val }))
  const hasFilters = filters.category || filters.year || filters.language || filters.sort !== 'newest'

  return (
    <div className="gazette-browse">
      {/* Nav */}
      <nav className="gazette-nav">
        <div className="nav-container">
          <Link to="/dashboard" className="nav-logo">
            <Scale size={24} color="#2563eb" />
            <div>
              <div className="logo-title">Rwanda Legal Aid</div>
              <div className="logo-subtitle">Official Gazette Library</div>
            </div>
          </Link>
          <div className="nav-actions">
            {user?.role === 'admin' && (
              <Link to="/admin/upload-gazette" className="nav-btn upload-btn-nav">
                + Upload Document
              </Link>
            )}
            <Link to="/dashboard" className="nav-btn">Dashboard</Link>
          </div>
        </div>
      </nav>

      {/* Hero + Search */}
      <div className="gazette-header">
        <div className="container">
          <div className="header-content">
            <div className="header-icon"><BookOpen size={36} /></div>
            <div>
              <h1>Rwanda Official Gazette Library</h1>
              <p>Search across {dbTotal > 0 ? dbTotal : 'all'} official legal documents — laws, orders, and statutes</p>
            </div>
          </div>

          <div className="gazette-search-wrap">
            <form onSubmit={handleSearch} className="gazette-search">
              <Search size={20} color="#6b7280" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder='Search laws… e.g. "theft penalty" or "ubujura" or "Article 165"'
                value={liveQuery}
                onChange={(e) => setLiveQuery(e.target.value)}
                onFocus={() => setShowRecent(true)}
                onBlur={() => setTimeout(() => setShowRecent(false), 180)}
                autoComplete="off"
              />
              {liveQuery && (
                <button type="button" className="search-clear" onClick={clearSearch}>
                  <X size={16} />
                </button>
              )}
              <button type="submit" className="search-submit">Search</button>
            </form>
            {showRecent && recentSearches.length > 0 && !liveQuery && (
              <div className="recent-dropdown">
                <p className="recent-heading">Recent searches</p>
                {recentSearches.map(term => (
                  <button key={term} className="recent-item" onMouseDown={() => pickRecent(term)}>
                    🕐 {term}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter pills */}
          <div className="filter-pills">
            <button
              className={`filter-pill-toggle${showFilters ? ' active' : ''}`}
              onClick={() => setShowFilters(p => !p)}
            >
              <SlidersHorizontal size={14} /> Filters {hasFilters && <span className="filter-dot" />}
              <ChevronDown size={13} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>
            {filters.category && filters.category !== 'All' && (
              <span className="active-pill">{filters.category} <button onClick={() => setFilter('category', '')}>×</button></span>
            )}
            {filters.year && (
              <span className="active-pill">{filters.year} <button onClick={() => setFilter('year', '')}>×</button></span>
            )}
            {filters.language && (
              <span className="active-pill">{LANG_OPTIONS.find(l => l.value === filters.language)?.label} <button onClick={() => setFilter('language', '')}>×</button></span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded filter bar */}
      {showFilters && (
        <div className="filter-bar">
          <div className="container">
            <div className="filter-bar-inner">
              <div className="filter-group">
                <label>Category</label>
                <select value={filters.category} onChange={e => setFilter('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Year</label>
                <select value={filters.year} onChange={e => setFilter('year', e.target.value)}>
                  <option value="">All years</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Language</label>
                <select value={filters.language} onChange={e => setFilter('language', e.target.value)}>
                  {LANG_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <div className="filter-group">
                <label>Sort by</label>
                <select value={filters.sort} onChange={e => setFilter('sort', e.target.value)}>
                  {SORT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="gazette-content">
        <div className="container">
          <div className="content-header">
            <h2>
              {query
                ? totalArticleHits > 0
                  ? `${totalArticleHits} articles found for "${query}"`
                  : `Results for "${query}" (${documents.length} documents)`
                : `All Gazettes (${documents.length}${dbTotal > documents.length ? ` of ${dbTotal}` : ''})`
              }
            </h2>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Searching legal library…</p>
            </div>

          ) : query && articleGroups.length > 0 ? (
            /* ── ARTICLE-LEVEL RESULTS ── */
            <div className="article-results">
              {articleGroups.map(group => (
                <div key={group.sourceDocument} className="article-group">
                  <div className="group-header">
                    <BookOpen size={18} color="#2563eb" />
                    <span className="group-title">{group.gazetteTitle}</span>
                    <span className="group-num">{group.gazetteNumber}</span>
                    <span className="group-count">{group.totalMatches} match{group.totalMatches !== 1 ? 'es' : ''}</span>
                    {group.gazetteId && (
                      <Link to={`/gazette/${group.gazetteId}`} className="group-view-btn">View Document →</Link>
                    )}
                  </div>
                  <div className="group-articles">
                    {group.matchingArticles.map(art => (
                      <div key={art.id} className="article-hit-card">
                        <div className="art-hit-header">
                          <span className="art-hit-num">{art.articleNumber}</span>
                          {art.crimeType && art.crimeType !== 'Other' && (
                            <span className="art-crime-badge">{art.crimeType}</span>
                          )}
                          <button
                            className="art-ask-ai-btn"
                            onClick={() => {
                              const msg = `${art.articleNumber} of "${group.gazetteTitle}" states: "${art.snippet}". What does this mean for an ordinary citizen?`
                              window.dispatchEvent(new CustomEvent('openChat', { detail: { message: msg, autoSend: true } }))
                            }}
                          >🤖 Ask AI &rarr;</button>
                        </div>
                        <p className="art-hit-snippet"><Snippet text={art.snippet} term={query} /></p>
                        {group.gazetteId && (
                          <Link
                            to={`/gazette/${group.gazetteId}#${encodeURIComponent(art.articleNumber)}`}
                            className="art-view-link"
                          >View full article</Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          ) : documents.length > 0 ? (
            /* ── DOCUMENT CARDS ── */
            <div className="documents-grid">
              {documents.map((doc) => (
                <div key={doc.id || doc._id} className="document-card">
                  <div className="doc-header">
                    <div className="doc-icon"><BookOpen size={20} color="#7c3aed" /></div>
                    <span
                      className="doc-category"
                      style={{ background: CAT_COLORS[doc.category] + '1a', color: CAT_COLORS[doc.category] || '#475569' }}
                    >
                      {doc.category}
                    </span>
                  </div>

                  <h3 className="doc-title">{doc.title}</h3>

                  <div className="doc-meta">
                    <span className="doc-number">{doc.documentNumber}</span>
                    <span className="doc-date">
                      <Calendar size={12} />
                      {new Date(doc.publicationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Relevance snippet */}
                  {doc.snippet && (
                    <div className="doc-snippet">
                      <Snippet text={doc.snippet} term={query} />
                    </div>
                  )}

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="doc-tags">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="doc-stats">
                    {doc.articleCount > 0 && <span>📑 {doc.articleCount} articles</span>}
                    {doc.downloadCount > 0 && <span>⬇ {doc.downloadCount} downloads</span>}
                    {doc.languages?.length > 0 && <span>🌐 {doc.languages.join(' · ').toUpperCase()}</span>}
                  </div>

                  <div className="doc-actions">
                    <Link to={`/gazette/${doc.id || doc._id}`} className="btn-view">View Details</Link>
                    <button
                      onClick={() => window.open(`/api/gazette/${doc.id || doc._id}/download`, '_blank')}
                      className="btn-download"
                    >
                      <Download size={15} /> PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <BookOpen size={56} color="#cbd5e1" />
              <h3>No gazettes found{query ? ` for "${query}"` : ''}</h3>
              <p>Try different keywords, or let the AI Legal Assistant help you instantly</p>
              <div className="empty-actions">
                <button className="btn-try-ai" onClick={openChatWithQuery}>
                  🤖 Try AI Legal Assistant →
                </button>
                {query && (
                  <button className="btn-clear-search" onClick={clearSearch}>
                    Clear search
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
