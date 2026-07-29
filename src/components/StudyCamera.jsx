import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function StudyCamera({ isOpen, onClose, roomId }) {
  const [snapPreviewOpen, setSnapPreviewOpen] = useState(false)
  const [snapStream, setSnapStream] = useState(null)
  const [incomingSnap, setIncomingSnap] = useState(null)
  const [snapVisible, setSnapVisible] = useState(false)
  const [snapExpanded, setSnapExpanded] = useState(false)
  
  const [snapTimer, setSnapTimer] = useState(null)
  const [snapCountdown, setSnapCountdown] = useState(0)
  const [snapTimerRunning, setSnapTimerRunning] = useState(false)
  const [flashVideo, setFlashVideo] = useState(false)
  
  const countdownRef = useRef(null)
  const snapChannelRef = useRef(null)
  const snapVideoRef = useRef(null)

  const currentRoomId = roomId || 'solo'

  // Subscribe to snap channel on mount
  useEffect(() => {
    const channel = supabase.channel(`snaps-${currentRoomId}`, {
      config: { broadcast: { self: false } }
    })
    snapChannelRef.current = channel

    channel.on('broadcast', { event: 'snap' }, ({ payload }) => {
      if (payload.from === 'viewer') {
        setIncomingSnap(payload)
        setSnapVisible(true)
      }
    })

    channel.subscribe()
    return () => channel.unsubscribe()
  }, [])

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
      payload: { image: base64, from: 'her', id: Date.now() }
    })
  }

  const cancelSnap = () => {
    if (snapStream) {
      snapStream.getTracks().forEach(t => t.stop())
    }
    setSnapStream(null)
    setSnapPreviewOpen(false)
    clearInterval(countdownRef.current)
    setSnapTimerRunning(false)
    setSnapCountdown(0)
  }

  const cancelSnapTimer = () => {
    clearInterval(countdownRef.current)
    setSnapTimerRunning(false)
    setSnapCountdown(0)
  }

  const triggerSendSnap = () => {
    if (snapTimer === null) {
      sendSnap()
    } else {
      setSnapCountdown(snapTimer)
      setSnapTimerRunning(true)
      
      countdownRef.current = setInterval(() => {
        setSnapCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current)
            setSnapTimerRunning(false)
            setFlashVideo(true)
            setTimeout(() => {
              setFlashVideo(false)
              sendSnap()
            }, 150)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
  }

  const dismissIncoming = () => {
    setSnapVisible(false)
    setSnapExpanded(false)
    setIncomingSnap(null)
  }

  return (
    <>
      {/* Snap button — fixed bottom left */}
      <motion.button
        onClick={takeSnap}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        style={{
          position: 'fixed', bottom: 20, left: 20, zIndex: 100,
          background: '#6B0A14', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '999px', padding: '8px 16px',
          color: '#C8B89A', fontFamily: 'DM Sans', fontSize: '12px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
        }}
      >
         Snap
      </motion.button>

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
            ></button>

            {/* Video preview */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ position: 'relative', borderRadius: '20px', overflow: 'hidden' }}
            >
              <motion.div
                animate={{ backgroundColor: flashVideo ? 'rgba(255,255,255,0.8)' : 'transparent' }}
                transition={{ duration: 0.15 }}
                style={{ position: 'relative', display: 'flex' }}
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
                    background: '#3D0408',
                    opacity: flashVideo ? 0.2 : 1
                  }}
                />
              </motion.div>
              
              {snapTimerRunning && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <AnimatePresence mode="popLayout">
                    <motion.div
                      key={snapCountdown}
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ fontFamily: 'DM Mono', fontWeight: 300, fontSize: '80px', color: '#F5EFE6', opacity: 0.9, lineHeight: 1 }}
                    >
                      {snapCountdown}
                    </motion.div>
                  </AnimatePresence>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '16px', color: '#C8B89A', marginTop: '-10px' }}>
                    pose! 
                  </div>
                  <button onClick={cancelSnapTimer} style={{ marginTop: '10px', background: 'transparent', border: 'none', color: '#9A7A6A', fontFamily: 'DM Sans', fontSize: '11px', cursor: 'pointer' }}>Cancel</button>
                </div>
              )}
            </motion.div>

            {!snapTimerRunning && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px' }}>
                <div style={{ fontFamily: 'DM Sans', fontSize: '11px', color: '#9A7A6A', marginBottom: '8px' }}>Timer</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {[null, 3, 5, 10].map(val => (
                    <button
                      key={val || 'Off'}
                      onClick={() => setSnapTimer(val)}
                      style={{
                        background: snapTimer === val ? '#C8B89A' : 'transparent',
                        border: snapTimer === val ? 'none' : '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '999px', padding: '4px 12px',
                        color: snapTimer === val ? '#6B0A14' : '#9A7A6A',
                        fontFamily: 'DM Sans', fontSize: '11px', cursor: 'pointer'
                      }}
                    >
                      {val ? `${val}s` : 'Off'}
                    </button>
                  ))}
                </div>
                
                {/* Send button */}
                <motion.button
                  onClick={triggerSendSnap}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    background: '#C8B89A', color: '#6B0A14',
                    border: 'none', borderRadius: '999px',
                    padding: '10px 28px', fontFamily: 'DM Sans',
                    fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                  }}
                >
                   Send
                </motion.button>
              </div>
            )}
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
              ></button>
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
    </>
  )
}

export function StudyCameraToggle({ isOn, onToggle }) {
  return (
    <button
      id="study-camera-toggle"
      className={`sc-toggle-btn ${isOn ? 'sc-toggle-btn--on' : ''}`}
      onClick={onToggle}
      title={isOn ? 'Close camera' : 'Open study camera'}
      aria-label="Toggle study camera"
    >
      
    </button>
  )
}
