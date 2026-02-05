import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Scale, ArrowLeft, FileText, ExternalLink } from 'lucide-react'
import './SearchPage.css'

function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setSearched(true)
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&lang=en`)
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
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
              <button onClick={() => { setQuery('theft'); handleSearch({ preventDefault: () => {} }) }}>Theft</button>
              <button onClick={() => { setQuery('assault'); handleSearch({ preventDefault: () => {} }) }}>Assault</button>
              <button onClick={() => { setQuery('GBV'); handleSearch({ preventDefault: () => {} }) }}>GBV</button>
            </div>
          </div>

          {searched && (
            <div className="search-results">
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
