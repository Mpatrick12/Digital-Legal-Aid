import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AdminLogin.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPw, setShowPw]     = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Invalid credentials')
        return
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/admin/dashboard')
    } catch {
      setError('Could not connect to server. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Header */}
        <div className="admin-login-header">
          <div className="admin-shield">🛡️</div>
          <h1>Admin Portal</h1>
          <p>Digital Legal Aid — Rwanda</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          {error && (
            <div className="admin-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="admin-field">
            <label htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="admin-password">Password</label>
            <div className="admin-pw-wrap">
              <input
                id="admin-password"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="admin-pw-toggle"
                onClick={() => setShowPw(p => !p)}
                tabIndex={-1}
              >
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading || !username || !password}
          >
            {loading ? 'Signing in…' : 'Sign In to Admin'}
          </button>
        </form>

        <p className="admin-back-link">
          <a href="/">← Back to main site</a>
        </p>
      </div>
    </div>
  )
}
# Mbe 02 Wer 2026 21:02:46 CAT
