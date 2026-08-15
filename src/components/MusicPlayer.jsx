import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Music } from 'lucide-react'
import './MusicPlayer.css'

const PRESETS = [
  { label: 'Lo-fi beats', id: 'jfKfPfyJRdk' },
  { label: 'Classical focus', id: '4oStw0r33so' },
  { label: 'Rain sounds', id: 'mPZkdNFkNps' },
  { label: 'Piano study', id: 'lTRiuFIWV54' },
]

function extractVideoId(input) {
  if (!input) return null
  const trimmed = input.trim()

  // Plain video ID (11 chars)
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed

  // Full YouTube URL patterns
  try {
    const url = new URL(trimmed)
    if (url.hostname.includes('youtube.com')) {
      // /watch?v=ID
      const v = url.searchParams.get('v')
      if (v) return v
      // /embed/ID or /live/ID
      const parts = url.pathname.split('/')
      const idx = parts.indexOf('embed') !== -1
        ? parts.indexOf('embed')
        : parts.indexOf('live') !== -1
          ? parts.indexOf('live')
          : -1
      if (idx !== -1 && parts[idx + 1]) return parts[idx + 1]
    }
    if (url.hostname === 'youtu.be') {
      return url.pathname.slice(1)
    }
  } catch {
    // Not a URL, treat as raw ID
    if (trimmed.length >= 8 && trimmed.length <= 16) return trimmed
  }

  return null
}

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activePreset, setActivePreset] = useState(null)
  const [customUrl, setCustomUrl] = useState('')
  const [currentId, setCurrentId] = useState(null)
  
  const panelRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    if (!isOpen || isMinimized) return
    const handleClickOutside = (e) => {
      if (panelRef.current && 
          !panelRef.current.contains(e.target) &&
          buttonRef.current && 
          !buttonRef.current.contains(e.target)) {
        setIsOpen(false)
        setIsMinimized(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, isMinimized])

  useEffect(() => {
    if (!isOpen || isMinimized) return
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setIsMinimized(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, isMinimized])

  const handlePreset = (preset) => {
    setActivePreset(preset.id)
    setCurrentId(preset.id)
  }

  const handleCustomPlay = () => {
    const id = extractVideoId(customUrl)
    if (id) {
      setActivePreset(null)
      setCurrentId(id)
    }
  }

  const handleCustomKeyDown = (e) => {
    if (e.key === 'Enter') handleCustomPlay()
  }

  const handleMinimize = () => {
    setIsMinimized(true)
  }

  const handleRestore = () => {
    setIsMinimized(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  const embedSrc = useMemo(() => {
    if (!currentId) return null
    return `https://www.youtube.com/embed/${currentId}?autoplay=1&enablejsapi=1`
  }, [currentId])

  return (
    <>
      {/* Collapsed pill — shown when panel is fully closed */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            ref={buttonRef}
            className="music-pill"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Music size={14} />
            <span>Music</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Minimized pill — shown when panel is open but minimized */}
      <AnimatePresence>
        {isOpen && isMinimized && (
          <motion.button
            className="music-minimized-pill"
            onClick={handleRestore}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <span className="music-minimized-pulse" />
            <span>♪ playing...</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded panel — always mounted when isOpen, animated via height */}
      {isOpen && (
        <motion.div
          ref={panelRef}
          className="music-panel"
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{
            opacity: isMinimized ? 0 : 1,
            scale: isMinimized ? 0.85 : 1,
            y: isMinimized ? 20 : 0,
            height: isMinimized ? 0 : 'auto',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            transformOrigin: 'bottom right',
            overflow: isMinimized ? 'hidden' : 'visible',
            pointerEvents: isMinimized ? 'none' : 'auto',
          }}
        >
          {/* Header */}
          <div className="music-header">
            <span className="section-label">STUDY MUSIC</span>
            <div className="music-header-actions">
              <button
                className="music-header-btn"
                onClick={handleMinimize}
                aria-label="Minimize music player"
              >
                −
              </button>
              <button
                className="music-header-btn"
                onClick={handleClose}
                aria-label="Close music player"
              >
                ×
              </button>
            </div>
          </div>

          {/* Preset chips */}
          <div className="music-presets">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                className={`music-preset-chip ${activePreset === p.id ? 'music-preset-chip--active' : ''}`}
                onClick={() => handlePreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom URL */}
          <div className="music-custom-row">
            <input
              type="text"
              className="music-custom-input"
              placeholder="YouTube URL or ID"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              onKeyDown={handleCustomKeyDown}
            />
            <button className="btn-primary music-play-btn" onClick={handleCustomPlay}>
              Play
            </button>
          </div>

          {/* YouTube embed — NEVER unmounted, only hidden visually */}
          <div className={`music-embed-container ${isMinimized ? 'music-embed-hidden' : ''}`}>
            {embedSrc && (
              <iframe
                className="music-iframe"
                src={embedSrc}
                title="Study music"
                allow="autoplay; encrypted-media"
                allowFullScreen
                frameBorder="0"
              />
            )}
          </div>

          {!embedSrc && (
            <div className="music-placeholder">
              Pick a preset or paste a link to start playing
            </div>
          )}
        </motion.div>
      )}
    </>
  )
}
