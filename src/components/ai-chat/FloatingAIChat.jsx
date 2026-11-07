import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bot, MessageCircle, X, Trash2, Send, Sparkles, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext.jsx'
import { useLanguage } from '../../i18n/LanguageContext.jsx'
import { askLegacyVaultAssistant, getChatbotSuggestions, isAssistantApiEnabled } from './chatService.js'
import { mapChatError, validateChatMessage } from './chatContract.mjs'
import { chatCopy } from './chatKnowledge.mjs'
import './floatingAIChat.css'

function newMessage(role, text, details = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    text,
    ...details,
  }
}

function ChatPanel({ language, user, onClose, isOpen }) {
  const strings = chatCopy[language] || chatCopy.en
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [starterSuggestions, setStarterSuggestions] = useState([])
  const [typedSuggestions, setTypedSuggestions] = useState({ query: '', suggestions: [] })
  const [followUpSuggestions, setFollowUpSuggestions] = useState([])
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const controllerRef = useRef(null)
  const pendingRef = useRef(false)
  const mountedRef = useRef(true)
  const apiMode = isAssistantApiEnabled()

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      controllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
  }, [messages, pending, error, isOpen])

  // Suggestions are retrieved from the curated FAQ catalog (not the AI provider).
  // Empty query requests starter prompts; typed queries are debounced by 250ms.
  useEffect(() => {
    if (!isOpen) return undefined
    let active = true
    const controller = new AbortController()
    const query = draft.trim().slice(0, 200)
    const timer = window.setTimeout(async () => {
      try {
        const result = await getChatbotSuggestions({
          query,
          language,
          role: user?.role, // Only used for local demo prompts; never sent as JSON to backend.
          signal: controller.signal,
        })
        if (!active || controller.signal.aborted) return
        if (query) setTypedSuggestions({ query, suggestions: result })
        else setStarterSuggestions(result)
      } catch {
        if (!active || controller.signal.aborted) return
        if (query) setTypedSuggestions({ query, suggestions: [] })
        else setStarterSuggestions([])
        // Starter/type-ahead failures are non-blocking. Sending a message still works.
      }
    }, query ? 250 : 0)
    return () => {
      active = false
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [isOpen, draft, language, user?.role])

  async function sendMessage(text = draft) {
    if (pendingRef.current) return
    let message
    try {
      message = validateChatMessage(text)
    } catch (err) {
      setError(mapChatError(err, language))
      return
    }
    const sent = newMessage('user', message)
    const previousHistory = messages
    setError('')
    setMessages((previous) => [...previous, sent])
    setDraft('')
    setFollowUpSuggestions([])
    setPending(true)
    pendingRef.current = true
    const controller = new AbortController()
    controllerRef.current = controller
    try {
      const answer = await askLegacyVaultAssistant({
        message,
        language,
        history: previousHistory,
        signal: controller.signal,
      })
      if (!mountedRef.current || controller.signal.aborted) return
      setMessages((previous) => [...previous, newMessage('assistant', answer.reply, {
        status: answer.status,
        topic: answer.topic,
      })])
      setFollowUpSuggestions(answer.suggestions)
    } catch (err) {
      if (mountedRef.current && !controller.signal.aborted) {
        setMessages((previous) => previous.map((item) => item.id === sent.id ? { ...item, failed: true } : item))
        setError(mapChatError(err, language))
      }
    } finally {
      pendingRef.current = false
      if (mountedRef.current && !controller.signal.aborted) setPending(false)
    }
  }

  function clearConversation() {
    controllerRef.current?.abort()
    pendingRef.current = false
    setMessages([])
    setDraft('')
    setPending(false)
    setError('')
    setFollowUpSuggestions([])
    inputRef.current?.focus()
  }

  const currentTypedSuggestions = draft.trim() && typedSuggestions.query === draft.trim().slice(0, 200)
    ? typedSuggestions.suggestions : []
  const shownPrompts = messages.length ? followUpSuggestions : starterSuggestions

  return (
    <section className="lv-ai-panel" aria-label={strings.heading} hidden={!isOpen}>
      <header className="lv-ai-header">
        <div className="lv-ai-avatar"><Bot size={22} aria-hidden="true" /></div>
        <div className="lv-ai-heading">
          <strong>{strings.heading}</strong>
          <span><span className="lv-ai-status-dot" />{apiMode ? strings.subtitleApi : strings.subtitleDemo}</span>
        </div>
        <button type="button" className="lv-ai-head-button" onClick={clearConversation} title={strings.clear} aria-label={strings.clear}>
          <Trash2 size={17} aria-hidden="true" />
        </button>
        <button type="button" className="lv-ai-head-button" onClick={onClose} aria-label={strings.close}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="lv-ai-transcript" role="log" aria-live="polite" aria-relevant="additions text">
        <div className="lv-ai-intro">
          <span className="lv-ai-intro-symbol"><Sparkles size={18} aria-hidden="true" /></span>
          <h3>{strings.heading}</h3>
          <p>{strings.welcome}</p>
        </div>
        {messages.map((item) => (
          <div key={item.id} className={`lv-ai-message lv-ai-message--${item.role}`}>
            {item.role === 'assistant' && <div className="lv-ai-mini-avatar"><Bot size={15} aria-hidden="true" /></div>}
            <div className="lv-ai-bubble">
              {item.text}
              {item.failed && <small className="lv-ai-message-note">{strings.notSent}</small>}
              {item.status === 'CLARIFICATION_NEEDED' && <small className="lv-ai-message-note">{strings.clarification}</small>}
              {item.status === 'OUT_OF_SCOPE' && <small className="lv-ai-message-note">{strings.outOfScope}</small>}
            </div>
          </div>
        ))}
        {pending && (
          <div className="lv-ai-message lv-ai-message--assistant" aria-label={strings.typing}>
            <div className="lv-ai-mini-avatar"><Bot size={15} aria-hidden="true" /></div>
            <div className="lv-ai-bubble lv-ai-loading"><span /><span /><span /> <span className="lv-ai-sr-only">{strings.typing}</span></div>
          </div>
        )}
        {error && <p className="lv-ai-error" role="alert">{error}</p>}
        {!pending && !draft.trim() && shownPrompts.length > 0 && (
          <div className="lv-ai-suggestions">
            <div className="lv-ai-small-title">{strings.suggestions}</div>
            {shownPrompts.map((question) => (
              <button key={question} type="button" className="lv-ai-suggestion" onClick={() => sendMessage(question)}>
                <MessageCircle size={14} aria-hidden="true" /> {question}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="lv-ai-compose">
        {draft.trim() && currentTypedSuggestions.length > 0 && !pending && (
          <div className="lv-ai-typeahead" aria-label={strings.suggestions}>
            {currentTypedSuggestions.map((question) => (
              <button key={question} type="button" onClick={() => sendMessage(question)}>
                <Sparkles size={13} aria-hidden="true" />{question}
              </button>
            ))}
          </div>
        )}
        <form className="lv-ai-form" onSubmit={(event) => { event.preventDefault(); sendMessage() }}>
          <label className="lv-ai-sr-only" htmlFor="lv-ai-question">{strings.placeholder}</label>
          <input
            ref={inputRef}
            id="lv-ai-question"
            type="text"
            autoComplete="off"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={strings.placeholder}
            maxLength={1000}
            disabled={pending}
          />
          <button type="submit" className="lv-ai-send" disabled={!draft.trim() || pending} aria-label={strings.send}>
            <Send size={18} aria-hidden="true" />
          </button>
        </form>
        <p><ShieldCheck size={13} aria-hidden="true" />{strings.disclaimer}</p>
      </div>
    </section>
  )
}

// Only show on authenticated dashboard pages; language and role follow the app.
export default function FloatingAIChat() {
  const { user } = useAuth()
  const { language } = useLanguage()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const labels = chatCopy[language] || chatCopy.en
  const visible = Boolean(user) && location.pathname.startsWith('/dashboard')

  useEffect(() => {
    if (!open) return undefined
    function escapeClose(event) { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', escapeClose)
    return () => window.removeEventListener('keydown', escapeClose)
  }, [open])

  if (!visible) return null
  return (
    <div className="lv-ai-widget">
      {hasOpened && <ChatPanel key={user?.id} language={language} user={user} isOpen={open} onClose={() => setOpen(false)} />}
      {!open && (
        <button
          type="button"
          className="lv-ai-fab"
          onClick={() => { setHasOpened(true); setOpen(true) }}
          aria-label={labels.open}
          title={labels.open}
          aria-expanded={false}
        >
          <MessageCircle size={25} aria-hidden="true" />
          <span className="lv-ai-fab-spark"><Sparkles size={12} aria-hidden="true" /></span>
        </button>
      )}
    </div>
  )
}
