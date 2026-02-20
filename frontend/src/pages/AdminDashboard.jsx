import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { 
  Scale, Users, Search, FileText, TrendingUp, Download, 
  BarChart3, PieChart as PieChartIcon, Activity, Clock
} from 'lucide-react'
import './AdminDashboard.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
      return
    }

    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role !== 'admin') {
      navigate('/dashboard')
      return
    }

    fetchAnalytics()
  }, [navigate])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/analytics/stats', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data.data)
      setLoading(false)
    } catch (err) {
      setError('Failed to load analytics')
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2']

  // Transform data for charts
  const districtData = stats?.districtBreakdown?.slice(0, 10).map(d => ({
    name: d.district,
    users: d.count
  })) || []

  const searchTrendData = stats?.searchTrends?.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    searches: t.searches
  })) || []

  const categoryData = stats?.gazettesByCategory?.map(c => ({
    name: c.category || 'Uncategorized',
    value: c.count
  })) || []

  const topSearchesData = stats?.topSearches?.slice(0, 8).map(s => ({
    query: s.query.length > 15 ? s.query.substring(0, 15) + '...' : s.query,
    count: s.count
  })) || []

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <nav className="admin-nav">
        <div className="nav-container">
          <div className="nav-left">
            <Link to="/" className="nav-logo">
              <Scale size={24} color="#2563eb" />
              <div>
                <div className="logo-title">Admin Portal</div>
                <div className="logo-subtitle">Analytics Dashboard</div>
              </div>
            </Link>
          </div>
          <div className="nav-right">
            <Link to="/dashboard" className="nav-btn">User View</Link>
            <Link to="/admin/upload-gazette" className="nav-btn">Upload Gazette</Link>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </nav>

      <div className="admin-content">
        <div className="content-container">
          <h1 className="page-title">
            <BarChart3 size={32} />
            System Analytics & Insights
          </h1>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card stat-primary">
              <div className="stat-icon">
                <Users size={28} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{stats?.overview?.totalUsers || 0}</div>
                <div className="stat-label">Total Users</div>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">
                <Search size={28} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{stats?.overview?.totalSearches || 0}</div>
                <div className="stat-label">Total Searches</div>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">
                <FileText size={28} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{stats?.overview?.totalGazetteDocuments || 0}</div>
                <div className="stat-label">Gazette Documents</div>
              </div>
            </div>

            <div className="stat-card stat-info">
              <div className="stat-icon">
                <Activity size={28} />
              </div>
              <div className="stat-details">
                <div className="stat-value">{stats?.overview?.totalLegalContent || 0}</div>
                <div className="stat-label">Legal Articles</div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {/* Search Trends Line Chart */}
            <div className="chart-card chart-large">
              <div className="chart-header">
                <div>
                  <h2 className="chart-title">
                    <TrendingUp size={20} />
                    Search Trends (Last 30 Days)
                  </h2>
                  <p className="chart-subtitle">Daily search activity</p>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={searchTrendData}>
                    <defs>
                      <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="searches" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Users by District Bar Chart */}
            <div className="chart-card chart-large">
              <div className="chart-header">
                <div>
                  <h2 className="chart-title">
                    <Users size={20} />
                    Users by District
                  </h2>
                  <p className="chart-subtitle">Top 10 districts</p>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={districtData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6b7280" 
                      style={{ fontSize: '11px' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Bar dataKey="users" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Searches Bar Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h2 className="chart-title">
                    <Search size={20} />
                    Top Search Queries
                  </h2>
                  <p className="chart-subtitle">Most searched terms</p>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topSearchesData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis 
                      type="category" 
                      dataKey="query" 
                      stroke="#6b7280" 
                      style={{ fontSize: '11px' }}
                      width={100}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }} 
                    />
                    <Bar dataKey="count" fill="#db2777" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Category Distribution Pie Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h2 className="chart-title">
                    <PieChartIcon size={20} />
                    Documents by Category
                  </h2>
                  <p className="chart-subtitle">Category distribution</p>
                </div>
              </div>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="activity-section">
            <div className="activity-grid">
              {/* Popular Content */}
              <div className="activity-card">
                <h3 className="activity-title">
                  <TrendingUp size={18} />
                  Popular Legal Content
                </h3>
                <div className="activity-list">
                  {stats?.popularContent?.slice(0, 5).map((content, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-rank">{index + 1}</div>
                      <div className="activity-details">
                        <div className="activity-name">{content.crimeType}</div>
                        <div className="activity-meta">Article {content.articleNumber}</div>
                      </div>
                      <div className="activity-value">{content.viewCount} views</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Gazettes */}
              <div className="activity-card">
                <h3 className="activity-title">
                  <Download size={18} />
                  Most Downloaded Gazettes
                </h3>
                <div className="activity-list">
                  {stats?.popularGazettes?.slice(0, 5).map((gazette, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-rank">{index + 1}</div>
                      <div className="activity-details">
                        <div className="activity-name">
                          {gazette.title?.substring(0, 40)}{gazette.title?.length > 40 ? '...' : ''}
                        </div>
                        <div className="activity-meta">{gazette.documentNumber}</div>
                      </div>
                      <div className="activity-value">{gazette.downloadCount} downloads</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Searches */}
              <div className="activity-card">
                <h3 className="activity-title">
                  <Clock size={18} />
                  Recent Searches
                </h3>
                <div className="activity-list">
                  {stats?.recentSearches?.slice(0, 8).map((search, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-details">
                        <div className="activity-name">{search.query}</div>
                        <div className="activity-meta">
                          {new Date(search.timestamp).toLocaleString()} • {search.resultsCount} results
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
