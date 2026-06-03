import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SYSTEM_PROMPT = `You are a friendly and brilliant study assistant for a medical aspirant preparing for NEET. Your name is Suru AI. You help with Physics, Chemistry, Botany, and Zoology questions. Keep answers concise, clear, and use simple language. When explaining concepts, use examples. Add relevant emojis occasionally. If asked non-study questions, gently redirect to studying.`

const QUICK_QUESTIONS = [
  'What is osmosis?',
  "Explain Newton's laws",
  'DNA replication steps',
  'Photosynthesis formula',
]

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', padding: '8px 12px' }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#C8B89A',
          }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const askAI = async (question) => {
    if (!question.trim() || loading) return

    setLoading(true)

    const userMsg = { role: 'user', content: question, id: Date.now() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    try {
      const response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              ...messages.slice(-6).map((m) => ({
                role: m.role,
                content: m.content,
              })),
              { role: 'user', content: question },
            ],
            max_tokens: 1024,
            temperature: 0.7,
          }),
        }
      )

      const data = await response.json()
      const aiReply = data.choices[0].message.content

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: aiReply,
          id: Date.now() + 1,
        },
      ])
    } catch (err) {
      console.error('AI error:', err)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I could not connect. Try again! 😔',
          id: Date.now() + 1,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* AI Toggle Button */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        style={{
          position: 'fixed',
          bottom: 170,
          left: 20,
          zIndex: 101,
          background: '#6B0A14',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '999px',
          padding: '8px 16px',
          color: '#C8B89A',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        🧠 Ask AI
      </motion.button>

      {/* AI Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
              position: 'fixed',
              bottom: 220,
              left: 20,
              width: '320px',
              maxHeight: '480px',
              zIndex: 999,
              background: '#6B0A14',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.10)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontStyle: 'italic',
                  fontSize: '16px',
                  color: '#F5EFE6',
                }}
              >
                🧠 Suru AI
              </span>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#F5EFE6',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                maxHeight: '320px',
                overflowY: 'auto',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                marginBottom: '12px',
              }}
            >
              {/* Welcome message when empty */}
              {messages.length === 0 && !loading && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '20px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontStyle: 'italic',
                      fontSize: '14px',
                      color: '#9A7A6A',
                      margin: '0 0 16px 0',
                      lineHeight: '1.5',
                    }}
                  >
                    Hi! I'm Suru AI 🤖 Ask me anything about Physics,
                    Chemistry, Botany or Zoology and slayy! 💅
                  </p>

                  {/* Quick question chips */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      justifyContent: 'center',
                    }}
                  >
                    {QUICK_QUESTIONS.map((q) => (
                      <motion.button
                        key={q}
                        onClick={() => askAI(q)}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(255,255,255,0.12)',
                          borderRadius: '999px',
                          padding: '5px 10px',
                          fontFamily: 'DM Sans, sans-serif',
                          fontSize: '11px',
                          color: '#9A7A6A',
                          cursor: 'pointer',
                        }}
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              <AnimatePresence>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      alignSelf:
                        msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                    }}
                  >
                    <div
                      style={{
                        background:
                          msg.role === 'user'
                            ? 'rgba(200,184,154,0.15)'
                            : 'rgba(61,4,8,0.6)',
                        borderRadius:
                          msg.role === 'user'
                            ? '16px 16px 4px 16px'
                            : '16px 16px 16px 4px',
                        padding: '8px 12px',
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '12px',
                        color: '#F5EFE6',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading dots */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <div
                    style={{
                      background: 'rgba(61,4,8,0.6)',
                      borderRadius: '16px 16px 16px 4px',
                    }}
                  >
                    <LoadingDots />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Row */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                    askAI(input)
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                placeholder="Ask a study question..."
                style={{
                  flex: 1,
                  background: '#7D1020',
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  color: '#F5EFE6',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '12px',
                  outline: 'none',
                }}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  askAI(input)
                }}
                disabled={loading || !input.trim()}
                style={{
                  background: loading || !input.trim() ? '#9A7A6A' : '#C8B89A',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 10px',
                  color: '#6B0A14',
                  cursor:
                    loading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  opacity: loading || !input.trim() ? 0.5 : 1,
                }}
              >
                ↑
              </button>
            </div>

            {/* Clear chat button */}
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '10px',
                  color: '#9A7A6A',
                  cursor: 'pointer',
                  marginTop: '6px',
                  textAlign: 'center',
                  padding: '2px',
                }}
              >
                clear chat
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
