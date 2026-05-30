import { useState, useEffect, useCallback, useRef } from 'react'

const PRESETS = {
  '25/5': { focus: 1500, shortBreak: 300 },
  '50/10': { focus: 3000, shortBreak: 600 },
}

const LONG_BREAK = 1200 // 20 minutes

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

export function useTimer({ onSessionComplete } = {}) {
  const [preset, setPresetState] = useState('25/5')
  const [customFocus, setCustomFocus] = useState(25)
  const [customBreak, setCustomBreak] = useState(5)
  const [mode, setMode] = useState('focus')
  const [isRunning, setIsRunning] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [autoStart, setAutoStart] = useState(false)

  const onSessionCompleteRef = useRef(onSessionComplete)
  useEffect(() => {
    onSessionCompleteRef.current = onSessionComplete
  }, [onSessionComplete])

  // Derive durations from current preset
  const getDurations = useCallback(() => {
    if (preset === 'custom') {
      return {
        focus: customFocus * 60,
        shortBreak: customBreak * 60,
      }
    }
    return PRESETS[preset]
  }, [preset, customFocus, customBreak])

  const getDurationForMode = useCallback((m) => {
    const durations = getDurations()
    if (m === 'focus') return durations.focus
    if (m === 'shortBreak') return durations.shortBreak
    return LONG_BREAK
  }, [getDurations])

  const [timeLeft, setTimeLeft] = useState(() => getDurationForMode('focus'))

  // Tick interval
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  // Handle timeLeft reaching 0
  useEffect(() => {
    if (timeLeft !== 0) return
    if (!isRunning) return

    setIsRunning(false)
    playBell()

    if (mode === 'focus') {
      // Compute focus duration in minutes for the callback
      const durations = getDurations()
      const focusMinutes = Math.round(durations.focus / 60)

      if (onSessionCompleteRef.current) {
        onSessionCompleteRef.current(focusMinutes)
      }

      const newCount = sessionCount + 1
      setSessionCount(newCount)

      // Determine next mode
      if (newCount % 4 === 0) {
        setMode('longBreak')
        setTimeLeft(LONG_BREAK)
      } else {
        setMode('shortBreak')
        setTimeLeft(getDurationForMode('shortBreak'))
      }

      if (autoStart) {
        setIsRunning(true)
      }
    } else {
      // Break ended → back to focus
      setMode('focus')
      setTimeLeft(getDurationForMode('focus'))

      if (autoStart) {
        setIsRunning(true)
      }
    }
  }, [timeLeft, isRunning, mode, sessionCount, autoStart, getDurations, getDurationForMode])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])

  const reset = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(getDurationForMode(mode))
  }, [getDurationForMode, mode])

  const skip = useCallback(() => {
    setIsRunning(false)

    if (mode === 'focus') {
      // Skip focus → go to break (don't count as completed session)
      const nextCount = sessionCount
      if (nextCount % 4 === 0 && nextCount > 0) {
        setMode('longBreak')
        setTimeLeft(LONG_BREAK)
      } else {
        setMode('shortBreak')
        setTimeLeft(getDurationForMode('shortBreak'))
      }
    } else {
      // Skip break → go to focus
      setMode('focus')
      setTimeLeft(getDurationForMode('focus'))
    }
  }, [mode, sessionCount, getDurationForMode])

  const setPreset = useCallback((p) => {
    setPresetState(p)
    setIsRunning(false)
    setMode('focus')
    setSessionCount(0)

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
