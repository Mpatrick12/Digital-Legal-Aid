import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { getApiUrl } from './config'
import LandingPage from './pages/LandingPage'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import SearchPage from './pages/SearchPage'
import GazetteUpload from './pages/GazetteUpload'
import GazetteBrowse from './pages/GazetteBrowse'
import GazetteDetail from './pages/GazetteDetail'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import NotaryPage from './pages/NotaryPage'
import LegalPolicyPage from './pages/LegalPolicyPage'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import ChatWidget from './components/ChatWidget'
import SiteFooter from './components/SiteFooter'
import { useLanguage } from './context/LanguageContext.jsx'

function App() {
  const { language } = useLanguage()
  useLocation()
  const isLoggedIn = !!localStorage.getItem('token')

  // Keep Render backend alive — ping every 14 min so it never sleeps
  useEffect(() => {
    const ping = () => fetch(getApiUrl('api/health'), { method: 'GET' }).catch(() => { })
    ping()
    const id = setInterval(ping, 14 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <SearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gazette"
          element={
            <ProtectedRoute>
              <GazetteBrowse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gazette/:id"
          element={
            <ProtectedRoute>
              <GazetteDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/upload-gazette"
          element={
            <AdminRoute>
              <GazetteUpload />
            </AdminRoute>
          }
        />
        <Route
          path="/notary"
          element={
            <ProtectedRoute>
              <NotaryPage />
            </ProtectedRoute>
          }
        />
        <Route path="/privacy" element={<LegalPolicyPage />} />
        <Route path="/terms" element={<LegalPolicyPage />} />
      </Routes>
      <SiteFooter />
      <ChatWidget language={language} />
    </>
  )
}

export default App
