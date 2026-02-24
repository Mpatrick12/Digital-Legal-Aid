import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Scale, Shield, BookOpen, Building, Phone, User, Clock, ChevronDown } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { t } from '../translations.js'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()
  const { language, setLanguage } = useLanguage()
  const [user, setUser] = useState({
    name: 'Patrik Karekezi',
    email: 'patrik@gmail.com',
    phone: '+250785456534',
    district: 'Kicukiro',
    role: 'citizen'
  })
  const [activeTab, setActiveTab] = useState('legal-aid')

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
              {t('nav.legalAid', language)}
            </button>
            <button 
              className={`nav-tab ${activeTab === 'gazette' ? 'active' : ''}`}
              onClick={() => navigate('/gazette')}
            >
              <BookOpen size={18} />
              {t('nav.gazette', language)}
            </button>
          </div>

          <div className="nav-right">
            <button
              className="language-selector"
              onClick={() => setLanguage(language === 'en' ? 'rw' : 'en')}
              title="Switch language"
            >
              <span>{language === 'en' ? 'EN' : 'RW'}</span>
              <ChevronDown size={14} />
            </button>
            {user.role === 'admin' && (
              <Link to="/admin/dashboard" className="admin-link-btn">
                {t('nav.adminPortal', language)}
              </Link>
            )}
            <div className="user-info">
              <div className="user-details">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              {t('nav.logout', language)}
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
                <h1>{t('dashboard.welcomeGreeting', language)}, {user.name.split(' ')[0]}!</h1>
                <p>{t('dashboard.subtitle', language)}</p>
              </div>
            </div>

            <div className="quick-access">
              <div className="quick-access-header">
                <h2>{t('dashboard.quickAccess', language)}</h2>
              </div>
              <div className="access-grid">
                <Link to="/search" className="access-card">
                  <div className="access-icon blue">
                    <Shield size={24} />
                  </div>
                  <h3>{t('dashboard.legalAidCard', language)}</h3>
                  <p>{t('dashboard.legalAidDesc', language)}</p>
                </Link>

                <Link to="/gazette" className="access-card">
                  <div className="access-icon purple">
                    <BookOpen size={24} />
                  </div>
                  <h3>{t('dashboard.gazetteCard', language)}</h3>
                  <p>{t('dashboard.gazetteDesc', language)}</p>
                </Link>

                <div className="access-card">
                  <div className="access-icon green">
                    <Building size={24} />
                  </div>
                  <h3>{t('dashboard.notaryCard', language)}</h3>
                  <p>{t('dashboard.notaryDesc', language)}</p>
                </div>

                <div className="access-card">
                  <div className="access-icon red">
                    <Phone size={24} />
                  </div>
                  <h3>{t('dashboard.emergencyCard', language)}</h3>
                  <p>{t('dashboard.emergencyDesc', language)}</p>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <div className="section-header">
                <Clock size={20} />
                <h2>{t('dashboard.recentActivity', language)}</h2>
              </div>
              <div className="activity-content">
                <Clock size={48} className="empty-icon" />
                <p>{t('dashboard.noActivity', language)}</p>
              </div>
            </div>
          </div>

          <aside className="sidebar">
            <div className="account-info-card">
              <h3>{t('dashboard.accountInfo', language)}</h3>
              <div className="info-group">
                <label>{t('dashboard.fieldName', language)}</label>
                <p>{user.name}</p>
              </div>
              <div className="info-group">
                <label>{t('dashboard.fieldEmail', language)}</label>
                <p>{user.email}</p>
              </div>
              <div className="info-group">
                <label>{t('dashboard.fieldPhone', language)}</label>
                <p>{user.phone}</p>
              </div>
              <div className="info-group">
                <label>{t('dashboard.fieldDistrict', language)}</label>
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
