import { ArrowRight, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Hero.css'

function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">
            Supporting SDG 16: Peace, Justice & Strong Institutions
          </div>
          
          <h1 className="hero-title">
            Access to Justice,<br />
            Simplified for All Rwandans
          </h1>
          
          <p className="hero-subtitle">
            Understand your legal rights and know how to report crimes with easy-to-understand 
            guidance in English and Kinyarwanda.
          </p>
          
          <div className="hero-buttons">
            <Link to="/signup" className="btn-primary">
              Get Started Free
              <ArrowRight size={20} />
            </Link>
            <Link to="/search" className="btn-secondary">
              Browse Without Account
            </Link>
          </div>
          
          <div className="hero-features">
            <div className="feature-item">
              <CheckCircle size={20} color="#2563eb" />
              <span>100% Free Service</span>
            </div>
            <div className="feature-item">
              <CheckCircle size={20} color="#2563eb" />
              <span>Mobile Friendly</span>
            </div>
            <div className="feature-item">
              <CheckCircle size={20} color="#2563eb" />
              <span>Bilingual Support</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
