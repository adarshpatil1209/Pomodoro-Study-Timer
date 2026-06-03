import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const getToday = () => new Date().toISOString().split('T')[0]

const getLocalDateStr = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
}

const getDayIndex = () => {
  // 0=Mon, 1=Tue, ..., 6=Sun
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
}

const parseWeekly = (raw) => {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) }
    catch { return [0,0,0,0,0,0,0] }
  }
  if (raw && typeof raw === 'object') {
    return Object.values(raw)
  }
  return [0,0,0,0,0,0,0]
}

export function useStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false)
      setStats((prev) => prev || {
        id: 1,
        name: 'love',
        display_name: 'love',
        total_sessions: 0,
        total_minutes: 0,
        streak_days: 0,
        last_study_date: null,
        daily_goal: 8,
        sessions_today: 0,
        weekly_data: [0, 0, 0, 0, 0, 0, 0]
      })
    }, 5000)

    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from('user_stats')
          .select('*')
          .eq('id', 1)
          .single()

        if (error) {
          console.error('Supabase error:', error)
          // Even on error, stop loading — show app with defaults
          setStats((prev) => prev || {
            id: 1,
            name: 'love',
            display_name: 'love',
            total_sessions: 0,
            total_minutes: 0,
            streak_days: 0,
            last_study_date: null,
            daily_goal: 8,
            sessions_today: 0,
            weekly_data: [0, 0, 0, 0, 0, 0, 0]
          })
        } else {
          setStats(data)
        }
      } catch (err) {
        console.error('Fetch failed:', err)
        // Fallback default so app never stays stuck
        setStats((prev) => prev || {
          id: 1,
          name: 'love',
          display_name: 'love',
          total_sessions: 0,
          total_minutes: 0,
          streak_days: 0,
          last_study_date: null,
          daily_goal: 8,
          sessions_today: 0,
          weekly_data: [0, 0, 0, 0, 0, 0, 0]
        })
      } finally {
        clearTimeout(timeout)
        setLoading(false) // ALWAYS runs — skeleton always clears
      }
    }

    fetchStats()

    return () => clearTimeout(timeout)
  }, [])

  const updateStats = useCallback(async (patch) => {
    // Step 1: update local state immediately using functional update
    setStats(prev => ({ ...prev, ...patch }))

    // Step 2: save to Supabase — no re-fetch after this
    const { error } = await supabase
      .from('user_stats')
      .update(patch)
      .eq('id', 1)

    if (error) {
      console.error('Update error:', error)
      // revert using functional update
      setStats(prev => ({ ...prev, ...stats }))
    }
    // DO NOT call fetchStats() or setStats(data) after update
    // DO NOT re-fetch after saving — causes the flicker
  }, [stats])

  const addSession = useCallback(async (minutes) => {
    if (!stats) return

    const today = getLocalDateStr()
    const lastDate = stats.last_study_date
    
    // Calculate streak
    const yd = new Date()
    yd.setDate(yd.getDate() - 1)
    const yesterday = `${yd.getFullYear()}-${String(yd.getMonth()+1).padStart(2,'0')}-${String(yd.getDate()).padStart(2,'0')}`

    let newStreak = stats.streak_days || 0

    if (!lastDate) {
      newStreak = 1
    } else if (lastDate === today) {
      newStreak = stats.streak_days  // same day no change
    } else if (lastDate === yesterday) {
      newStreak = (stats.streak_days || 0) + 1
    } else {
      newStreak = 1  // streak broke
    }

    // Weekly data update
    const dayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
    const currentWeekly = parseWeekly(stats.weekly_data)
    const newWeekly = [...currentWeekly]
    newWeekly[dayIndex] = (newWeekly[dayIndex] || 0) + 1

    const patch = {
      total_sessions: (stats.total_sessions || 0) + 1,
      total_minutes: (stats.total_minutes || 0) + minutes,
      streak_days: newStreak,
      last_study_date: today,
      sessions_today: lastDate === today 
        ? (stats.sessions_today || 0) + 1 
        : 1,
      weekly_data: newWeekly
    }

    // Update local state immediately
    setStats(prev => ({ ...prev, ...patch }))

    // Save to Supabase
    const { error } = await supabase
      .from('user_stats')
      .update(patch)
      .eq('id', 1)

    if (error) console.error('addSession error:', error)
  }, [stats])

  return { stats, loading, updateStats, addSession }
}
