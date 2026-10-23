import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TimelinePage from './pages/TimelinePage'
import ProfilePage from './pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<TimelinePage />} />
      <Route path="/profile/:username" element={<ProfilePage />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App