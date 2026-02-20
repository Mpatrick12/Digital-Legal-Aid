import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import SearchPage from './pages/SearchPage'
import GazetteUpload from './pages/GazetteUpload'
import GazetteBrowse from './pages/GazetteBrowse'
import GazetteDetail from './pages/GazetteDetail'
import AdminDashboard from './pages/AdminDashboard'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
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
  )
}

export default App
