import { motion } from 'framer-motion'
import './Stats.css'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDayIndex() {
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

const parseWeekly = (raw) => {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) }
    catch { return [0,0,0,0,0,0,0] }
  }
  if (raw && typeof raw === 'object') {
    return Object.values(raw)
  }
  return [0,0,0,0,0,0,0]
}

function formatHours(totalMinutes) {
  const totalMins = totalMinutes || 0
  const hours = Math.floor(totalMins / 60)
  const mins = totalMins % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
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

function WeeklyChart({ weeklyData: rawWeekly }) {
  const weeklyData = parseWeekly(rawWeekly)
  const maxVal = Math.max(...weeklyData, 1)
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  return (
    <div className="stats-chart-bars">
      {weeklyData.map((val, i) => {
        const heightPct = Math.max((val / maxVal) * 100, 4)
        const isToday = i === todayIndex

        return (
          <div className="stats-chart-col" key={i}>
            <div className="stats-chart-bar-track" style={{ overflow: 'visible' }}>
              {val > 0 && (
                <span style={{ fontFamily: '"DM Mono", monospace', fontWeight: 300, fontSize: '10px', color: '#9A7A6A', marginBottom: '4px' }}>
                  {val}
                </span>
              )}
              <motion.div
                className={`stats-chart-bar-fill ${isToday ? 'stats-chart-bar-fill--today' : ''}`}
                style={{ backgroundColor: isToday ? '#EDE0D4' : '#C8B89A' }}
                initial={{ height: 0 }}
                animate={{ height: `${heightPct}%` }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: i * 0.04 }}
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

  const neetDate = new Date('2026-06-21')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  neetDate.setHours(0, 0, 0, 0)
  const daysLeft = Math.ceil((neetDate - today) / (1000 * 60 * 60 * 24))

  return (
    <div className="stats-section">
      <span className="section-label">YOUR PROGRESS</span>

      {/* Row 1 — Metric cards */}
      <div className="stats-metrics-grid">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22, delay: 0.3 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <MetricCard emoji="" value={stats?.total_sessions || 0} label="Sessions Total" />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22, delay: 0.38 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <MetricCard emoji="" value={formatHours(stats?.total_minutes || 0)} label="Total Hours" />
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22, delay: 0.46 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <MetricCard emoji="" value={stats?.streak_days || 0} label="Day Streak">
            {stats?.streak_days > 0 && <span className="stats-streak-badge">{stats?.streak_days}d streak</span>}
          </MetricCard>
        </motion.div>
      </div>

      {/* Row 2 — NEET countdown */}
      <motion.div
        className="stats-metric-card card"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 100, damping: 22, delay: 0.54 }}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        style={{ padding: '24px', gridColumn: '1 / -1', marginBottom: '16px' }}
      >
        <span className="font-mono" style={{ 
          fontSize: '28px', 
          fontWeight: 300, 
          color: daysLeft > 30 ? '#F5EFE6' : daysLeft > 10 ? '#D4893A' : '#B03030'
        }}>
<<<<<<< HEAD
          {daysLeft <= 0 ? 'NEET Day! 🩺🎉' : daysLeft}
        </span>
        {daysLeft > 0 && <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#9A7A6A', marginTop: '4px' }}>days to NEET 🩺</span>}
=======
          {daysLeft <= 0 ? 'Goal day! ' : daysLeft}
        </span>
        {daysLeft > 0 && <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: '#9A7A6A', marginTop: '4px' }}>{`days to ${stats?.exam_name || 'Goal'} `}</span>}
>>>>>>> 034adc0 (new)
      </motion.div>

      {/* Row 2 — Weekly chart */}
      <div className="stats-chart-card card">
        <span className="section-label">THIS WEEK</span>
        <WeeklyChart weeklyData={stats.weekly_data} />

      </div>
    </div>
  )
}
