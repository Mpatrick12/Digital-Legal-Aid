import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Scale, Shield, BookOpen, Building, Phone, User, Clock, ChevronDown } from 'lucide-react'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState({
    name: 'Patrik Karekezi',
    email: 'patrik@gmail.com',
    phone: '+250785456534',
    district: 'Kicukiro',
    role: 'citizen'
  })
  const [activeTab, setActiveTab] = useState('legal-aid')
  const [language, setLanguage] = useState('English')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
      return
    }
    
    // Load user data from localStorage
    const userData = JSON.parse(localStorage.getItem('user') || '{}')
    if (userData.name) {
      setUser({
        name: userData.name,
        email: userData.email,
        phone: userData.phone || 'N/A',
        district: userData.district,
        role: userData.role || 'citizen'
      })
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="nav-logo">
              <Scale size={24} color="#2563eb" />
              <div>
                <div className="logo-title">Rwanda Legal Aid</div>
                <div className="logo-subtitle">Access to Justice</div>
              </div>
            </Link>
          </div>

          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'legal-aid' ? 'active' : ''}`}
              onClick={() => setActiveTab('legal-aid')}
            >
              <Shield size={18} />
              Legal Aid
            </button>
            <button 
              className={`nav-tab ${activeTab === 'gazette' ? 'active' : ''}`}
              onClick={() => navigate('/gazette')}
            >
              <BookOpen size={18} />
              Official Gazette
            </button>
          </div>

          <div className="nav-right">
            <div className="language-selector">
              <span>{language}</span>
              <ChevronDown size={16} />
            </div>
            {user.role === 'admin' && (
              <Link to="/admin/dashboard" className="admin-link-btn">
                Admin Portal
              </Link>
            )}
            <div className="user-info">
              <div className="user-details">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="content-container">
          <div className="main-content">
            <div className="welcome-section">
              <User size={48} className="welcome-icon" />
              <div>
                <h1>Welcome, {user.name.split(' ')[0]}!</h1>
                <p>Access your personalized legal aid portal</p>
              </div>
            </div>

            <div className="quick-access">
              <div className="quick-access-header">
                <h2>Quick Access</h2>
              </div>
              <div className="access-grid">
                <Link to="/search" className="access-card">
                  <div className="access-icon blue">
                    <Shield size={24} />
                  </div>
                  <h3>Legal Aid & Crime Reporting</h3>
                  <p>Find step-by-step guidance for reporting crimes</p>
                </Link>

                <Link to="/gazette" className="access-card">
                  <div className="access-icon purple">
                    <BookOpen size={24} />
                  </div>
                  <h3>Official Gazette</h3>
                  <p>Search laws and legal documents</p>
                </Link>

                <div className="access-card">
                  <div className="access-icon green">
                    <Building size={24} />
                  </div>
                  <h3>Notary Directory</h3>
                  <p>Find certified notaries near you</p>
                </div>

                <div className="access-card">
                  <div className="access-icon red">
                    <Phone size={24} />
                  </div>
                  <h3>Emergency Contacts</h3>
                  <p>Get help immediately</p>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <div className="section-header">
                <Clock size={20} />
                <h2>Recent Activity</h2>
              </div>
              <div className="activity-content">
                <Clock size={48} className="empty-icon" />
                <p>No recent activity</p>
              </div>
            </div>
          </div>

          <aside className="sidebar">
            <div className="account-info-card">
              <h3>Account Information</h3>
              <div className="info-group">
                <label>Name</label>
                <p>{user.name}</p>
              </div>
              <div className="info-group">
                <label>Email</label>
                <p>{user.email}</p>
              </div>
              <div className="info-group">
                <label>Phone</label>
                <p>{user.phone}</p>
              </div>
              <div className="info-group">
                <label>District</label>
                <p>{user.district}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
