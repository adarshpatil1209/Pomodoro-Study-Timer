import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fireGoalConfetti } from '../utils/confetti'
import './EndOfDayModal.css'

const QUOTES = [
  'Every page you read today is a life you\'ll save tomorrow.',
  'Future doctors don\'t quit. They rest and come back stronger.',
  'The patient who needs you is counting on the student you are today.',
  'You\'re building knowledge that matters. Proud of you. 🩺',
  'Small sessions, big futures. Keep going.',
]

function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}

function formatHours(totalMinutes) {
  const h = Math.floor((totalMinutes || 0) / 60)
  const m = (totalMinutes || 0) % 60
  return `${h}h ${m}m`
}

export default function EndOfDayModal({ stats, visible, onClose }) {
  const hasFiredConfetti = useRef(false)

  const sessionsToday = stats?.sessions_today || 0
  const dailyGoal = stats?.daily_goal || 8
  const goalHit = sessionsToday >= dailyGoal
  const totalMinutes = stats?.total_minutes || 0
  const streakDays = stats?.streak_days || 0
  const name = stats?.display_name || 'love'

  // Fire confetti on open if goal was hit
  useEffect(() => {
    if (visible && goalHit && !hasFiredConfetti.current) {
      hasFiredConfetti.current = true
      // Small delay so modal is visible first
      const timer = setTimeout(() => fireGoalConfetti(), 400)
      return () => clearTimeout(timer)
    }
    if (!visible) {
      hasFiredConfetti.current = false
    }
  }, [visible, goalHit])

  const quote = useRef(getRandomQuote())
  useEffect(() => {
    if (visible) {
      quote.current = getRandomQuote()
    }
  }, [visible])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="eod-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="eod-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Heading */}
            <h2 className="eod-heading font-display">
<<<<<<< HEAD
              Today was beautiful, {name} 🌸
=======
              Today was beautiful, {name} 
>>>>>>> 034adc0 (new)
            </h2>

            {/* Stats summary */}
            <div className="eod-stats">
              <div className="eod-stat-row">
                <span className="eod-stat-emoji"></span>
                <span className="eod-stat-text">
                  <strong className="font-mono">{sessionsToday}</strong> sessions completed
                </span>
              </div>
              <div className="eod-stat-row">
                <span className="eod-stat-emoji"></span>
                <span className="eod-stat-text">
                  <strong className="font-mono">{formatHours(totalMinutes)}</strong> studied
                </span>
              </div>
              <div className="eod-stat-row">
                <span className="eod-stat-emoji"></span>
                <span className="eod-stat-text">
                  <strong className="font-mono">{streakDays}</strong> day streak
                </span>
              </div>
              {goalHit && (
                <div className="eod-stat-row eod-stat-row--goal">
                  <span className="eod-stat-emoji"></span>
                  <span className="eod-stat-text eod-goal-text">Daily goal crushed!</span>
                </div>
              )}
            </div>

            {/* Motivational quote */}
            <p className="eod-quote font-display">{quote.current}</p>

            {/* Close button */}
            <button className="btn-primary eod-close-btn" onClick={onClose}>
<<<<<<< HEAD
              Wrap up for today 🌙
=======
              Wrap up for today 
>>>>>>> 034adc0 (new)
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
