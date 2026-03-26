import { Link } from 'react-router-dom'
import './SiteFooter.css'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-copy">© {new Date().getFullYear()} Digital Legal Aid Rwanda</p>
        <nav className="site-footer-links" aria-label="Legal links">
          <Link to="/privacy">Privacy Policy</Link>
          <span aria-hidden="true">•</span>
          <Link to="/terms">Terms of Use</Link>
        </nav>
      </div>
    </footer>
  )
}
