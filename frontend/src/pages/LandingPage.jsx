import Header from '../components/Header'
import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import Benefits from '../components/Benefits'
import './LandingPage.css'

function LandingPage() {
  return (
    <div className="landing-page">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <Benefits />
      <footer className="footer">
        <div className="container">
          <p>&copy; 2026 Digital Legal Aid Rwanda. Supporting SDG 16.</p>
          <p className="disclaimer">
            This platform provides legal guidance, not legal advice. 
            Consult a professional attorney for specific legal matters.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
