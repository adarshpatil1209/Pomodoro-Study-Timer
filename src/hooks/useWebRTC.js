import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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
 */
export function useWebRTC({ enabled, isInitiator, presenceKey, onChat }) {
  const [localStream,   setLocalStream]   = useState(null)
  const [remoteStream,  setRemoteStream]  = useState(null)
  // 'idle' | 'pending' | 'granted' | 'denied'
  const [cameraStatus,  setCameraStatus]  = useState('idle')
  const [peerConnected, setPeerConnected] = useState(false)
  const [viewerPresent, setViewerPresent] = useState(false)

  const peerRef    = useRef(null)
  const channelRef = useRef(null)
  const streamRef  = useRef(null)

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

      // Lazy-load simple-peer to avoid SSR / polyfill issues
      import('simple-peer').then(({ default: SimplePeer }) => {
        const peer = new SimplePeer({
          initiator: isInitiator,
          stream: stream || streamRef.current,
          trickle: false,             // wait for full ICE gathering before sending
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
        peer.on('close',   () => { setPeerConnected(false); peerRef.current = null })
        peer.on('error',   (e) => console.error('[WebRTC] peer error', e))

        peerRef.current = peer
      })
    },
    [isInitiator],
  )

  const destroyPeer = useCallback(() => {
    peerRef.current?.destroy()
    peerRef.current = null
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

    // WebRTC signaling — relay signals to peer
    channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
      if (peerRef.current) {
        peerRef.current.signal(payload)
      }
    })

    // Chat messages from remote
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      onChat?.(payload)
    })

    // Presence tracking — host side watches for viewer joining
    if (isInitiator) {
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const hasViewer = Object.values(state).some((presences) =>
          presences.some((p) => p.role === 'viewer'),
        )
        setViewerPresent(hasViewer)
      })
    }

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ role: presenceKey, joinedAt: Date.now() })
      }
    })

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [enabled, isInitiator, presenceKey, onChat])

  // ── Host side: start peer when viewer joins AND camera is ready ───────────
  useEffect(() => {
    if (!isInitiator) return

    if (viewerPresent && localStream && !peerRef.current) {
      startPeer(localStream)
    }
    if (!viewerPresent && peerRef.current) {
      peerRef.current.destroy()
      peerRef.current = null
      setPeerConnected(false)
      setRemoteStream(null)
    }
  }, [viewerPresent, localStream, isInitiator, startPeer])

  // ── Chat ─────────────────────────────────────────────────────────────────
  const sendChat = useCallback((text, sender) => {
    if (!channelRef.current || !text.trim()) return null
    const payload = { text: text.trim(), sender, ts: Date.now() }
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload })
    return payload
  }, [])

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
  }
}
