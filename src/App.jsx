import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import ProfileSetup from './pages/ProfileSetup'
import Dashboard from './pages/Dashboard'
import MainApp from './pages/MainApp'
import Settings from './pages/Settings'
import WatchPage from './pages/WatchPage'

const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    background: '#3D0408',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <motion.h1
      style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: 28,
        color: '#F5EFE6',
        letterSpacing: '0.12em',
        margin: 0,
      }}
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      DR.SURU 🩺
    </motion.h1>
  </div>
)

function App() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return <LoadingScreen />

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={
        user ? <Navigate to="/" /> : <AuthPage />
      } />

      {/* Protected routes */}
      <Route path="/setup" element={
        !user ? <Navigate to="/auth" /> :
        profile?.exam_name ? <Navigate to="/" /> :
        <ProfileSetup />
      } />

      <Route path="/" element={
        !user ? <Navigate to="/auth" /> :
        !profile?.exam_name ? <Navigate to="/setup" /> :
        <Dashboard onModeSelect={(mode, room) => {
          if (mode === 'solo') {
            navigate('/study')
          } else if (mode === 'room' && room) {
            navigate(`/room/${room.id}`)
          }
        }} />
      } />

      <Route path="/study" element={
        !user ? <Navigate to="/auth" /> : <MainApp />
      } />

      <Route path="/room/:roomId" element={
        !user ? <Navigate to="/auth" /> : <MainApp />
      } />

      <Route path="/settings" element={
        !user ? <Navigate to="/auth" /> : <Settings />
      } />

      <Route path="/watch" element={<WatchPage />} />
    </Routes>
  )
}

export default App
