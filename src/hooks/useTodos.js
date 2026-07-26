import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useTodos({ onComplete } = {}) {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    if (user) fetchTodos()
  }, [user])

  const fetchTodos = async () => {
    const { data } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    if (data) setTodos(data)
    setLoading(false)
  }

  const addTodo = async (text, subject = 'General', priority = 'normal') => {
    const { data } = await supabase
      .from('todos')
      .insert({ text, subject, priority, completed: false, user_id: user.id })
      .select()
      .single()
    if (data) setTodos(prev => [...prev, data])
  }

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    const newCompleted = !todo.completed
    await supabase
      .from('todos')
      .update({ completed: newCompleted })
      .eq('id', id)
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, completed: newCompleted } : t
    ))

    if (newCompleted && onCompleteRef.current) {
      onCompleteRef.current({ ...todo, completed: true })
    }
  }

  const deleteTodo = async (id) => {
    await supabase.from('todos').delete().eq('id', id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  const bulkAddTodos = (newTodos) => {
    setTodos(prev => [...prev, ...newTodos])
  }

  return { todos, loading, addTodo, toggleTodo, deleteTodo, bulkAddTodos }
}

export default useTodos
