import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

// ─── SVG ICONS ───────────────────────────────────────────────────────────────

const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8B89A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8B89A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
)

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8B89A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
)

const MessageIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8B89A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const CameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8B89A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const CpuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C8B89A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="14" x2="23" y2="14" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="14" x2="4" y2="14" />
  </svg>
)

// ─── DECORATIVE FLORAL SVG ────────────────────────────────────────────────────

const FloralAccent = () => (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ position: 'absolute', top: 12, right: 12 }}>
    <path
      d="M30 10 C30 10, 22 18, 22 26 C22 34, 30 38, 30 38 C30 38, 38 34, 38 26 C38 18, 30 10, 30 10Z"
      fill="rgba(90,10,20,0.5)"
    />
    <path
      d="M14 24 C14 24, 22 22, 26 30 C30 38, 26 46, 26 46 C26 46, 18 40, 18 32 C18 28, 14 24, 14 24Z"
      fill="rgba(90,10,20,0.35)"
    />
    <path
      d="M46 24 C46 24, 38 22, 34 30 C30 38, 34 46, 34 46 C34 46, 42 40, 42 32 C42 28, 46 24, 46 24Z"
      fill="rgba(90,10,20,0.35)"
    />
    <circle cx="30" cy="30" r="4" fill="rgba(107,10,20,0.6)" />
  </svg>
)

// ─── FEATURE CARDS DATA ───────────────────────────────────────────────────────

const features = [
  {
    icon: <ClockIcon />,
    title: 'Pomodoro Timer',
    description: '25-minute focus sessions with short and long breaks. Proven technique used by millions to beat procrastination.',
  },
  {
    icon: <UsersIcon />,
    title: 'Study Rooms',
    description: 'Create a private room with a 6-digit code. Invite one partner and study together in real time.',
  },
  {
    icon: <BarChartIcon />,
    title: 'Progress Tracking',
    description: 'Session counts, study hours, daily streaks, and a weekly chart to visualize your consistency.',
  },
  {
    icon: <MessageIcon />,
    title: 'Live Chat',
    description: 'Send messages to your study partner while you both work. Stay connected without distractions.',
  },
  {
    icon: <CameraIcon />,
    title: 'Instant Snaps',
    description: 'Send a quick photo to your partner. It appears as a small card and disappears when closed.',
  },
  {
    icon: <CpuIcon />,
    title: 'AI Assistant',
    description: 'Ask questions about anything you are working on. Get concise answers without leaving your study session.',
  },
]

// ─── HOW IT WORKS DATA ────────────────────────────────────────────────────────

