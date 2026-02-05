import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Scale, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import './SignUp.css'

function SignUp() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    district: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const districts = [
    'Gasabo', 'Kicukiro', 'Nyarugenge', 'Bugesera', 'Gatsibo', 
    'Kayonza', 'Kirehe', 'Ngoma', 'Rwamagana', 'Burera', 
    'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo', 'Gisagara', 
    'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 
    'Nyaruguru', 'Ruhango', 'Karongi', 'Ngororero', 'Nyabihu', 
    'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro'
  ]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const response = await axios.post('/api/auth/signup', {
        name: formData.fullName,
        email: formData.email,
        district: formData.district,
        password: formData.password
      })
      
      localStorage.setItem('token', response.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
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
          
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join Digital Legal Aid to access justice information</p>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            
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
              <label htmlFor="district">District</label>
              <select
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                required
              >
                <option value="">Select your district</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
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
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          
          <p className="auth-footer">
            Already have an account? <Link to="/signin">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp
