import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'

const PRESETS = {
  '25/5':  { focus: 1500, shortBreak: 300 },
  '50/10': { focus: 3000, shortBreak: 600 },
}

const LONG_BREAK   = 1200  // 20 minutes

function playSineFallback() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(830, ctx.currentTime)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 1.2)
  } catch (e) {
    console.warn('Could not play fallback bell sound:', e)
  }
}

function playBell() {
  const audio = new Audio('/bell.mp3')
  audio.volume = 0.5
  audio.play().catch(() => {
    // bell.mp3 not found or blocked — fall back to sine wave
    playSineFallback()
  })
}

function saveState(state, storageKey) {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ ...state, savedAt: Date.now() }))
  } catch { /* storage full or unavailable — silently ignore */ }
}

function clearState(storageKey) {
  try { localStorage.removeItem(storageKey) } catch { /* ignore */ }
}

export function useTimer({ onSessionComplete } = {}) {
  const { user } = useAuth()
  const STORAGE_KEY = user?.id ? 'pomo-timer-' + user.id : 'pomo-timer'
  const [preset,       setPresetState]  = useState('25/5')
  const [customFocus,  setCustomFocus]  = useState(25)
  const [customBreak,  setCustomBreak]  = useState(5)
  const [mode,         setMode]         = useState('focus')
  const [isRunning,    setIsRunning]    = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [autoStart,    setAutoStart]    = useState(false)

  const onSessionCompleteRef = useRef(onSessionComplete)
  useEffect(() => {
    onSessionCompleteRef.current = onSessionComplete
  }, [onSessionComplete])

  // ── Derive durations from current preset ─────────────────────────────────
  const getDurations = useCallback(() => {
    if (preset === 'custom') {
      return { focus: customFocus * 60, shortBreak: customBreak * 60 }
    }
    return PRESETS[preset]
  }, [preset, customFocus, customBreak])

  const getDurationForMode = useCallback((m) => {
    const durations = getDurations()
    if (m === 'focus')      return durations.focus
    if (m === 'shortBreak') return durations.shortBreak
    return LONG_BREAK
  }, [getDurations])

  const [timeLeft, setTimeLeft] = useState(() => getDurationForMode('focus'))

  // ── RESTORE FROM LOCALSTORAGE ON MOUNT ──────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      const now    = Date.now()

      if (parsed.isRunning && parsed.savedAt) {
        // Timer was running when they left — calculate elapsed time
        const elapsed   = Math.floor((now - parsed.savedAt) / 1000)
        const remaining = parsed.timeLeft - elapsed

        if (remaining > 0) {
          setTimeLeft(remaining)
          setMode(parsed.mode        || 'focus')
          setSessionCount(parsed.sessionCount ?? 0)
          if (parsed.preset) setPresetState(parsed.preset)
          setIsRunning(true)   // auto-resume
        } else {
          // Session finished while away — clear and start fresh
          clearState(STORAGE_KEY)
        }
      } else {
        // Timer was paused — restore paused state exactly
        setTimeLeft(parsed.timeLeft)
        setMode(parsed.mode          || 'focus')
        setSessionCount(parsed.sessionCount ?? 0)
        if (parsed.preset) setPresetState(parsed.preset)
        setIsRunning(false)
      }
    } catch {
      clearState(STORAGE_KEY)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── TICK INTERVAL — saves to localStorage every second ───────────────────
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1

        // Persist on every tick so refresh always has current time
        saveState({ timeLeft: next, mode, sessionCount, preset, isRunning: true }, STORAGE_KEY)

        if (next <= 0) {
          clearInterval(interval)
          return 0
        }
        return next
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, mode, sessionCount, preset])

  // ── HANDLE timeLeft REACHING 0 ───────────────────────────────────────────
  useEffect(() => {
    if (timeLeft !== 0) return
    if (!isRunning)     return

    setIsRunning(false)
    clearState(STORAGE_KEY)   // clear saved state on session complete
    playBell()

    if (mode === 'focus') {
      const durations     = getDurations()
      const focusMinutes  = Math.round(durations.focus / 60)

      if (onSessionCompleteRef.current) {
        onSessionCompleteRef.current(focusMinutes)
      }

      const newCount = sessionCount + 1
      setSessionCount(newCount)

      if (newCount % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(LONG_BREAK)
      } else {
        setMode('shortBreak')
        setTimeLeft(getDurationForMode('shortBreak'))
      }

      if (autoStart) setIsRunning(true)
    } else {
      // Break ended → back to focus
      setMode('focus')
      setTimeLeft(getDurationForMode('focus'))
      if (autoStart) setIsRunning(true)
    }
  }, [timeLeft, isRunning, mode, sessionCount, autoStart, getDurations, getDurationForMode])

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  const start = useCallback(() => setIsRunning(true), [])

  const pause = useCallback(() => {
    setIsRunning(false)
    // Capture current timeLeft via functional update to avoid stale closure
    setTimeLeft((tl) => {
      saveState({ timeLeft: tl, mode, sessionCount, preset, isRunning: false }, STORAGE_KEY)
      return tl
    })
  }, [mode, sessionCount, preset])

  const reset = useCallback(() => {
    clearState(STORAGE_KEY)
    setIsRunning(false)
    setTimeLeft(getDurationForMode(mode))
  }, [getDurationForMode, mode])

  const skip = useCallback(() => {
    setIsRunning(false)
    clearState(STORAGE_KEY)

    if (mode === 'focus') {
      const nextCount = sessionCount
      if (nextCount % 4 === 0 && nextCount > 0) {
        setMode('longBreak')
        setTimeLeft(LONG_BREAK)
      } else {
        setMode('shortBreak')
        setTimeLeft(getDurationForMode('shortBreak'))
      }
    } else {
      setMode('focus')
      setTimeLeft(getDurationForMode('focus'))
    }
  }, [mode, sessionCount, getDurationForMode])

  const setPreset = useCallback((p) => {
    setPresetState(p)
    setIsRunning(false)
    setMode('focus')
    setSessionCount(0)
    clearState(STORAGE_KEY)

    if (p === 'custom') {
      setTimeLeft(customFocus * 60)
    } else {
      setTimeLeft(PRESETS[p].focus)
    }
  }, [customFocus])

  const setCustom = useCallback((focusMin, breakMin) => {
    setCustomFocus(focusMin)
    setCustomBreak(breakMin)
    if (preset === 'custom') {
      setIsRunning(false)
      setMode('focus')
      setTimeLeft(focusMin * 60)
      clearState(STORAGE_KEY)
    }
  }, [preset])

  return {
    mode,
    timeLeft,
    isRunning,
    sessionCount,
    preset,
    customFocus,
    customBreak,
    autoStart,
    start,
    pause,
    reset,
    skip,
    setPreset,
    setAutoStart,
    setCustom,
    totalDuration: getDurationForMode(mode),
  }
}
