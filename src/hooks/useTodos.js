import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useTodos({ onComplete } = {}) {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const getTodayStr = () => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  useEffect(() => {
    fetchTodayTodos()
    subscribeToTodayTodos()
  }, [])

  const fetchTodayTodos = async () => {
    const today = getTodayStr()
    const { data, error } = await supabase
      .from('dated_todos')
      .select('*')
      .eq('date', today)
      .order('created_at', { ascending: true })

    if (data) setTodos(data)
    setLoading(false)
  }

  const subscribeToTodayTodos = () => {
    const today = getTodayStr()
    
    supabase
      .channel('todays-todos-' + Date.now())
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dated_todos',
          filter: `date=eq.${today}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTodos(prev => {
              if (prev.find(t => t.id === payload.new.id)) return prev
              return [...prev, payload.new]
            })
          }
          if (payload.eventType === 'UPDATE') {
            setTodos(prev => prev.map(t =>
              t.id === payload.new.id ? payload.new : t
            ))
          }
          if (payload.eventType === 'DELETE') {
            setTodos(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()
  }

  const addTodo = async (text, subject = 'General', priority = 'normal') => {
    const today = getTodayStr()
    const { data, error } = await supabase
      .from('dated_todos')
      .insert({ text, date: today, subject, priority })
      .select()
      .single()

    if (data) setTodos(prev => [...prev, data])
  }

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return

    const newCompleted = !todo.completed

    const { error } = await supabase
      .from('dated_todos')
      .update({ completed: newCompleted })
      .eq('id', id)

    if (!error) {
      setTodos(prev => prev.map(t =>
        t.id === id ? { ...t, completed: newCompleted } : t
      ))

      if (newCompleted && onCompleteRef.current) {
        onCompleteRef.current({ ...todo, completed: true })
      }
    }
  }

  const deleteTodo = async (id) => {
    await supabase
      .from('dated_todos')
      .delete()
      .eq('id', id)

    setTodos(prev => prev.filter(t => t.id !== id))
  }

  return { todos, loading, addTodo, toggleTodo, deleteTodo }
}

export default useTodos
