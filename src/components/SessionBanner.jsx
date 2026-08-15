import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './SessionBanner.css'

export default function SessionBanner({ type, visible, onHide }) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => onHide(), 4000)
    return () => clearTimeout(timer)
  }, [visible, onHide])

  const message =
    type === 'break'
      ? '✨ Break done! Back to it.'
      : '🍅 Session complete! Take a break, you earned it.'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="session-banner"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        >
          <span className="session-banner-text font-display">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/**
 * Helper hook to drive the SessionBanner show/hide state.
 * Returns { bannerType, bannerVisible, showBanner, hideBanner }
 */
export function useSessionBanner() {
  const [bannerType, setBannerType] = useState('focus')
  const [bannerVisible, setBannerVisible] = useState(false)

  const showBanner = useCallback((type = 'focus') => {
    setBannerType(type)
    setBannerVisible(true)
  }, [])

  const hideBanner = useCallback(() => {
    setBannerVisible(false)
  }, [])

  return { bannerType, bannerVisible, showBanner, hideBanner }
}
