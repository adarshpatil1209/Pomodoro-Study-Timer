import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const getToday = () => new Date().toISOString().split('T')[0]

const getDayIndex = () => {
  // 0=Mon, 1=Tue, ..., 6=Sun
  const day = new Date().getDay()
  return day === 0 ? 6 : day - 1
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
    const updated = { ...stats, ...patch }
    setStats(updated)  // update local state immediately (feels instant)

    const { error } = await supabase
      .from('user_stats')
      .update(patch)
      .eq('id', 1)

    if (error) {
      console.error('Update failed:', error)
      setStats(stats)  // revert if save failed
    }
  }, [stats])

  const addSession = useCallback(async (minutes) => {
    if (!stats) return

    const today = getToday()
    const dayIndex = getDayIndex()
    const isNewDay = stats.last_study_date !== today

    // Parse weekly data
    let weeklyData
    try {
      weeklyData = typeof stats.weekly_data === 'string'
        ? JSON.parse(stats.weekly_data)
        : Array.isArray(stats.weekly_data)
          ? [...stats.weekly_data]
          : [0, 0, 0, 0, 0, 0, 0]
    } catch {
      weeklyData = [0, 0, 0, 0, 0, 0, 0]
    }

    // Increment today's slot in weekly data
    weeklyData[dayIndex] = (weeklyData[dayIndex] || 0) + minutes

    const patch = {
      total_sessions: (stats.total_sessions || 0) + 1,
      total_minutes: (stats.total_minutes || 0) + minutes,
      sessions_today: isNewDay ? 1 : (stats.sessions_today || 0) + 1,
      streak_days: isNewDay ? (stats.streak_days || 0) + 1 : stats.streak_days,
      last_study_date: today,
      weekly_data: weeklyData,
    }

    await updateStats(patch)
  }, [stats, updateStats])

  return { stats, loading, updateStats, addSession }
}
