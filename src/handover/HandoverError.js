// Error thrown by the handover service. `code` picks the translated message
// (see `errors` in src/data/handoverContent.js). `details` carries extra data,
// e.g. { attemptsLeft } or { reasons } (deny codes from handoverAccess.js).
export class HandoverError extends Error {
  constructor(code, details = {}) {
    super(code)
    this.name = 'HandoverError'
    this.code = code
    this.details = details
  }
}
