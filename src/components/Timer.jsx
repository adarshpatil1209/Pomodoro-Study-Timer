import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateCcw, SkipForward } from 'lucide-react'
import './Timer.css'

const MODES = [
  { key: 'focus', label: 'Focus' },
  { key: 'shortBreak', label: 'Short Break' },
  { key: 'longBreak', label: 'Long Break' },
]

const PRESETS = [
  { key: '25/5', label: '25 / 5' },
  { key: '50/10', label: '50 / 10' },
  { key: 'custom', label: 'Custom' },
]

function pad(n) {
  return String(n).padStart(2, '0')
}

function RoseSVG() {
  return (
    <motion.svg
      className="timer-rose"
      width="80"
      height="80"
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      animate={{ rotate: [0, 2, -1, 0], y: [0, 4, 0] }}
      transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
    >
      <path
        d="M40 8C40 8 32 18 28 26C24 34 26 40 30 44C34 48 38 46 40 42C42 46 46 48 50 44C54 40 56 34 52 26C48 18 40 8 40 8Z"
        fill="rgba(90,10,20,0.6)"
      />
      <path
        d="M40 42C40 42 36 50 34 56C32 62 34 68 40 72C46 68 48 62 46 56C44 50 40 42 40 42Z"
        fill="rgba(90,10,20,0.6)"
      />
      <path
        d="M30 44C30 44 22 42 18 44C14 46 12 52 16 56C20 58 26 56 28 52C30 48 30 44 30 44Z"
        fill="rgba(90,10,20,0.45)"
      />
      <path
        d="M50 44C50 44 58 42 62 44C66 46 68 52 64 56C60 58 54 56 52 52C50 48 50 44 50 44Z"
        fill="rgba(90,10,20,0.45)"
      />
    </motion.svg>
  )
}

function TomatoIcons({ sessionCount }) {
  const total = 4
  const filled = sessionCount % 4
  return (
    <div className="timer-tomatoes">
      {Array.from({ length: total }, (_, i) => {
        const isFilled = i < filled
        return (
          <motion.span
            key={`${i}-${isFilled}`}
            className={isFilled ? 'tomato-filled' : 'tomato-hollow'}
            initial={isFilled ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={isFilled ? { type: 'spring', stiffness: 400, damping: 25 } : { duration: 0 }}
          >
            🍅
          </motion.span>
        )
      })}
    </div>
  )
}

function CircularRing({ timeLeft, totalDuration, mode, isRunning }) {
  const isBreak = mode === 'shortBreak' || mode === 'longBreak'
  const strokeColor = isBreak ? 'var(--break)' : 'var(--accent)'

  const radius = 110
  const strokeWidth = 6
  const circumference = 2 * Math.PI * radius
  const progress = totalDuration > 0 ? timeLeft / totalDuration : 1
  const offset = circumference * (1 - progress)

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <motion.div
      className="timer-ring-container"
      animate={{ scale: isRunning ? [1, 1.008, 1] : 1 }}
      transition={isRunning ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
    >
      <svg className="timer-ring-svg" viewBox="0 0 240 240">
        {/* Track */}
        <circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx="120"
          cy="120"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          transform="rotate(-90 120 120)"
          style={{ transition: 'stroke 0.3s ease' }}
        />
      </svg>
      <div className="timer-ring-center">
        <span className="timer-digits font-mono">
          {pad(minutes)}:{pad(seconds)}
        </span>
      </div>
    </motion.div>
  )
}

export default function Timer({ timerHook }) {
  const {
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
    totalDuration,
  } = timerHook

  // Keyboard shortcut: Space = start/pause
  useEffect(() => {
    const handler = (e) => {
      if (
        e.code === 'Space' &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        isRunning ? pause() : start()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isRunning, start, pause])

  const isBreak = mode === 'shortBreak' || mode === 'longBreak'

  const getButtonLabel = () => {
    if (isRunning) return 'Pause'
    if (isBreak) return 'Start Break'
    return 'Start Focus'
  }

  return (
    <div className="timer-card card">
      <RoseSVG />

      {/* Mode tabs */}
      <div className="timer-tabs">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`timer-tab ${mode === m.key ? 'timer-tab--active' : ''}`}
            onClick={() => {
              // Only allow manual mode switch when not running
              if (!isRunning) {
                // We'll use skip-like logic or just visual indicator
              }
            }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={mode === m.key ? 'active' : 'inactive'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
              >
                {m.label}
              </motion.span>
            </AnimatePresence>
          </button>
        ))}
      </div>

      {/* SVG Ring */}
      <CircularRing timeLeft={timeLeft} totalDuration={totalDuration} mode={mode} isRunning={isRunning} />

      {/* Session tomato icons */}
      <TomatoIcons sessionCount={sessionCount} />

      {/* Preset chips */}
      <div className="timer-presets">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            className={`timer-preset-chip ${preset === p.key ? 'timer-preset-chip--active' : ''}`}
            onClick={() => setPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom inputs */}
      <AnimatePresence>
        {preset === 'custom' && (
          <motion.div
            className="timer-custom-row"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          >
            <div className="timer-custom-input-group">
              <label className="section-label">Focus</label>
              <input
                type="number"
                className="timer-custom-input font-mono"
                value={customFocus}
                min={1}
                max={120}
                onChange={(e) => setCustom(Number(e.target.value) || 1, customBreak)}
              />
              <span className="timer-custom-unit">min</span>
            </div>
            <div className="timer-custom-input-group">
              <label className="section-label">Break</label>
              <input
                type="number"
                className="timer-custom-input font-mono"
                value={customBreak}
                min={1}
                max={60}
                onChange={(e) => setCustom(customFocus, Number(e.target.value) || 1)}
              />
              <span className="timer-custom-unit">min</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button row */}
      <div className="timer-controls">
        <button className="btn-circle timer-ctrl-btn" onClick={reset} aria-label="Reset">
          <RotateCcw size={18} />
        </button>

        <motion.button
          className="btn-primary timer-main-btn"
          onClick={isRunning ? pause : start}
          animate={!isRunning && timeLeft === totalDuration ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={!isRunning && timeLeft === totalDuration ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.03 }}
        >
          {getButtonLabel()}
        </motion.button>

        <button className="btn-circle timer-ctrl-btn" onClick={skip} aria-label="Skip">
          <SkipForward size={18} />
        </button>
      </div>

      {/* Auto-start toggle */}
      <div className="timer-autostart">
        <span className="timer-autostart-label">Auto-start next</span>
        <button
          className={`timer-toggle ${autoStart ? 'timer-toggle--on' : ''}`}
          onClick={() => setAutoStart(!autoStart)}
          aria-label="Toggle auto-start"
        >
          <motion.div
            className="timer-toggle-thumb"
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="timer-hint">
        <span className="timer-hint-chip">Space to start/pause</span>
      </div>
    </div>
  )
}
