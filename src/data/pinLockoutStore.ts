// Bremst Brute-Force-Rateversuche am Kiosk-Tablet aus. Bewusst simpel und
// geräteweit (nicht pro Mitarbeiter) gehalten, weil das Terminal vor der
// PIN-Eingabe noch nicht weiß, wer da tippt. Persistiert in localStorage,
// damit ein Reload den Sperr-Timer nicht einfach umgeht.

const STORAGE_KEY = 'zeiterfassung.lockout'
export const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 30_000

interface LockoutState {
  failedAttempts: number
  lockedUntil: string | null
}

function loadState(): LockoutState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { failedAttempts: 0, lockedUntil: null }
    const parsed = JSON.parse(raw)
    return {
      failedAttempts: typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0,
      lockedUntil: typeof parsed.lockedUntil === 'string' ? parsed.lockedUntil : null,
    }
  } catch {
    return { failedAttempts: 0, lockedUntil: null }
  }
}

function saveState(state: LockoutState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export interface LockoutStatus {
  isLocked: boolean
  remainingMs: number
  failedAttempts: number
}

export function getLockoutStatus(now = new Date()): LockoutStatus {
  const state = loadState()
  const remainingMs = state.lockedUntil
    ? new Date(state.lockedUntil).getTime() - now.getTime()
    : 0

  if (remainingMs <= 0) {
    // Eine abgelaufene Sperre gibt einen vollständig frischen Satz an
    // Versuchen frei, statt den Zähler auf dem Maximum stehen zu lassen.
    if (state.lockedUntil) {
      saveState({ failedAttempts: 0, lockedUntil: null })
    }
    return { isLocked: false, remainingMs: 0, failedAttempts: 0 }
  }
  return { isLocked: true, remainingMs, failedAttempts: state.failedAttempts }
}

export function registerFailedAttempt(now = new Date()): LockoutStatus {
  const state = loadState()
  const failedAttempts = state.failedAttempts + 1
  const lockedUntil =
    failedAttempts >= MAX_ATTEMPTS
      ? new Date(now.getTime() + LOCKOUT_DURATION_MS).toISOString()
      : state.lockedUntil

  saveState({ failedAttempts, lockedUntil })
  return getLockoutStatus(now)
}

export function registerSuccessfulPin(): void {
  saveState({ failedAttempts: 0, lockedUntil: null })
}
