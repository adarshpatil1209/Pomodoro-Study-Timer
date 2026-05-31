import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/* ── helpers ─────────────────────────────────────────────────── */
function attachDebugListeners(pc) {
  if (!pc) return
  pc.onconnectionstatechange = () =>
    console.log('[WebRTC] Connection state:', pc.connectionState)
  pc.onicegatheringstatechange = () =>
    console.log('[WebRTC] ICE gathering:', pc.iceGatheringState)
  pc.onsignalingstatechange = () =>
    console.log('[WebRTC] Signaling state:', pc.signalingState)
}

const CHANNEL_NAME = 'studywatch-signal'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

/**
 * Shared WebRTC + signaling hook.
 *
 * @param {object}   opts
 * @param {boolean}  opts.enabled       — whether to subscribe at all
 * @param {boolean}  opts.isInitiator   — true = her side, false = viewer side
 * @param {string}   opts.presenceKey   — 'host' | 'viewer'
 * @param {function} opts.onChat        — called when remote chat msg arrives
 * @param {string}   opts.chatFrom      — 'her' | 'viewer' — identity of THIS side
 */
export function useWebRTC({ enabled, isInitiator, presenceKey, onChat, chatFrom }) {
  const [localStream,   setLocalStream]   = useState(null)
  const [remoteStream,  setRemoteStream]  = useState(null)
  // 'idle' | 'pending' | 'granted' | 'denied'
  const [cameraStatus,  setCameraStatus]  = useState('idle')
  const [peerConnected, setPeerConnected] = useState(false)
  const [viewerPresent, setViewerPresent] = useState(false)

  const peerRef           = useRef(null)
  const channelRef        = useRef(null)
  const streamRef         = useRef(null)
  const subscribedRef     = useRef(false)
  const signalBuffer      = useRef([])
  const viewerReadyRef    = useRef(false)   // host: has viewer announced ready?
  const onChatRef         = useRef(onChat)  // keep fresh ref to avoid re-subscribing
  onChatRef.current = onChat

  // ── Camera ───────────────────────────────────────────────────────────────
  const getCameraPermission = useCallback(async () => {
    setCameraStatus('pending')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      streamRef.current = stream
      setLocalStream(stream)
      setCameraStatus('granted')
      return stream
    } catch {
      setCameraStatus('denied')
      return null
    }
  }, [])

  // ── Peer lifecycle ────────────────────────────────────────────────────────
  const startPeer = useCallback(
    (stream) => {
      if (peerRef.current) return      // already running
      if (!channelRef.current) return  // channel not ready yet
      if (!subscribedRef.current) {    // FIX 3 — wait for subscription
        console.warn('[WebRTC] startPeer called before channel subscribed — skipping')
        return
      }

      // Lazy-load simple-peer to avoid SSR / polyfill issues
      import('simple-peer').then(({ default: SimplePeer }) => {
        const peer = new SimplePeer({
          initiator: isInitiator,
          stream: stream || streamRef.current,
          trickle: true,              // enable trickle ICE — we buffer correctly now
          config: ICE_SERVERS,
        })

        peer.on('signal', (data) => {
          channelRef.current?.send({
            type: 'broadcast',
            event: 'signal',
            payload: data,
          })
        })

        peer.on('stream', (remote) => {
          setRemoteStream(remote)
        })

        peer.on('connect', () => setPeerConnected(true))
        peer.on('close',   () => {
          setPeerConnected(false)
          peerRef.current = null
          setRemoteStream(null)
        })
        peer.on('error',   (e) => console.error('[WebRTC] peer error', e))

        peerRef.current = peer

        // FIX 2 — attach debug logging to the underlying RTCPeerConnection
        // simple-peer exposes _pc after construction
        try { attachDebugListeners(peer._pc) } catch { /* noop */ }

        // FIX 1 — flush any signals that arrived before peer existed
        if (signalBuffer.current.length > 0) {
          console.log(`[WebRTC] Flushing ${signalBuffer.current.length} buffered signal(s)`)
          for (const sig of signalBuffer.current) {
            peer.signal(sig)
          }
          signalBuffer.current = []
        }
      })
    },
    [isInitiator],
  )

  const destroyPeer = useCallback(() => {
    peerRef.current?.destroy()
    peerRef.current = null
    signalBuffer.current = []
    setPeerConnected(false)
    setRemoteStream(null)
    setViewerPresent(false)
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setLocalStream(null)
    setCameraStatus('idle')
  }, [])

  // ── Supabase Realtime channel ─────────────────────────────────────────────
  useEffect(() => {
    if (!enabled) return

    const channel = supabase.channel(CHANNEL_NAME, {
      config: {
        broadcast: { self: false },
        presence: { key: presenceKey },
      },
    })

    channelRef.current = channel

    // ── WebRTC signaling: buffer if peer isn't ready yet ──
    channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
      if (peerRef.current) {
        try {
          peerRef.current.signal(payload)
        } catch (err) {
          console.warn('[WebRTC] signal() failed, buffering:', err.message)
          signalBuffer.current.push(payload)
        }
      } else {
        console.log('[WebRTC] Peer not ready — buffering signal')
        signalBuffer.current.push(payload)
      }
    })

    // ── Chat messages — only accept from the OTHER side ──
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      // chatFrom = identity of THIS side, so we only accept msgs NOT from us
      if (payload.from !== chatFrom) {
        onChatRef.current?.(payload)
      }
    })

    // ── Viewer-ready handshake ──
    if (isInitiator) {
      // Host: listen for viewer announcing readiness
      channel.on('broadcast', { event: 'viewer-ready' }, () => {
        console.log('[WebRTC] HOST: viewer-ready received')
        viewerReadyRef.current = true
        setViewerPresent(true)
        // If camera already on → start peer immediately
        if (streamRef.current && !peerRef.current && subscribedRef.current) {
          console.log('[WebRTC] HOST: camera already on, creating offer now')
          startPeer(streamRef.current)
        }
      })

      // Also keep presence sync as fallback and to detect leaving
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const hasViewer = Object.values(state).some((presences) =>
          presences.some((p) => p.role === 'viewer'),
        )
        setViewerPresent(hasViewer)
        if (!hasViewer) {
          viewerReadyRef.current = false
        }
      })
    }

    // ── Subscribe & track presence ──
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        subscribedRef.current = true
        await channel.track({ role: presenceKey, joinedAt: Date.now() })
        console.log(`[WebRTC] Channel subscribed (${presenceKey})`)

        // Viewer: announce readiness after a short delay
        if (!isInitiator) {
          setTimeout(() => {
            channel.send({
              type: 'broadcast',
              event: 'viewer-ready',
              payload: {},
            })
            console.log('[WebRTC] VIEWER: sent viewer-ready')
          }, 1000)
        }
      }
    })

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
      subscribedRef.current = false
      signalBuffer.current  = []
      viewerReadyRef.current = false
    }
  }, [enabled, isInitiator, presenceKey, chatFrom, startPeer])

  // ── Host side: start peer when viewer is ready AND camera is ready ─────────
  useEffect(() => {
    if (!isInitiator) return

    if (viewerPresent && localStream && !peerRef.current && subscribedRef.current) {
      console.log('[WebRTC] HOST: viewer present + camera ready → startPeer')
      startPeer(localStream)
    }
    if (!viewerPresent && peerRef.current) {
      console.log('[WebRTC] HOST: viewer left, destroying peer')
      peerRef.current.destroy()
      peerRef.current = null
      setPeerConnected(false)
      setRemoteStream(null)
    }
  }, [viewerPresent, localStream, isInitiator, startPeer])

  // ── Chat ─────────────────────────────────────────────────────────────────
  const sendChat = useCallback((text, from) => {
    if (!channelRef.current || !text.trim()) return null
    const payload = { text: text.trim(), from, time: Date.now() }
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload })
    return payload
  }, [])

  // Reconnect: tear down current peer & re-init
  const reconnect = useCallback(() => {
    console.log('[WebRTC] Manual reconnect triggered')
    peerRef.current?.destroy()
    peerRef.current = null
    signalBuffer.current = []
    setPeerConnected(false)
    setRemoteStream(null)

    const stream = streamRef.current
    if (stream && subscribedRef.current) {
      if (!isInitiator) {
        // Viewer: resend viewer-ready so host creates a new offer
        channelRef.current?.send({
          type: 'broadcast',
          event: 'viewer-ready',
          payload: {},
        })
        console.log('[WebRTC] VIEWER: reconnect — resent viewer-ready')
      } else {
        // Host: just re-init peer directly
        setTimeout(() => startPeer(stream), 500)
      }
    }
  }, [startPeer, isInitiator])

  return {
    localStream,
    remoteStream,
    cameraStatus,
    peerConnected,
    viewerPresent,
    getCameraPermission,
    startPeer,
    destroyPeer,
    stopCamera,
    sendChat,
    reconnect,
  }
}
