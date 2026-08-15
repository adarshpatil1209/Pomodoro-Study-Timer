import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings as SettingsIcon, ArrowLeft, Check, AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const EXAM_OPTIONS = ['NEET', 'JEE', 'UPSC', 'CAT', 'BAR', 'Custom']
const PRESET_OPTIONS = ['25/5', '50/10', 'custom']

const Settings = () => {
  const navigate = useNavigate()
  const { user, profile, updateProfile, signOut } = useAuth()

  // Profile Section State
  const [name, setName] = useState('')
  const [examName, setExamName] = useState('')
  const [customExam, setCustomExam] = useState('')
  const [examDate, setExamDate] = useState('')

  // Study Preferences State
  const [dailyGoal, setDailyGoal] = useState(8)
  const [defaultPreset, setDefaultPreset] = useState('25/5')
  const [autoStart, setAutoStart] = useState(false)
  const [bellSound, setBellSound] = useState(true)

  // Status & Feedback
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [prefsSuccess, setPrefsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Delete Account Confirmation Modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  // Sync profile data into state on load
  useEffect(() => {
    if (profile) {
      setName(profile.name || '')
      
      const isStandardExam = EXAM_OPTIONS.includes(profile.exam_name)
      if (profile.exam_name) {
        if (isStandardExam && profile.exam_name !== 'Custom') {
          setExamName(profile.exam_name)
          setCustomExam('')
        } else {
          setExamName('Custom')
          setCustomExam(profile.exam_name)
        }
      }

      setExamDate(profile.exam_date ? String(profile.exam_date).split('T')[0] : '')
      setDailyGoal(profile.daily_goal ?? 8)
      setDefaultPreset(profile.default_preset || '25/5')
      setAutoStart(profile.auto_start ?? false)
      setBellSound(profile.bell_sound ?? true)
    }
  }, [profile])

  const selectedExamValue = examName === 'Custom' ? customExam : examName

  // Handle Profile Save
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setErrorMsg('')
    setProfileSuccess(false)

    const { error } = await updateProfile({
      name: name.trim(),
      exam_name: selectedExamValue.trim() || null,
      exam_date: examDate || null,
    })

    setSavingProfile(false)
    if (error) {
      setErrorMsg('Failed to update profile: ' + error.message)
    } else {
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    }
  }

  // Handle Study Preferences Save
  const handleSavePreferences = async () => {
    setSavingPrefs(true)
    setErrorMsg('')
    setPrefsSuccess(false)

    const { error } = await updateProfile({
      daily_goal: dailyGoal,
      default_preset: defaultPreset,
      auto_start: autoStart,
      bell_sound: bellSound,
    })

    setSavingPrefs(false)
    if (error) {
      setErrorMsg('Failed to update preferences: ' + error.message)
    } else {
      setPrefsSuccess(true)
      setTimeout(() => setPrefsSuccess(false), 3000)
    }
  }

  // Handle Account Deletion
  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      // Clean up profile & user data from supabase
      if (user?.id) {
        await supabase.from('profiles').delete().eq('id', user.id)
        await supabase.from('user_stats').delete().eq('user_id', user.id)
        await supabase.from('todos').delete().eq('user_id', user.id)
        await supabase.from('dated_todos').delete().eq('user_id', user.id)
      }
      await signOut()
      navigate('/auth')
    } catch (err) {
      console.error('Delete account error:', err)
      setErrorMsg('Error deleting account')
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.headerRow}>
          <motion.button
            style={styles.backBtn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            type="button"
          >
            <ArrowLeft size={18} />
          </motion.button>
          <h1 style={styles.headerTitle}>
            <SettingsIcon size={20} style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Settings
          </h1>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <motion.div
            style={styles.errorBanner}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errorMsg}
          </motion.div>
        )}

        {/* SECTION 1: PROFILE */}
        <motion.div
          style={styles.card}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h2 style={styles.cardTitle}>1. Profile</h2>

          {/* Edit Name */}
          <label style={styles.label}>Display Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={styles.input}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(200,184,154,0.50)' }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
          />

          {/* Edit Exam Name */}
          <label style={styles.label}>Target Exam</label>
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
            <input
              type="text"
              value={customExam}
              onChange={(e) => setCustomExam(e.target.value)}
              placeholder="Enter custom exam name"
              style={{ ...styles.input, marginTop: -8 }}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(200,184,154,0.50)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
            />
          )}

          {/* Edit Exam Date */}
          <label style={styles.label}>Exam Date (optional)</label>
          <input
            type="date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            style={styles.input}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(200,184,154,0.50)' }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
          />

          {/* Save Profile Button */}
          <div style={styles.saveRow}>
            <motion.button
              style={styles.saveBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveProfile}
              disabled={savingProfile}
              type="button"
            >
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </motion.button>

            {profileSuccess && (
              <motion.span
                style={styles.successBadge}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Check size={14} style={{ marginRight: 4 }} /> Saved!
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* SECTION 2: STUDY PREFERENCES */}
        <motion.div
          style={styles.card}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h2 style={styles.cardTitle}>2. Study Preferences</h2>

          {/* Daily Goal */}
          <label style={styles.label}>Daily Session Goal (1 - 20)</label>
          <div style={styles.goalRow}>
            <motion.button
              type="button"
              style={styles.stepperBtn}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDailyGoal(Math.max(1, dailyGoal - 1))}
            >
              −
            </motion.button>
            <span style={styles.goalValue}>{dailyGoal}</span>
            <motion.button
              type="button"
              style={styles.stepperBtn}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setDailyGoal(Math.min(20, dailyGoal + 1))}
            >
              +
            </motion.button>
            <span style={styles.goalUnit}>sessions / day</span>
          </div>

          {/* Default Preset */}
          <label style={styles.label}>Default Timer Preset</label>
          <div style={styles.pillContainer}>
            {PRESET_OPTIONS.map((presetOption) => (
              <motion.button
                key={presetOption}
                type="button"
                style={{
                  ...styles.pill,
                  ...(defaultPreset === presetOption ? styles.pillActive : {}),
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDefaultPreset(presetOption)}
              >
                {presetOption}
              </motion.button>
            ))}
          </div>

          {/* Toggles */}
          <div style={styles.toggleRow}>
            <div>
              <span style={styles.toggleLabel}>Auto-start Breaks & Focus</span>
              <p style={styles.toggleSub}>Automatically continue timer when a session ends</p>
            </div>
            <motion.button
              type="button"
              style={{
                ...styles.switch,
                background: autoStart ? 'linear-gradient(135deg, #B03030, #8B1A1A)' : 'rgba(255,255,255,0.12)',
              }}
              onClick={() => setAutoStart(!autoStart)}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                style={styles.switchHandle}
                animate={{ x: autoStart ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>

          <div style={styles.toggleRow}>
            <div>
              <span style={styles.toggleLabel}>Bell Sound</span>
              <p style={styles.toggleSub}>Play audio chime when session finishes</p>
            </div>
            <motion.button
              type="button"
              style={{
                ...styles.switch,
                background: bellSound ? 'linear-gradient(135deg, #B03030, #8B1A1A)' : 'rgba(255,255,255,0.12)',
              }}
              onClick={() => setBellSound(!bellSound)}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                style={styles.switchHandle}
                animate={{ x: bellSound ? 20 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>

          {/* Save Preferences Button */}
          <div style={styles.saveRow}>
            <motion.button
              style={styles.saveBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSavePreferences}
              disabled={savingPrefs}
              type="button"
            >
              {savingPrefs ? 'Saving...' : 'Save Preferences'}
            </motion.button>

            {prefsSuccess && (
              <motion.span
                style={styles.successBadge}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Check size={14} style={{ marginRight: 4 }} /> Saved!
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* SECTION 3: ACCOUNT */}
        <motion.div
          style={styles.card}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h2 style={styles.cardTitle}>3. Account</h2>

          {/* Email Display */}
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            value={user?.email || ''}
            disabled
            style={styles.disabledInput}
          />

          {/* Sign Out */}
          <div style={{ marginTop: 24 }}>
            <motion.button
              style={styles.signOutBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                await signOut()
                navigate('/auth')
              }}
              type="button"
            >
              Sign Out
            </motion.button>
          </div>

          {/* Delete Account */}
          <div style={styles.deleteWrapper}>
            <button
              type="button"
              style={styles.deleteLink}
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete account
            </button>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            style={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={styles.modalCard}
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <AlertTriangle size={36} color="#B03030" style={{ marginBottom: 8 }} />
                <h3 style={styles.modalTitle}>Delete Account?</h3>
                <p style={styles.modalSub}>
                  This action cannot be undone. All your stats, tasks, and settings will be permanently removed.
                </p>
              </div>

              <div style={styles.modalBtnRow}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deletingAccount}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  style={styles.confirmDeleteBtn}
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                >
                  {deletingAccount ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#3D0408',
    padding: '24px 16px 40px',
    boxSizing: 'border-box',
  },
  container: {
    maxWidth: 520,
    margin: '0 auto',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  backBtn: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#F5EFE6',
    cursor: 'pointer',
  },
  headerTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 700,
    fontSize: 24,
    color: '#F5EFE6',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
  },
  errorBanner: {
    background: 'rgba(176,48,48,0.25)',
    border: '1px solid rgba(176,48,48,0.50)',
    borderRadius: 12,
    padding: '12px 16px',
    color: '#F5EFE6',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    marginBottom: 20,
  },
  card: {
    background: '#6B0A14',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.10)',
    padding: 28,
    marginBottom: 20,
  },
  cardTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 600,
    fontSize: 20,
    color: '#F5EFE6',
    margin: '0 0 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: 10,
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
    marginBottom: 18,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  disabledInput: {
    width: '100%',
    background: 'rgba(0,0,0,0.20)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '10px 14px',
    color: '#9A7A6A',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box',
    cursor: 'not-allowed',
  },
  pillContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  pill: {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 20,
    padding: '6px 14px',
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
    gap: 12,
    marginBottom: 18,
  },
  stepperBtn: {
    width: 34,
    height: 34,
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
  },
  goalValue: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 20,
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
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: '8px 0',
  },
  toggleLabel: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    color: '#F5EFE6',
    display: 'block',
  },
  toggleSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: '#9A7A6A',
    margin: '2px 0 0',
  },
  switch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  switchHandle: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#F5EFE6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  saveRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  saveBtn: {
    background: 'linear-gradient(135deg, #B03030, #8B1A1A)',
    color: '#F5EFE6',
    border: 'none',
    borderRadius: 12,
    padding: '10px 20px',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  successBadge: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: '#4CAF50',
    display: 'flex',
    alignItems: 'center',
  },
  signOutBtn: {
    width: '100%',
    background: 'rgba(176,48,48,0.85)',
    color: '#F5EFE6',
    border: 'none',
    borderRadius: 12,
    padding: '12px 0',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  deleteWrapper: {
    textAlign: 'center',
    marginTop: 16,
  },
  deleteLink: {
    background: 'none',
    border: 'none',
    color: '#9A7A6A',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(20,2,4,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1000,
  },
  modalCard: {
    background: '#6B0A14',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.12)',
    padding: 28,
    maxWidth: 360,
    width: '100%',
  },
  modalTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 700,
    fontSize: 22,
    color: '#F5EFE6',
    margin: '0 0 8px',
  },
  modalSub: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: '#C8B89A',
    lineHeight: 1.5,
    margin: 0,
  },
  modalBtnRow: {
    display: 'flex',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: '10px 0',
    color: '#F5EFE6',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    cursor: 'pointer',
  },
  confirmDeleteBtn: {
    flex: 1,
    background: '#B03030',
    border: 'none',
    borderRadius: 12,
    padding: '10px 0',
    color: '#F5EFE6',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
}

export default Settings
