import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const getTodayStr = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getYesterdayStr = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const year = yesterday.getFullYear()
  const month = String(yesterday.getMonth() + 1).padStart(2, '0')
  const day = String(yesterday.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const normalizeDateStr = (dateVal) => {
  if (!dateVal) return null
  // Supabase can return "2026-05-31T00:00:00" or "2026-05-31"
  // Always extract just YYYY-MM-DD
  return String(dateVal).split('T')[0]
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
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const timeout = setTimeout(() => {
      setLoading(false)
      setStats((prev) => prev || {
        user_id: user.id,
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
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        // Normalize the date field immediately on fetch
        const normalized = {
          ...data,
          last_study_date: normalizeDateStr(data.last_study_date),
          weekly_data: parseWeekly(data.weekly_data)
        }

        setStats(normalized)
      } catch (err) {
        console.error('fetchStats error:', err)
        setStats((prev) => prev || {
          user_id: user.id,
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
        setLoading(false)
      }
    }

    fetchStats()

    return () => clearTimeout(timeout)
  }, [user])

  const updateStats = useCallback(async (patch) => {
    // Step 1: update local state immediately using functional update
    setStats(prev => ({ ...prev, ...patch }))

    // Step 2: save to Supabase — no re-fetch after this
    const { error } = await supabase
      .from('user_stats')
      .update(patch)
      .eq('user_id', user.id)

    if (error) {
      console.error('Update error:', error)
      // revert using functional update
      setStats(prev => ({ ...prev, ...stats }))
    }
    // DO NOT call fetchStats() or setStats(data) after update
    // DO NOT re-fetch after saving — causes the flicker
  }, [stats, user])

  const addSession = useCallback(async (minutes) => {
    if (!stats) return

    const today = getTodayStr()
    const yesterday = getYesterdayStr()
    const lastDate = normalizeDateStr(stats.last_study_date)

    let newStreak = stats.streak_days || 0
    let newSessionsToday = stats.sessions_today || 0

    // Streak logic
    if (!lastDate) {
      // First ever session
      newStreak = 1
      newSessionsToday = 1
    } else if (lastDate === today) {
      // Same day — streak unchanged
      newStreak = stats.streak_days
      newSessionsToday = (stats.sessions_today || 0) + 1
    } else if (lastDate === yesterday) {
      // Consecutive day — increment streak
      newStreak = (stats.streak_days || 0) + 1
      newSessionsToday = 1
    } else {
      // Streak broke — restart
      newStreak = 1
      newSessionsToday = 1
    }

    // Weekly data
    const dayIndex = new Date().getDay() === 0
      ? 6
      : new Date().getDay() - 1

    const rawWeekly = stats.weekly_data
    let currentWeekly = [0,0,0,0,0,0,0]

    if (Array.isArray(rawWeekly)) {
      currentWeekly = rawWeekly
    } else if (typeof rawWeekly === 'string') {
      try { currentWeekly = JSON.parse(rawWeekly) } catch {}
    } else if (rawWeekly && typeof rawWeekly === 'object') {
      currentWeekly = Object.values(rawWeekly)
    }

    // Reset weekly data if new week
    const thisMonday = new Date()
    thisMonday.setDate(
      thisMonday.getDate() - (thisMonday.getDay() || 7) + 1
    )
    thisMonday.setHours(0,0,0,0)

    const lastStudyDate = lastDate ? new Date(lastDate) : null
    if (lastStudyDate && lastStudyDate < thisMonday) {
      currentWeekly = [0,0,0,0,0,0,0]
    }

    const newWeekly = [...currentWeekly]
    newWeekly[dayIndex] = (newWeekly[dayIndex] || 0) + 1

    const patch = {
      total_sessions: (stats.total_sessions || 0) + 1,
      total_minutes: (stats.total_minutes || 0) + minutes,
      streak_days: newStreak,
      last_study_date: today,
      sessions_today: newSessionsToday,
      weekly_data: newWeekly
    }

    // Update local state INSTANTLY
    setStats(prev => ({ ...prev, ...patch }))

    // Save to Supabase
    const { error } = await supabase
      .from('user_stats')
      .update(patch)
      .eq('user_id', user.id)

    if (error) {
      console.error('addSession error:', error)
      // Revert on error
      setStats(prev => ({ ...prev, ...stats }))
    }
  }, [stats, user])

  return { stats, loading, updateStats, addSession }
}
