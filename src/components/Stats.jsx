import { motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'
import './Stats.css'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDayIndex() {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

function parseWeeklyData(data) {
  if (!data) return [0, 0, 0, 0, 0, 0, 0]
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data
    return Array.isArray(parsed) ? parsed.map(Number) : [0, 0, 0, 0, 0, 0, 0]
  } catch {
    return [0, 0, 0, 0, 0, 0, 0]
  }
}

function formatHours(totalMinutes) {
  const h = Math.floor((totalMinutes || 0) / 60)
  const m = (totalMinutes || 0) % 60
  return `${h}h ${m}m`
}

function MetricCard({ emoji, value, label, children }) {
  return (
    <div className="stats-metric-card card">
      <div className="stats-metric-top">
        <span className="stats-metric-emoji">{emoji}</span>
        <span className="stats-metric-value font-mono">{value}</span>
      </div>
      <span className="stats-metric-label">{label}</span>
      {children}
    </div>
  )
}

function WeeklyChart({ weeklyData }) {
  const data = parseWeeklyData(weeklyData)
  const maxVal = Math.max(...data, 1)
  const todayIndex = getDayIndex()

  return (
    <div className="stats-chart-bars">
      {data.map((val, i) => {
        const heightPct = Math.max((val / maxVal) * 100, 3)
        const isToday = i === todayIndex

        return (
          <div className="stats-chart-col" key={i}>
            <div className="stats-chart-bar-track">
              <motion.div
                className={`stats-chart-bar-fill ${isToday ? 'stats-chart-bar-fill--today' : ''}`}
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
              />
            </div>
            <span className={`stats-chart-day ${isToday ? 'stats-chart-day--today' : ''}`}>
              {DAY_LABELS[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function Stats({ stats, updateStats }) {
  if (!stats) return null

  const totalSessions = stats.total_sessions || 0
  const totalMinutes = stats.total_minutes || 0
  const streakDays = stats.streak_days || 0
  const sessionsToday = stats.sessions_today || 0
  const dailyGoal = stats.daily_goal || 8
  const goalHit = sessionsToday >= dailyGoal

  const handleGoalChange = (delta) => {
    const newGoal = Math.max(1, Math.min(20, dailyGoal + delta))
    if (newGoal !== dailyGoal) {
      updateStats({ daily_goal: newGoal })
    }
  }

  return (
    <div className="stats-section">
      <span className="section-label">YOUR PROGRESS</span>

      {/* Row 1 — Metric cards */}
      <div className="stats-metrics-grid">
        <MetricCard emoji="🍅" value={totalSessions} label="Sessions Total" />
        <MetricCard emoji="⏱" value={formatHours(totalMinutes)} label="Total Hours" />
        <MetricCard emoji="🔥" value={streakDays} label="Day Streak">
          <span className="stats-streak-badge">{streakDays}d streak</span>
        </MetricCard>
        <MetricCard
          emoji="🎯"
          value={`${sessionsToday} / ${dailyGoal}`}
          label="Today"
        >
          {goalHit && <span className="stats-goal-hit">🎉 Goal hit!</span>}
        </MetricCard>
      </div>

      {/* Row 2 — Weekly chart */}
      <div className="stats-chart-card card">
        <span className="section-label">THIS WEEK</span>
        <WeeklyChart weeklyData={stats.weekly_data} />

        {/* Daily goal setter */}
        <div className="stats-goal-setter">
          <span className="stats-goal-label">Daily goal:</span>
          <button
            className="btn-circle stats-goal-btn"
            onClick={() => handleGoalChange(-1)}
            aria-label="Decrease goal"
          >
            <Minus size={14} />
          </button>
          <span className="stats-goal-value font-mono">{dailyGoal}</span>
          <button
            className="btn-circle stats-goal-btn"
            onClick={() => handleGoalChange(1)}
            aria-label="Increase goal"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
