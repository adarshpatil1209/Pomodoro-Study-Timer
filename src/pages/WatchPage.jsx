import React, { useState, useEffect, useRef } from 'react'
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

export default function WatchPage() {
  // All state
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [herStream, setHerStream] = useState(null)
  const [viewerStream, setViewerStream] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('waiting')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Refs
  const herVideoRef = useRef(null)
  const myVideoRef = useRef(null)
  const pcRef = useRef(null)
  const channelRef = useRef(null)
  const viewerStreamRef = useRef(null)
  const iceCandidateBuffer = useRef([])
  const remoteDescSet = useRef(false)
  const messagesEndRef = useRef(null)

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

  // Initialize watch connections when authenticated
  useEffect(() => {
    if (authed) {
      initWatch()
    }
  }, [authed])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      channelRef.current?.send({
        type: 'broadcast', event: 'viewer-left', payload: {}
      })
      viewerStreamRef.current?.getTracks().forEach(t => t.stop())
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }
      channelRef.current?.unsubscribe()
    }
  }, [])

  const initWatch = async () => {
    setIsConnecting(true)

    // Start own camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      })
      viewerStreamRef.current = stream
      setViewerStream(stream)
    } catch (e) {
      console.error('Viewer camera error:', e)
    }

    // Setup channel
    const channel = supabase.channel(CHANNEL_NAME, {
      config: { broadcast: { self: false }, presence: { key: 'viewer' } }
    })
    channelRef.current = channel

    // Receive offer from her
    channel.on('broadcast', { event: 'offer' }, async ({ payload }) => {
      console.log('VIEWER: received offer')
      if (!pcRef.current) await createPeerConnection()
      
      const pc = pcRef.current
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
        remoteDescSet.current = true
        
        // flush buffered ICE
        for (const c of iceCandidateBuffer.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c))
        }
        iceCandidateBuffer.current = []
        
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        channel.send({
          type: 'broadcast', event: 'answer',
          payload: { sdp: answer }
        })
        console.log('VIEWER: sent answer with type:', answer.type)
      } catch (e) {
        console.error('VIEWER: offer handling error', e)
      }
    })

    // Receive ICE from her
    channel.on('broadcast', { event: 'ice-her' }, async ({ payload }) => {
      if (!payload.candidate) return
      if (remoteDescSet.current && pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate))
        } catch (e) { console.error('VIEWER: ICE error', e) }
      } else {
        iceCandidateBuffer.current.push(payload.candidate)
      }
    })

    // Receive chat from her
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (payload.from === 'her') {
        const msg = { ...payload, id: Date.now() + Math.random() }
        setMessages(prev => [...prev.slice(-4), msg])
      }
    })

    channel.subscribe(async (status) => {
      console.log('VIEWER channel:', status)
      if (status === 'SUBSCRIBED') {
        await channel.track({ role: 'viewer' })
        
        // Wait 1.5s then send viewer-ready
        setTimeout(() => {
          channel.send({
            type: 'broadcast',
            event: 'viewer-ready',
            payload: {}
          })
          console.log('VIEWER: sent viewer-ready')
          setIsConnecting(false)
        }, 1500)
      }
    })
  }

  const createPeerConnection = async () => {
    if (pcRef.current) pcRef.current.close()
    remoteDescSet.current = false
    iceCandidateBuffer.current = []

    const pc = new RTCPeerConnection(ICE_SERVERS)
    pcRef.current = pc

    if (viewerStreamRef.current) {
      viewerStreamRef.current.getTracks().forEach(t => 
        pc.addTrack(t, viewerStreamRef.current)
      )
    }

    pc.ontrack = (event) => {
      console.log('VIEWER: got her stream!')
      const stream = event.streams[0]
      setHerStream(stream)
      setConnectionStatus('connected')
      
      setTimeout(() => {
        if (herVideoRef.current) {
          herVideoRef.current.srcObject = stream
          herVideoRef.current.play()
            .then(() => console.log('VIEWER: her video playing'))
            .catch(e => console.error('VIEWER: play error', e))
        }
      }, 100)
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channelRef.current.send({
          type: 'broadcast', event: 'ice-viewer',
          payload: { candidate: event.candidate }
        })
      }
    }

    pc.onconnectionstatechange = () => {
      console.log('VIEWER connection:', pc.connectionState)
      if (pc.connectionState === 'connected') setConnectionStatus('connected')
      if (pc.connectionState === 'failed') setConnectionStatus('failed')
      if (pc.connectionState === 'disconnected') setConnectionStatus('disconnected')
    }

    return pc
  }

  const sendMessage = () => {
    if (!chatInput.trim()) return
    const msg = { text: chatInput, from: 'viewer', id: Date.now(), time: Date.now() }
    channelRef.current.send({
      type: 'broadcast', event: 'chat', payload: msg
    })
    setMessages(prev => [...prev.slice(-4), msg])
    setChatInput('')
  }

  const reconnect = () => {
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    iceCandidateBuffer.current = []
    remoteDescSet.current = false
    setConnectionStatus('waiting')
    setHerStream(null)
    setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast', event: 'viewer-ready', payload: {}
      })
      console.log('VIEWER: reconnect sent')
    }, 500)
  }

  // Bind media stream source objects safely to UI once DOM elements mount
  useEffect(() => {
    if (herStream && herVideoRef.current) {
      herVideoRef.current.srcObject = herStream
    }
  }, [herStream])

  useEffect(() => {
    if (viewerStream && myVideoRef.current) {
      myVideoRef.current.srcObject = viewerStream
    }
  }, [viewerStream])

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

  const getStatusPill = () => {
    if (connectionStatus === 'connected') {
      return (
        <div style={{
          background: 'rgba(125,170,150,0.15)', color: '#7DAA96',
          borderRadius: '999px', padding: '6px 14px', fontSize: '12px',
          fontWeight: 600, fontFamily: 'DM Sans'
        }}>
          ● Live
        </div>
      )
    }
    if (connectionStatus === 'failed') {
      return (
        <div style={{
          background: 'rgba(176,48,48,0.15)', color: '#B03030',
          borderRadius: '999px', padding: '6px 14px', fontSize: '12px',
          fontWeight: 600, fontFamily: 'DM Sans'
        }}>
          ● Failed
        </div>
      )
    }
    return (
      <div style={{
        background: 'rgba(212,137,58,0.15)', color: '#D4893A',
        borderRadius: '999px', padding: '6px 14px', fontSize: '12px',
        fontWeight: 600, fontFamily: 'DM Sans'
      }}>
        ● Waiting
      </div>
    )
  }

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
        {getStatusPill()}
      </div>

      {/* Main Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '2fr 1.2fr',
        gap: '20px',
        alignItems: 'start'
      }}>
        {/* LEFT — Her video (large) */}
        <div style={{
          background: '#6B0A14', borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.10)',
          overflow: 'hidden', position: 'relative', display: 'flex',
          flexDirection: 'column'
        }}>
          {herStream ? (
            <video
              ref={herVideoRef}
              autoPlay
              playsInline
              muted={false}
              style={{
                width: '100%',
                borderRadius: '24px',
                background: '#3D0408',
                objectFit: 'cover',
                aspectRatio: '4/3',
                display: 'block'
              }}
            />
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              aspectRatio: '4/3', width: '100%'
            }}>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                  fontSize: '18px', color: '#9A7A6A'
                }}
              >
                Waiting for her camera... 🌸
              </motion.div>
            </div>
          )}
          <span style={{
            position: 'absolute', bottom: '16px', left: '16px',
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: '14px', color: '#F5EFE6', background: 'rgba(0,0,0,0.4)',
            borderRadius: '999px', padding: '4px 10px'
          }}>
            her 🌸
          </span>
        </div>

        {/* RIGHT — Controls Panel */}
        <div style={{
          background: '#6B0A14', borderRadius: '24px', padding: '20px',
          border: '1px solid rgba(255,255,255,0.10)', display: 'flex',
          flexDirection: 'column', gap: '16px'
        }}>
          {/* My Video */}
          <div style={{
            position: 'relative', borderRadius: '14px',
            overflow: 'hidden', aspectRatio: '4/3'
          }}>
            <video
              ref={myVideoRef}
              autoPlay playsInline muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: 'scaleX(-1)', display: 'block', background: '#3D0408'
              }}
            />
            <span style={{
              position: 'absolute', bottom: '12px', left: '12px',
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: '12px', color: '#F5EFE6', background: 'rgba(0,0,0,0.4)',
              borderRadius: '999px', padding: '3px 8px'
            }}>
              you
            </span>
          </div>

          {/* Section Divider */}
          <div style={{
            borderBottom: '1px solid rgba(255, 255, 255, 0.10)',
            margin: '4px 0'
          }} />

          {/* Messages list */}
          <div style={{
            maxHeight: '200px', overflowY: 'auto', display: 'flex',
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

          {/* Reconnect button */}
          <motion.button
            onClick={reconnect}
            whileHover={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%', background: 'transparent', color: '#C8B89A',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px',
              padding: '10px 16px', fontFamily: 'DM Sans', fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            🔄 Reconnect
          </motion.button>
        </div>
      </div>
    </div>
  )
}
