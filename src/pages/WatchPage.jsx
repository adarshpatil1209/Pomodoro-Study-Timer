import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebRTC } from '../hooks/useWebRTC'
import './WatchPage.css'

const WATCH_PASSWORD = import.meta.env.VITE_WATCH_PASSWORD || ''

export default function WatchPage() {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const [authed, setAuthed]   = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)

  // ── Camera prompt UI ─────────────────────────────────────────────────────
  const [showPrompt, setShowPrompt] = useState(false)

  // ── Chat ─────────────────────────────────────────────────────────────────
  const [messages, setMessages]   = useState([])
  const [chatInput, setChatInput] = useState('')
  const messagesEndRef = useRef(null)

  // ── Video refs ────────────────────────────────────────────────────────────
  const localVideoRef  = useRef(null)
  const remoteVideoRef = useRef(null)

  // ── Incoming chat handler ─────────────────────────────────────────────────
  const handleChat = useCallback((payload) => {
    setMessages((prev) => [...prev, { ...payload, self: false }])
  }, [])

  // ── WebRTC (viewer side: initiator = false) ────────────────────────────
  const {
    localStream,
    remoteStream,
    cameraStatus,
    getCameraPermission,
    startPeer,
    sendChat,
  } = useWebRTC({
    enabled:     authed,
    isInitiator: false,
    presenceKey: 'viewer',
    onChat:      handleChat,
  })

  // ── Wire video elements ───────────────────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
      localVideoRef.current.play().catch(() => {})
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log('[WatchPage] Got remote stream', remoteStream)
      remoteVideoRef.current.srcObject = remoteStream
      remoteVideoRef.current.play().catch((e) => console.log('[WatchPage] remote play err', e))
    }
  }, [remoteStream])

  // ── Auto-scroll messages ──────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Start peer once we have a local stream (viewer is non-initiator) ───────
  // Delay slightly so the Supabase channel can finish subscribing first
  useEffect(() => {
    if (!localStream) return
    const t = setTimeout(() => startPeer(localStream), 700)
    return () => clearTimeout(t)
  }, [localStream]) // eslint-disable-line react-hooks/exhaustive-deps


  // ── On auth: show prompt briefly then request camera ─────────────────────
  useEffect(() => {
    if (!authed) return
    setShowPrompt(true)
    const t = setTimeout(async () => {
      setShowPrompt(false)
      await getCameraPermission()
    }, 1600)
    return () => clearTimeout(t)
  }, [authed]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (pwInput === WATCH_PASSWORD) {
      setAuthed(true)
    } else {
      setPwError(true)
      setPwInput('')
    }
  }

  const handleSendChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const payload = sendChat(chatInput, 'viewer')
    if (payload) setMessages((prev) => [...prev, { ...payload, self: true }])
    setChatInput('')
  }

  // ══════════════════════════════════════════════════════════════
  // ── AUTH GATE ────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  if (!authed) {
    return (
      <div className="wp-auth">
        <motion.div
          className="wp-auth-card"
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        >
          <h1 className="wp-auth-title font-display">Study with her 🌸</h1>
          <p className="wp-auth-subtitle font-display">enter the password to join</p>
          <form className="wp-auth-form" onSubmit={handlePasswordSubmit}>
            <input
              id="watch-password-input"
              type="password"
              className="wp-auth-input"
              value={pwInput}
              autoFocus
              autoComplete="current-password"
              onChange={(e) => { setPwInput(e.target.value); setPwError(false) }}
              placeholder="••••••••"
            />
            <AnimatePresence>
              {pwError && (
                <motion.p
                  className="wp-auth-error font-display"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  wrong password 💔
                </motion.p>
              )}
            </AnimatePresence>
            <button id="watch-enter-btn" type="submit" className="btn-primary wp-auth-btn">
              enter 💕
            </button>
          </form>
        </motion.div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // ── MAIN WATCH PAGE ──────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  return (
    <div className="wp-root">

      {/* Camera permission prompt */}
      <AnimatePresence>
        {showPrompt && (
          <motion.div
            className="wp-cam-prompt font-display"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            Allow camera to let her see you 💕
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Her camera — large center, top 60% ── */}
      <div className="wp-her-area">
        <div className="wp-her-video-wrap">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="wp-her-video"
            />
          ) : (
            <div className="wp-her-placeholder">
              <motion.span
                style={{ fontSize: 52 }}
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                🌸
              </motion.span>
            </div>
          )}
          <span className="wp-her-label font-display">her 🌸</span>
        </div>
      </div>

      {/* ── Bottom bar: messages + chat input ── */}
      <div className="wp-bottom">
        <div className="wp-messages">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              className={`wp-msg ${msg.self ? 'wp-msg-self' : 'wp-msg-other'}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {msg.text}
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <form className="wp-chat-form" onSubmit={handleSendChat}>
          <input
            id="watch-chat-input"
            className="wp-chat-input"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="say something sweet 💌"
          />
          <button
            id="watch-chat-send"
            type="submit"
            className="btn-primary wp-chat-send"
          >
            send
          </button>
        </form>
      </div>

      {/* ── Your camera — fixed bottom-right ── */}
      <div className="wp-your-wrap">
        {cameraStatus === 'denied' ? (
          <div className="wp-cam-error font-display">
            Camera access<br />needed 🎥
          </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="wp-your-video wp-mirrored"
          />
        )}
        <span className="wp-your-label">you</span>
      </div>

    </div>
  )
}
