import './Skeleton.css'

export function SkeletonTimerCard() {
  return (
    <div style={{
      width: '100%',
      borderRadius: '24px',
      border: '1px solid rgba(255,255,255,0.06)',
      padding: '24px',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
        <div className="skel-base" style={{ width: '80px', height: '30px', borderRadius: '999px', animationDelay: '0s' }} />
        <div className="skel-base" style={{ width: '80px', height: '30px', borderRadius: '999px', animationDelay: '0.15s' }} />
        <div className="skel-base" style={{ width: '80px', height: '30px', borderRadius: '999px', animationDelay: '0.3s' }} />
      </div>
      
      <div className="skel-base" style={{ width: '180px', height: '180px', borderRadius: '50%', margin: '20px auto', animationDelay: '0.45s' }} />
      
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
        <div className="skel-base" style={{ width: '60px', height: '24px', borderRadius: '999px', animationDelay: '0.6s' }} />
        <div className="skel-base" style={{ width: '60px', height: '24px', borderRadius: '999px', animationDelay: '0.75s' }} />
        <div className="skel-base" style={{ width: '60px', height: '24px', borderRadius: '999px', animationDelay: '0.9s' }} />
      </div>
      
      <div className="skel-base" style={{ width: '140px', height: '40px', borderRadius: '14px', margin: '0 auto', animationDelay: '1.05s' }} />
    </div>
  )
}

export function SkeletonStatsCard() {
  return (
    <div style={{
      width: '100%',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.06)',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="skel-base" style={{ width: '80px', height: '10px', borderRadius: '4px', marginBottom: '16px', animationDelay: '0s' }} />
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div className="skel-base" style={{ borderRadius: '16px', height: '80px', background: '#6B0A14', animationDelay: '0.1s' }} />
        <div className="skel-base" style={{ borderRadius: '16px', height: '80px', background: '#6B0A14', animationDelay: '0.2s' }} />
        <div className="skel-base" style={{ borderRadius: '16px', height: '80px', background: '#6B0A14', animationDelay: '0.3s' }} />
        <div className="skel-base" style={{ borderRadius: '16px', height: '80px', background: '#6B0A14', animationDelay: '0.4s' }} />
      </div>
    </div>
  )
}

export function SkeletonTodoCard() {
  return (
    <div style={{
      width: '100%',
      borderRadius: '20px',
      border: '1px solid rgba(255,255,255,0.06)',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="skel-base" style={{ width: '100%', height: '40px', borderRadius: '12px', marginBottom: '16px', animationDelay: '0s' }} />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div className="skel-base" style={{ width: '100%', height: '44px', borderRadius: '10px', animationDelay: '0.1s' }} />
        <div className="skel-base" style={{ width: '100%', height: '44px', borderRadius: '10px', animationDelay: '0.2s' }} />
        <div className="skel-base" style={{ width: '100%', height: '44px', borderRadius: '10px', animationDelay: '0.3s' }} />
      </div>
    </div>
  )
}
