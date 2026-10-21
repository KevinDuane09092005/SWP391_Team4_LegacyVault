// DEMO ONLY — small JSON store used by the Flow 6 / Flow 7 mocks.
// Uses this browser's localStorage when there is one, otherwise memory (Node tests).
// Anyone with access to the browser can read or edit it: it is not secure storage.
export function createDemoStorage(key) {
  const memory = new Map()
  const hasLocal = () => {
    try {
      return Boolean(globalThis.localStorage)
    } catch {
      return false
    }
  }

  return {
    key,
    get() {
      try {
        const raw = hasLocal() ? globalThis.localStorage.getItem(key) : memory.get(key)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },
    set(value) {
      const raw = JSON.stringify(value)
      try {
        if (hasLocal()) globalThis.localStorage.setItem(key, raw)
        else memory.set(key, raw)
      } catch {
        // Storage full or blocked: the demo keeps working for this page only.
      }
    },
    clear() {
      try {
        if (hasLocal()) globalThis.localStorage.removeItem(key)
      } catch {
        // ignore
      }
      memory.delete(key)
    },
  }
}
