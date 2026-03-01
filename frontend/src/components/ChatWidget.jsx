import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { MessageCircle, X, Send, Globe, ChevronDown, Scale, Maximize2, Minimize2, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
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

const VOICE_LABELS = {
  en: { autoSpeak: 'Auto-speak', listening: 'Listening…', micTitle: 'Speak your message', speakTitle: 'Read aloud', stopTitle: 'Stop speaking' },
  rw: { autoSpeak: 'Vuga igisubizo', listening: 'Ntega inzebe…', micTitle: 'Vuga ubutumwa bwawe', speakTitle: 'Soma mu ijwi', stopTitle: 'Hagarika' }
}

// Languages supported by Web Speech API for our two languages
const SPEECH_LANG = { en: 'en-US', rw: 'rw-RW' }

export default function ChatWidget({ language: externalLanguage = 'en' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [language, setLanguage] = useState(externalLanguage)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const [hasUnread, setHasUnread] = useState(false)

  // Voice states
  const [isListening, setIsListening] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [speakingId, setSpeakingId] = useState(null)   // id of message currently being spoken

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const recognitionRef = useRef(null)   // holds SpeechRecognition instance

  // Pre-load voices so they're available immediately on first speak
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
    }
  }, [])

  // ── Voice Output ────────────────────────────────────────────────────────────
  const speakText = useCallback((text, msgId) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = SPEECH_LANG[language] || 'en-US'
    utterance.rate = 1.05    // Natural conversational pace
    utterance.pitch = 1.1    // Slightly higher = less flat
    utterance.volume = 1     // Full volume

    // Pick best available voice: prefer Google/Microsoft natural voices
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      const targetLang = SPEECH_LANG[language] || 'en-US'
      // Priority: Google > Microsoft > any matching language
      const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith(targetLang.split('-')[0]))
        || voices.find(v => v.name.includes('Microsoft') && v.lang.startsWith(targetLang.split('-')[0]))
        || voices.find(v => v.lang === targetLang)
        || voices.find(v => v.lang.startsWith(targetLang.split('-')[0]))
      if (preferred) utterance.voice = preferred
    }

    utterance.onstart  = () => setSpeakingId(msgId)
    utterance.onend    = () => setSpeakingId(null)
    utterance.onerror  = () => setSpeakingId(null)
    window.speechSynthesis.speak(utterance)
  }, [language])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeakingId(null)
  }, [])

  // Stop speaking when chat is closed
  useEffect(() => {
    if (!isOpen) stopSpeaking()
  }, [isOpen, stopSpeaking])

  // ── Voice Input ─────────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    // Stop any ongoing recognition first
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }
    const recognition = new SpeechRecognition()
    recognition.lang = SPEECH_LANG[language] || 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setIsListening(false)
      // Put text in input and auto-send
      sendVoiceMessage(transcript)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }, [language]) // eslint-disable-line react-hooks/exhaustive-deps

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

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
    await dispatchMessage(trimmed)
  }

  // Shared send logic used by both text input and voice
  const dispatchMessage = async (trimmed) => {
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

      // Auto-speak AI response if toggle is on
      if (autoSpeak) {
        speakText(data.data.response, assistantMessage.id)
      }
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

  // Called after voice recognition returns a transcript
  const sendVoiceMessage = (transcript) => {
    if (!transcript || isTyping) return
    dispatchMessage(transcript)
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
              {/* Auto-speak toggle */}
              <button
                className={`chat-icon-btn chat-autospeak-btn ${autoSpeak ? 'chat-autospeak-btn--on' : ''}`}
                onClick={() => { setAutoSpeak(p => !p); stopSpeaking() }}
                title={VOICE_LABELS[language].autoSpeak}
                aria-label={VOICE_LABELS[language].autoSpeak}
              >
                {autoSpeak ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </button>
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
                  <div className="chat-message__bubble-row">
                    <div className="chat-message__bubble">
                      {/* Render message with basic markdown (bold, line breaks) */}
                      {formatMessageContent(msg.content)}
                    </div>
                    {/* Speaker button on assistant messages */}
                    {msg.role === 'assistant' && (
                      <button
                        className={`chat-speak-btn ${speakingId === msg.id ? 'chat-speak-btn--active' : ''}`}
                        onClick={() => speakingId === msg.id ? stopSpeaking() : speakText(msg.content, msg.id)}
                        title={speakingId === msg.id ? VOICE_LABELS[language].stopTitle : VOICE_LABELS[language].speakTitle}
                        aria-label={speakingId === msg.id ? VOICE_LABELS[language].stopTitle : VOICE_LABELS[language].speakTitle}
                      >
                        {speakingId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      </button>
                    )}
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
            {/* Listening indicator */}
            {isListening && (
              <div className="chat-listening">
                <span className="chat-listening__dot" />
                {VOICE_LABELS[language].listening}
              </div>
            )}
            <div className="chat-input-row">
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? VOICE_LABELS[language].listening : PLACEHOLDERS[language]}
                rows={1}
                disabled={isTyping || isListening}
                maxLength={500}
              />
              {/* Mic button */}
              <button
                className={`chat-mic-btn ${isListening ? 'chat-mic-btn--listening' : ''}`}
                onClick={isListening ? stopListening : startListening}
                disabled={isTyping}
                title={VOICE_LABELS[language].micTitle}
                aria-label={VOICE_LABELS[language].micTitle}
              >
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
              <button
                className={`chat-send-btn ${input.trim() && !isTyping ? 'chat-send-btn--active' : ''}`}
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </div>
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