const steps = [
  {
    number: '01',
    title: 'Create your account',
    description: 'Sign up with Google or email in under a minute. Set your goal and daily session target.',
  },
  {
    number: '02',
    title: 'Start solo or create a room',
    description: 'Study alone or generate a room code and share it with your study partner.',
  },
  {
    number: '03',
    title: 'Focus and track progress',
    description: 'Complete sessions, build streaks, and watch your progress grow over time.',
  },
]

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div style={{ background: '#3D0408', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>

      {/* ── AMBIENT ORBS ─────────────────────────────────────────────────── */}
      <motion.div
        style={{
          position: 'fixed',
          width: 600,
          height: 600,
          top: -200,
          left: -150,
          background: 'rgba(107,10,20,0.6)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        animate={{ x: [0, 20, 0], y: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={{
          position: 'fixed',
          width: 400,
          height: 400,
          bottom: -100,
          right: -100,
          background: 'rgba(107,10,20,0.5)',
          borderRadius: '50%',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        animate={{ x: [0, -15, 0], y: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      />
      <motion.div
        style={{
          position: 'fixed',
          width: 300,
          height: 300,
          top: '40%',
          left: '50%',
          background: 'rgba(125,170,150,0.08)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      />

      {/* ── NAVBAR ───────────────────────────────────────────────────────── */}
      <motion.nav
        style={{
          height: 60,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(61,4,8,0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          padding: '0 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 600,
          fontSize: 20,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: '#F5EFE6',
        }}>
          PomoXP
        </span>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            onClick={() => navigate('/auth?mode=login')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 10,
              padding: '8px 20px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 13,
              color: '#C8B89A',
              cursor: 'pointer',
            }}
            whileHover={{ background: 'rgba(255,255,255,0.06)', scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Sign in
          </motion.button>

          <motion.button
            onClick={() => navigate('/auth?mode=signup')}
            style={{
              background: '#C8B89A',
              color: '#6B0A14',
              border: 'none',
              borderRadius: 10,
              padding: '8px 20px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 13,
              cursor: 'pointer',
            }}
            whileHover={{ background: '#EDE0D4', scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Get started
          </motion.button>
        </div>
      </motion.nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 40px 80px',
        position: 'relative',
        zIndex: 1,
      }}>

        {/* Top label pill */}
        <motion.div
          style={{
            background: 'rgba(200,184,154,0.06)',
            border: '1px solid rgba(200,184,154,0.12)',
            borderRadius: 999,
            padding: '5px 16px',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: '#9A7A6A',
            marginBottom: 28,
            display: 'inline-block',
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Pomodoro. Progress. Partnership.
        </motion.div>

        {/* Main heading */}
        <div style={{ width: '100%' }}>
          <motion.div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600,
              fontSize: 'clamp(56px, 9vw, 100px)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              fontStyle: 'italic',
              color: '#F5EFE6',
              display: 'block',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Focus deeper.
          </motion.div>
          <motion.div
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600,
              fontSize: 'clamp(56px, 9vw, 100px)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
              fontStyle: 'italic',
              color: '#C8B89A',
              display: 'block',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            Together.
          </motion.div>
        </div>

        {/* Subheading */}
        <motion.p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            fontSize: 15,
            color: 'rgba(154,122,106,0.8)',
            maxWidth: 440,
            margin: '20px auto 0',
            lineHeight: 1.75,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          A Pomodoro timer with real-time study rooms, progress tracking,
          and an AI assistant — built for people who take their goals seriously.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: 36,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
        >
          <motion.button
            onClick={() => navigate('/auth?mode=signup')}
            style={{
              background: '#C8B89A',
              color: '#6B0A14',
              border: 'none',
              borderRadius: 12,
              padding: '13px 32px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 14,
              cursor: 'pointer',
            }}
            whileHover={{ background: '#EDE0D4', scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          >
            Start for free
          </motion.button>

          <motion.button
            onClick={() => navigate('/auth?mode=login')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 12,
              padding: '13px 32px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 14,
              color: '#C8B89A',
              cursor: 'pointer',
            }}
            whileHover={{ background: 'rgba(255,255,255,0.05)', scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            Sign in
          </motion.button>
        </motion.div>

        {/* Timer Preview Card */}
        <motion.div
          style={{
            marginTop: 64,
            maxWidth: 360,
            marginLeft: 'auto',
            marginRight: 'auto',
            width: '100%',
          }}
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            style={{
              background: '#6B0A14',
              borderRadius: 24,
              border: '1px solid rgba(255,255,255,0.10)',
              padding: '32px 28px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <FloralAccent />

            {/* Mode tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
              {['Focus', 'Short Break', 'Long Break'].map((tab, i) => (
                <div
                  key={tab}
                  style={{
                    background: i === 0 ? '#C8B89A' : 'transparent',
                    color: i === 0 ? '#6B0A14' : '#9A7A6A',
                    border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 999,
                    padding: '4px 14px',
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 12,
                  }}
                >
                  {tab}
                </div>
              ))}
            </div>

            {/* SVG Ring */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: 200, margin: '0 auto' }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="6"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#C8B89A"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="565"
                  strokeDashoffset="141"
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontFamily: "'DM Mono', monospace",
                fontWeight: 300,
                fontSize: 48,
                color: '#F5EFE6',
                lineHeight: 1,
              }}>
                18:45
              </div>
            </div>

            {/* Session dots */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: i < 2 ? '#C8B89A' : 'rgba(255,255,255,0.15)',
                  }}
                />
              ))}
            </div>

            {/* Start button */}
            <div style={{
              background: '#C8B89A',
              color: '#6B0A14',
              borderRadius: 14,
              padding: '10px 40px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              fontSize: 13,
              marginTop: 20,
              display: 'inline-block',
            }}>
              Focus
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            fontSize: 11,
            color: 'rgba(154,122,106,0.5)',
          }}>
            Scroll to explore
          </span>
          <motion.div
            style={{
              width: 1,
              height: 24,
              background: 'rgba(154,122,106,0.3)',
              transformOrigin: 'top',
            }}
            animate={{ scaleY: [0, 1, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────── */}
      <section style={{
        padding: '100px 40px',
        position: 'relative',
        zIndex: 1,
        maxWidth: 1100,
        margin: '0 auto',
      }}>

        {/* Section header */}
        <div style={{ textAlign: 'center' }}>
          <motion.div
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 999,
              padding: '5px 16px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 300,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              color: '#9A7A6A',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            What you get
          </motion.div>

          <motion.h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600,
              fontStyle: 'italic',
              fontSize: 'clamp(32px, 5vw, 52px)',
              color: '#F5EFE6',
              marginTop: 14,
              marginBottom: 0,
              textAlign: 'center',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Everything you need to stay focused.
          </motion.h2>
        </div>

        {/* Features grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginTop: 56,
        }}
          className="features-grid"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              style={{
                background: 'rgba(107,10,20,0.4)',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '28px 24px',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'default',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              whileHover={{ y: -4, borderColor: 'rgba(200,184,154,0.16)', transition: { type: 'spring', bounce: 0, duration: 0.3 } }}
            >
              {/* Corner accent */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 40,
                height: 40,
                borderTop: '1px solid rgba(200,184,154,0.06)',
                borderRight: '1px solid rgba(200,184,154,0.06)',
                borderTopRightRadius: 20,
              }} />

              {/* Top label */}
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.16em',
                color: '#9A7A6A',
                marginBottom: 12,
              }}>
                Feature
              </div>

              {/* Title */}
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                fontSize: 22,
                color: '#F5EFE6',
                letterSpacing: '-0.01em',
                marginBottom: 8,
              }}>
                {feature.title}
              </div>

              {/* Description */}
              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
                fontSize: 13,
                color: 'rgba(154,122,106,0.8)',
                lineHeight: 1.65,
                marginTop: 8,
              }}>
                {feature.description}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section style={{
        padding: '100px 40px',
        position: 'relative',
        zIndex: 1,
        maxWidth: 1100,
        margin: '0 auto',
      }}>

        {/* Section header */}
        <div style={{ textAlign: 'center' }}>
          <motion.div
            style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 999,
              padding: '5px 16px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 300,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              color: '#9A7A6A',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            How it works
          </motion.div>

          <motion.h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600,
              fontStyle: 'italic',
              fontSize: 'clamp(28px, 4vw, 44px)',
              color: '#F5EFE6',
              marginTop: 14,
              marginBottom: 0,
              textAlign: 'center',
            }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Up and running in seconds.
          </motion.h2>
        </div>

        {/* Steps */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginTop: 56,
        }}
          className="steps-grid"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              style={{ textAlign: 'center', padding: '0 20px', position: 'relative' }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
            >
              <div style={{
                fontFamily: "'DM Mono', monospace",
                fontWeight: 300,
                fontSize: 48,
                color: 'rgba(200,184,154,0.15)',
                lineHeight: 1,
                marginBottom: 16,
              }}>
                {step.number}
              </div>

              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 600,
                fontSize: 20,
                color: '#F5EFE6',
                marginBottom: 8,
              }}>
                {step.title}
              </div>

              <div style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 300,
                fontSize: 13,
                color: '#9A7A6A',
                lineHeight: 1.6,
              }}>
                {step.description}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────────────── */}
      <section style={{
        padding: '100px 40px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        <motion.h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontWeight: 600,
            fontStyle: 'italic',
            fontSize: 'clamp(40px, 6vw, 72px)',
            color: '#F5EFE6',
            margin: 0,
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Ready to focus?
        </motion.h2>

        <motion.p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 300,
            fontSize: 15,
            color: '#9A7A6A',
            marginTop: 12,
            marginBottom: 0,
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Join people who use PomoXP to get serious work done.
        </motion.p>

        <motion.button
          onClick={() => navigate('/auth?mode=signup')}
          style={{
            background: '#C8B89A',
            color: '#6B0A14',
            border: 'none',
            borderRadius: 12,
            padding: '14px 40px',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
            fontSize: 14,
            cursor: 'pointer',
            marginTop: 32,
            display: 'inline-block',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ background: '#EDE0D4', scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
        >
          Get started free
        </motion.button>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        position: 'relative',
        zIndex: 1,
      }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 600,
          fontSize: 16,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#9A7A6A',
        }}>
          PomoXP
        </span>

        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: 14,
          color: 'rgba(154,122,106,0.6)',
        }}>
          Built for focused people.
        </span>
      </footer>

      {/* ── RESPONSIVE STYLES ────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          .steps-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          nav {
            padding: 16px 20px !important;
          }
        }
      `}</style>
    </div>
  )
}
