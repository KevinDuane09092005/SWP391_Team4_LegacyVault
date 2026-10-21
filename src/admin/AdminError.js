// Error thrown by the Flow 7 services (notifications, audit, administration).
// `code` picks the translated message (see `errors` in src/data/flow7Content.js).
export class AdminError extends Error {
  constructor(code, details = {}) {
    super(code)
    this.name = 'AdminError'
    this.code = code
    this.details = details
  }
}
