import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import ProfileSetup from './pages/ProfileSetup'
import Dashboard from './pages/Dashboard'
import MainApp from './pages/MainApp'
import Settings from './pages/Settings'
import WatchPage from './pages/WatchPage'

function App() {
  const { user, profile, loading } = useAuth()
  const [showRefresh, setShowRefresh] = useState(false)

  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setShowRefresh(true), 4000)
    return () => clearTimeout(t)
  }, [loading])

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: '#3D0408',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px'
      }}>
        <span style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '26px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: '#C8B89A',
          textTransform: 'uppercase'
        }}>
          PomoXP
        </span>

        {showRefresh && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              color: '#9A7A6A'
            }}>
              Taking longer than usual
            </span>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '6px 16px',
                color: '#C8B89A',
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/auth" element={
        user ? <Navigate to="/app" /> : <AuthPage />
      } />

      <Route path="/setup" element={
        !user ? <Navigate to="/auth" /> :
        profile?.exam_name ? <Navigate to="/app" /> :
        <ProfileSetup />
      } />

      <Route path="/app" element={
        !user ? <Navigate to="/auth" /> :
        !profile?.exam_name ? <Navigate to="/setup" /> :
        <Dashboard />
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
