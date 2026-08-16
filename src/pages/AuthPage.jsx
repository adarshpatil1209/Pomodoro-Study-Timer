import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const AuthPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') || 'signup'
  const [mode, setMode] = useState(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()

  const handleSubmit = async () => {
    setError('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signInWithEmail(email, password)
      if (error) setError(error.message)
      else navigate('/app')
    } else {
      if (!name.trim()) {
        setError('Name is required')
        setLoading(false)
        return
      }
      const { data, error } = await signUpWithEmail(email, password, name)
      if (error) setError(error.message)
      else if (data?.user) navigate('/app')
      else setError('Check your email to confirm signup!')
    }
    setLoading(false)
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
    setError('')
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <h1 style={styles.logo}>PomoXP</h1>
          <p style={styles.tagline}>Study smarter. Together.</p>
        </div>

        {/* Google Button */}
        <motion.button
          style={styles.googleBtn}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={signInWithGoogle}
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 10, flexShrink: 0 }}>
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
          </svg>
          Continue with Google
        </motion.button>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(200,184,154,0.50)' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(200,184,154,0.50)' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
            />

            <div style={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...styles.input, marginBottom: 0, paddingRight: 44 }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(200,184,154,0.50)' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.14)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9A7A6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9A7A6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  style={styles.error}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, x: [0, -8, 8, -8, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              style={styles.submitBtn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={loading}
              type="button"
            >
              {loading
                ? '...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </motion.button>
          </motion.div>
        </AnimatePresence>

        {/* Toggle */}
        <p style={styles.toggle}>
          {mode === 'login' ? "Don't have an account? " : 'Already have one? '}
          <span onClick={toggleMode} style={styles.toggleLink}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#3D0408',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    background: '#6B0A14',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.10)',
    padding: 40,
    maxWidth: 400,
    width: '100%',
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: 32,
    background: 'rgba(61,4,8,0.6)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: '24px 24px 0 0',
  },
  logo: {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#F5EFE6',
    fontSize: 52,
    lineHeight: 1,
    margin: 0,
  },
  tagline: {
    fontFamily: "'Cormorant Garamond', serif",
    fontStyle: 'italic',
    fontWeight: 300,
    fontSize: 20,
    color: '#9A7A6A',
    margin: '8px 0 0',
  },
  googleBtn: {
    width: '100%',
    background: '#fff',
    color: '#3D0408',
    border: 'none',
    borderRadius: 14,
    padding: 12,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 500,
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: 'rgba(255,255,255,0.08)',
  },
  dividerText: {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 11,
    color: '#9A7A6A',
  },
  input: {
    width: '100%',
    background: '#7D1020',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: '10px 14px',
    color: '#F5EFE6',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    outline: 'none',
    marginBottom: 12,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  passwordWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
    alignItems: 'center',
  },
  error: {
    color: '#B03030',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    margin: '0 0 12px',
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #B03030, #8B1A1A)',
    color: '#F5EFE6',
    border: 'none',
    borderRadius: 14,
    padding: '13px 0',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
    marginTop: 4,
  },
  toggle: {
    textAlign: 'center',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 12,
    color: '#9A7A6A',
    marginTop: 20,
    marginBottom: 0,
  },
  toggleLink: {
    color: '#F5EFE6',
    cursor: 'pointer',
    textDecoration: 'underline',
    textUnderlineOffset: 2,
  },
}

export default AuthPage
