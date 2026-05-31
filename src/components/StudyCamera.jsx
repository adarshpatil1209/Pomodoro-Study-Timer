import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'

const CHANNEL_NAME = 'studywatch-v2'
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ]
}

export default function StudyCamera({ isOpen, onClose }) {
  const [cameraOn, setCameraOn] = useState(false)
  const [isBeingWatched, setIsBeingWatched] = useState(false)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [remoteStream, setRemoteStream] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('idle')
  // idle | connecting | connected | failed

  const [localActive, setLocalActive] = useState(false)
  const isCameraActive = isOpen !== undefined ? (isOpen || localActive) : cameraOn

  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const localStreamRef = useRef(null)
  const pcRef = useRef(null)
  const channelRef = useRef(null)
  const viewerReadyRef = useRef(false)
  const iceCandidateBuffer = useRef([])
  const remoteDescSet = useRef(false)
  const messageTimers = useRef([])
  const constraintsRef = useRef(null)
  const offerSentRef = useRef(false)

  // Initialize channel on mount always
  useEffect(() => {
    const channel = supabase.channel(CHANNEL_NAME, {
      config: { broadcast: { self: false }, presence: { key: 'her' } }
    })
    channelRef.current = channel

    // Listen for viewer-ready
    channel.on('broadcast', { event: 'viewer-ready' }, () => {
      console.log('HER: viewer ready received')
      viewerReadyRef.current = true
      setIsBeingWatched(true)
      if (localStreamRef.current) {
        createPeerConnection(localStreamRef.current)
      }
    })

    // Listen for answer from viewer
    channel.on('broadcast', { event: 'answer' }, async ({ payload }) => {
      console.log('HER: received answer')
      if (!pcRef.current) return
      try {
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(payload.sdp)
        )
        remoteDescSet.current = true
        // flush buffered ICE
        for (const c of iceCandidateBuffer.current) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(c))
        }
        iceCandidateBuffer.current = []
      } catch (e) {
        console.error('HER: answer error', e)
      }
    })

    // Listen for ICE from viewer
    channel.on('broadcast', { event: 'ice-viewer' }, async ({ payload }) => {
      if (!payload.candidate) return
      if (remoteDescSet.current && pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(
            new RTCIceCandidate(payload.candidate)
          )
        } catch (e) { console.error('HER: ICE error', e) }
      } else {
        iceCandidateBuffer.current.push(payload.candidate)
      }
    })

    // Listen for chat from viewer
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (payload.from === 'viewer') {
        const msg = { ...payload, id: Date.now() + Math.random() }
        setMessages(prev => [...prev.slice(-3), msg])
        // auto remove after 15s
        const t = setTimeout(() => {
          setMessages(prev => prev.filter(m => m.id !== msg.id))
        }, 15000)
        messageTimers.current.push(t)
      }
    })

    // Listen for viewer-left
    channel.on('broadcast', { event: 'viewer-left' }, () => {
      console.log('HER: viewer left')
      setIsBeingWatched(false)
      setRemoteStream(null)
      setMessages([])
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
      viewerReadyRef.current = false
      remoteDescSet.current = false
      iceCandidateBuffer.current = []
      offerSentRef.current = false
    })

    channel.subscribe(async (status) => {
      console.log('HER channel status:', status)
    })

    return () => {
      messageTimers.current.forEach(clearTimeout)
      channel.unsubscribe()
    }
  }, [])

  const createPeerConnection = (stream) => {
    if (offerSentRef.current) {
      console.log('HER: offer already sent, skipping duplicate')
      return
    }
    offerSentRef.current = true

    if (pcRef.current) { pcRef.current.close() }
    remoteDescSet.current = false
    iceCandidateBuffer.current = []

    const pc = new RTCPeerConnection(ICE_SERVERS)
    pcRef.current = pc
    setConnectionStatus('connecting')

    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    pc.ontrack = (event) => {
      console.log('HER: got remote stream from viewer')
      const stream = event.streams[0]
      setRemoteStream(stream)
      setConnectionStatus('connected')
      
      // Force attach with slight delay
      setTimeout(() => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream
          remoteVideoRef.current.play()
            .then(() => console.log('HER: remote video playing'))
            .catch(e => console.error('HER: play error', e))
        }
      }, 100)
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'ice-her',
          payload: { candidate: event.candidate }
        })
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('HER connection state:', pc.connectionState)
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        offerSentRef.current = false  // allow retry
      }
      if (pc.connectionState === 'connected') setConnectionStatus('connected')
      if (pc.connectionState === 'failed') setConnectionStatus('failed')
    }

    pc.createOffer().then(async (offer) => {
      await pc.setLocalDescription(offer)
      channelRef.current.send({
        type: 'broadcast',
        event: 'offer',
        payload: { sdp: offer }
      })
      console.log('HER: sent offer with type:', offer.type)
    })
  }

  const startCamera = async () => {
    if (localStreamRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      })
      localStreamRef.current = stream
      setCameraOn(true)
      setLocalActive(true)
      if (viewerReadyRef.current) {
        createPeerConnection(stream)
      }
    } catch (err) {
      console.error('Camera error:', err)
      alert('Camera permission needed. Click the lock icon in address bar → Allow Camera → Refresh.')
      onClose?.()
    }
  }

  const stopCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    setCameraOn(false)
    setLocalActive(false)
    setRemoteStream(null)
    setConnectionStatus('idle')
    offerSentRef.current = false
    onClose?.()
  }

  const sendMessage = () => {
    if (!chatInput.trim()) return
    const msg = { text: chatInput, from: 'her', id: Date.now(), time: Date.now() }
    channelRef.current.send({
      type: 'broadcast', event: 'chat', payload: msg
    })
    setMessages(prev => [...prev.slice(-3), msg])
    setChatInput('')
    const t = setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== msg.id))
    }, 15000)
    messageTimers.current.push(t)
  }

  // Sync with isOpen prop from App.jsx controls
  useEffect(() => {
    if (isOpen !== undefined) {
      if (isOpen) {
        if (!localStreamRef.current) {
          startCamera()
        }
      } else {
        if (localStreamRef.current) {
          stopCamera()
        }
      }
    }
  }, [isOpen])

  // Securely wire video elements inside conditional mounts
  useEffect(() => {
    if (isCameraActive && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current
    }
  }, [isCameraActive, isMinimized])

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream, isMinimized])

  // DRAGGABLE PANEL using framer-motion drag
  return (
    <>
      <div 
        ref={constraintsRef}
        style={{
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      {/* Camera toggle button - fixed bottom left */}
      {!isCameraActive && (
        <motion.button
          onClick={startCamera}
          style={{
            position: 'fixed', bottom: 80, left: 20, zIndex: 100,
            background: '#6B0A14', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '999px', padding: '8px 16px',
            color: '#C8B89A', fontFamily: 'DM Sans', fontSize: '12px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
        >
          📷 Study Cam
        </motion.button>
      )}

      {/* Watching indicator */}
      <AnimatePresence>
        {isBeingWatched && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            style={{
              position: 'fixed', top: 70, left: '50%',
              transform: 'translateX(-50%)', zIndex: 200,
              background: 'rgba(107,10,20,0.95)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '999px', padding: '8px 20px',
              fontFamily: 'Cormorant Garamond', fontStyle: 'italic',
              fontSize: '15px', color: '#F5EFE6', whiteSpace: 'nowrap'
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >👁</motion.span>
            {' '}watching you study
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera panel — draggable */}
      <AnimatePresence>
        {isCameraActive && (
          <motion.div
            drag
            dragConstraints={constraintsRef}
            dragElastic={0}
            dragMomentum={false}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: isMinimized ? 80 : 20,
              right: 20,
              zIndex: 150,
              cursor: 'grab',
              width: isMinimized ? '160px' : '280px',
              background: isMinimized ? 'transparent' : '#6B0A14',
              borderRadius: '20px',
              border: isMinimized ? 'none' : '1px solid rgba(255,255,255,0.10)',
              overflow: 'hidden',
              userSelect: 'none'
            }}
            whileDrag={{ cursor: 'grabbing' }}
          >
            {isMinimized ? (
              // MINIMIZED — only his video, draggable rectangle
              <div style={{ position: 'relative', width: '160px', height: '120px' }}>
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  muted={false}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', borderRadius: '16px',
                    border: '1px solid rgba(200,184,154,0.20)',
                    background: '#3D0408',
                    display: 'block'
                  }}
                />
                {/* expand button */}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsMinimized(false) }}
                  style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#F5EFE6', fontSize: '10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >⛶</button>
                {/* live badge */}
                <div style={{
                  position: 'absolute', bottom: 6, left: 6,
                  background: 'rgba(0,0,0,0.5)', borderRadius: '999px',
                  padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 4
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: connectionStatus === 'connected' ? '#7DAA96' : '#D4893A'
                  }} />
                  <span style={{ fontSize: 9, color: '#F5EFE6', fontFamily: 'DM Sans' }}>
                    {connectionStatus === 'connected' ? 'live' : 'waiting'}
                  </span>
                </div>
              </div>
            ) : (
              // FULL PANEL
              <div style={{ padding: '14px' }}>
                {/* Header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '10px'
                }}>
                  <span style={{
                    fontFamily: 'Cormorant Garamond', fontStyle: 'italic',
                    fontSize: '14px', color: '#C8B89A'
                  }}>📷 Study Cam</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {/* minimize */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsMinimized(true) }}
                      style={{
                        width: 24, height: 24, borderRadius: '50%', cursor: 'pointer',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.14)',
                        color: '#C8B89A', fontSize: '14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >−</button>
                    {/* close */}
                    <button
                      onClick={(e) => { e.stopPropagation(); stopCamera() }}
                      style={{
                        width: 24, height: 24, borderRadius: '50%', cursor: 'pointer',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.14)',
                        color: '#C8B89A', fontSize: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                    >✕</button>
                  </div>
                </div>

                {/* Her video */}
                <video
                  ref={localVideoRef}
                  autoPlay playsInline muted
                  style={{
                    width: '100%', borderRadius: '12px',
                    background: '#3D0408', transform: 'scaleX(-1)',
                    marginBottom: '8px', maxHeight: '160px',
                    objectFit: 'cover'
                  }}
                />

                {/* His video */}
                <div style={{ position: 'relative', marginBottom: '8px' }}>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted={false}
                    style={{
                      width: '100%', borderRadius: '12px',
                      background: '#3D0408', maxHeight: '140px',
                      objectFit: 'cover',
                      display: 'block'
                    }}
                  />
                  <span style={{
                    position: 'absolute', bottom: 6, left: 8,
                    fontFamily: 'DM Sans', fontSize: '10px',
                    color: 'rgba(200,184,154,0.7)',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '999px', padding: '2px 6px'
                  }}>him</span>
                  {/* connection status */}
                  <span style={{
                    position: 'absolute', bottom: 6, right: 8,
                    fontSize: '9px', color: '#F5EFE6',
                    background: 'rgba(0,0,0,0.4)',
                    borderRadius: '999px', padding: '2px 6px',
                    display: 'flex', alignItems: 'center', gap: 3,
                    fontFamily: 'DM Sans'
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%', display: 'inline-block',
                      background: connectionStatus === 'connected' ? '#7DAA96' :
                        connectionStatus === 'connecting' ? '#D4893A' : '#9A7A6A'
                    }}/>
                    {connectionStatus}
                  </span>
                </div>

                {/* Messages */}
                <div style={{ minHeight: '40px', marginBottom: '8px' }}>
                  <AnimatePresence>
                    {messages.map(msg => (
                      <motion.div
                        key={msg.id}
                        initial={{ x: msg.from === 'her' ? 20 : -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          textAlign: msg.from === 'her' ? 'right' : 'left',
                          marginBottom: '4px'
                        }}
                      >
                        <span style={{
                          display: 'inline-block',
                          background: msg.from === 'her'
                            ? 'rgba(200,184,154,0.15)'
                            : 'rgba(61,4,8,0.9)',
                          borderRadius: '12px', padding: '5px 10px',
                          fontFamily: 'Cormorant Garamond, serif',
                          fontStyle: 'italic', fontSize: '13px',
                          color: '#F5EFE6',
                          border: '1px solid rgba(255,255,255,0.08)',
                          maxWidth: '90%'
                        }}>
                          {msg.text}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Chat input */}
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
                      color: '#F5EFE6', fontFamily: 'DM Sans',
                      fontSize: '12px', outline: 'none'
                    }}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); sendMessage() }}
                    style={{
                      background: '#C8B89A', border: 'none',
                      borderRadius: '10px', padding: '6px 10px',
                      color: '#6B0A14', fontFamily: 'DM Sans',
                      fontSize: '12px', fontWeight: 500, cursor: 'pointer'
                    }}
                  >↑</button>
                </div>
              </div>
            )}
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
