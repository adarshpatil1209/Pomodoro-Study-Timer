import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const featureCards = [
  {
    title: 'Pomodoro Timer',
    description: 'Stay focused with proven 25-minute sessions. Track every session, build streaks, and measure real progress.'
  },
  {
    title: 'Study Rooms',
    description: 'Create a private room and study with a partner. Share a code, join instantly, and stay accountable together.'
  },
  {
    title: 'Progress Tracking',
    description: 'Weekly charts, session history, and streaks that show you how far you have come.'
  }
]

const LandingPage = () => {
  const navigate = useNavigate()
  const featuresRef = useRef(null)

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div style={styles.page}>
      <div style={styles.orbLayer} aria-hidden="true">
        <motion.div
          style={{ ...styles.orb, top: -80, left: -60 }}
          animate={{ y: [0, 30, 0], x: [0, 15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ ...styles.orb, width: 200, height: 200, bottom: '10%', right: -40, background: 'rgba(125, 16, 32, 0.35)' }}
          animate={{ y: [0, -25, 0], x: [0, -10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        />
        <motion.div
          style={{ ...styles.orb, width: 120, height: 120, top: '50%', left: '20%', background: 'rgba(125, 170, 150, 0.06)' }}
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 7 }}
        />
      </div>

      <section style={styles.heroSection}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={styles.heroContent}
        >
          <h1 style={styles.heroHeading}>Focus deeper.<br />Study together.</h1>
          <p style={styles.heroSubheading}>
            A Pomodoro timer built for focused work and real-time study rooms.
          </p>

          <div style={styles.buttonRow}>
            <motion.button
              style={styles.primaryButton}
              whileHover={{ scale: 1.03, background: '#EDE0D4' }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/auth')}
              type="button"
            >
              Get started
            </motion.button>

            <motion.button
              style={styles.secondaryButton}
              whileHover={{ background: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.98 }}
              onClick={scrollToFeatures}
              type="button"
            >
              See how it works
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ y: [0, 6, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          style={styles.scrollIndicator}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </section>

      <section ref={featuresRef} style={styles.featuresSection}>
        <p style={styles.sectionLabel}>EVERYTHING YOU NEED</p>
        <div style={styles.cardsGrid}>
          {featureCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              style={styles.featureCard}
            >
              <h3 style={styles.cardTitle}>{card.title}</h3>
              <p style={styles.cardDescription}>{card.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={styles.ctaSection}>
        <h2 style={styles.ctaTitle}>Ready to focus?</h2>
        <p style={styles.ctaText}>
          Join thousands of students and professionals who use PomoXP to get more done.
        </p>
        <motion.button
          style={styles.primaryButton}
          whileHover={{ scale: 1.03, background: '#EDE0D4' }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/auth')}
          type="button"
        >
          Get started free
        </motion.button>
      </section>

      <footer style={styles.footer}>
        <span style={styles.footerLeft}>PomoXP</span>
        <span style={styles.footerRight}>Built for focused people.</span>
      </footer>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#3D0408',
    color: '#F5EFE6',
    position: 'relative',
    overflow: 'hidden',
  },
  orbLayer: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  orb: {
    position: 'absolute',
    width: 300,
    height: 300,
    background: 'rgba(107, 10, 20, 0.5)',
    borderRadius: '50%',
  },
  heroSection: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    padding: '24px 24px 80px',
    position: 'relative',
    zIndex: 1,
  },
  heroContent: {
    textAlign: 'center',
    maxWidth: 760,
    width: '100%',
  },
  heroHeading: {
    fontFamily: '"Cormorant Garamond", serif',
    fontWeight: 600,
    fontStyle: 'italic',
    fontSize: 'clamp(40px, 7vw, 80px)',
    lineHeight: 1.1,
    letterSpacing: '-0.01em',
    color: '#F5EFE6',
    margin: 0,
  },
  heroSubheading: {
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 300,
    fontSize: 16,
    lineHeight: 1.6,
    color: '#9A7A6A',
    maxWidth: 480,
    margin: '16px auto 0',
    textAlign: 'center',
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 12,
    marginTop: 36,
    flexWrap: 'wrap',
  },
  primaryButton: {
    background: '#C8B89A',
    color: '#6B0A14',
    border: 'none',
    borderRadius: 12,
    padding: '12px 28px',
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.2s ease, transform 0.2s ease',
  },
  secondaryButton: {
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12,
    padding: '12px 28px',
    color: '#C8B89A',
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 500,
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  scrollIndicator: {
    marginTop: 48,
    color: '#9A7A6A',
    opacity: 0.5,
  },
  featuresSection: {
    padding: '80px 40px',
    maxWidth: 900,
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  sectionLabel: {
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 300,
    fontSize: 11,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#9A7A6A',
    margin: '0 0 48px',
    textAlign: 'center',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 18,
  },
  featureCard: {
    background: '#6B0A14',
    borderRadius: 20,
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '28px 24px',
    transition: 'transform 0.2s ease',
  },
  cardTitle: {
    fontFamily: '"Cormorant Garamond", serif',
    fontWeight: 600,
    fontSize: 20,
    color: '#F5EFE6',
    margin: 0,
  },
  cardDescription: {
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 300,
    fontSize: 13,
    lineHeight: 1.6,
    color: '#9A7A6A',
    margin: '8px 0 0',
  },
  ctaSection: {
    padding: '80px 40px 60px',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
  ctaTitle: {
    fontFamily: '"Cormorant Garamond", serif',
    fontWeight: 600,
    fontStyle: 'italic',
    fontSize: 40,
    color: '#F5EFE6',
    margin: 0,
  },
  ctaText: {
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 300,
    fontSize: 14,
    color: '#9A7A6A',
    margin: '12px auto 0',
    maxWidth: 520,
    lineHeight: 1.6,
  },
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  footerLeft: {
    fontFamily: '"DM Sans", sans-serif',
    fontWeight: 400,
    fontSize: 13,
    color: '#9A7A6A',
  },
  footerRight: {
    fontFamily: '"Cormorant Garamond", serif',
    fontStyle: 'italic',
    fontSize: 13,
    color: '#9A7A6A',
  },
}

export default LandingPage
