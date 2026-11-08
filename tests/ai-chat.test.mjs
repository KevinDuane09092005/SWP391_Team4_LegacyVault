import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildChatHistory,
  createChatRequest,
  createSuggestionsRequest,
  mapChatError,
  normalizeMessageResponse,
  normalizeSuggestionResponse,
  validateChatMessage,
} from '../src/components/ai-chat/chatContract.mjs'
import { getDemoReply, getPromptCategory } from '../src/components/ai-chat/chatKnowledge.mjs'

test('message validation trims text and rejects empty, oversized, or sensitive input', () => {
  assert.equal(validateChatMessage('  How do I add an asset?  '), 'How do I add an asset?')
  assert.throws(() => validateChatMessage('   '), { message: 'EMPTY_MESSAGE' })
  assert.throws(() => validateChatMessage('x'.repeat(1001)), { message: 'MESSAGE_TOO_LONG' })
  assert.throws(() => validateChatMessage('my OTP is 123456'), { message: 'SENSITIVE_INPUT' })
  assert.throws(() => validateChatMessage('CCCD: 012345678901'), { message: 'SENSITIVE_INPUT' })
})

test('request builders match the backend contract and limit history', () => {
  const request = createChatRequest({
    message: 'How does handover work?',
    language: 'vi-VN',
    history: [
      { role: 'system', content: 'must be removed' },
      { role: 'user', content: 'Earlier question' },
      { role: 'assistant', content: 'Earlier answer', failed: true },
    ],
  })
  assert.deepEqual(request, {
    message: 'How does handover work?',
    language: 'en',
    history: [{ role: 'user', content: 'Earlier question' }],
  })
  assert.deepEqual(Object.keys(request).sort(), ['history', 'language', 'message'])
  const longHistory = Array.from({ length: 10 }, (_, index) => ({ role: 'user', content: `${index}` }))
  assert.equal(buildChatHistory(longHistory).length, 8)
  assert.deepEqual(createSuggestionsRequest({ query: 'x'.repeat(220), language: 'vi' }), {
    query: 'x'.repeat(200),
    language: 'vi',
  })
})

test('response normalizers accept only expected backend structures', () => {
  assert.deepEqual(normalizeSuggestionResponse({ suggestions: [' One ', '', 'Two'] }), ['One', 'Two'])
  assert.throws(() => normalizeSuggestionResponse({ suggestions: 'not an array' }), {
    message: 'INVALID_SUGGESTIONS_RESPONSE',
  })
  assert.deepEqual(normalizeMessageResponse({
    reply: '  Answer  ',
    status: 'ANSWERED',
    topic: 'HANDOVER',
    suggestions: [' Next question '],
  }), {
    reply: 'Answer',
    status: 'ANSWERED',
    topic: 'HANDOVER',
    suggestions: ['Next question'],
  })
  assert.throws(() => normalizeMessageResponse({ reply: 'No status', suggestions: [] }), {
    message: 'INVALID_CHATBOT_RESPONSE',
  })
})

test('API configuration errors are explained in English and Vietnamese', () => {
  const error = { status: 503, data: { code: 'AI_NOT_CONFIGURED' } }
  assert.match(mapChatError(error, 'en'), /not configured/i)
  assert.match(mapChatError(error, 'vi'), /chưa được cấu hình/i)
})

test('demo knowledge supports common English and Vietnamese phrasing and role prompts', () => {
  assert.match(getDemoReply('How can I add an asset?', 'en'), /My Assets/i)
  assert.match(getDemoReply('Làm sao thêm tài sản?', 'vi'), /Thêm tài sản/)
  assert.equal(getPromptCategory('ROLE_BENEFICIARY'), 'beneficiary')
  assert.equal(getPromptCategory('EXECUTOR'), 'executor')
})
