import { getTypeFields } from './assetTypes.js'

// Form checks for Flow 2. They help the user fix mistakes before saving;
// the backend must validate everything again.
// Each validate* function returns { fieldName: message } for every field with a problem.

export const LIMITS = {
  vaultName: { min: 3, max: 60 },
  vaultDescription: 300,
  assetName: 80,
  description: 500,
  handoverNotes: 1000,
  shortText: 100,
}

const LAST4_PATTERN = /^\d{4}$/
// Public wallet addresses: letters, numbers (and ':' for some networks), no spaces.
const PUBLIC_ADDRESS_PATTERN = /^[A-Za-z0-9:]{20,120}$/

// Catches obvious secrets so people do not paste them into the demo:
// 12+ word recovery phrases, 64-character hex private keys, or "password: ..." notes.
export function looksLikeSecret(value) {
  const text = value.trim()
  const words = text.toLowerCase().split(/\s+/)
  // Wallet recovery phrases have 12, 15, 18, 21 or 24 short lowercase words.
  const isRecoveryPhrase =
    [12, 15, 18, 21, 24].includes(words.length) && words.every((word) => /^[a-z]{3,8}$/.test(word))
  const isPrivateKey = /\b(0x)?[0-9a-fA-F]{64}\b/.test(text)
  const isPasswordNote = /\b(password|passcode|mật khẩu|pin)\s*[:=]/i.test(text)
  return isRecoveryPhrase || isPrivateKey || isPasswordNote
}

function checkText(value, { required = false, max, messages, allowSecrets = false }) {
  const text = (value ?? '').trim()
  if (!text) return required ? messages.required : undefined
  if (max && text.length > max) return messages.tooLong(max)
  if (!allowSecrets && looksLikeSecret(text)) return messages.secret
  return undefined
}

function withoutEmpty(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message))
}

export function validateVault(values, messages) {
  const name = values.name.trim()
  let nameError
  if (!name) nameError = messages.vaultNameRequired
  else if (name.length < LIMITS.vaultName.min) nameError = messages.tooShort(LIMITS.vaultName.min)
  else if (name.length > LIMITS.vaultName.max) nameError = messages.tooLong(LIMITS.vaultName.max)

  return withoutEmpty({
    name: nameError,
    description: checkText(values.description, { max: LIMITS.vaultDescription, messages }),
  })
}

// Step "Enter asset information": common fields + the fields of the chosen type.
export function validateAssetInfo(values, messages) {
  const assetType = values.type || values.assetType
  const assetName = values.name || values.assetName
  const errors = {
    type: assetType ? undefined : messages.typeRequired,
    name: checkText(assetName, { required: true, max: LIMITS.assetName, messages }),
    description: checkText(values.description, { max: LIMITS.description, messages }),
    handoverNotes: checkText(values.handoverNotes, { max: LIMITS.handoverNotes, messages, allowSecrets: true }),
  }

  // "Other" assets have no fixed fields, so the description is what explains them.
  if (values.type === 'OTHER' && !errors.description && !values.description.trim()) {
    errors.description = messages.otherDescription
  }

  for (const field of getTypeFields(values.type)) {
    const value = (values[field.name] ?? '').trim()
    let error
    if (field.kind === 'select') {
      error = field.required && !value ? messages.required : undefined
    } else {
      error = checkText(value, { required: field.required, max: LIMITS.shortText, messages })
    }
    if (!error && value && field.check === 'last4' && !LAST4_PATTERN.test(value)) {
      error = messages.last4
    }
    if (!error && value && field.check === 'publicAddress' && !PUBLIC_ADDRESS_PATTERN.test(value)) {
      error = messages.publicAddress
    }
    errors[field.name] = error
  }

  return withoutEmpty(errors)
}

// Order of the asset fields on screen, used to focus the first one with an error.
export function getAssetFieldOrder(type) {
  return ['type', 'name', ...getTypeFields(type).map((field) => field.name), 'description', 'handoverNotes']
}
