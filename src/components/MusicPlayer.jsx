import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Music } from 'lucide-react'
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
  const [activePreset, setActivePreset] = useState(null)
  const [customUrl, setCustomUrl] = useState('')
  const [currentId, setCurrentId] = useState(null)

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

  const embedSrc = useMemo(() => {
    if (!currentId) return null
    return `https://www.youtube.com/embed/${currentId}?autoplay=1&enablejsapi=1`
  }, [currentId])

  return (
    <>
      {/* Collapsed pill */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
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

      {/* Expanded panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="music-panel"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            style={{ transformOrigin: 'bottom right' }}
          >
            {/* Header */}
            <div className="music-header">
              <span className="section-label">STUDY MUSIC</span>
              <button
                className="btn-circle music-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Close music player"
              >
                <X size={14} />
              </button>
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

            {/* YouTube embed */}
            {embedSrc && (
              <div className="music-embed-container">
                <iframe
                  className="music-iframe"
                  src={embedSrc}
                  title="Study music"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  frameBorder="0"
                />
              </div>
            )}

            {!embedSrc && (
              <div className="music-placeholder">
                Pick a preset or paste a link to start playing
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
