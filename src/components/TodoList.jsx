import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import './TodoList.css'

const getTodayStr = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const SUBJECTS = ['Physics', 'Chemistry', 'Botany', 'Zoology', 'Custom']

function Checkbox({ checked, onToggle }) {
  return (
    <button className="todo-checkbox" onClick={onToggle} aria-label="Toggle task">
      <AnimatePresence mode="wait">
        {checked && (
          <motion.svg
            key="check"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            className="todo-checkmark"
          >
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="var(--surface)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </motion.svg>
        )}
      </AnimatePresence>
    </button>
  )
}

function TodoRow({ todo, onToggle, onDelete }) {
  return (
    <motion.div
      className="todo-row"
      layout
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      whileHover={{ x: 4, transition: { type: 'spring', bounce: 0, duration: 0.3 } }}
    >
      {/* Priority dot */}
      {todo.priority === 'high' && <span className="todo-priority-dot" />}

      <Checkbox
        checked={todo.completed}
        onToggle={() => onToggle(todo.id)}
      />

      <span className={`todo-text ${todo.completed ? 'todo-text--done' : ''}`}>
        {todo.text}
      </span>

      {todo.subject && (
        <span className="todo-subject-badge">{todo.subject}</span>
      )}

      <button
        className="todo-delete-btn"
        onClick={() => onDelete(todo.id)}
        aria-label="Delete task"
      >
        <Trash2 size={14} />
      </button>
    </motion.div>
  )
}

export default function TodoList({ todosHook, onTaskComplete }) {
  const { user } = useAuth()
  const { todos, addTodo, toggleTodo, deleteTodo, bulkAddTodos } = todosHook

  const [text, setText] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('Physics')
  const [customSubject, setCustomSubject] = useState('')
  const [priority, setPriority] = useState('normal')

  const [copied, setCopied] = useState(false)
  const [nothingToCopy, setNothingToCopy] = useState(false)

  useEffect(() => {
    const lastCopied = localStorage.getItem('tasks-copied-date')
    const today = getTodayStr()
    if (lastCopied === today) setCopied(true)
  }, [])

  const copyFromCalendar = async () => {
    const today = getTodayStr()
    
    // Fetch today's tasks from dated_todos
    const { data: calendarTasks } = await supabase
      .from('dated_todos')
      .select('*')
      .eq('date', today)
      .eq('completed', false)  // only incomplete tasks
      .eq('user_id', user.id)
    
    if (!calendarTasks || calendarTasks.length === 0) {
      // Nothing to copy — show brief message
      setNothingToCopy(true)
      setTimeout(() => setNothingToCopy(false), 2000)
      return
    }
    
    // Insert into todos table
    const toInsert = calendarTasks.map(t => ({
      text: t.text,
      subject: t.subject,
      priority: t.priority,
      completed: false,
      user_id: user.id
    }))
    
    const { data: inserted } = await supabase
      .from('todos')
      .insert(toInsert)
      .select()
    
    if (inserted) {
      if (bulkAddTodos) {
        bulkAddTodos(inserted)
      } else {
        // fallback if hook not updated yet
        window.location.reload()
      }
      setCopied(true)
      localStorage.setItem('tasks-copied-date', today)
    }
  }

  const handleAdd = () => {
    const trimmed = text.trim()
    if (!trimmed) return

    let finalSubject = selectedSubject
    if (selectedSubject === 'Custom') {
      finalSubject = customSubject.trim() || 'Custom'
    }

    addTodo(trimmed, finalSubject, priority)
    setText('')
    setPriority('normal')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleToggle = (id) => {
    const todo = todos.find((t) => t.id === id)
    if (todo && !todo.completed && onTaskComplete) {
      onTaskComplete(todo)
    }
    toggleTodo(id)
  }

  return (
    <div className="todo-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span className="section-label" style={{ marginBottom: 0 }}>TODAY'S TASKS</span>
        
        {nothingToCopy ? (
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            style={{
              fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
              fontSize: '13px', color: '#9A7A6A'
            }}
          >
            No tasks in Planner for today
          </motion.span>
        ) : copied ? (
          <span style={{ fontFamily: 'DM Sans', fontSize: '11px', color: '#7DAA96' }}>
            ✓ Copied from Planner today
          </span>
        ) : (
          <motion.button
            onClick={copyFromCalendar}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: 'rgba(125,170,150,0.12)', border: '1px solid rgba(125,170,150,0.25)',
              borderRadius: '999px', padding: '4px 12px',
              fontFamily: 'DM Sans', fontSize: '11px', color: '#7DAA96', cursor: 'pointer'
            }}
          >
            📅 Copy today from Planner
          </motion.button>
        )}
      </div>

      <div className="todo-card card">
        {/* Add task row */}
        <div className="todo-add-area">
          <div className="todo-input-row">
            <input
              type="text"
              className="todo-input"
              placeholder="Add a task..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button className="btn-primary todo-add-btn" onClick={handleAdd}>
              <Plus size={16} />
            </button>
          </div>

          {/* Subject chips */}
          <div className="todo-subject-chips" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            {SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                className={`todo-subject-chip ${selectedSubject === s ? 'todo-subject-chip--active' : ''}`}
                onClick={() => setSelectedSubject(s)}
              >
                {s}
              </button>
            ))}
            <AnimatePresence>
              {selectedSubject === 'Custom' && (
                <motion.input
                  key="custom-subject"
                  type="text"
                  className="todo-custom-subject-input"
                  placeholder="Subject name..."
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 100, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                  style={{ overflow: 'hidden' }}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Priority toggle */}
          <button
            className={`todo-priority-toggle ${priority === 'high' ? 'todo-priority-toggle--high' : ''}`}
            onClick={() => setPriority(priority === 'high' ? 'normal' : 'high')}
          >
            {priority === 'high' ? '⚠️ High' : 'Normal'}
          </button>
        </div>

        {/* Divider */}
        <div className="todo-divider" />

        {/* Task list */}
        <div className="todo-list">
          <AnimatePresence mode="popLayout">
            {todos.length === 0 ? (
              <motion.div
                key="empty"
                className="todo-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Nothing to do baddie ,  Add your first task above
              </motion.div>
            ) : (
              todos.map((todo) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  onToggle={handleToggle}
                  onDelete={deleteTodo}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
