import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function ChatWidget() {
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [toastMsg, setToastMsg] = useState(null)
  const chatChannelRef = useRef(null)
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
    const handleFocus = () => clearTabNotification()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  useEffect(() => {
    const channel = supabase.channel('study-chat', {
      config: { broadcast: { self: false } }
    })
    chatChannelRef.current = channel

    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (payload.from === 'viewer') {
        const msg = { ...payload, id: Date.now() + Math.random() }
        setMessages(prev => [...prev.slice(-20), msg])
        
        setChatOpen(currentOpen => {
          if (document.hidden || !currentOpen) {
            setUnreadCount(prev => {
              const newCount = prev + 1
              showTabNotification(newCount)
              return newCount
            })
            if (!currentOpen) {
              setToastMsg(msg.text)
              setTimeout(() => setToastMsg(null), 5000)
            }
          }
          return currentOpen
        })
      }
    })

    channel.subscribe()
    return () => channel.unsubscribe()
  }, [])

  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0)
      clearTabNotification()
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chatOpen, messages])

  const sendMessage = () => {
    if (!chatInput.trim()) return
    const msg = {
      text: chatInput, from: 'her',
      id: Date.now(), time: Date.now()
    }
    chatChannelRef.current.send({
      type: 'broadcast', event: 'chat', payload: msg
    })
    setMessages(prev => [...prev, msg])
    setChatInput('')
  }

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
              setChatOpen(true)
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
        onClick={() => setChatOpen(prev => !prev)}
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
          <div style={{
            position: 'absolute', top: -4, right: -4,
            background: '#B03030', borderRadius: '50%',
            width: '16px', height: '16px',
            fontFamily: 'DM Sans, sans-serif', fontSize: '10px',
            color: 'white', display: 'flex', alignItems: 'center',
            justifyContent: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
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
              <button
                onClick={() => setChatOpen(false)}
                style={{
                  background: 'transparent', border: 'none', color: '#F5EFE6',
                  cursor: 'pointer', fontSize: '14px', padding: '4px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >✕</button>
            </div>

            {/* Messages list */}
            <div style={{
              maxHeight: '240px', overflowY: 'auto',
              scrollbarWidth: 'none', msOverflowStyle: 'none',
              display: 'flex', flexDirection: 'column', gap: '4px',
              marginBottom: '12px'
            }}>
              <AnimatePresence>
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      alignSelf: msg.from === 'viewer' ? 'flex-start' : 'flex-end',
                      maxWidth: '85%'
                    }}
                  >
                    <div style={{
                      background: msg.from === 'viewer' ? 'rgba(61,4,8,0.8)' : 'rgba(200,184,154,0.15)',
                      borderRadius: msg.from === 'viewer' ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                      padding: '6px 10px',
                      fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                      fontSize: '14px', color: '#F5EFE6'
                    }}>
                      {msg.text}
                    </div>
                    <div style={{
                      fontFamily: 'DM Sans, sans-serif', fontSize: '10px', color: '#9A7A6A',
                      marginTop: '2px', textAlign: msg.from === 'viewer' ? 'left' : 'right'
                    }}>
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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
