import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CardBuilder from './pages/CardBuilder'
import PublicCard from './pages/PublicCard'
import AdminPanel from './pages/AdminPanel'
import TemplateManager from './pages/TemplateManager'

function App() {
  const token = localStorage.getItem('token')

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/builder" element={token ? <CardBuilder /> : <Navigate to="/login" />} />
        <Route path="/card/:slug" element={<PublicCard />} />  {/* ← добавить */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/admin" element={token ? <AdminPanel /> : <Navigate to="/login" />} />
        <Route path="/admin/templates" element={token ? <TemplateManager /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App