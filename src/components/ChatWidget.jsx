import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ChatWidget() {
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [toastMsg, setToastMsg] = useState(null)
  const [destroying, setDestroying] = useState(false)
  const [destroyCountdown, setDestroyCountdown] = useState(30)
  const [clearedMsg, setClearedMsg] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const destroyTimerRef = useRef(null)
  const countdownRef = useRef(null)
  const channelRef = useRef(null)
  const messagesEndRef = useRef(null)
  const originalTitle = useRef(document.title)
  const notifInterval = useRef(null)
  const chatOpenRef = useRef(false)

  // Keep ref in sync with state
  useEffect(() => {
    chatOpenRef.current = chatOpen
  }, [chatOpen])

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
    const handleFocus = () => clearTabNotification()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
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
      const unread = data.filter(m => m.from_role === 'viewer' && !m.read_at).length
      setUnreadCount(unread)
      if (unread > 0) showTabNotification(unread)
    }
  }, [])

  // Subscribe to realtime INSERT and DELETE
  const subscribeToMessages = useCallback(() => {
    const channel = supabase
      .channel('messages-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new
          setMessages(prev => [...prev, newMsg])

          if (newMsg.from_role === 'viewer') {
            setUnreadCount(prev => {
              const count = prev + 1
              showTabNotification(count)
              return count
            })
            if (!chatOpenRef.current) {
              setToastMsg(newMsg.text)
              setTimeout(() => setToastMsg(null), 5000)
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

    channelRef.current = channel
  }, [])

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
      // Timer already expired — delete immediately
      deleteAllMessages()
      return
    }

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

  // Mount: clean old messages, fetch + subscribe, check existing timer
  useEffect(() => {
    cleanOldMessages()
    fetchMessages().then(() => {
      // Check if a destruction timer is already running in DB
      checkExistingTimer()
    })
    subscribeToMessages()
    return () => {
      channelRef.current?.unsubscribe()
      clearTimeout(destroyTimerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [cleanOldMessages, fetchMessages, subscribeToMessages])

  // On mount — check if destruction timer already exists and resume it
  const checkExistingTimer = useCallback(async () => {
    const { data: existing } = await supabase
      .from('messages')
      .select('destruction_started_at')
      .not('destruction_started_at', 'is', null)
      .limit(1)

    if (existing && existing.length > 0) {
      const destroyAt = new Date(existing[0].destruction_started_at)
      const remaining = Math.ceil((destroyAt.getTime() - Date.now()) / 1000)

      if (remaining <= 0) {
        deleteAllMessages()
      } else {
        setDestroying(true)
        setDestroyCountdown(remaining)

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
      }
    }
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatOpen, messages])

  // Send message to Supabase
  const sendMessage = async () => {
    if (!chatInput.trim()) return
    const { error } = await supabase
      .from('messages')
      .insert({ text: chatInput.trim(), from_role: 'her' })
    if (!error) setChatInput('')
  }

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

  // FIX 7 — Open chat: fetch messages first, THEN start destruction timer
  const openChat = () => {
    setChatOpen(true)
    setUnreadCount(0)
    clearTabNotification()
    setClearedMsg(false)

    // Mark viewer messages as read
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('from_role', 'viewer')
      .is('read_at', null)
      .then(() => {})

    // Fetch messages first, THEN start timer
    fetchMessages().then(() => {
      checkAndStartDestruction()
    })
  }

  const closeChat = () => {
    setChatOpen(false)
    // Timer keeps running — messages still delete after 30s
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

  return (
    <>
      {/* Toast Popup */}
      <AnimatePresence>
        {toastMsg && !chatOpen && (
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            onClick={() => {
              openChat()
              setToastMsg(null)
            }}
            style={{
              position: 'fixed', top: 80, right: 20, zIndex: 200,
              background: '#6B0A14', borderRadius: '18px',
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '12px 18px', maxWidth: '260px',
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: '16px', color: '#F5EFE6', cursor: 'pointer'
            }}
          >
            💬 {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Button */}
      <motion.button
        onClick={() => {
          if (chatOpen) {
            closeChat()
          } else {
            openChat()
          }
        }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        style={{
          position: 'fixed', bottom: 70, left: 20, zIndex: 100,
          background: '#6B0A14', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '999px', padding: '8px 16px',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '16px'
        }}
      >
        💬
        {unreadCount > 0 && !chatOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute', top: -4, right: -4,
              background: '#B03030', borderRadius: '50%',
              width: '18px', height: '18px',
              fontFamily: 'DM Sans, sans-serif', fontSize: '10px',
              color: 'white', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed', bottom: 120, left: 20,
              width: '280px', zIndex: 100,
              background: '#6B0A14', borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.10)',
              padding: '14px', display: 'flex', flexDirection: 'column'
            }}
          >
            {/* Header row */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '12px'
            }}>
              <span style={{
                fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                fontSize: '16px', color: '#F5EFE6'
              }}>Messages</span>

              {/* Countdown pill */}
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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

                <button
                  onClick={closeChat}
                  style={{
                    background: 'transparent', border: 'none', color: '#F5EFE6',
                    cursor: 'pointer', fontSize: '14px', padding: '4px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >✕</button>
              </div>
            </div>

            {/* Messages list */}
            <div style={{
              maxHeight: '240px', overflowY: 'auto',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
              display: 'flex', flexDirection: 'column', gap: '4px',
              marginBottom: '12px', minHeight: '60px'
            }}>
              <AnimatePresence mode="popLayout">
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isPulsing
                      ? { opacity: [1, 0.4, 1], y: 0 }
                      : { opacity: 1, y: 0 }
                    }
                    exit={{ y: -10, opacity: 0, scale: 0.8 }}
                    transition={isPulsing
                      ? { opacity: { duration: 0.8, repeat: Infinity }, y: { duration: 0.2 } }
                      : { duration: 0.2 }
                    }
                    style={{
                      alignSelf: msg.from_role === 'viewer' ? 'flex-start' : 'flex-end',
                      maxWidth: '85%'
                    }}
                  >
                    <div style={{
                      background: msg.from_role === 'viewer'
                        ? 'rgba(61,4,8,0.8)'
                        : 'rgba(200,184,154,0.15)',
                      borderRadius: msg.from_role === 'viewer'
                        ? '16px 16px 16px 4px'
                        : '16px 16px 4px 16px',
                      padding: '6px 10px',
                      fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                      fontSize: '14px', color: '#F5EFE6'
                    }}>
                      {msg.text}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: '10px', color: '#9A7A6A',
                      marginTop: '2px',
                      textAlign: msg.from_role === 'viewer' ? 'left' : 'right'
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

            {/* Input row */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.stopPropagation(); sendMessage() }
                }}
                onClick={e => e.stopPropagation()}
                placeholder="Send a message..."
                style={{
                  flex: 1, background: '#7D1020',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '10px', padding: '6px 10px',
                  color: '#F5EFE6', fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px', outline: 'none'
                }}
              />
              <button
                onClick={(e) => { e.stopPropagation(); sendMessage() }}
                style={{
                  background: '#C8B89A', border: 'none',
                  borderRadius: '10px', padding: '6px 10px',
                  color: '#6B0A14', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >↑</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
