import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebRTC } from '../hooks/useWebRTC'
import './StudyCamera.css'

export default function StudyCamera({ isOpen, onClose }) {
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const miniVideoRef = useRef(null)   // separate ref for minimized video
  const messagesEndRef = useRef(null)

  const handleChat = useCallback((payload) => {
    setMessages((prev) => [...prev, { ...payload, self: false }])
  }, [])

  const {
    localStream,
    remoteStream,
    cameraStatus,
    getCameraPermission,
    destroyPeer,
    stopCamera,
    sendChat,
  } = useWebRTC({
    enabled: isOpen,
    isInitiator: true,
    presenceKey: 'host',
    onChat: handleChat,
  })

  // ── Camera on open / cleanup on close ────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setBannerDismissed(false)
      setIsMinimized(false)
      getCameraPermission()
    } else {
      destroyPeer()
      stopCamera()
      setMessages([])
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Wire local stream → full-panel video ─────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
      localVideoRef.current.play().catch(() => { })
    }
  }, [localStream])

  // ── Wire remote stream → full-panel + mini video ─────────────────────────
  useEffect(() => {
    if (!remoteStream) return
    console.log('[StudyCamera] Got remote stream', remoteStream)
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
      remoteVideoRef.current.play().catch((e) => console.log('[SC] remote play err', e))
    }
    if (miniVideoRef.current) {
      miniVideoRef.current.srcObject = remoteStream
      miniVideoRef.current.play().catch(() => { })
    }
  }, [remoteStream])

  // When switching back from minimized, re-attach stream to full panel ref
  useEffect(() => {
    if (!isMinimized && remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
      remoteVideoRef.current.play().catch(() => { })
    }
    if (isMinimized && remoteStream && miniVideoRef.current) {
      miniVideoRef.current.srcObject = remoteStream
      miniVideoRef.current.play().catch(() => { })
    }
  }, [isMinimized]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const payload = sendChat(chatInput, 'her')
    if (payload) setMessages((prev) => [...prev, { ...payload, self: true }])
    setChatInput('')
  }

  const handleRetryCamera = () => {
    setBannerDismissed(false)
    getCameraPermission()
  }

  const showDeniedBanner = cameraStatus === 'denied' && !bannerDismissed

  if (!isOpen) return null

  return (
    <>
      {/* ── Camera denied banner — fixed top-center ── */}
      <AnimatePresence>
        {showDeniedBanner && (
          <motion.div
            className="sc-denied-banner"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          >
            <button
              className="sc-denied-close"
              onClick={() => setBannerDismissed(true)}
              aria-label="Dismiss"
            >
              ✕
            </button>
            <p className="sc-denied-title font-display">
              📷 Camera blocked — he wants to see you study!
            </p>
            <p className="sc-denied-subtitle font-display">
              Click the 🔒 icon in your browser address bar → Allow Camera
            </p>
            <div className="sc-denied-steps">
              <span>Chrome: 🔒 lock icon → Camera → Allow → Refresh</span>
              <span>Safari: Settings → Websites → Camera → Allow</span>
            </div>
            <button className="btn-primary sc-denied-retry" onClick={handleRetryCamera}>
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          MINIMIZED STATE — draggable floating pill
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isMinimized && (
          <motion.div
            className="sc-mini-drag"
            drag
            dragMomentum={false}
            dragConstraints={{
              top: 0,
              left: 0,
              right: typeof window !== 'undefined' ? window.innerWidth - 160 : 800,
              bottom: typeof window !== 'undefined' ? window.innerHeight - 120 : 600,
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
            style={{ cursor: 'grab' }}
          >
            {/* His video / placeholder */}
            <div className="sc-mini-video-box">
              {remoteStream ? (
                <video
                  ref={miniVideoRef}
                  autoPlay
                  playsInline
                  className="sc-mini-video"
                />
              ) : (
                <div className="sc-mini-placeholder">
                  <motion.span
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontSize: 26 }}
                  >

                  </motion.span>
                </div>
              )}

              {/* Expand button — top-right */}
              <button
                className="sc-mini-expand"
                onClick={() => setIsMinimized(false)}
                title="Expand camera"
                aria-label="Expand camera panel"
              >
                ↗
              </button>

              {/* Live badge — bottom-left */}
              <div className="sc-mini-live-badge">
                <span className="sc-mini-live-dot" />
                live
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════
          FULL PANEL STATE
          ══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            className="sc-panel"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {/* Header */}
            <div className="sc-panel-header">
              <span className="sc-panel-title font-display">📷 Study Cam</span>
              <button
                className="sc-panel-minimize"
                onClick={() => setIsMinimized(true)}
                title="Minimize"
                aria-label="Minimize camera panel"
              >
                −
              </button>
            </div>

            {/* Her own camera — mirrored */}
            <div className="sc-full-video-wrap">
              {cameraStatus === 'pending' ? (
                <div className="sc-cam-pending font-display">
                  <motion.span
                    className="sc-pending-dot"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  Waiting for camera…
                </div>
              ) : cameraStatus === 'denied' ? (
                <div className="sc-permission-error font-display">
                  Camera access needed 🎥
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="sc-full-video sc-mirrored"
                />
              )}
              <span className="sc-full-label">you</span>
            </div>

            {/* His camera (remote) */}
            <div className="sc-full-video-wrap">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="sc-full-video"
                />
              ) : (
                <div className="sc-full-placeholder">
                  <motion.span
                    animate={{ opacity: [1, 0.25, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontSize: 28 }}
                  >

                  </motion.span>
                </div>
              )}
              <span className="sc-full-label sc-label-him font-display">him</span>
            </div>

            {/* Chat */}
            <div className="sc-chat">
              <div className="sc-messages">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    className={`sc-msg ${msg.self ? 'sc-msg-self' : 'sc-msg-other'}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {msg.text}
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form className="sc-chat-form" onSubmit={handleSendChat}>
                <input
                  className="sc-chat-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="say hi"
                />
                <button type="submit" className="btn-primary sc-chat-send">↑</button>
              </form>
            </div>

            {/* End camera */}
            <button className="sc-end-btn" onClick={onClose}>
              End Camera
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ── Toggle button exported separately for use in App ── */
export function StudyCameraToggle({ isOn, onToggle }) {
  return (
    <button
      id="study-camera-toggle"
      className={`sc-toggle-btn ${isOn ? 'sc-toggle-btn--on' : ''}`}
      onClick={onToggle}
      title={isOn ? 'Close camera' : 'Open study camera'}
      aria-label="Toggle study camera"
    >
      📷
    </button>
  )
}
