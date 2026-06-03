import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function WatchPage() {
  // All state
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Snap state
  const [snapPreviewOpen, setSnapPreviewOpen] = useState(false)
  const [snapStream, setSnapStream] = useState(null)
  const [incomingSnap, setIncomingSnap] = useState(null)
  const [snapVisible, setSnapVisible] = useState(false)

  // Refs
  const chatChannelRef = useRef(null)
  const snapChannelRef = useRef(null)
  const snapVideoRef = useRef(null)
  const messagesEndRef = useRef(null)
  const originalTitle = useRef(document.title)
  const notifInterval = useRef(null)

  const showTabNotification = (count) => {
    if (notifInterval.current) clearInterval(notifInterval.current)
    let show = true
    notifInterval.current = setInterval(() => {
      document.title = show
        ? `(${count}) New message 💬`
        : originalTitle.current
      show = !show
    }, 1000)
  }

  const clearTabNotification = () => {
    if (notifInterval.current) clearInterval(notifInterval.current)
    document.title = originalTitle.current
  }

  useEffect(() => {
    const handleFocus = () => {
      setUnreadCount(0)
      clearTabNotification()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Track responsive screen width
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-scroll messages list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Password check
  const checkPassword = () => {
    if (password === import.meta.env.VITE_WATCH_PASSWORD) {
      setAuthed(true)
      sessionStorage.setItem('watch-authed', 'true')
    } else {
      alert('Wrong password')
    }
  };

  // Check auth status on mount
  useEffect(() => {
    if (sessionStorage.getItem('watch-authed') === 'true') {
      setAuthed(true)
    }
  }, [])

  // Initialize chat + snap channels when authenticated
  useEffect(() => {
    if (!authed) return

    // Chat channel
    const chatChannel = supabase.channel('study-chat', {
      config: { broadcast: { self: false } }
    })
    chatChannelRef.current = chatChannel

    chatChannel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (payload.from === 'her') {
        const msg = { ...payload, id: Date.now() + Math.random() }
        setMessages(prev => [...prev.slice(-20), msg])

        if (document.hidden) {
          setUnreadCount(prev => {
            const newCount = prev + 1
            showTabNotification(newCount)
            return newCount
          })
        }
      }
    })
    chatChannel.subscribe()

    // Snap channel
    const snapChannel = supabase.channel('instant-snap', {
      config: { broadcast: { self: false } }
    })
    snapChannelRef.current = snapChannel

    snapChannel.on('broadcast', { event: 'snap' }, ({ payload }) => {
      if (payload.from === 'her') {
        setIncomingSnap(payload)
        setSnapVisible(true)
      }
    })
    snapChannel.subscribe()

    return () => {
      chatChannel.unsubscribe()
      snapChannel.unsubscribe()
    }
  }, [authed])

  // Dismiss incoming snap on Escape
  useEffect(() => {
    if (!snapVisible) return
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setSnapVisible(false)
        setIncomingSnap(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [snapVisible])

  const sendMessage = () => {
    if (!chatInput.trim()) return
    const msg = { text: chatInput, from: 'viewer', id: Date.now(), time: Date.now() }
    chatChannelRef.current?.send({
      type: 'broadcast', event: 'chat', payload: msg
    })
    setMessages(prev => [...prev, msg])
    setChatInput('')
  }

  const takeSnap = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 400, height: 300 },
        audio: false
      })
      setSnapStream(stream)
      setSnapPreviewOpen(true)
      setTimeout(() => {
        if (snapVideoRef.current) {
          snapVideoRef.current.srcObject = stream
        }
      }, 100)
    } catch (err) {
      alert('Allow camera permission to snap')
    }
  }

  const sendSnap = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    ctx.translate(400, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(snapVideoRef.current, 0, 0, 400, 300)
    const base64 = canvas.toDataURL('image/jpeg', 0.7)

    snapStream.getTracks().forEach(t => t.stop())
    setSnapStream(null)
    setSnapPreviewOpen(false)

    snapChannelRef.current.send({
      type: 'broadcast',
      event: 'snap',
      payload: { image: base64, from: 'viewer', id: Date.now() }
    })
  }

  const cancelSnap = () => {
    if (snapStream) {
      snapStream.getTracks().forEach(t => t.stop())
    }
    setSnapStream(null)
    setSnapPreviewOpen(false)
  }

  const dismissIncoming = () => {
    setSnapVisible(false)
    setIncomingSnap(null)
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    checkPassword()
  }

  // ══════════════════════════════════════════════════════════════
  // ── AUTH SCREEN ──────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════
  if (!authed) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: '#3D0408', padding: '20px',
        boxSizing: 'border-box'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: '#6B0A14', borderRadius: '24px', padding: '32px',
            width: '100%', maxWidth: '320px', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: '16px',
            border: '1px solid rgba(255, 255, 255, 0.10)'
          }}
        >
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
            textTransform: 'uppercase', fontSize: '28px', color: '#C8B89A',
            margin: 0, letterSpacing: '0.05em'
          }}>DR.SURU 🩺</h1>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: '16px', color: '#F5EFE6', margin: 0, opacity: 0.8
          }}>Study Watch</p>
          <form
            onSubmit={handlePasswordSubmit}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              style={{
                width: '100%', background: '#7D1020',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '12px', padding: '10px 14px',
                color: '#F5EFE6', fontFamily: 'DM Sans',
                fontSize: '14px', outline: 'none', textAlign: 'center',
                boxSizing: 'border-box'
              }}
            />
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%', background: '#C8B89A', color: '#6B0A14',
                border: 'none', borderRadius: '12px', padding: '10px 16px',
                fontFamily: 'DM Sans', fontSize: '14px', fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Enter
            </motion.button>
          </form>
        </motion.div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════
  // ── MAIN WATCH UI ────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', minHeight: '100vh',
      background: '#3D0408', padding: '20px', boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '20px'
      }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontWeight: 700,
          fontSize: '24px', color: '#C8B89A', margin: 0
        }}>DR.SURU 🩺</h1>
      </div>

      {/* Main Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1.2fr',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* LEFT — Snap placeholder */}
        <div style={{
          background: '#6B0A14', borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.10)',
          overflow: 'hidden', position: 'relative', display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          aspectRatio: '4/3'
        }}>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: '18px', color: '#9A7A6A', textAlign: 'center',
              padding: '20px'
            }}
          >
            Send a snap to see each other 📷
          </motion.div>
        </div>

        {/* RIGHT — Controls Panel */}
        <div style={{
          background: '#6B0A14', borderRadius: '24px', padding: '20px',
          border: '1px solid rgba(255,255,255,0.10)', display: 'flex',
          flexDirection: 'column', gap: '16px'
        }}>
          {/* Section Divider */}
          <div style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            margin: '4px 0 12px 0'
          }} />

          {/* Section Label */}
          <div style={{
            fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 700,
            color: '#9A7A6A', letterSpacing: '0.08em', marginBottom: '-8px'
          }}>
            MESSAGES
          </div>

          {/* Messages list */}
          <div style={{
            maxHeight: '300px', overflowY: 'auto', display: 'flex',
            flexDirection: 'column', gap: '8px', paddingRight: '4px'
          }}>
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ x: msg.from === 'viewer' ? 20 : -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    textAlign: msg.from === 'viewer' ? 'right' : 'left',
                    marginBottom: '4px'
                  }}
                >
                  <span style={{
                    display: 'inline-block',
                    background: msg.from === 'viewer'
                      ? 'rgba(107,10,20,0.6)'
                      : 'rgba(200,184,154,0.10)',
                    borderRadius: '12px', padding: '6px 10px',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontStyle: 'italic', fontSize: '14px',
                    color: '#F5EFE6',
                    border: '1px solid rgba(255,255,255,0.08)',
                    maxWidth: '90%'
                  }}>
                    {msg.from === 'her' && (
                      <span style={{ color: '#C8B89A', fontStyle: 'italic', marginRight: '4px' }}>
                        her:
                      </span>
                    )}
                    {msg.text}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Chat input row */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { sendMessage() }
              }}
              placeholder="Send a message..."
              style={{
                flex: 1, background: '#7D1020',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: '10px', padding: '8px 12px',
                color: '#F5EFE6', fontFamily: 'DM Sans',
                fontSize: '13px', outline: 'none'
              }}
            />
            <button
              onClick={sendMessage}
              style={{
                background: '#C8B89A', border: 'none',
                borderRadius: '10px', padding: '8px 12px',
                color: '#6B0A14', fontFamily: 'DM Sans',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer'
              }}
            >
              ↑
            </button>
          </div>

          {/* Snap her button */}
          <motion.button
            onClick={takeSnap}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', background: 'transparent', color: '#C8B89A',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px',
              padding: '10px 16px', fontFamily: 'DM Sans', fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            📷 Snap her
          </motion.button>
        </div>
      </div>

      {/* Snap preview modal */}
      <AnimatePresence>
        {snapPreviewOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(20,2,4,0.90)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}
          >
            {/* Close button */}
            <button
              onClick={cancelSnap}
              style={{
                position: 'absolute', top: 20, right: 20,
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#F5EFE6', fontSize: '14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >✕</button>

            {/* Video preview */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <video
                ref={snapVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: '300px', height: '225px',
                  borderRadius: '20px', objectFit: 'cover',
                  transform: 'scaleX(-1)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  background: '#3D0408'
                }}
              />
            </motion.div>

            {/* Send button */}
            <motion.button
              onClick={sendSnap}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              style={{
                marginTop: '20px',
                background: '#C8B89A', color: '#6B0A14',
                border: 'none', borderRadius: '999px',
                padding: '10px 28px', fontFamily: 'DM Sans',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              📸 Send
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming snap — floating card bottom-right */}
      <AnimatePresence>
        {snapVisible && incomingSnap && (
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed', bottom: 20, right: 20, zIndex: 999,
              display: 'flex', flexDirection: 'column', alignItems: 'center'
            }}
          >
            <div
              onClick={dismissIncoming}
              style={{
                width: '200px', height: '150px',
                borderRadius: '20px', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer', position: 'relative'
              }}
            >
              <img
                src={incomingSnap.image}
                alt="Snap"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  display: 'block'
                }}
              />
              {/* Close button */}
              <button
                onClick={(e) => { e.stopPropagation(); dismissIncoming() }}
                style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.5)',
                  border: 'none', color: 'white', fontSize: '10px',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}
              >✕</button>
            </div>
            <span style={{
              marginTop: '6px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '11px',
              color: '#9A7A6A', textAlign: 'center'
            }}>
              tap to close
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
