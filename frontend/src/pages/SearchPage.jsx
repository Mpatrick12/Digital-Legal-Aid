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

  const runSearch = async (q) => {
    if (!q.trim()) return
    setLoading(true)
    setAiLoading(true)
    setSearched(true)
    setAiAnswer(null)
    setAiSources([])

    // Run both in parallel
    const [searchRes, aiRes] = await Promise.allSettled([
      fetch(`/api/search?q=${encodeURIComponent(q)}&lang=en`).then(r => r.json()),
      fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...( localStorage.getItem('token') ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}) },
        body: JSON.stringify({ message: q, language: 'en', conversationHistory: [] })
      }).then(r => r.json())
    ])

    if (searchRes.status === 'fulfilled') setResults(searchRes.value.results || [])
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
                                {src.lawText && <blockquote className="ai-source-law">{src.lawText}</blockquote>}
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
              {loading ? (
                <div className="loading">Searching legal database...</div>
              ) : results.length > 0 ? (
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
              ) : (
                <div className="no-results">
                  <FileText size={48} color="#9ca3af" />
                  <h3>No results found</h3>
                  <p>Try different keywords or browse our legal categories</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchPage
