import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, MapPin, Phone, Mail, Globe, Clock, Star, ChevronDown, Building2, Briefcase, ArrowLeft } from 'lucide-react'
import { getApiUrl } from '../config'
import './NotaryPage.css'

// Rwanda's official district groupings — used to filter district dropdown by province
const PROVINCE_DISTRICTS = {
  'Kigali City':       ['Gasabo', 'Kicukiro', 'Nyarugenge'],
  'Eastern Province':  ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
  'Northern Province': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
  'Southern Province': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyamasheke', 'Nyanza', 'Ruhango'],
  'Western Province':  ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'],
}

const SPECIALIZATION_COLORS = {
  Property:    { bg: '#dbeafe', text: '#1d4ed8' },
  Succession:  { bg: '#fce7f3', text: '#be185d' },
  Corporate:   { bg: '#d1fae5', text: '#065f46' },
  Civil:       { bg: '#fef9c3', text: '#92400e' },
  Family:      { bg: '#ede9fe', text: '#5b21b6' },
  Commercial:  { bg: '#ffedd5', text: '#9a3412' },
}

export default function NotaryPage() {
  const navigate = useNavigate()
  const [notaries, setNotaries]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [query, setQuery]                   = useState('')
  const [province, setProvince]             = useState('')
  const [district, setDistrict]             = useState('')
  const [specialization, setSpecialization] = useState('')
  const [filterOptions, setFilterOptions]   = useState({ provinces: [], districts: [], specializations: [] })
  const [selected, setSelected]             = useState(null)   // notary details modal

  const fetchNotaries = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (query)          params.set('q', query)
      if (province)       params.set('province', province)
      if (district)       params.set('district', district)
      if (specialization) params.set('specialization', specialization)

      const res  = await fetch(getApiUrl(`api/notary?${params.toString()}`), {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to load notaries')
      setNotaries(data.data?.notaries || [])
      if (data.data?.filters) setFilterOptions(data.data.filters)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [query, province, district, specialization])

  // Initial load
  useEffect(() => { fetchNotaries() }, [])   // eslint-disable-line

  // Re-fetch when filters change (except free-text which uses button)
  useEffect(() => {
    if (province || district || specialization) fetchNotaries()
  }, [province, district, specialization])   // eslint-disable-line

  const handleSearch = (e) => {
    e.preventDefault()
    fetchNotaries()
  }

  const clearFilters = () => {
    setQuery('')
    setProvince('')
    setDistrict('')
    setSpecialization('')
    fetchNotaries()
  }

  const mapsUrl = (n) => {
    if (n.coordinates?.lat && n.coordinates?.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${n.coordinates.lat},${n.coordinates.lng}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n.address + ', Rwanda')}`
  }

  const hasFilters = query || province || district || specialization

  return (
    <div className="notary-page">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <nav className="notary-nav">
        <div className="nav-container">
          <div className="nav-logo">
            <Building2 size={22} className="logo-icon" />
            <div>
              <div className="logo-title">Digital Legal Aid</div>
              <div className="logo-subtitle">Rwanda</div>
            </div>
          </div>
          <div className="nav-actions">
            <button className="nav-btn" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={15} style={{ marginRight: 4 }} />
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="notary-header">
        <div className="container">
          <div className="header-content">
            <div className="header-icon-wrap">
              <Building2 size={32} />
            </div>
            <div>
              <h1>Find a Notary in Rwanda</h1>
              <p>Licensed notarial offices across all provinces — property, succession, corporate & more</p>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="notary-search-bar">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, firm, or district…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="search-btn">Search</button>
          </form>

          {/* Filter row */}
          <div className="filter-row">
            <div className="select-wrap">
              <select value={province} onChange={e => { setProvince(e.target.value); setDistrict('') }}>
                <option value="">All Provinces</option>
                {filterOptions.provinces.map(p => <option key={p}>{p}</option>)}
              </select>
              <ChevronDown size={14} className="select-arrow" />
            </div>

            <div className="select-wrap">
              <select value={district} onChange={e => setDistrict(e.target.value)}>
                <option value="">All Districts</option>
                {(province ? (PROVINCE_DISTRICTS[province] || []) : filterOptions.districts)
                  .map(d => <option key={d}>{d}</option>)}
              </select>
              <ChevronDown size={14} className="select-arrow" />
            </div>

            <div className="select-wrap">
              <select value={specialization} onChange={e => setSpecialization(e.target.value)}>
                <option value="">All Specializations</option>
                {filterOptions.specializations.map(s => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown size={14} className="select-arrow" />
            </div>

            {hasFilters && (
              <button className="clear-btn" onClick={clearFilters}>Clear filters</button>
            )}
          </div>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <main className="notary-main">
        <div className="container">
          {/* Result count */}
          {!loading && !error && (
            <div className="result-info">
              {notaries.length === 0
                ? 'No notaries found for the current filters.'
                : `${notaries.length} notary office${notaries.length !== 1 ? 's' : ''} found`}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="error-banner">⚠️ {error}</div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="notary-grid">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="notary-card skeleton-card">
                  <div className="sk sk-title" />
                  <div className="sk sk-sub" />
                  <div className="sk sk-line" />
                  <div className="sk sk-line short" />
                </div>
              ))}
            </div>
          )}

          {/* Cards */}
          {!loading && !error && notaries.length > 0 && (
            <div className="notary-grid">
              {notaries.map(n => (
                <NotaryCard
                  key={n._id}
                  notary={n}
                  onSelect={() => setSelected(n)}
                  mapsUrl={mapsUrl(n)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Detail Modal ─────────────────────────────────────── */}
      {selected && (
        <NotaryModal notary={selected} mapsUrl={mapsUrl(selected)} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

/* ────────────────────────────────── Card ──── */
function NotaryCard({ notary: n, onSelect, mapsUrl }) {
  return (
    <div className="notary-card" onClick={onSelect} role="button" tabIndex={0}
         onKeyDown={e => e.key === 'Enter' && onSelect()}>
      {n.verified && (
        <span className="verified-badge">
          <Star size={11} fill="currentColor" /> Verified
        </span>
      )}

      <div className="card-top">
        <div className="notary-avatar">
          {n.name.split(' ').filter(w => w.startsWith('Me.') === false).slice(0,2).map(w => w[0]).join('')}
        </div>
        <div>
          <h3 className="notary-name">{n.name}</h3>
          <p className="notary-firm">{n.firm}</p>
        </div>
      </div>

      <div className="card-meta">
        <span className="meta-item">
          <MapPin size={13} />
          {n.district}, {n.province}
        </span>
        <span className="meta-item">
          <Phone size={13} />
          {n.phone}
        </span>
        {n.workingHours && (
          <span className="meta-item">
            <Clock size={13} />
            {n.workingHours}
          </span>
        )}
      </div>

      <div className="spec-row">
        {n.specializations.slice(0, 3).map(s => {
          const c = SPECIALIZATION_COLORS[s] || { bg: '#f1f5f9', text: '#475569' }
          return (
            <span key={s} className="spec-badge" style={{ background: c.bg, color: c.text }}>{s}</span>
          )
        })}
        {n.specializations.length > 3 && (
          <span className="spec-badge" style={{ background: '#f1f5f9', color: '#64748b' }}>
            +{n.specializations.length - 3}
          </span>
        )}
      </div>

      <div className="card-actions" onClick={e => e.stopPropagation()}>
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="card-btn btn-map">
          <MapPin size={14} /> Directions
        </a>
        <button className="card-btn btn-detail" onClick={onSelect}>
          View Details
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────────────── Modal ── */
function NotaryModal({ notary: n, mapsUrl, onClose }) {
  // Close on backdrop click
  const handleBackdrop = e => { if (e.target === e.currentTarget) onClose() }

  const lang = n.languages?.join(' · ') || 'Kinyarwanda'

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {n.verified && (
          <span className="verified-badge modal-badge">
            <Star size={12} fill="currentColor" /> Verified Office
          </span>
        )}

        <div className="modal-header">
          <div className="notary-avatar large">
            {n.name.split(' ').filter(w => w !== 'Me.').slice(0,2).map(w => w[0]).join('')}
          </div>
          <div>
            <h2>{n.name}</h2>
            <p className="modal-firm">{n.firm}</p>
          </div>
        </div>

        <div className="modal-body">
          <div className="info-grid">
            <div className="info-item">
              <MapPin size={16} />
              <div>
                <strong>Address</strong>
                <span>{n.address}</span>
              </div>
            </div>
            <div className="info-item">
              <Phone size={16} />
              <div>
                <strong>Phone</strong>
                <a href={`tel:${n.phone}`}>{n.phone}</a>
              </div>
            </div>
            {n.email && (
              <div className="info-item">
                <Mail size={16} />
                <div>
                  <strong>Email</strong>
                  <a href={`mailto:${n.email}`}>{n.email}</a>
                </div>
              </div>
            )}
            {n.website && (
              <div className="info-item">
                <Globe size={16} />
                <div>
                  <strong>Website</strong>
                  <a href={n.website} target="_blank" rel="noopener noreferrer">{n.website}</a>
                </div>
              </div>
            )}
            <div className="info-item">
              <Clock size={16} />
              <div>
                <strong>Hours</strong>
                <span>{n.workingHours || 'Contact for hours'}</span>
              </div>
            </div>
            {n.fees && (
              <div className="info-item">
                <Briefcase size={16} />
                <div>
                  <strong>Fees</strong>
                  <span>{n.fees}</span>
                </div>
              </div>
            )}
          </div>

          <div className="modal-section">
            <strong>Specializations</strong>
            <div className="spec-row modal-specs">
              {n.specializations.map(s => {
                const c = SPECIALIZATION_COLORS[s] || { bg: '#f1f5f9', text: '#475569' }
                return <span key={s} className="spec-badge" style={{ background: c.bg, color: c.text }}>{s}</span>
              })}
            </div>
          </div>

          <div className="modal-section">
            <strong>Languages</strong>
            <p className="modal-lang">{lang}</p>
          </div>
        </div>

        <div className="modal-footer">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="modal-btn btn-primary">
            <MapPin size={15} /> Get Directions
          </a>
          <a href={`tel:${n.phone}`} className="modal-btn btn-secondary">
            <Phone size={15} /> Call Now
          </a>
        </div>
      </div>
    </div>
  )
}
