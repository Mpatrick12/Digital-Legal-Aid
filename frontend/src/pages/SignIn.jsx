import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scale, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import './SignUp.css'

function SignIn() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await axios.post('/api/auth/signin', formData)
      localStorage.setItem('token', response.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <Link to="/" className="back-to-home">
        <ArrowLeft size={20} />
        Back to Home
      </Link>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-icon">
            <Scale size={48} color="#2563eb" />
          </div>
          
          <h2 className="auth-title">Digital Legal Aid</h2>
          <p className="auth-subtitle">Access justice information at your fingertips</p>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          
          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignIn
