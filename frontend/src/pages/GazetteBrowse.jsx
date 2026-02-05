import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scale, BookOpen, Search, Download, Calendar, ChevronDown, Filter } from 'lucide-react'
import axios from 'axios'
import './GazetteBrowse.css'

function GazetteBrowse() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [dbStats, setDbStats] = useState({ totalDocuments: 0, recentUploads: [] })

  const categories = ['Law', 'Presidential Order', 'Ministerial Order', 'Prime Minister Order', 'Other']
  const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018']

  useEffect(() => {
    fetchDocuments()
    fetchDbStats()
  }, [selectedCategory, selectedYear])

  const fetchDbStats = async () => {
    try {
      const response = await axios.get('/api/debug/stats')
      setDbStats(response.data)
      console.log('Database stats:', response.data)
    } catch (error) {
      console.error('Stats fetch error:', error)
    }
  }

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedYear) params.append('year', selectedYear)

      const response = await axios.get(`/api/gazette?${params.toString()}`)
      setDocuments(response.data.documents || [])
    } catch (error) {
      console.error('Fetch error:', error)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const response = await axios.get(`/api/gazette/search?q=${encodeURIComponent(searchQuery)}`)
      setDocuments(response.data.documents || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (docId) => {
    window.open(`/api/gazette/${docId}/download`, '_blank')
  }

  return (
    <div className="gazette-browse">
      <nav className="gazette-nav">
        <div className="nav-container">
          <Link to="/dashboard" className="nav-logo">
            <Scale size={24} color="#2563eb" />
            <div>
              <div className="logo-title">Rwanda Legal Aid</div>
              <div className="logo-subtitle">Access to Justice</div>
            </div>
          </Link>

          <div className="nav-actions">
            <Link to="/admin/upload-gazette" className="nav-btn upload-btn-nav">
              Upload Document
            </Link>
            <Link to="/dashboard" className="nav-btn">Dashboard</Link>
            <button onClick={() => navigate(-1)} className="nav-btn">Back</button>
          </div>
        </div>
      </nav>

      <div className="gazette-header">
        <div className="container">
          <div className="header-content">
            <BookOpen size={48} color="white" />
            <div>
              <h1>Rwanda Official Gazette</h1>
              <p>Search and access official legal documents and laws</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="gazette-search">
            <Search size={20} color="#6b7280" />
            <input
              type="text"
              placeholder="Search by document number, title, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="filters">
            <div className="filter-group">
              <Filter size={18} />
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <Calendar size={18} />
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                <option value="">All Years</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="gazette-content">
        <div className="container">
          <div className="content-header">
            <h2>Official Gazette Documents</h2>
            <div className="header-right">
              <span className="doc-count">{dbStats.totalDocuments} total in database</span>
              {documents.length > 0 && documents.length !== dbStats.totalDocuments && (
                <span className="doc-count"> • {documents.length} shown</span>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading documents...</p>
            </div>
          ) : documents.length > 0 ? (
            <div className="documents-grid">
              {documents.map((doc) => (
                <div key={doc._id} className="document-card">
                  <div className="doc-header">
                    <div className="doc-icon">
                      <BookOpen size={24} color="#7c3aed" />
                    </div>
                    <span className="doc-category">{doc.category}</span>
                  </div>

                  <h3 className="doc-title">{doc.title}</h3>
                  <div className="doc-meta">
                    <span className="doc-number">{doc.documentNumber}</span>
                    <span className="doc-date">
                      {new Date(doc.publicationDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  {doc.tags && doc.tags.length > 0 && (
                    <div className="doc-tags">
                      {doc.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="doc-actions">
                    <Link to={`/gazette/${doc._id}`} className="btn-view">
                      View Details
                    </Link>
                    <button onClick={() => handleDownload(doc._id)} className="btn-download">
                      <Download size={16} />
                      Download PDF
                    </button>
                  </div>

                  {doc.pageCount && (
                    <div className="doc-footer">
                      <span>{doc.pageCount} pages</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <BookOpen size={64} color="#d1d5db" />
              <h3>No documents found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GazetteBrowse
