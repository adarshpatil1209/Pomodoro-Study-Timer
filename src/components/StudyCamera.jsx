import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

export default function StudyCamera({ isOpen, onClose }) {
  const [snapPreviewOpen, setSnapPreviewOpen] = useState(false)
  const [snapStream, setSnapStream] = useState(null)
  const [incomingSnap, setIncomingSnap] = useState(null)
  const [snapVisible, setSnapVisible] = useState(false)
  const snapChannelRef = useRef(null)
  const snapVideoRef = useRef(null)

  // Subscribe to snap channel on mount
  useEffect(() => {
    const channel = supabase.channel('instant-snap', {
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
  }

  const dismissIncoming = () => {
    setSnapVisible(false)
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
          position: 'fixed', bottom: 80, left: 20, zIndex: 100,
          background: '#6B0A14', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '999px', padding: '8px 16px',
          color: '#C8B89A', fontFamily: 'DM Sans', fontSize: '12px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
        }}
      >
        📷 Snap
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

      {/* Incoming snap overlay */}
      <AnimatePresence>
        {snapVisible && incomingSnap && (
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
                width: '300px', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.10)'
              }}
            />
            <span style={{
              marginTop: '16px',
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: '14px', color: '#9A7A6A'
            }}>
              click anywhere to close
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
      📷
    </button>
  )
}
