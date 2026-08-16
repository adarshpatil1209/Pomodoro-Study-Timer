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
import ClockLoader from './components/ClockLoader'

function App() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <ClockLoader />
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
