import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import './GazetteUpload.css'

function GazetteUpload() {
  const [file, setFile] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    documentNumber: '',
    publicationDate: '',
    category: 'Law',
    tags: ''
  })
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const categories = [
    'Law',
    'Presidential Order',
    'Ministerial Order',
    'Prime Minister Order',
    'Other'
  ]

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setError('')
    } else {
      setError('Please select a valid PDF file')
      setFile(null)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a PDF file')
      return
    }

    setUploading(true)
    setError('')
    setSuccess(false)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('pdf', file)
      formDataToSend.append('title', formData.title)
      formDataToSend.append('documentNumber', formData.documentNumber)
      formDataToSend.append('publicationDate', formData.publicationDate)
      formDataToSend.append('category', formData.category)
      formDataToSend.append('tags', formData.tags)

      const token = localStorage.getItem('token')
      
      const response = await axios.post('/api/gazette/upload', formDataToSend, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      setSuccess(true)
      setFile(null)
      setFormData({
        title: '',
        documentNumber: '',
        publicationDate: '',
        category: 'Law',
        tags: ''
      })
      
      // Reset file input
      document.getElementById('pdf-upload').value = ''
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="gazette-upload-page">
      <div className="upload-container">
        <Link to="/dashboard" className="back-link">
          <ArrowLeft size={20} />
          Back to Dashboard
        </Link>

        <div className="upload-card">
          <div className="upload-header">
            <FileText size={48} color="#2563eb" />
            <h1>Upload Official Gazette</h1>
            <p>Upload PDF documents to make them searchable in the system</p>
          </div>

          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Document Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Law N° 68/2018 on the Penal Code"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="documentNumber">Document Number *</label>
                <input
                  type="text"
                  id="documentNumber"
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleChange}
                  placeholder="e.g., N° 68/2018"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="publicationDate">Publication Date *</label>
                <input
                  type="date"
                  id="publicationDate"
                  name="publicationDate"
                  value={formData.publicationDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="e.g., criminal law, theft, assault"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pdf-upload">PDF File *</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf"
                  onChange={handleFileChange}
                  required
                />
                <div className="file-upload-content">
                  <Upload size={32} color="#6b7280" />
                  {file ? (
                    <div className="file-selected">
                      <CheckCircle size={20} color="#16a34a" />
                      <span>{file.name}</span>
                      <span className="file-size">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ) : (
                    <p>Click to browse or drag and drop PDF file (Max 50MB)</p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="error-alert">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {success && (
              <div className="success-alert">
                <CheckCircle size={20} />
                Document uploaded and processed successfully!
              </div>
            )}

            <button 
              type="submit" 
              className="upload-btn" 
              disabled={uploading || !file}
            >
              {uploading ? 'Uploading & Processing...' : 'Upload Document'}
            </button>
          </form>
        </div>

        <div className="upload-info">
          <h3>How it works:</h3>
          <ol>
            <li>Fill in the document information</li>
            <li>Upload the PDF file</li>
            <li>System automatically extracts text from PDF</li>
            <li>Document becomes searchable in the gazette database</li>
            <li>Users can search, view, and download the document</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

export default GazetteUpload
