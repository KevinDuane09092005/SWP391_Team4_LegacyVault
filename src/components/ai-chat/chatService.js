import { apiFetch } from '../../services/apiClient.js'
import { chatCopy, getDemoReply, getPromptCategory } from './chatKnowledge.mjs'
import {
  createChatRequest,
  createSuggestionsRequest,
  normalizeChatLanguage,
  normalizeMessageResponse,
  normalizeSuggestionResponse,
  validateChatMessage,
} from './chatContract.mjs'

// AI API key stays on the backend, never in Vite/client code.
export function isAssistantApiEnabled() {
  // Use the real backend by default; the local sample chatbot is opt-in only.
  return String(import.meta.env?.VITE_CHAT_API_MODE || 'api').trim().toLowerCase() !== 'demo'
}

export async function getChatbotSuggestions({ query = '', language, role, signal } = {}) {
  const safeLanguage = normalizeChatLanguage(language)
  const safeQuery = createSuggestionsRequest({ query, language }).query
  if (!isAssistantApiEnabled()) {
    const copy = chatCopy[safeLanguage]
    const prompts = copy.prompts[getPromptCategory(role)] || copy.prompts.default
    const q = safeQuery.toLocaleLowerCase().trim()
    return (q ? Object.values(copy.prompts).flat().filter((item) => item.toLocaleLowerCase().includes(q)) : prompts)
      .filter((item, index, arr) => arr.indexOf(item) === index).slice(0, 5)
  }
  const data = await apiFetch('/chatbot/suggestions', {
    method: 'POST',
    signal,
    body: createSuggestionsRequest({ query: safeQuery, language: safeLanguage }),
  })
  return normalizeSuggestionResponse(data)
}

export async function askLegacyVaultAssistant({ message, language, history = [], signal } = {}) {
  const safeMessage = validateChatMessage(message)
  const safeLanguage = normalizeChatLanguage(language)

  if (!isAssistantApiEnabled()) {
    const reply = getDemoReply(safeMessage, safeLanguage)
    const outOfScope = reply === chatCopy[safeLanguage].fallback
    return {
      reply,
      topic: outOfScope ? 'UNKNOWN' : 'GENERAL',
      status: outOfScope ? 'OUT_OF_SCOPE' : 'ANSWERED',
      suggestions: [],
    }
  }

  // Exact OpenAPI v0.2.0 contract; DO NOT include role or account/vault information.
  // Server determines the effective role from the authenticated JWT/session.
  const data = await apiFetch('/chatbot/message', {
    method: 'POST',
    signal,
    body: createChatRequest({ message: safeMessage, language: safeLanguage, history }),
  })
  return normalizeMessageResponse(data)
}
