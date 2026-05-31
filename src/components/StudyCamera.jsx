import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWebRTC } from '../hooks/useWebRTC'
import './StudyCamera.css'

export default function StudyCamera({ isOpen, onClose }) {
  const [messages, setMessages]   = useState([])
  const [chatInput, setChatInput] = useState('')
  const localVideoRef  = useRef(null)
  const remoteVideoRef = useRef(null)
  const messagesEndRef = useRef(null)

  const handleChat = useCallback((payload) => {
    setMessages((prev) => [...prev, { ...payload, self: false }])
  }, [])

  const {
    localStream,
    remoteStream,
    permissionError,
    viewerPresent,
    getCameraPermission,
    destroyPeer,
    stopCamera,
    sendChat,
  } = useWebRTC({
    enabled:      isOpen,
    isInitiator:  true,
    presenceKey:  'host',
    onChat:       handleChat,
  })

  // ── Request camera when panel opens ──────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      getCameraPermission()
    } else {
      destroyPeer()
      stopCamera()
      setMessages([])
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Wire local stream → <video> ───────────────────────────────────────────
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  // ── Wire remote stream → <video> ──────────────────────────────────────────
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

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

  if (!isOpen) return null

  return (
    <div className="sc-panel">

      {/* ── Viewer camera (remote) — top, larger ── */}
      <AnimatePresence mode="wait">
        {remoteStream ? (
          <motion.div
            key="remote-live"
            className="sc-video-wrap sc-remote"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="sc-video"
            />
            <span className="sc-label sc-label-him font-display">him 💕</span>
          </motion.div>
        ) : (
          <motion.div
            key="remote-placeholder"
            className="sc-video-wrap sc-remote sc-placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.span
              className="sc-placeholder-emoji"
              animate={{ opacity: [1, 0.25, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              💕
            </motion.span>
            <span className="sc-label sc-label-him font-display">him 💕</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Her own camera (local) — bottom, smaller, mirrored ── */}
      <div className="sc-video-wrap sc-local">
        {permissionError ? (
          <div className="sc-permission-error font-display">
            Camera access<br />needed 🎥
          </div>
        ) : (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="sc-video sc-mirrored"
          />
        )}
        <span className="sc-label">you</span>
      </div>

      {/* ── Compact chat ── */}
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
            placeholder="say hi 💌"
          />
          <button type="submit" className="btn-primary sc-chat-send">↑</button>
        </form>
      </div>

    </div>
  )
}

/* ── Toggle button exported separately for use in Timer/App ── */
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
