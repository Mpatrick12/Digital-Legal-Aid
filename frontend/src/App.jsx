import { Routes, Route, useLocation } from 'react-router-dom'
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
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import ChatWidget from './components/ChatWidget'
import { useLanguage } from './context/LanguageContext.jsx'

function App() {
  const { language } = useLanguage()
  useLocation() // triggers re-render on route change so isLoggedIn stays in sync
  const isLoggedIn = !!localStorage.getItem('token')

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
    </Routes>
      <ChatWidget language={language} />
    </>
  )
}

export default App
