import { ArrowRight, CheckCircle, Globe } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      {/* decorative blobs */}
      <div className="hero-blob hero-blob-1" />
      <div className="hero-blob hero-blob-2" />

      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">
            <Globe size={13} />
            Supporting SDG 16 · Peace, Justice &amp; Strong Institutions
          </div>

          <h1 className="hero-title">
            Access to Justice,<br />
            <span className="hero-title-accent">Simplified for All Rwandans</span>
          </h1>

          <p className="hero-subtitle">
            Understand your legal rights and know how to report crimes—in plain language,
            in English and Kinyarwanda.
          </p>

          <div className="hero-actions">
            <Link to="/signup" className="btn btn-hero-primary">
              Get Started Free
              <ArrowRight size={17} />
            </Link>
            <Link to="/search" className="btn btn-hero-outline">
              Browse Without Account
            </Link>
          </div>

          <div className="hero-pills">
            <span className="hero-pill"><CheckCircle size={14} />100% Free</span>
            <span className="hero-pill"><CheckCircle size={14} />Mobile Friendly</span>
            <span className="hero-pill"><CheckCircle size={14} />Bilingual Support</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
