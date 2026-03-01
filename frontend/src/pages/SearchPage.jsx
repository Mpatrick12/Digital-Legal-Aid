import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Scale, ArrowLeft, FileText, ExternalLink, Bot, ChevronDown, ChevronUp } from 'lucide-react'
import './SearchPage.css'

function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [aiAnswer, setAiAnswer] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSources, setAiSources] = useState([])
  const [aiExpanded, setAiExpanded] = useState(true)
  const [searchError, setSearchError] = useState(null)

  const runSearch = async (q) => {
    if (!q.trim()) return
    setLoading(true)
    setAiLoading(true)
    setSearched(true)
    setSearchError(null)
    setAiAnswer(null)
    setAiSources([])

    const fetchJson = async (url, opts) => {
      const r = await fetch(url, opts)
      if (!r.ok) throw new Error(`Server error ${r.status}`)
      return r.json()
    }

    // Run both in parallel
    const [searchRes, aiRes] = await Promise.allSettled([
      fetchJson(`/api/search?q=${encodeURIComponent(q)}&lang=en`),
      fetchJson('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
        body: JSON.stringify({ message: q, language: 'en', conversationHistory: [] })
      })
    ])

    if (searchRes.status === 'fulfilled') {
      setResults(searchRes.value.results || [])
    } else {
      setSearchError('Could not reach the server. Please make sure the backend is running on port 5001.')
      setResults([])
    }

    if (aiRes.status === 'fulfilled' && aiRes.value?.data) {
      setAiAnswer(aiRes.value.data.response)
      setAiSources(aiRes.value.data.sources || [])
    }

    setLoading(false)
    setAiLoading(false)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    await runSearch(query)
  }

  return (
    <div className="search-page">
      <nav className="search-nav">
        <div className="container">
          <div className="nav-content">
            <Link to="/" className="nav-logo">
              <Scale size={28} color="#2563eb" />
              <span>Digital Legal Aid</span>
            </Link>
            <Link to="/signin" className="nav-link">
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <div className="search-content">
        <div className="container">
          <div className="search-header">
            <h1>Search Legal Information</h1>
            <p>Get simplified answers to your legal questions in seconds</p>
            
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-bar">
                <Search size={20} color="#6b7280" />
                <input 
                  type="text"
                  placeholder="What do you need help with? e.g., 'I was robbed', 'assault reporting'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="search-btn" disabled={loading}>
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            <div className="search-suggestions">
              <span>Popular searches:</span>
              <button onClick={() => { setQuery('theft'); runSearch('theft') }}>Theft</button>
              <button onClick={() => { setQuery('assault'); runSearch('assault') }}>Assault</button>
              <button onClick={() => { setQuery('GBV'); runSearch('GBV') }}>GBV</button>
            </div>
          </div>

          {searched && (
            <div className="search-results">

              {/* ── AI Legal Analysis card ─────────────────────────────── */}
              {(aiLoading || aiAnswer) && (
                <div className="ai-answer-card">
                  <div className="ai-answer-header" onClick={() => setAiExpanded(p => !p)}>
                    <div className="ai-answer-header-left">
                      <div className="ai-answer-icon"><Bot size={18} /></div>
                      <div>
                        <div className="ai-answer-title">AI Legal Analysis</div>
                        <div className="ai-answer-subtitle">Based on Rwanda Penal Code — not a substitute for legal counsel</div>
                      </div>
                    </div>
                    {aiAnswer && (aiExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />)}
                  </div>

                  {aiLoading && (
                    <div className="ai-answer-loading">
                      <span /><span /><span />
                      <p>Analysing relevant articles...</p>
                    </div>
                  )}

                  {!aiLoading && aiAnswer && aiExpanded && (
                    <div className="ai-answer-body">
                      <div className="ai-answer-text">
                        {aiAnswer.split('\n').map((line, i) => {
                          if (!line.trim()) return <br key={i} />
                          const parts = line.split(/\*\*(.*?)\*\*/g)
                          const isBlockquote = line.trim().startsWith('>')
                          const cleanLine = isBlockquote ? line.replace(/^\s*>\s*/, '') : line
                          const cleanParts = cleanLine.split(/\*\*(.*?)\*\*/g)
                          if (isBlockquote) return (
                            <blockquote key={i} className="ai-law-quote">
                              {cleanParts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
                            </blockquote>
                          )
                          return (
                            <p key={i} className={/^\d+\./.test(line.trim()) ? 'ai-step' : ''}>
                              {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
                            </p>
                          )
                        })}
                      </div>

                      {aiSources.length > 0 && (
                        <div className="ai-sources">
                          <div className="ai-sources-title">Legal Sources Referenced ({aiSources.length})</div>
                          <div className="ai-sources-list">
                            {aiSources.map((src, i) => (
                              <details key={i} className="ai-source-item">
                                <summary>
                                  <span className="ai-source-ref">{src.articleNumber}</span>
                                  <span className="ai-source-type">{src.crimeType}</span>
                                </summary>
                                <div className="ai-source-body">
                                  {src.lawText && (
                                    <div className="ai-source-section">
                                      <span className="ai-source-section-label">Law text (Rwanda Penal Code)</span>
                                      <p className="ai-source-lawtext">{(() => {
                                        const lt = src.lawText
                                        // Strip garbled OCR title prefix up to the first body sentence
                                        const cleaned = lt.replace(
                                          /^Article\s+\d+\s*:.*?(?=The |Any |Upon |If |A person|No person|Whoever|When |In this|For the|Section|Definitions|It is|Pursuant|Anyone|Every person|No one)/s,
                                          ''
                                        ).trim()
                                        return cleaned || lt
                                      })()}</p>
                                    </div>
                                  )}
                                  {src.explanation && src.explanation !== src.lawText &&
                                   src.explanation.length > 40 && (
                                    <div className="ai-source-section">
                                      <span className="ai-source-section-label">About this article</span>
                                      <p>{src.explanation}</p>
                                    </div>
                                  )}
                                  {src.whereToReport && (
                                    <div className="ai-source-section">
                                      <span className="ai-source-section-label">Where to report</span>
                                      <p>{src.whereToReport}</p>
                                    </div>
                                  )}
                                  {src.reportingSteps?.length > 0 && (
                                    <div className="ai-source-section">
                                      <span className="ai-source-section-label">Reporting steps</span>
                                      <ol className="ai-source-steps">
                                        {src.reportingSteps.map((step, si) => (
                                          <li key={si}>{step}</li>
                                        ))}
                                      </ol>
                                    </div>
                                  )}
                                  {src.requiredEvidence?.length > 0 && (
                                    <div className="ai-source-section">
                                      <span className="ai-source-section-label">Required evidence</span>
                                      <ul className="ai-source-steps">
                                        {src.requiredEvidence.map((ev, ei) => (
                                          <li key={ei}>{ev}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </details>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {/* ────────────────────────────────────────────────────────── */}
              {searchError && (
                <div className="search-error-banner">
                  <span>⚠️</span>
                  <div>
                    <strong>Search unavailable</strong>
                    <p>{searchError}</p>
                  </div>
                </div>
              )}
              {loading ? (
                <div className="loading">Searching legal database...</div>
              ) : !searchError && results.length > 0 ? (
                <>
                  <div className="results-header">
                    <h2>Found {results.length} results</h2>
                  </div>
                  <div className="results-list">
                    {results.map((result, index) => (
                      <div key={index} className="result-card">
                        <div className="result-header">
                          <h3>{result.crimeType}</h3>
                          <span className="article-number">{result.articleNumber}</span>
                        </div>
                        <p className="result-explanation">{result.explanation}</p>
                        
                        <div className="result-section">
                          <h4>Where to Report:</h4>
                          <p>{result.whereToReport}</p>
                        </div>

                        {result.reportingSteps && result.reportingSteps.length > 0 && (
                          <div className="result-section">
                            <h4>Reporting Steps:</h4>
                            <ol>
                              {result.reportingSteps.map((step, idx) => (
                                <li key={idx}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {result.requiredEvidence && result.requiredEvidence.length > 0 && (
                          <div className="result-section">
                            <h4>Required Evidence:</h4>
                            <ul>
                              {result.requiredEvidence.map((evidence, idx) => (
                                <li key={idx}>{evidence}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="result-footer">
                          <span className="disclaimer">
                            <FileText size={16} />
                            This is guidance, not legal advice
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : !searchError ? (
                <div className="no-results">
                  <FileText size={48} color="#9ca3af" />
                  <h3>No results found</h3>
                  <p>Try different keywords or browse our legal categories</p>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchPage
