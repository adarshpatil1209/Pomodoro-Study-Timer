import './Skeleton.css'

export function SkeletonTimerCard() {
  return (
    <div className="skel-timer-card">
      <div className="skel-timer-tabs">
        <div className="skel skel-timer-tab" />
        <div className="skel skel-timer-tab" />
        <div className="skel skel-timer-tab" />
      </div>
      <div className="skel skel-timer-circle" />
      <div className="skel skel-timer-button" />
    </div>
  )
}

export function SkeletonStatsCard() {
  return (
    <div className="skel-stats-card">
      <div className="skel skel-stats-item" />
      <div className="skel skel-stats-item" />
      <div className="skel skel-stats-item" />
      <div className="skel skel-stats-item" />
    </div>
  )
}

export function SkeletonTodoCard() {
  return (
    <div className="skel-todo-card">
      <div className="skel skel-todo-row" />
      <div className="skel skel-todo-row" />
      <div className="skel skel-todo-row" />
    </div>
  )
}
