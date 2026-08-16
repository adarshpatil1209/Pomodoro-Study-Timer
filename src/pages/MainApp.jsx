import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon } from 'lucide-react'
import { useTimer } from '../hooks/useTimer'
import { useStats } from '../hooks/useStats'
import { useTodos } from '../hooks/useTodos'
import { useAuth } from '../contexts/AuthContext'
import useRoom from '../hooks/useRoom'
import Timer from '../components/Timer'
import Stats from '../components/Stats'
import TodoList from '../components/TodoList'
import MusicPlayer from '../components/MusicPlayer'
import Toast from '../components/Toast'
import SessionBanner, { useSessionBanner } from '../components/SessionBanner'
import EndOfDayModal from '../components/EndOfDayModal'
import { SkeletonTimerCard, SkeletonStatsCard, SkeletonTodoCard } from '../components/Skeleton'
import { fireGoalConfetti } from '../utils/confetti'
import StudyCamera, { StudyCameraToggle } from '../components/StudyCamera'
import ChatWidget from '../components/ChatWidget'
import CalendarTodos from '../components/CalendarTodos'
import AIChat from '../components/AIChat'
import { supabase } from '../lib/supabase'

import '../App.css'

function HibiscusSVG() {
  return (
    <motion.svg
      className="app-hibiscus"
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ rotate: [0, 2, -1, 0], y: [0, 4, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path
        d="M50 20C50 20 40 8 30 12C20 16 22 28 30 34C24 30 12 26 10 36C8 46 20 48 30 44C20 48 14 58 22 64C30 70 38 60 40 52C38 62 40 76 50 76C60 76 62 62 60 52C62 60 70 70 78 64C86 58 80 48 70 44C80 48 92 46 90 36C88 26 76 30 70 34C78 28 80 16 70 12C60 8 50 20 50 20Z"
        fill="rgba(90,10,20,0.6)"
      />
      <circle cx="50" cy="44" r="8" fill="rgba(90,10,20,0.45)" />
    </motion.svg>
  )
}

function EditableName({ name, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const inputRef = useRef(null)

  useEffect(() => {
    setValue(name)
  }, [name])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleBlur = () => {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed && trimmed !== name) {
      onSave(trimmed)
    } else {
      setValue(name)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
    if (e.key === 'Escape') {
      setValue(name)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="app-name-input font-display"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    )
  }

  return (
    <span
      className="app-name-text"
      onClick={() => setEditing(true)}
      title="Click to edit name"
    >
      {name}
    </span>
  )
}

export default function MainApp() {
  const { roomId: urlRoomId } = useParams()
  const navigate = useNavigate()
  const { profile, user } = useAuth()

  // Determine mode from URL
  const mode = urlRoomId ? 'room' : 'solo'
  const roomId = urlRoomId || null

  const { room, partner, leaveRoom } = useRoom(roomId)

  // --- Partner presence ---
  const [partnerOnline, setPartnerOnline] = useState(false)

  useEffect(() => {
    if (mode !== 'room' || !roomId || !user) return

    const channel = supabase.channel(`presence-${roomId}`)

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const others = Object.values(state)
          .flat()
          .filter((p) => p.user_id !== user.id)
        setPartnerOnline(others.length > 0)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, name: profile?.name })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mode, roomId, user, profile])

  // --- Hooks ---
  const { stats, loading: statsLoading, updateStats, addSession } = useStats()
  const [cameraOpen, setCameraOpen] = useState(false)

  const [showSkeleton, setShowSkeleton] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShowSkeleton(false), 3000)
    return () => clearTimeout(t)
  }, [])

  const isLoading = showSkeleton && statsLoading
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [eodVisible, setEodVisible] = useState(false)
  const [eodDismissed, setEodDismissed] = useState(false)

  const { bannerType, bannerVisible, showBanner, hideBanner } = useSessionBanner()

  // Session complete handler
  const handleSessionComplete = useCallback((focusMinutes) => {
    addSession(focusMinutes)
    showBanner('focus')

    // Check goal after a tick so stats have updated
    setTimeout(() => {
      if (stats) {
        const newSessionsToday = (stats.sessions_today || 0) + 1
        const dailyGoal = stats.daily_goal || 8
        if (newSessionsToday >= dailyGoal && !eodDismissed) {
          fireGoalConfetti()
          setEodVisible(true)
        }
      }
    }, 500)
  }, [addSession, showBanner, stats, eodDismissed])

  const timerHook = useTimer({
    onSessionComplete: handleSessionComplete,
  })

  // Show break banner when timer switches to focus from a break
  const prevModeRef = useRef(timerHook.mode)
  useEffect(() => {
    const prev = prevModeRef.current
    const curr = timerHook.mode
    if (
      (prev === 'shortBreak' || prev === 'longBreak') &&
      curr === 'focus' &&
      !timerHook.isRunning
    ) {
      showBanner('break')
    }
    prevModeRef.current = curr
  }, [timerHook.mode, timerHook.isRunning, showBanner])

  // Todo complete handler
  const handleTaskComplete = useCallback(() => {
    setToastMsg("Proud of you, let's gooo!! 🎉")
    setToastVisible(true)
  }, [])

  const todosHook = useTodos({
    onComplete: handleTaskComplete,
  })
  const { loading: rawTodosLoading } = todosHook
  const todosLoading = showSkeleton && rawTodosLoading

  // EndOfDay: auto-show after 9pm if not dismissed
  useEffect(() => {
    if (eodDismissed || !stats) return
    const hour = new Date().getHours()
    if (hour >= 21 && (stats.sessions_today || 0) > 0) {
      setEodVisible(true)
    }
  }, [stats, eodDismissed])

  const handleEodClose = useCallback(() => {
    setEodVisible(false)
    setEodDismissed(true)
  }, [])

  // Name save
  const handleNameSave = useCallback((newName) => {
    updateStats({ display_name: newName })
  }, [updateStats])

  // Global keyboard shortcuts: r = reset, s = skip
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        timerHook.reset()
      }
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        timerHook.skip()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [timerHook])

  const displayName = profile?.name || stats?.display_name || 'friend'
  const streakDays = stats?.streak_days || 0

  const [headerVisible, setHeaderVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY < 10) {
        setHeaderVisible(true)
      } else if (currentScrollY > lastScrollY) {
        setHeaderVisible(false)
      } else {
        setHeaderVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const handleLeaveRoom = async () => {
    await leaveRoom()
    navigate('/')
  }

  return (
    <div className="app-root page-pad">
      {/* Fixed Background Orbs */}
      <div style={{ zIndex: -1, position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <motion.div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            background: 'rgba(107, 10, 20, 0.5)',
            borderRadius: '50%',
            top: -80,
            left: -60,
          }}
          animate={{ y: [0, 30, 0], x: [0, 15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            background: 'rgba(125, 16, 32, 0.35)',
            borderRadius: '50%',
            bottom: '10%',
            right: -40,
          }}
          animate={{ y: [0, -25, 0], x: [0, -10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
        <motion.div
          style={{
            position: 'absolute',
            width: 120,
            height: 120,
            background: 'rgba(125, 170, 150, 0.06)',
            borderRadius: '50%',
            top: '50%',
            left: '20%',
          }}
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
        />
      </div>

      {/* Header */}
      <motion.header
        className="app-header header"
        animate={{
          opacity: headerVisible ? 1 : 0,
          y: headerVisible ? 0 : -20,
          pointerEvents: headerVisible ? 'auto' : 'none'
        }}
        transition={{
          duration: 0.3,
          ease: 'easeInOut'
        }}
        style={{
          background: '#3D0408',
          borderRadius: 0,
          boxShadow: 'none',
          border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '16px 28px 12px',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div className="app-header-left">
          <span style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 700,
            fontSize: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#F5EFE6',
          }}>PomoXP</span>
        </div>

        <motion.div
          className="app-header-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0 }}
        >
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 300,
            fontStyle: 'italic',
            fontSize: 20,
            color: '#C8B89A',
            margin: 0,
          }}>
            Hey <EditableName name={displayName} onSave={handleNameSave} />
          </h1>

          {/* Room mode: partner presence */}
          {mode === 'room' && (
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: 14,
              color: '#9A7A6A',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
              justifyContent: 'center',
            }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: partnerOnline ? '#4CAF50' : '#666',
                display: 'inline-block',
                boxShadow: partnerOnline ? '0 0 6px rgba(76,175,80,0.5)' : 'none',
              }} />
              Studying with {partner?.name || room?.host?.name || 'partner'}
            </div>
          )}
        </motion.div>

        <div className="app-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <motion.span
            className="app-streak-badge"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🔥 {streakDays} days
          </motion.span>

          <motion.button
            onClick={() => navigate('/settings')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Settings"
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              width: 28,
              height: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9A7A6A',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <SettingsIcon size={16} />
          </motion.button>

          {mode === 'room' && (
            <>
              <StudyCameraToggle
                isOn={cameraOpen}
                onToggle={() => setCameraOpen((v) => !v)}
              />
              <motion.button
                onClick={handleLeaveRoom}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  padding: '5px 12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: '#B03030',
                  cursor: 'pointer',
                }}
              >
                Leave Room
              </motion.button>
            </>
          )}
        </div>
      </motion.header>

      {/* Main grid */}
      <main className="app-grid">
        <motion.div
          className="app-col-left"
          initial={{ x: -60, opacity: 0, rotateY: -8 }}
          animate={{ x: 0, opacity: 1, rotateY: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.1 }}
          style={{ transformPerspective: 1000 }}
        >
          {isLoading ? <SkeletonTimerCard /> : <Timer timerHook={timerHook} />}
        </motion.div>
        <div className="app-col-right">
          {isLoading ? <SkeletonStatsCard /> : (
            <motion.div
              initial={{ y: -40, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 100, damping: 22, delay: 0.25 }}
            >
              <Stats stats={stats} updateStats={updateStats} />
            </motion.div>
          )}
          {todosLoading ? <SkeletonTodoCard /> : (
            <motion.div
              initial={{ x: 60, opacity: 0, rotateY: 8 }}
              animate={{ x: 0, opacity: 1, rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.4 }}
              style={{ transformPerspective: 1000 }}
            >
              <TodoList todosHook={todosHook} onTaskComplete={handleTaskComplete} />
            </motion.div>
          )}
        </div>
      </main>

      {/* Shared fixed elements (both modes) */}
      <MusicPlayer />
      <CalendarTodos />
      <AIChat />

      {/* Room-only elements */}
      {mode === 'room' && (
        <>
          <ChatWidget roomId={roomId} />
          <StudyCamera isOpen={cameraOpen} onClose={() => setCameraOpen(false)} roomId={roomId} />
        </>
      )}

      <Toast
        message={toastMsg}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />

      <SessionBanner
        type={bannerType}
        visible={bannerVisible}
        onHide={hideBanner}
      />

      <EndOfDayModal
        stats={stats}
        visible={eodVisible}
        onClose={handleEodClose}
      />

      {/* Decorative hibiscus */}
      <HibiscusSVG />
    </div>
  )
}
