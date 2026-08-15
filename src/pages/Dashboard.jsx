import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import useRoom from '../hooks/useRoom'

const Dashboard = () => {
  const navigate = useNavigate()
  const [roomCode, setRoomCode] = useState('')
  const [copied, setCopied] = useState(false)
  const { room, createRoom, joinRoom, roomLoading, error } = useRoom()
  const { profile, signOut } = useAuth()

  const handleCreateRoom = async () => {
    await createRoom()
  }

  const handleJoinRoom = async () => {
    if (roomCode.length !== 6) return
    await joinRoom(roomCode)
  }

  const handleCopyCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }

  const daysToExam = profile?.exam_date
    ? Math.ceil((new Date(profile.exam_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null

  useEffect(() => {
    if (room && room.status === 'active') {
      navigate(`/room/${room.id}`)
    }
  }, [room, navigate])

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.logo}>PomoXP ✨</h1>
          <div style={styles.headerRight}>
            <span style={styles.profileName}>{profile?.name}</span>
            <motion.button
              style={styles.signOutBtn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSignOut}
              type="button"
            >
              Sign out
            </motion.button>
          </div>
        </div>

        {/* Greeting */}
        <h2 style={styles.greeting}>
          Hey {profile?.name} 👋
        </h2>

        {/* Two Cards */}
        <div style={styles.cardGrid}>
          {/* Solo Study Card */}
          <motion.div
            style={styles.card}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <span style={styles.cardIcon}>🎯</span>
            <h3 style={styles.cardTitle}>Solo Study</h3>
            <p style={styles.cardDesc}>
              Focus on your own. Timer, todos, stats and AI assistant.
            </p>
            <motion.button
              style={styles.primaryBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/study')}
              type="button"
            >
              Start Solo
            </motion.button>
          </motion.div>

          {/* Study Room Card */}
          <motion.div
            style={styles.card}
            whileHover={{ y: -4 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <span style={styles.cardIcon}>👥</span>
            <h3 style={styles.cardTitle}>Study Room</h3>
            <p style={styles.cardDesc}>
              Study with a partner. Chat, snaps, and shared sessions.
            </p>

            {room ? (
              <div style={styles.codeDisplay}>
                <div style={styles.codeRow}>
                  <span style={styles.codeText}>{room.room_code}</span>
                  <motion.button
                    style={styles.copyBtn}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCopyCode}
                    type="button"
                  >
                    {copied ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8B89A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8B89A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </motion.button>
                </div>
                <p style={styles.codeHint}>Share this code with your partner</p>
              </div>
            ) : (
              <div style={styles.roomOptions}>
                <motion.button
                  style={styles.primaryBtn}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCreateRoom}
                  disabled={roomLoading}
                  type="button"
                >
                  {roomLoading ? '...' : 'Create Room'}
                </motion.button>

                <div style={styles.miniDivider}>
                  <div style={styles.miniDividerLine} />
                  <span style={styles.miniDividerText}>or</span>
                  <div style={styles.miniDividerLine} />
                </div>

                <div style={styles.joinRow}>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                    placeholder="Enter room code"
                    maxLength={6}
                    style={styles.codeInput}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(200,184,154,0.50)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
                  />
                  <motion.button
                    style={{
                      ...styles.primaryBtn,
                      width: 'auto',
                      padding: '10px 20px',
                      opacity: roomCode.length === 6 ? 1 : 0.5,
                    }}
                    whileHover={roomCode.length === 6 ? { scale: 1.02 } : {}}
                    whileTap={roomCode.length === 6 ? { scale: 0.97 } : {}}
                    onClick={handleJoinRoom}
                    disabled={roomCode.length !== 6 || roomLoading}
                    type="button"
                  >
                    Join
                  </motion.button>
                </div>
              </div>
            )}

            {error && <p style={styles.error}>{error}</p>}
          </motion.div>
        </div>

        {daysToExam !== null && daysToExam > 0 && (
          <motion.div
            style={styles.examPill}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {daysToExam} days to {profile.exam_name} ✨
          </motion.div>
        )}
      </div>
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
  container: {
    maxWidth: 500,
    width: '100%',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    color: '#F5EFE6',
    fontSize: 18,
    margin: 0,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  profileName: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    color: '#C8B89A',
    fontWeight: 500,
  },
  signOutBtn: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 999,
    padding: '5px 12px',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: '#9A7A6A',
    cursor: 'pointer',
  },
  greeting: {
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: 'italic',
    fontWeight: 400,
    fontSize: 26,
    color: '#F5EFE6',
    textAlign: 'center',
    margin: '24px 0 36px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },
  card: {
    background: '#6B0A14',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.10)',
    padding: 28,
    textAlign: 'center',
  },
  cardIcon: {
    fontSize: 40,
    display: 'block',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 600,
    fontSize: 20,
    color: '#F5EFE6',
    margin: '0 0 8px',
  },
  cardDesc: {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 300,
    fontSize: 13,
    color: '#9A7A6A',
    lineHeight: 1.5,
    margin: '0 0 20px',
  },
  primaryBtn: {
    width: '100%',
    background: '#B03030',
    color: '#F5EFE6',
    border: 'none',
    borderRadius: 14,
    padding: '12px 0',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 13,
    cursor: 'pointer',
  },
  roomOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  miniDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '14px 0',
  },
  miniDividerLine: {
    flex: 1,
    height: 1,
    background: 'rgba(255,255,255,0.08)',
  },
  miniDividerText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: '#9A7A6A',
  },
  joinRow: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    background: '#7D1020',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: '10px 12px',
    color: '#F5EFE6',
    fontFamily: "'DM Mono', monospace",
    fontWeight: 300,
    fontSize: 18,
    letterSpacing: '0.2em',
    outline: 'none',
    textTransform: 'uppercase',
    textAlign: 'center',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    minWidth: 0,
  },
  codeDisplay: {
    marginTop: 4,
  },
  codeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  codeText: {
    fontFamily: "'DM Mono', monospace",
    fontWeight: 300,
    fontSize: 36,
    letterSpacing: '0.3em',
    color: '#C8B89A',
  },
  copyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
  },
  codeHint: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: '#9A7A6A',
    margin: '8px 0 0',
  },
  error: {
    color: '#B03030',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    margin: '12px 0 0',
    textAlign: 'center',
  },
  examPill: {
    display: 'inline-flex',
    background: 'rgba(212,137,58,0.15)',
    color: '#D4893A',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    padding: '8px 20px',
    borderRadius: 20,
    textAlign: 'center',
    margin: '32px auto 0',
    width: 'fit-content',
    justifyContent: 'center',
    alignItems: 'center',
  },
}

export default Dashboard
