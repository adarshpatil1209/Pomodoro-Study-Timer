import { useState, useEffect, useCallback, useRef } from 'react'
import { useTimer } from './hooks/useTimer'
import { useStats } from './hooks/useStats'
import { useTodos } from './hooks/useTodos'
import Timer from './components/Timer'
import Stats from './components/Stats'
import TodoList from './components/TodoList'
import MusicPlayer from './components/MusicPlayer'
import Toast from './components/Toast'
import SessionBanner, { useSessionBanner } from './components/SessionBanner'
import EndOfDayModal from './components/EndOfDayModal'
import { fireGoalConfetti } from './utils/confetti'
import './App.css'

function HibiscusSVG() {
  return (
    <svg
      className="app-hibiscus"
      width="100"
      height="100"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 20C50 20 40 8 30 12C20 16 22 28 30 34C24 30 12 26 10 36C8 46 20 48 30 44C20 48 14 58 22 64C30 70 38 60 40 52C38 62 40 76 50 76C60 76 62 62 60 52C62 60 70 70 78 64C86 58 80 48 70 44C80 48 92 46 90 36C88 26 76 30 70 34C78 28 80 16 70 12C60 8 50 20 50 20Z"
        fill="rgba(90,10,20,0.6)"
      />
      <circle cx="50" cy="44" r="8" fill="rgba(90,10,20,0.45)" />
    </svg>
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

export default function App() {
  // --- Hooks ---
  const { stats, loading, updateStats, addSession } = useStats()

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
    setToastMsg("Proud of you baby, let's gooo!! 🎉")
    setToastVisible(true)
  }, [])

  const todosHook = useTodos({
    onComplete: handleTaskComplete,
  })

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

  const displayName = stats?.display_name || 'love'
  const streakDays = stats?.streak_days || 0

  if (loading) {
    return (
      <div className="app-loading">
        <span className="app-loading-text font-display">Loading your study space...</span>
      </div>
    )
  }

  return (
    <div className="app-root page-pad">
      {/* Header */}
      <header className="app-header">
        <div className="app-header-left">
          <span className="app-logo font-display">Pomo</span>
          <span className="app-logo-icon">🩺</span>
        </div>

        <div className="app-header-center">
          <h1 className="app-greeting font-display">
            Hey{' '}
            <EditableName name={displayName} onSave={handleNameSave} />
            , time to grind! 💪
          </h1>
        </div>

        <div className="app-header-right">
          <span className="app-streak-badge">🔥 {streakDays} days</span>
        </div>
      </header>

      {/* Main grid */}
      <main className="app-grid">
        <div className="app-col-left">
          <Timer timerHook={timerHook} />
        </div>
        <div className="app-col-right">
          <Stats stats={stats} updateStats={updateStats} />
          <TodoList todosHook={todosHook} onTaskComplete={handleTaskComplete} />
        </div>
      </main>

      {/* Fixed elements */}
      <MusicPlayer />

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
