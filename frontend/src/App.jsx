import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import SearchPage from './pages/SearchPage'
import GazetteUpload from './pages/GazetteUpload'
import GazetteBrowse from './pages/GazetteBrowse'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/gazette" element={<GazetteBrowse />} />
      <Route path="/admin/upload-gazette" element={<GazetteUpload />} />
    </Routes>
  )
}

export default App
