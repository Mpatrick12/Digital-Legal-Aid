import { useState } from 'react'
import { Scale, Menu, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import './Header.css'

function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const close = () => setMobileOpen(false)

  return (
    <header className="header">
      <div className="container">
        <div className="header-inner">
          <Link to="/" className="header-logo" onClick={close}>
            <div className="header-logo-icon">
              <Scale size={18} color="#fff" strokeWidth={2.5} />
            </div>
            <div className="header-logo-text">
              <span className="header-logo-name">Digital Legal Aid</span>
              <span className="header-logo-sub">Rwanda</span>
            </div>
          </Link>

          <nav className={`header-nav${mobileOpen ? ' header-nav--open' : ''}`}>
            <Link to="/search" className="header-nav-link" onClick={close}>Search Laws</Link>
            <Link to="/gazette" className="header-nav-link" onClick={close}>Gazette</Link>
            <div className="header-nav-sep" />
            <Link to="/signin" className="btn btn-ghost header-auth-btn" onClick={close}>Sign In</Link>
            <Link to="/signup" className="btn btn-primary header-auth-btn" onClick={close}>Get Started</Link>
          </nav>

          <button
            className="header-menu-btn"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
