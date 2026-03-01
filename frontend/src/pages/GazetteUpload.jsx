import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, FileText, CheckCircle, AlertCircle, ArrowLeft,
  X, Eye, FileSearch, Layers
} from 'lucide-react'
import './GazetteUpload.css'

const CATEGORIES = ['Law', 'Presidential Order', 'Ministerial Order', 'Prime Minister Order', 'Special Edition', 'Other']
const LANGUAGE_OPTIONS = [
  { value: 'rw', label: 'Kinyarwanda' },
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' }
]
const UPLOAD_STAGES = [
  { key: 'uploading',  label: 'Uploading PDF…',     icon: '⬆️' },
  { key: 'extracting', label: 'Extracting text…',    icon: '📄' },
  { key: 'indexing',   label: 'Indexing articles…',  icon: '🔍' },
  { key: 'done',       label: 'Complete',             icon: '✅' }
]

export default function GazetteUpload() {
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [formData, setFormData] = useState({
    title: '', documentNumber: '', gazetteNumber: '',
    publicationDate: '', category: 'Law', tags: '',
    languages: ['rw', 'en', 'fr']
  })
  const [stage, setStage] = useState(null)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const validateAndSetFile = (f) => {
    if (f && f.type === 'application/pdf') {
      if (f.size > 50 * 1024 * 1024) { setError('File exceeds 50 MB limit.'); return }
      setFile(f); setError('')
      if (!formData.title) {
        const name = f.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
        setFormData(p => ({ ...p, title: name }))
      }
    } else { setError('Please select a valid PDF file.'); setFile(null) }
  }

  const handleFileChange  = (e) => validateAndSetFile(e.target.files[0])
  const handleDragOver    = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragEnter   = (e) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave   = (e) => { e.preventDefault(); setIsDragging(false) }
  const handleDrop        = (e) => { e.preventDefault(); setIsDragging(false); validateAndSetFile(e.dataTransfer.files[0]) }
  const handleChange      = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))
  const toggleLanguage    = (lang) => setFormData(p => ({
    ...p,
    languages: p.languages.includes(lang) ? p.languages.filter(l => l !== lang) : [...p.languages, lang]
  }))

  const tickProgress = (from, to, ms) => new Promise(resolve => {
    const steps = 20
    const inc = (to - from) / steps
    let cur = from
    const t = setInterval(() => {
      cur = Math.min(cur + inc, to)
      setProgress(Math.round(cur))
      if (cur >= to) { clearInterval(t); resolve() }
    }, ms / steps)
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please select a PDF file.'); return }
    if (!formData.languages.length) { setError('Select at least one language.'); return }
    setError(''); setResult(null); setStage('uploading'); setProgress(0)

    try {
      const token = localStorage.getItem('token')
      const fd = new FormData()
      fd.append('pdf', file)
      Object.entries(formData).forEach(([k, v]) =>
        fd.append(k, Array.isArray(v) ? v.join(',') : v)
      )

      const uploadPromise = fetch('/api/gazette/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      })

      await tickProgress(0, 55, 1200)
      setStage('extracting')
      await tickProgress(55, 80, 800)
      setStage('indexing')
      const [res] = await Promise.all([uploadPromise, tickProgress(80, 95, 1000)])
      const data = await res.json()

      if (!res.ok) {
        setStage(null); setProgress(0)
        setError(data.message || data.error || 'Upload failed')
        return
      }

      setProgress(100); setStage('done'); setResult(data.data)
      setFile(null)
      document.getElementById('pdf-upload').value = ''
      setFormData({ title: '', documentNumber: '', gazetteNumber: '', publicationDate: '', category: 'Law', tags: '', languages: ['rw', 'en', 'fr'] })
    } catch (err) {
      setStage(null); setProgress(0)
      setError(err.message || 'Network error — is the backend running?')
    }
  }

  const isUploading = stage && stage !== 'done'
  const stageIdx = UPLOAD_STAGES.findIndex(s => s.key === stage)

  return (
    <div className="gazette-upload-page">
      <div className="upload-container">
        <Link to="/dashboard" className="back-link">
          <ArrowLeft size={18} /> Back to Dashboard
        </Link>

        <div className="upload-card">
          <div className="upload-header">
            <FileText size={44} />
            <h1>Upload Official Gazette</h1>
            <p>Upload a PDF — text extraction, article parsing and indexing happen automatically</p>
          </div>

          <form onSubmit={handleSubmit} className="upload-form">

            {/* PDF Drop Zone */}
            <div className="form-section">
              <label className="section-label">PDF File *</label>
              <div
                className={`file-upload-area${isDragging ? ' dragging' : ''}${file ? ' has-file' : ''}`}
                onDragOver={handleDragOver} onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave} onDrop={handleDrop}
              >
                <input type="file" id="pdf-upload" accept=".pdf"
                  onChange={handleFileChange} disabled={isUploading} />
                <div className="file-upload-content">
                  {file ? (
                    <>
                      <CheckCircle size={32} color="#15803d" />
                      <div className="file-selected">
                        <span className="file-name">{file.name}</span>
                        <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button type="button" className="file-remove"
                        onClick={(e) => { e.stopPropagation(); setFile(null) }}>
                        <X size={14} /> Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload size={32} color={isDragging ? '#2563eb' : '#94a3b8'} />
                      <p className="drop-label">{isDragging ? 'Drop PDF here' : 'Drag & drop or click to browse'}</p>
                      <p className="drop-hint">PDF only · Max 50 MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Gazette Title *</label>
                <input id="title" name="title" type="text" value={formData.title}
                  onChange={handleChange} placeholder='"Official Gazette No. 21bis of 01/11/2008"'
                  required disabled={isUploading} />
              </div>
              <div className="form-group">
                <label htmlFor="gazetteNumber">Gazette Number *</label>
                <input id="gazetteNumber" name="gazetteNumber" type="text" value={formData.gazetteNumber}
                  onChange={handleChange} placeholder='"21bis" or "Special Issue"'
                  required disabled={isUploading} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="documentNumber">Document Reference No. *</label>
                <input id="documentNumber" name="documentNumber" type="text" value={formData.documentNumber}
                  onChange={handleChange} placeholder='"N° 68/2018" — must be unique'
                  required disabled={isUploading} />
              </div>
              <div className="form-group">
                <label htmlFor="publicationDate">Publication Date *</label>
                <input id="publicationDate" name="publicationDate" type="date"
                  value={formData.publicationDate} onChange={handleChange}
                  required disabled={isUploading} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select id="category" name="category" value={formData.category}
                  onChange={handleChange} required disabled={isUploading}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="tags">Tags <span className="field-hint">(comma separated)</span></label>
                <input id="tags" name="tags" type="text" value={formData.tags}
                  onChange={handleChange} placeholder='"penal code, criminal law, theft"'
                  disabled={isUploading} />
              </div>
            </div>

            {/* Language checkboxes */}
            <div className="form-group">
              <label>Languages in this gazette</label>
              <div className="lang-checkboxes">
                {LANGUAGE_OPTIONS.map(({ value, label }) => (
                  <label key={value} className={`lang-check${formData.languages.includes(value) ? ' checked' : ''}`}>
                    <input type="checkbox" checked={formData.languages.includes(value)}
                      onChange={() => toggleLanguage(value)} disabled={isUploading} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={18} /><span>{error}</span>
              </div>
            )}

            {/* Progress */}
            {isUploading && (
              <div className="upload-progress">
                <div className="progress-stages">
                  {UPLOAD_STAGES.slice(0, 3).map((s, i) => (
                    <div key={s.key} className={`stage${i < stageIdx ? ' done' : i === stageIdx ? ' active' : ' pending'}`}>
                      <span className="stage-icon">{s.icon}</span>
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="progress-pct">{progress}%</div>
              </div>
            )}

            {/* Success */}
            {result && stage === 'done' && (
              <div className="upload-result">
                <div className="result-header">
                  <CheckCircle size={22} color="#15803d" />
                  <span>Gazette uploaded · <strong>{result.articleCount} articles indexed</strong></span>
                  <Link to="/gazette" className="result-browse">Browse all →</Link>
                </div>
                {result.isScannedPdf && (
                  <div className="alert alert-warn">
                    <AlertCircle size={16} />
                    This PDF appears to be a scanned image — text could not be extracted. Use an OCR tool first for full indexing.
                  </div>
                )}
                {result.textPreview && !result.isScannedPdf && (
                  <div className="text-preview">
                    <div className="preview-label"><Eye size={13} /> Extracted text preview</div>
                    <pre className="preview-body">{result.textPreview}</pre>
                  </div>
                )}
                <div className="result-meta">
                  <span>📄 {result.pageCount} pages</span>
                  <span>💾 {(result.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                  <span>📑 {result.articleCount} articles</span>
                </div>
              </div>
            )}

            <button type="submit" className="upload-btn" disabled={isUploading || !file}>
              {isUploading ? (UPLOAD_STAGES.find(s => s.key === stage)?.label || 'Processing…') : 'Upload & Index Gazette'}
            </button>
          </form>
        </div>

        <div className="upload-info">
          <h3>How it works</h3>
          <ol>
            <li><strong>Upload PDF</strong> — drag &amp; drop or click to browse (max 50 MB)</li>
            <li><strong>Auto text extraction</strong> — the system runs pdf-parse on the file immediately</li>
            <li><strong>Trilingual split</strong> — Kinyarwanda, English and French sections are detected and separated</li>
            <li><strong>Article parsing</strong> — individual articles are identified and stored</li>
            <li><strong>Instantly searchable</strong> — citizens can find this gazette using any keyword in seconds</li>
            <li><strong>AI-connected</strong> — the Legal AI can now reference articles from this gazette</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
