import { Clock, BookOpen, Shield, Smartphone } from 'lucide-react'
import './Benefits.css'

function Benefits() {
  const benefits = [
    {
      icon: <Clock size={48} color="#2563eb" />,
      title: 'Save Time & Money',
      description: 'No need to travel to offices or wait in lines. Get information instantly from your phone.'
    },
    {
      icon: <BookOpen size={48} color="#2563eb" />,
      title: 'Understand Your Rights',
      description: 'Legal jargon translated into simple language that anyone can understand.'
    },
    {
      icon: <Shield size={48} color="#2563eb" />,
      title: 'Know How to Report',
      description: 'Clear step-by-step procedures so you know exactly what to do when you\'re a victim of crime.'
    },
    {
      icon: <Smartphone size={48} color="#2563eb" />,
      title: 'Mobile Accessible',
      description: 'Works on any smartphone, even with low data. Progressive Web App technology for offline access.'
    }
  ]

  return (
    <section className="benefits">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Why Choose Us</span>
          <h2 className="section-title">Benefits for Citizens</h2>
        </div>
        
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card">
              <div className="benefit-icon-wrapper">
                {benefit.icon}
              </div>
              <div className="benefit-content">
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Benefits
