import { useState, useEffect } from 'react'

export default function ClockLoader() {
  const [showRefresh, setShowRefresh] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowRefresh(true), 4000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#3D0408',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg) }
          to { transform: rotate(360deg) }
        }
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
      `}</style>
      
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="22" stroke="rgba(200,184,154,0.2)" strokeWidth="2" fill="none" />
        <line
          x1="24" y1="24" x2="24" y2="14"
          stroke="#C8B89A" strokeWidth="2" strokeLinecap="round"
          style={{ transformOrigin: '24px 24px', animation: 'spin 6s linear infinite' }}
        />
        <line
          x1="24" y1="24" x2="24" y2="10"
          stroke="rgba(200,184,154,0.5)" strokeWidth="1.5" strokeLinecap="round"
          style={{ transformOrigin: '24px 24px', animation: 'spin 1s linear infinite' }}
        />
        <circle cx="24" cy="24" r="2" fill="#C8B89A" />
      </svg>

      <span style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '18px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        color: '#C8B89A',
        textTransform: 'uppercase',
        marginTop: '20px',
        animation: 'fadeIn 0.4s ease 0.2s both'
      }}>
        PomoXP
      </span>

      {showRefresh && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 300,
            fontSize: '12px',
            color: '#9A7A6A',
            marginTop: '12px'
          }}>
            Taking longer than usual
          </span>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '8px',
              padding: '6px 16px',
              color: '#C8B89A',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  )
}
