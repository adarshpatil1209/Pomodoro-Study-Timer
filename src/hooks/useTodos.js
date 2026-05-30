import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useTodos({ onComplete } = {}) {
  const [todos, setTodos] = useState([])

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const fetchTodos = useCallback(async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching todos:', error)
    } else {
      setTodos(data || [])
    }
  }, [])

  useEffect(() => {
    fetchTodos()
  }, [fetchTodos])

  const addTodo = useCallback(async (text, subject, priority) => {
    const { data, error } = await supabase
      .from('todos')
      .insert([{ text, subject, priority, completed: false }])
      .select()

    if (error) {
      console.error('Error adding todo:', error)
      return
    }

    if (data) {
      setTodos((prev) => [data[0], ...prev])
    }
  }, [])

  const toggleTodo = useCallback(async (id) => {
    const todo = todos.find((t) => t.id === id)
    if (!todo) return

    const newCompleted = !todo.completed

    const { error } = await supabase
      .from('todos')
      .update({ completed: newCompleted })
      .eq('id', id)

    if (error) {
      console.error('Error toggling todo:', error)
      return
    }

    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: newCompleted } : t))
    )

    // Fire onComplete only when completing (not uncompleting)
    if (newCompleted && onCompleteRef.current) {
      onCompleteRef.current({ ...todo, completed: true })
    }
  }, [todos])

  const deleteTodo = useCallback(async (id) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting todo:', error)
      return
    }

    setTodos((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { todos, addTodo, toggleTodo, deleteTodo }
}
