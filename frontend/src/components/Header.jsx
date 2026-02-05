import { Scale } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Header.css'

function Header() {
  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <Scale size={32} color="#2563eb" />
            <div className="logo-text">
              <h1>Digital Legal Aid</h1>
              <p>Rwanda Justice Portal</p>
            </div>
          </Link>
          <Link to="/signin" className="sign-in-btn">
            Sign In
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
