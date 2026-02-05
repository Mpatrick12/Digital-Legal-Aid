import { Search, FileText, Users, Phone } from 'lucide-react'
import './Features.css'

function Features() {
  const features = [
    {
      icon: <Search size={40} color="#2563eb" />,
      title: 'Search Legal Documents',
      description: 'Search the Official Gazette using simple keywords. Find laws explained in plain language you can understand.'
    },
    {
      icon: <FileText size={40} color="#2563eb" />,
      title: 'Reporting Procedures',
      description: 'Step-by-step guides on how to report theft, assault, GBV, and other crimes. Know exactly where to go and what to bring.'
    },
    {
      icon: <Users size={40} color="#2563eb" />,
      title: 'Legal Aid Directory',
      description: 'Find free legal aid services and lawyers in your district. Get connected to MAJ offices and professional attorneys.'
    },
    {
      icon: <Phone size={40} color="#2563eb" />,
      title: 'Emergency Contacts',
      description: 'Quick access to police, GBV hotline, ambulance, and other emergency numbers when you need immediate help.'
    }
  ]

  return (
    <section className="features">
      <div className="container">
        <div className="section-header">
          <span className="section-badge">Platform Features</span>
          <h2 className="section-title">Everything You Need to Access Justice</h2>
          <p className="section-subtitle">
            A centralized platform that simplifies legal information and empowers citizens
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
