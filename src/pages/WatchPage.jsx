import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function WatchPage() {
  // All state
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [destroying, setDestroying] = useState(false)
  const [destroyCountdown, setDestroyCountdown] = useState(30)
  const [clearedMsg, setClearedMsg] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  // Snap state
  const [snapPreviewOpen, setSnapPreviewOpen] = useState(false)
  const [snapStream, setSnapStream] = useState(null)
  const [incomingSnap, setIncomingSnap] = useState(null)
  const [snapVisible, setSnapVisible] = useState(false)
  const [snapExpanded, setSnapExpanded] = useState(false)

  // Refs
  const chatChannelRef = useRef(null)
  const snapChannelRef = useRef(null)
  const snapVideoRef = useRef(null)
  const messagesEndRef = useRef(null)
  const originalTitle = useRef(document.title)
  const notifInterval = useRef(null)
  const destroyTimerRef = useRef(null)
  const countdownRef = useRef(null)
  const chatVisibleRef = useRef(false)

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

  // FIX 4 — Auto cleanup messages older than 24 hours
  const cleanOldMessages = useCallback(async () => {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await supabase
      .from('messages')
      .delete()
      .lt('created_at', cutoff.toISOString())
  }, [])

  // FIX 5 — Fetch with limit(50)
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50)

    if (data) {
      setMessages(data)
      const unread = data.filter(m => m.from_role === 'her' && !m.read_at).length
      setUnreadCount(unread)
      if (unread > 0) showTabNotification(unread)
    }
  }, [])

  // Subscribe to realtime INSERT and DELETE
  const subscribeToMessages = useCallback(() => {
    const channel = supabase
      .channel('messages-realtime-viewer')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new
          setMessages(prev => [...prev, newMsg])

          if (newMsg.from_role === 'her') {
            if (document.hidden) {
              setUnreadCount(prev => {
                const newCount = prev + 1
                showTabNotification(newCount)
                return newCount
              })
            }
          }
        }
      )
      .on('postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'messages' },
        () => {
          setMessages([])
          setDestroyCountdown(30)
          setDestroying(false)
          clearInterval(countdownRef.current)
          clearTimeout(destroyTimerRef.current)
          setClearedMsg(true)
          setTimeout(() => setClearedMsg(false), 2000)
        }
      )
      .subscribe()

    chatChannelRef.current = channel
  }, [])

  // Delete all messages
  const deleteAllMessages = async () => {
    await supabase
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    setMessages([])
    setDestroyCountdown(30)
    setDestroying(false)
    clearInterval(countdownRef.current)
    clearTimeout(destroyTimerRef.current)
    setClearedMsg(true)
    setTimeout(() => setClearedMsg(false), 2000)
  }

  // FIX 1+2+3 — Check server-side destruction_started_at and resume/start countdown
  const checkAndStartDestruction = useCallback(async () => {
    // Check if any message already has destruction_started_at set
    const { data: existing } = await supabase
      .from('messages')
      .select('destruction_started_at')
      .not('destruction_started_at', 'is', null)
      .limit(1)

    let destroyAt

    if (existing && existing.length > 0) {
      // Timer already started by someone — calculate remaining
      destroyAt = new Date(existing[0].destruction_started_at)
    } else {
      // First to open — set the timer now
      destroyAt = new Date(Date.now() + 30000)
      await supabase
        .from('messages')
        .update({ destruction_started_at: destroyAt.toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000')
    }

    const remaining = Math.ceil((destroyAt.getTime() - Date.now()) / 1000)

    if (remaining <= 0) {
      deleteAllMessages()
      return
    }

    // Mark her messages as read
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('from_role', 'her')
      .is('read_at', null)
      .then(() => {})

    // Start local countdown from remaining seconds
    setDestroying(true)
    setDestroyCountdown(remaining)
    setClearedMsg(false)

    clearInterval(countdownRef.current)
    clearTimeout(destroyTimerRef.current)

    countdownRef.current = setInterval(() => {
      setDestroyCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    destroyTimerRef.current = setTimeout(() => {
      deleteAllMessages()
    }, remaining * 1000)
  }, [])

  // Initialize channels when authenticated
  // FIX 7 — Fetch messages first, THEN start destruction timer
  useEffect(() => {
    if (!authed) return

    // FIX 4 — Clean old messages on mount
    cleanOldMessages()

    subscribeToMessages()

    // Fetch messages first, then check/start destruction timer
    fetchMessages().then(() => {
      checkAndStartDestruction()
    })
    chatVisibleRef.current = true

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
      chatChannelRef.current?.unsubscribe()
      snapChannel.unsubscribe()
      clearTimeout(destroyTimerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [authed, cleanOldMessages, fetchMessages, subscribeToMessages, checkAndStartDestruction])

  // Dismiss incoming snap on Escape
  useEffect(() => {
    if (!snapVisible) return
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setSnapVisible(false)
        setSnapExpanded(false)
        setIncomingSnap(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [snapVisible])

  const sendMessage = async () => {
    if (!chatInput.trim()) return
    const { error } = await supabase
      .from('messages')
      .insert({ text: chatInput.trim(), from_role: 'viewer' })
    if (!error) setChatInput('')
  }

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isPulsing = destroying && destroyCountdown < 10 && destroyCountdown > 0

  // Clear all messages (manual clear button)
  const clearAllMessages = async () => {
    const { error } = await supabase
      .from('messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (!error) {
      setMessages([])
      setConfirmClear(false)
      setDestroyCountdown(30)
      setDestroying(false)
      clearTimeout(destroyTimerRef.current)
      clearInterval(countdownRef.current)
    }
  }

  // Auto-reset confirmClear after 5s
  useEffect(() => {
    if (!confirmClear) return
    const t = setTimeout(() => setConfirmClear(false), 5000)
    return () => clearTimeout(t)
  }, [confirmClear])

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
    setSnapExpanded(false)
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

          {/* Section Label + Countdown */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '-4px'
          }}>
            <div style={{
              fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 700,
              color: '#9A7A6A', letterSpacing: '0.08em'
            }}>
              MESSAGES
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {destroying && destroyCountdown > 0 && (
                <motion.div
                  animate={destroyCountdown < 10
                    ? { scale: [1, 1.05, 1] }
                    : {}
                  }
                  transition={destroyCountdown < 10
                    ? { duration: 0.8, repeat: Infinity }
                    : {}
                  }
                  style={{
                    background: 'rgba(176,48,48,0.20)',
                    borderRadius: '999px',
                    padding: '3px 10px',
                    fontFamily: 'DM Sans, sans-serif',
                    fontSize: '11px',
                    color: '#B03030',
                    whiteSpace: 'nowrap'
                  }}
                >
                  🔥 deleting in {destroyCountdown}s
                </motion.div>
              )}

              {/* Clear button with confirmation */}
              {!confirmClear ? (
                <motion.button
                  onClick={() => setConfirmClear(true)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: '#B03030', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 0
                  }}
                >
                  <Trash2 size={14} />
                </motion.button>
              ) : (
                <div style={{ display: 'flex', gap: '3px' }}>
                  <motion.button
                    onClick={clearAllMessages}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: 'rgba(176,48,48,0.25)',
                      border: '1px solid rgba(176,48,48,0.4)',
                      borderRadius: '8px', padding: '2px 6px',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '10px',
                      color: '#B03030', cursor: 'pointer', whiteSpace: 'nowrap'
                    }}
                  >Yes 🗑️</motion.button>
                  <motion.button
                    onClick={() => setConfirmClear(false)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: '8px', padding: '2px 6px',
                      fontFamily: 'DM Sans, sans-serif', fontSize: '10px',
                      color: '#F5EFE6', cursor: 'pointer'
                    }}
                  >No</motion.button>
                </div>
              )}
            </div>
          </div>

          {/* Messages list */}
          <div style={{
            maxHeight: '300px', overflowY: 'auto', display: 'flex',
            flexDirection: 'column', gap: '8px', paddingRight: '4px',
            minHeight: '60px'
          }}>
            <AnimatePresence mode="popLayout">
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ x: msg.from_role === 'viewer' ? 20 : -20, opacity: 0 }}
                  animate={isPulsing
                    ? { x: 0, opacity: [1, 0.4, 1] }
                    : { x: 0, opacity: 1 }
                  }
                  exit={{ y: -10, opacity: 0, scale: 0.8 }}
                  transition={isPulsing
                    ? { opacity: { duration: 0.8, repeat: Infinity }, x: { duration: 0.2 } }
                    : { duration: 0.2 }
                  }
                  style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: msg.from_role === 'viewer' ? 'flex-end' : 'flex-start',
                    marginBottom: '4px'
                  }}
                >
                  <div style={{
                    display: 'inline-block',
                    background: msg.from_role === 'viewer'
                      ? 'rgba(200,184,154,0.15)'
                      : 'rgba(61,4,8,0.8)',
                    borderRadius: msg.from_role === 'viewer'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                    padding: '6px 10px',
                    fontFamily: 'Cormorant Garamond, serif',
                    fontStyle: 'italic', fontSize: '14px',
                    color: '#F5EFE6',
                    maxWidth: '90%'
                  }}>
                    {msg.from_role === 'her' && (
                      <span style={{ color: '#C8B89A', fontStyle: 'italic', marginRight: '4px' }}>
                        her:
                      </span>
                    )}
                    {msg.text}
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif', fontSize: '10px', color: '#9A7A6A',
                    marginTop: '2px',
                    textAlign: msg.from_role === 'viewer' ? 'right' : 'left'
                  }}>
                    {formatTime(msg.created_at)}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Cleared message */}
            <AnimatePresence>
              {clearedMsg && messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    textAlign: 'center', padding: '20px 0',
                    fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                    fontSize: '14px', color: '#9A7A6A'
                  }}
                >
                  Messages cleared 🔥
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {messages.length === 0 && !clearedMsg && (
              <div style={{
                textAlign: 'center', padding: '20px 0',
                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                color: '#9A7A6A'
              }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>No messages yet 🌸</div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>Messages disappear 30s after reading</div>
              </div>
            )}

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

      {/* Incoming snap — small floating card bottom-right */}
      <AnimatePresence>
        {snapVisible && incomingSnap && !snapExpanded && (
          <motion.div
            initial={{ x: 60, opacity: 0, scale: 0.9 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 60, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              bottom: '80px',
              right: '20px',
              zIndex: 999,
              cursor: 'pointer',
              width: '200px',
            }}
            onClick={() => setSnapExpanded(true)}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={incomingSnap.image}
                alt="Snap"
                style={{
                  width: '200px',
                  height: '150px',
                  objectFit: 'cover',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  display: 'block'
                }}
              />
              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  dismissIncoming()
                }}
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  color: '#F5EFE6',
                  fontSize: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >✕</button>
              <div style={{
                textAlign: 'center',
                marginTop: '6px',
                fontFamily: 'Cormorant Garamond',
                fontStyle: 'italic',
                fontSize: '12px',
                color: '#9A7A6A'
              }}>
                tap to expand
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming snap — expanded full view */}
      <AnimatePresence>
        {snapVisible && incomingSnap && snapExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissIncoming}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(20,2,4,0.92)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <motion.img
              src={incomingSnap.image}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                width: '340px', maxWidth: '90vw', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.10)'
              }}
            />
            <span style={{
              marginTop: '16px',
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: '14px', color: '#9A7A6A'
            }}>
              tap anywhere to close
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
