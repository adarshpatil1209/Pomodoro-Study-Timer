import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Maximize2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function CalendarTodos() {
  const { user } = useAuth()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [todos, setTodos] = useState({})
  const [input, setInput] = useState('')
  const [subject, setSubject] = useState('General')
  const [priority, setPriority] = useState('normal')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 500)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e) => {
      if (panelRef.current && 
          !panelRef.current.contains(e.target) &&
          buttonRef.current && 
          !buttonRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen])

  const formatDate = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  useEffect(() => {
    if (!user) return

    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from('dated_todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      
      if (data) {
        // Group by date
        const grouped = {}
        data.forEach(todo => {
          const dateKey = todo.date
          if (!grouped[dateKey]) grouped[dateKey] = []
          grouped[dateKey].push(todo)
        })
        setTodos(grouped)
      }
      setLoading(false)
    }
    fetchTodos()

    const channel = supabase
      .channel(`dated-todos-${user.id}-` + Date.now())
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dated_todos', filter: `user_id=eq.${user.id}` },
        () => {
          fetchTodos()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const addTodo = async () => {
    if (!input.trim()) return
    const dateStr = formatDate(selectedDate)
    
    const { data, error } = await supabase
      .from('dated_todos')
      .insert({
        text: input.trim(),
        date: dateStr,
        subject,
        priority,
        user_id: user.id
      })
      .select()
      .single()
    
    if (data) {
      setTodos(prev => ({
        ...prev,
        [dateStr]: [...(prev[dateStr] || []), data]
      }))
      setInput('')
    }
  }

  const toggleTodo = async (id, dateStr, currentVal) => {
    // Optimistic UI update
    setTodos(prev => ({
      ...prev,
      [dateStr]: prev[dateStr].map(t => 
        t.id === id ? { ...t, completed: !currentVal } : t
      )
    }))

    await supabase
      .from('dated_todos')
      .update({ completed: !currentVal })
      .eq('id', id)
  }

  const deleteTodo = async (id, dateStr) => {
    // Optimistic UI update
    setTodos(prev => ({
      ...prev,
      [dateStr]: prev[dateStr].filter(t => t.id !== id)
    }))

    await supabase
      .from('dated_todos')
      .delete()
      .eq('id', id)
  }

  // Generate calendar days
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()
    
    const startOffset = firstDay === 0 ? 6 : firstDay - 1
    
    const days = []
    
    const prevMonthDays = new Date(year, month, 0).getDate()
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      })
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }
    
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const days = getDaysInMonth(currentMonth)
  const todayStr = formatDate(new Date())
  const selectedDateStr = formatDate(selectedDate)
  const selectedTodos = todos[selectedDateStr] || []

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const subjects = ['Physics', 'Chemistry', 'Botany', 'Zoology', 'Custom']

  return (
    <>
      {/* Floating Trigger Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: 'fixed',
          bottom: 120, // positioned above the chat widget
          left: 20,
          zIndex: 100,
          background: '#6B0A14',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '999px',
          padding: '8px 16px',
          color: '#F5EFE6',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
         Planner
      </motion.button>

      {/* Floating Calendar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              bottom: '80px',
              left: '20px',
              right: isMobile ? '20px' : 'auto',
              zIndex: 500,
              background: '#6B0A14',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.10)',
              padding: '20px 22px',
              width: isMobile ? 'calc(100vw - 40px)' : 'min(360px, calc(100vw - 40px))',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}
          >
            {/* Calendar Panel Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontFamily: 'DM Sans', fontSize: '11px', fontWeight: 700, color: '#9A7A6A', letterSpacing: '0.08em' }}>
                 STUDY PLANNER
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.14)',
                    color: '#C8B89A', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                  }}
                >
                  <Maximize2 size={12} />
                </motion.button>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.14)',
                    color: '#C8B89A', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                  }}
                >
                  <X size={12} />
                </motion.button>
              </div>
            </div>

            {/* Calendar Month Navigation Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <button onClick={prevMonth} style={{ background: 'transparent', border: 'none', color: '#F5EFE6', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: '18px', color: '#F5EFE6' }}>
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
              <button onClick={nextMonth} style={{ background: 'transparent', border: 'none', color: '#F5EFE6', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</button>
            </div>

            {/* Days of week */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} style={{ fontFamily: 'DM Sans', fontSize: '10px', color: '#9A7A6A', textAlign: 'center' }}>{d}</div>
              ))}
            </div>

            {/* Date Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '20px' }}>
              {days.map((day, i) => {
                const dateStr = formatDate(day.date)
                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDateStr
                const dayTodos = todos[dateStr] || []
                const hasTodos = dayTodos.length > 0
                const allCompleted = hasTodos && dayTodos.every(t => t.completed)

                return (
                  <motion.div
                    key={i}
                    onClick={() => {
                      setSelectedDate(day.date)
                      if (!day.isCurrentMonth) {
                        setCurrentMonth(new Date(day.date.getFullYear(), day.date.getMonth(), 1))
                      }
                    }}
                    whileHover={day.isCurrentMonth ? { scale: 1.1 } : {}}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      width: 'clamp(28px, 8vw, 36px)',
                      height: 'clamp(28px, 8vw, 36px)',
                      borderRadius: '50%',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      background: isSelected ? '#C8B89A' : 'transparent',
                      color: isSelected ? '#6B0A14' : (day.isCurrentMonth ? '#C8B89A' : 'rgba(200,184,154,0.25)'),
                      border: isToday && !isSelected ? '1px solid rgba(200,184,154,0.40)' : '1px solid transparent',
                      fontFamily: 'DM Sans, sans-serif',
                      fontSize: 'clamp(10px, 2.5vw, 13px)',
                      position: 'relative'
                    }}
                  >
                    {day.date.getDate()}
                    {hasTodos && (
                      <div style={{
                        position: 'absolute', bottom: '4px',
                        width: '4px', height: '4px', borderRadius: '50%',
                        background: allCompleted ? '#7DAA96' : '#D4893A'
                      }} />
                    )}
                  </motion.div>
                )
              })}
            </div>

            {/* Selected Date Section */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.10)', paddingTop: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '12px' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: '16px', color: '#F5EFE6' }}>
                  {selectedDate.toLocaleString('default', { weekday: 'long' })}, {selectedDate.getDate()} {selectedDate.toLocaleString('default', { month: 'short' })}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '11px', color: '#9A7A6A' }}>
                  {selectedTodos.length} tasks
                </div>
              </div>

              {/* Task List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', marginBottom: '12px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <AnimatePresence>
                  {selectedTodos.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        textAlign: 'center', padding: '20px 0',
                        fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
                        fontSize: '14px', color: '#9A7A6A'
                      }}
                    >
                      No tasks for this day 🌸
                    </motion.div>
                  ) : (
                    selectedTodos.map(todo => (
                      <motion.div
                        key={todo.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px',
                          background: 'rgba(200,184,154,0.05)',
                          padding: '8px 12px', borderRadius: '12px',
                          position: 'relative'
                        }}
                      >
                        <button
                          onClick={() => toggleTodo(todo.id, formatDate(selectedDate), todo.completed)}
                          style={{
                            width: '18px', height: '18px', borderRadius: '50%',
                            border: `2px solid ${todo.completed ? '#7DAA96' : 'rgba(255,255,255,0.3)'}`,
                            background: todo.completed ? '#7DAA96' : 'transparent',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0, flexShrink: 0
                          }}
                        >
                          {todo.completed && <span style={{ color: '#3D0408', fontSize: '12px' }}></span>}
                        </button>
                        
                        <div style={{
                          flex: 1,
                          fontFamily: 'DM Sans, sans-serif', fontSize: '13px',
                          color: todo.completed ? '#9A7A6A' : '#F5EFE6',
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          wordBreak: 'break-word'
                        }}>
                          {todo.text}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {todo.priority === 'high' && (
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#D4893A' }} />
                          )}
                          <div style={{
                            background: 'rgba(255,255,255,0.08)', borderRadius: '999px',
                            padding: '2px 6px', fontFamily: 'DM Sans', fontSize: '9px',
                            color: '#C8B89A'
                          }}>
                            {todo.subject}
                          </div>
                          
                          <button
                            onClick={() => deleteTodo(todo.id, formatDate(selectedDate))}
                            style={{
                              background: 'transparent', border: 'none', color: '#9A7A6A',
                              cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {/* Add Task Input */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addTodo() }}
                    placeholder="Add task for this day..."
                    style={{
                      flex: 1, background: '#7D1020',
                      border: '1px solid rgba(255,255,255,0.14)',
                      borderRadius: '12px', padding: '8px 12px',
                      color: '#F5EFE6', fontFamily: 'DM Sans, sans-serif',
                      fontSize: '12px', outline: 'none'
                    }}
                  />
                  <button
                    onClick={addTodo}
                    style={{
                      background: '#C8B89A', border: 'none',
                      borderRadius: '12px', padding: '0 12px',
                      color: '#6B0A14', cursor: 'pointer',
                      fontFamily: 'DM Sans', fontSize: '18px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                  >+</button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Subjects horizontal scroll */}
                  <div style={{
                    display: 'flex', gap: '4px', overflowX: 'auto', scrollbarWidth: 'none',
                    paddingBottom: '2px'
                  }}>
                    {subjects.map(s => (
                      <button
                        key={s}
                        onClick={() => setSubject(s)}
                        style={{
                          background: subject === s ? 'rgba(255,255,255,0.15)' : 'transparent',
                          border: '1px solid rgba(255,255,255,0.14)',
                          borderRadius: '999px', padding: '2px 8px',
                          color: subject === s ? '#F5EFE6' : '#9A7A6A',
                          fontFamily: 'DM Sans', fontSize: '10px', cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  
                  {/* Priority Toggle */}
                  <button
                    onClick={() => setPriority(p => p === 'normal' ? 'high' : 'normal')}
                    style={{
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      fontFamily: 'DM Sans', fontSize: '10px', color: priority === 'high' ? '#D4893A' : '#9A7A6A',
                      display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', marginLeft: '8px'
                    }}
                  >
                     {priority}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
