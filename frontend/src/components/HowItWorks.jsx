import './HowItWorks.css'

function HowItWorks() {
  const steps = [
    {
      number: '1',
      title: 'Create Free Account',
      description: 'Sign up with your email and select your district. Takes less than 2 minutes.'
    },
    {
      number: '2',
      title: 'Search or Browse',
      description: 'Use keywords to search for laws or browse reporting procedures for different crimes.'
    },
    {
      number: '3',
      title: 'Get Guidance',
      description: 'Access simplified legal information, reporting steps, and connect with legal aid providers.'
    }
  ]

  return (
    <section className="how-it-works">
      <div className="container">
        <div className="section-header">
          <span className="section-badge section-badge-light">Simple Process</span>
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Get legal guidance in just three simple steps
          </p>
        </div>
        
        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={index} className="step-card">
              <div className="step-number">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
        
        <div className="stats-section">
          <h3 className="stats-title">Empowering Citizens Through Technology</h3>
          <p className="stats-subtitle">
            Aligned with Vision 2050 and National Strategy for Transformation (NST1)
          </p>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">50+</div>
              <div className="stat-label">Legal Articles Simplified</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">&lt;2s</div>
              <div className="stat-label">Average Search Time</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Access Anytime</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">100%</div>
              <div className="stat-label">Free Service</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
