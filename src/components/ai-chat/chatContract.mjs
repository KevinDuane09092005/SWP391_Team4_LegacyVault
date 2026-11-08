// Frontend contract helpers for LegacyVault Chatbot OpenAPI v0.2.0.
// Pure functions so validation and API alignment can be tested without React.
export const MAX_MESSAGE_LENGTH = 1000
export const MAX_HISTORY_TURNS = 8
export const MAX_QUERY_LENGTH = 200

const STATUSES = new Set(['ANSWERED', 'CLARIFICATION_NEEDED', 'OUT_OF_SCOPE'])
const TOPICS = new Set([
  'GENERAL', 'ACCOUNT', 'VAULTS', 'ASSETS', 'CONTACTS', 'DEAD_MANS_SWITCH',
  'LEGAL_VERIFICATION', 'HANDOVER', 'FACE_VERIFICATION', 'BILLING',
  'SECURITY', 'UNKNOWN',
])

export function normalizeChatLanguage(language) {
  return language === 'vi' ? 'vi' : 'en'
}

export function hasLikelySensitiveData(value) {
  const text = String(value ?? '')
  // Common patterns where a user appears to be supplying a secret, not asking about one.
  // This is a guardrail, not a substitute for server-side filtering/validation.
  return /\b(?:otp|one[- ]time code|verification code|mã otp|ma otp)\s*(?::|=|#|is)?\s*\d{4,8}\b/i.test(text) ||
    /(?:password|mật khẩu|mat khau|private[ -]?key|seed phrase|recovery phrase|cụm từ khôi phục|cum tu khoi phuc)\s*[:=]\s*\S{4,}/i.test(text) ||
    /(?:cccd|cmnd|identity number|id number|số căn cước|so can cuoc)\s*[:=]?\s*\d{9,12}\b/i.test(text)
}

export function validateChatMessage(message) {
  const value = String(message ?? '').trim()
  if (!value) throw new Error('EMPTY_MESSAGE')
  if (value.length > MAX_MESSAGE_LENGTH) throw new Error('MESSAGE_TOO_LONG')
  if (hasLikelySensitiveData(value)) throw new Error('SENSITIVE_INPUT')
  return value
}

export function createSuggestionsRequest({ query = '', language } = {}) {
  return { query: String(query).slice(0, MAX_QUERY_LENGTH), language: normalizeChatLanguage(language) }
}

export function createChatRequest({ message, language, history } = {}) {
  return {
    message: validateChatMessage(message),
    language: normalizeChatLanguage(language),
    history: buildChatHistory(history),
  }
}

export function buildChatHistory(messages) {
  if (!Array.isArray(messages)) return []
  return messages
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && !item.failed)
    .map((item) => ({
      role: item.role,
      content: String(item.content ?? item.text ?? '').trim().slice(0, 1500),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-MAX_HISTORY_TURNS)
}

export function normalizeSuggestionResponse(payload) {
  if (!payload || !Array.isArray(payload.suggestions)) throw new Error('INVALID_SUGGESTIONS_RESPONSE')
  return payload.suggestions.filter((item) => typeof item === 'string' && item.trim()).slice(0, 5).map((item) => item.trim().slice(0, 160))
}

export function normalizeMessageResponse(payload) {
  if (!payload || typeof payload.reply !== 'string' || !payload.reply.trim() ||
    !STATUSES.has(payload.status) || !TOPICS.has(payload.topic) ||
    !Array.isArray(payload.suggestions)) {
    throw new Error('INVALID_CHATBOT_RESPONSE')
  }
  return {
    reply: payload.reply.trim().slice(0, 3000),
    status: payload.status,
    topic: payload.topic,
    suggestions: payload.suggestions.slice(0, 3)
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim().slice(0, 160)),
  }
}

export function mapChatError(error, language = 'en') {
  const vi = language === 'vi'
  const local = {
    EMPTY_MESSAGE: vi ? 'Hãy nhập câu hỏi trước khi gửi.' : 'Please enter a question.',
    MESSAGE_TOO_LONG: vi ? 'Câu hỏi tối đa 1.000 ký tự.' : 'Questions must be 1,000 characters or fewer.',
    SENSITIVE_INPUT: vi
      ? 'Tin nhắn có vẻ chứa thông tin bí mật. Hãy xóa mật khẩu, OTP, số định danh hoặc khóa riêng rồi thử lại.'
      : 'Your message may include a secret. Remove passwords, OTP codes, ID numbers, or private keys and try again.',
    INVALID_CHATBOT_RESPONSE: vi ? 'Phản hồi từ AI không hợp lệ. Vui lòng thử lại.' : 'The AI returned an invalid response. Please try again.',
    INVALID_SUGGESTIONS_RESPONSE: vi ? 'Không tải được câu hỏi gợi ý.' : 'Unable to load suggestions.',
  }
  if (local[error?.message]) return local[error.message]
  if (error?.status === 503 && error?.data?.code === 'AI_NOT_CONFIGURED') {
    return vi
      ? 'Trợ lý AI chưa được cấu hình trên máy chủ. Vui lòng báo quản trị viên.'
      : 'The AI assistant is not configured on the server yet. Please contact the administrator.'
  }
  switch (error?.status) {
    case 400: return vi ? 'Câu hỏi không hợp lệ. Hãy chỉnh sửa và thử lại.' : 'Invalid question. Please edit it and try again.'
    case 401: return vi ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : 'Your session has expired. Please sign in again.'
    case 429: return vi ? 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.' : 'Too many requests. Please try again shortly.'
    case 502: return vi ? 'Dịch vụ AI đang gián đoạn. Vui lòng thử lại sau.' : 'The AI provider is unavailable. Please try again shortly.'
    case 500: return vi ? 'Máy chủ gặp lỗi. Vui lòng thử lại sau.' : 'The server encountered an error. Please try again shortly.'
    default: return vi ? 'Không thể kết nối trợ lý lúc này. Vui lòng thử lại.' : 'Unable to reach the assistant right now. Please try again.'
  }
}
