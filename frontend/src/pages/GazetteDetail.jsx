import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Scale, BookOpen, Download, Calendar, Search, ArrowLeft, Tag, FileText } from 'lucide-react'
import axios from 'axios'
import './GazetteDetail.css'

function GazetteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [document, setDocument] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedText, setHighlightedText] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [searchResults, setSearchResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  useEffect(() => {
    fetchDocument()
  }, [id])

  useEffect(() => {
    if (document?.extractedText?.en) {
      highlightSearchTerm()
    }
  }, [searchTerm, document])

  // Keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (searchTerm && matchCount > 0) {
        if (e.key === 'Enter') {
          e.preventDefault()
          if (e.shiftKey) {
            navigateToPrevious()
          } else {
            navigateToNext()
          }
        } else if (e.key === 'Escape') {
          setSearchTerm('')
          setShowResults(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [searchTerm, matchCount, currentMatchIndex])

  const fetchDocument = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`/api/gazette/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      setDocument(response.data.data)
      setHighlightedText(response.data.data.extractedText?.en || '')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }

  const highlightSearchTerm = () => {
    if (!document?.extractedText?.en) return

    const text = document.extractedText.en

    if (!searchTerm.trim()) {
      setHighlightedText(text)
      setMatchCount(0)
      setSearchResults([])
      setShowResults(false)
      return
    }

    try {
      // Escape special regex characters
      const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      // Case-insensitive search
      const regex = new RegExp(escapedTerm, 'gi')
      const matches = text.match(regex)
      const count = matches ? matches.length : 0
      setMatchCount(count)

      if (count > 0) {
        // Extract context for each match
        const results = []
        const contextLength = 150 // characters before and after match
        let match
        const searchRegex = new RegExp(escapedTerm, 'gi')
        
        while ((match = searchRegex.exec(text)) !== null && results.length < 100) {
          const start = Math.max(0, match.index - contextLength)
          const end = Math.min(text.length, match.index + match[0].length + contextLength)
          
          let snippet = text.substring(start, end)
          
          // Add ellipsis if not at start/end
          if (start > 0) snippet = '...' + snippet
          if (end < text.length) snippet = snippet + '...'
          
          results.push({
            index: match.index,
            snippet: snippet,
            matchText: match[0]
          })
        }
        
        setSearchResults(results)
        setShowResults(true)
        setCurrentMatchIndex(0)

        // Highlight matches in full text with unique IDs and active class
        let matchIndex = 0
        const highlighted = text.replace(searchRegex, (match, offset) => {
          const id = `match-${matchIndex}`
          const activeClass = matchIndex === 0 ? 'active-match' : ''
          matchIndex++
          return `<mark id="${id}" class="search-match ${activeClass}" data-index="${matchIndex - 1}">${match}</mark>`
        })
        setHighlightedText(highlighted)
      } else {
        setHighlightedText(text)
        setSearchResults([])
        setShowResults(false)
        setCurrentMatchIndex(0)
      }
    } catch (error) {
      console.error('Search error:', error)
      setHighlightedText(text)
      setMatchCount(0)
      setSearchResults([])
      setShowResults(false)
      setCurrentMatchIndex(0)
    }
  }

  const scrollToMatch = (index) => {
    // Remove active class from all marks
    document.querySelectorAll('mark.active-match').forEach(mark => {
      mark.classList.remove('active-match')
    })

    // Add active class to current match
    const targetMark = document.getElementById(`match-${index}`)
    if (targetMark) {
      targetMark.classList.add('active-match')
      targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setCurrentMatchIndex(index)
    }
  }

  const navigateToNext = () => {
    if (matchCount > 0) {
      const nextIndex = (currentMatchIndex + 1) % matchCount
      scrollToMatch(nextIndex)
    }
  }

  const navigateToPrevious = () => {
    if (matchCount > 0) {
      const prevIndex = currentMatchIndex === 0 ? matchCount - 1 : currentMatchIndex - 1
      scrollToMatch(prevIndex)
    }
  }

  const scrollToFirstMatch = () => {
    if (matchCount > 0) {
      scrollToMatch(0)
    }
  }

  const jumpToResult = (resultIndex) => {
    scrollToMatch(resultIndex)
  }

  const handleDownload = () => {
    window.open(`/api/gazette/${id}/download`, '_blank')
  }

  if (loading) {
    return (
      <div className="gazette-detail">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="gazette-detail">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => navigate('/gazette')} className="btn-back">
            Back to Browse
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="gazette-detail">
      {/* Header */}
      <nav className="detail-nav">
        <div className="nav-container">
          <Link to="/gazette" className="nav-logo">
            <Scale size={24} color="#2563eb" />
            <span>Rwanda Legal Aid</span>
          </Link>
          <div className="nav-actions">
            <button onClick={handleDownload} className="btn-download-nav">
              <Download size={18} />
              Download PDF
            </button>
            <button onClick={() => navigate(-1)} className="btn-back-nav">
              <ArrowLeft size={18} />
              Back
            </button>
          </div>
        </div>
      </nav>

      <div className="detail-container">
        {/* Document Header */}
        <div className="document-header">
          <div className="header-content">
            <div className="title-section">
              <BookOpen size={40} color="#2563eb" />
              <div>
                <h1>{document.title}</h1>
                <div className="header-meta">
                  <span className="doc-number">{document.documentNumber}</span>
                  <span className="separator">•</span>
                  <span className="doc-category">{document.category}</span>
                  <span className="separator">•</span>
                  <span className="doc-date">
                    <Calendar size={16} />
                    {new Date(document.publicationDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="header-actions">
                <button onClick={handleDownload} className="btn-download">
                  <Download size={20} />
                  Download PDF
                </button>
              </div>
            </div>

            {document.tags && document.tags.length > 0 && (
              <div className="tags-section">
                <Tag size={16} />
                {document.tags.map((tag, idx) => (
                  <span key={idx} className="tag">{tag}</span>
                ))}
              </div>
            )}
          </div>

          <div className="document-stats">
            <div className="stat-item">
              <FileText size={20} />
              <span>{document.pageCount || 0} pages</span>
            </div>
            <div className="stat-item">
              <Download size={20} />
              <span>{document.downloadCount || 0} downloads</span>
            </div>
            <div className="stat-item">
              <Search size={20} />
              <span>{document.searchCount || 0} searches</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="document-search">
          <div className="search-bar">
            <Search size={20} color="#6b7280" />
            <input
              type="text"
              placeholder="Search within this document... (e.g., theft, murder, assault)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <div className="search-controls">
                {matchCount > 0 ? (
                  <>
                    <div className="match-counter">
                      <span>{currentMatchIndex + 1} / {matchCount}</span>
                    </div>
                    <div className="navigation-buttons">
                      <button 
                        onClick={navigateToPrevious} 
                        className="btn-nav"
                        title="Previous match (Shift+Enter)"
                      >
                        ↑
                      </button>
                      <button 
                        onClick={navigateToNext} 
                        className="btn-nav"
                        title="Next match (Enter)"
                      >
                        ↓
                      </button>
                    </div>
                    <button 
                      onClick={() => setShowResults(!showResults)} 
                      className="btn-toggle-results"
                      title="Toggle results panel"
                    >
                      {showResults ? '✕' : '☰'} Results
                    </button>
                  </>
                ) : (
                  <span className="no-matches">No matches</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Search Results Panel */}
        {showResults && searchResults.length > 0 && (
          <div className="search-results-panel">
            <div className="results-header">
              <h3>Search Results ({searchResults.length})</h3>
              <button onClick={() => setShowResults(false)} className="btn-close">
                ✕
              </button>
            </div>
            <div className="results-list">
              {searchResults.map((result, idx) => (
                <div 
                  key={idx} 
                  className={`result-item ${idx === currentMatchIndex ? 'active' : ''}`}
                  onClick={() => jumpToResult(idx)}
                >
                  <div className="result-number">#{idx + 1}</div>
                  <div className="result-snippet">
                    {result.snippet.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                      part.toLowerCase() === searchTerm.toLowerCase() ? 
                        <strong key={i} className="match-highlight">{part}</strong> : 
                        <span key={i}>{part}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Content */}
        <div className="document-content">
          <div className="content-paper">
            {highlightedText ? (
              <div 
                className="text-content"
                dangerouslySetInnerHTML={{ __html: highlightedText.replace(/\n/g, '<br/>') }}
              />
            ) : (
              <div className="no-content">
                <FileText size={48} color="#9ca3af" />
                <p>No text content available for this document.</p>
                <button onClick={handleDownload} className="btn-download-full">
                  Download PDF to view full content
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GazetteDetail
