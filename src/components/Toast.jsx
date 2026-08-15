import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Toast.css'

export default function Toast({ message, visible, onHide }) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => onHide(), 3000)
    return () => clearTimeout(timer)
  }, [visible, onHide])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="toast font-display"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
