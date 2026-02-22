import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { MessageCircle, X, Send, Globe, ChevronDown, Scale, Maximize2, Minimize2 } from 'lucide-react'
import { getApiUrl } from '../config'
import './ChatWidget.css'

const WELCOME_MESSAGES = {
  en: "Hello! I'm your Legal Aid Assistant. Tell me what happened and I'll guide you through your rights and next steps.",
  rw: "Muraho! Ndi Umufasha wawe w'Amategeko. Mbwira icyabaye kandi nzagufasha gusobanukirwa uburenganzira bwawe n'intambwe zikurikira."
}

const PLACEHOLDERS = {
  en: 'Describe what happened...',
  rw: 'Sobanura icyabaye...'
}

const LANG_LABELS = {
  en: { toggle: 'Kinyarwanda', current: 'English' },
  rw: { toggle: 'English', current: 'Kinyarwanda' }
}

const SOURCE_LABEL = { en: 'Legal Sources', rw: 'Inkomoko y\'Amategeko' }

export default function ChatWidget({ language: externalLanguage = 'en' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [language, setLanguage] = useState(externalLanguage)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [hasUnread, setHasUnread] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Sync language from parent context
  useEffect(() => {
    setLanguage(externalLanguage)
  }, [externalLanguage])

  // Show welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: WELCOME_MESSAGES[language],
        sources: [],
        timestamp: new Date()
      }])
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (isOpen) setHasUnread(false)
  }, [isOpen])

  // Update welcome message when language changes (if only welcome is there)
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        return [{ ...prev[0], content: WELCOME_MESSAGES[language] }]
      }
      return prev
    })
  }, [language])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (!isOpen && messages.length > 1) {
      setHasUnread(true)
    }
  }, [messages, isTyping])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'rw' : 'en')
  }

  const sendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || isTyping) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    // Build history for context (exclude welcome message)
    const history = messages
      .filter(m => m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const token = localStorage.getItem('token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const requestBody = {
        message: trimmed,
        language,
        conversationHistory: history
      }
      if (sessionId) requestBody.sessionId = sessionId

      const { data } = await axios.post(
        getApiUrl('api/chat/message'),
        requestBody,
        { headers }
      )

      // Save sessionId for conversation continuity
      if (data.data?.sessionId && !sessionId) {
        setSessionId(data.data.sessionId)
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.data.response,
        sources: data.data.sources || [],
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: language === 'en'
          ? 'Sorry, I encountered an error. Please try again or visit your nearest police station for immediate help.'
          : 'Ihangane, habaye ikibazo. Ongera ugerageze cyangwa usure polisi yo hafi.',
        sources: [],
        isError: true,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="chat-widget">
      {/* ── Floating Button ─── */}
      <button
        className={`chat-fab ${isOpen ? 'chat-fab--open' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Open Legal Aid Chat"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        {!isOpen && hasUnread && <span className="chat-fab__badge" />}
      </button>

      {/* ── Chat Panel ─── */}
      {isOpen && (
        <div className={`chat-panel ${isExpanded ? 'chat-panel--expanded' : ''}`}>
          {/* Header */}
          <div className="chat-panel__header">
            <div className="chat-panel__header-left">
              <div className="chat-panel__avatar">
                <Scale size={18} />
              </div>
              <div>
                <div className="chat-panel__title">
                  {language === 'en' ? 'Legal Aid Assistant' : 'Umufasha w\'Amategeko'}
                </div>
                <div className="chat-panel__subtitle">
                  {language === 'en' ? 'Powered by Rwanda Penal Code' : 'Ishingiye ku Mategeko y\'u Rwanda'}
                </div>
              </div>
            </div>
            <div className="chat-panel__header-right">
              <button className="chat-lang-toggle" onClick={toggleLanguage} title="Switch Language">
                <Globe size={14} />
                <span>{LANG_LABELS[language].toggle}</span>
              </button>
              <button className="chat-icon-btn" onClick={() => setIsExpanded(prev => !prev)} title={isExpanded ? 'Collapse' : 'Expand'}>
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button className="chat-close-btn" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`chat-message chat-message--${msg.role} ${msg.isError ? 'chat-message--error' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="chat-message__avatar">
                    <Scale size={14} />
                  </div>
                )}
                <div className="chat-message__content">
                  <div className="chat-message__bubble">
                    {/* Render message with basic markdown (bold, line breaks) */}
                    {formatMessageContent(msg.content)}
                  </div>

                  {/* Source citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <details className="chat-sources">
                      <summary>
                        <ChevronDown size={12} />
                        {SOURCE_LABEL[language]} ({msg.sources.length})
                      </summary>
                      <div className="chat-sources__list">
                        {msg.sources.map((src, i) => (
                          <details key={i} className="chat-source-item">
                            <summary className="chat-source-item__header">
                              <span className="chat-source-item__ref">{src.articleNumber}</span>
                              <span className="chat-source-item__type">{src.crimeType}</span>
                            </summary>
                            {src.lawText && (
                              <blockquote className="chat-source-item__law">
                                {src.lawText}
                              </blockquote>
                            )}
                            {src.summary && src.summary !== src.lawText && (
                              <p className="chat-source-item__summary">{src.summary}</p>
                            )}
                          </details>
                        ))}
                      </div>
                    </details>
                  )}

                  <div className="chat-message__time">{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="chat-message chat-message--assistant">
                <div className="chat-message__avatar">
                  <Scale size={14} />
                </div>
                <div className="chat-message__content">
                  <div className="chat-typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={PLACEHOLDERS[language]}
              rows={1}
              disabled={isTyping}
              maxLength={500}
            />
            <button
              className={`chat-send-btn ${input.trim() && !isTyping ? 'chat-send-btn--active' : ''}`}
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              aria-label="Send"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="chat-footer">
            {language === 'en'
              ? 'Responses based on Rwanda Penal Code. Not legal advice.'
              : 'Ibisubizo bishingiye ku Mategeko y\'u Rwanda. Si inama y\'ubutegetsi.'}
          </div>
        </div>
      )}
    </div>
  )
}

// Simple markdown-like formatter: bold (**text**) and line breaks
function formatMessageContent(text) {
  if (!text) return null
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const parts = line.split(/\*\*(.*?)\*\*/g)
    return (
      <p key={i} className={line.startsWith('**') || /^\d+\./.test(line.trim()) ? 'chat-line--step' : ''}>
        {parts.map((part, j) =>
          j % 2 === 1 ? <strong key={j}>{part}</strong> : part
        )}
      </p>
    )
  })
}
