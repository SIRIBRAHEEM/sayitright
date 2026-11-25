// Small localStorage helpers. Everything the user adds stays on their own
// device; nothing is sent anywhere.

const USER_EXAMPLES_KEY = 'sayitright-user-examples'
const HISTORY_KEY = 'sayitright-history'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be full or blocked; the app still works without saving.
  }
}

export function loadUserExamples() {
  return read(USER_EXAMPLES_KEY, [])
}

export function saveUserExamples(examples) {
  write(USER_EXAMPLES_KEY, examples)
}

export function loadHistory() {
  return read(HISTORY_KEY, [])
}

export function saveHistory(items) {
  write(HISTORY_KEY, items.slice(0, 30))
}
