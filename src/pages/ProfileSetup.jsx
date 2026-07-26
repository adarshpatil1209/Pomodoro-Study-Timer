import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'

const EXAM_OPTIONS = ['NEET', 'JEE', 'UPSC', 'CAT', 'BAR', 'Custom']

const ProfileSetup = () => {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState(user?.user_metadata?.full_name || '')
  const [examName, setExamName] = useState('')
  const [customExam, setCustomExam] = useState('')
  const [examDate, setExamDate] = useState('')
  const [dailyGoal, setDailyGoal] = useState(8)
  const [loading, setLoading] = useState(false)

  const selectedExam = examName === 'Custom' ? customExam : examName

  const handleSave = async () => {
    setLoading(true)
    await updateProfile({
      name,
      exam_name: selectedExam,
      exam_date: examDate || null,
      daily_goal: dailyGoal,
    })
    setLoading(false)
    navigate('/')
  }

  return (
    <div style={styles.page}>
      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        {/* Title */}
        <h1 style={styles.title}>Set up your study profile 🎯</h1>

        {/* Display Name */}
        <label style={styles.label}>Display name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          style={styles.input}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(200,184,154,0.50)' }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
        />

        {/* Exam Selector */}
        <label style={styles.label}>What are you studying for?</label>
        <div style={styles.pillContainer}>
          {EXAM_OPTIONS.map((exam) => (
            <motion.button
              key={exam}
              type="button"
              style={{
                ...styles.pill,
                ...(examName === exam ? styles.pillActive : {}),
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setExamName(exam)}
            >
              {exam}
            </motion.button>
          ))}
        </div>

        {examName === 'Custom' && (
          <motion.input
            type="text"
            value={customExam}
            onChange={(e) => setCustomExam(e.target.value)}
            placeholder="Enter your exam name"
            style={{ ...styles.input, marginTop: 8 }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.25 }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(200,184,154,0.50)' }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
          />
        )}

        {/* Exam Date */}
        <label style={styles.label}>When is your exam?</label>
        <input
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          style={styles.input}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(200,184,154,0.50)' }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
        />

        {/* Daily Goal */}
        <label style={styles.label}>Daily session goal</label>
        <div style={styles.goalRow}>
          <motion.button
            type="button"
            style={styles.goalBtn}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setDailyGoal(Math.max(1, dailyGoal - 1))}
          >
            −
          </motion.button>
          <span style={styles.goalValue}>{dailyGoal}</span>
          <motion.button
            type="button"
            style={styles.goalBtn}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setDailyGoal(dailyGoal + 1)}
          >
            +
          </motion.button>
          <span style={styles.goalUnit}>sessions / day</span>
        </div>

        {/* Save */}
        <motion.button
          style={styles.saveBtn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={loading || !selectedExam}
          type="button"
        >
          {loading ? '...' : "Let's go 🚀"}
        </motion.button>
      </motion.div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#3D0408',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    background: '#6B0A14',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.10)',
    padding: 40,
    maxWidth: 400,
    width: '100%',
  },
  title: {
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: 22,
    color: '#F5EFE6',
    margin: '0 0 28px',
    textAlign: 'center',
  },
  label: {
    display: 'block',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    color: '#9A7A6A',
    marginBottom: 8,
    letterSpacing: '0.03em',
  },
  input: {
    width: '100%',
    background: '#7D1020',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: '10px 14px',
    color: '#F5EFE6',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    outline: 'none',
    marginBottom: 20,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  pillContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  pill: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: '7px 16px',
    color: '#C8B89A',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  pillActive: {
    background: 'linear-gradient(135deg, #B03030, #8B1A1A)',
    border: '1px solid rgba(200,184,154,0.30)',
    color: '#F5EFE6',
  },
  goalRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 28,
  },
  goalBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: '#7D1020',
    border: '1px solid rgba(255,255,255,0.14)',
    color: '#F5EFE6',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  goalValue: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 22,
    fontWeight: 700,
    color: '#F5EFE6',
    minWidth: 28,
    textAlign: 'center',
  },
  goalUnit: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: '#9A7A6A',
  },
  saveBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #B03030, #8B1A1A)',
    color: '#F5EFE6',
    border: 'none',
    borderRadius: 14,
    padding: '14px 0',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 15,
    cursor: 'pointer',
  },
}

export default ProfileSetup
