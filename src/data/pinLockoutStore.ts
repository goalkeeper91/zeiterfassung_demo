// Bremst Brute-Force-Rateversuche am Terminal aus. Seit die Mitarbeiterwahl
// der PIN-Eingabe vorgeschaltet ist (siehe TerminalPage), weiß das Terminal
// schon, wer es versucht — die Sperre läuft daher pro Mitarbeiter, nicht
// mehr geräteweit. Persistiert in localStorage, damit ein Reload den
// Sperr-Timer nicht einfach umgeht.

const STORAGE_KEY = 'zeiterfassung.lockout'
export const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 30_000

interface LockoutState {
  failedAttempts: number
  lockedUntil: string | null
}

type LockoutMap = Record<string, LockoutState>

function loadMap(): LockoutMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveMap(map: LockoutMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

function getState(map: LockoutMap, employeeId: string): LockoutState {
  return map[employeeId] ?? { failedAttempts: 0, lockedUntil: null }
}

export interface LockoutStatus {
  isLocked: boolean
  remainingMs: number
  failedAttempts: number
}

export function getLockoutStatus(employeeId: string, now = new Date()): LockoutStatus {
  const map = loadMap()
  const state = getState(map, employeeId)
  const remainingMs = state.lockedUntil
    ? new Date(state.lockedUntil).getTime() - now.getTime()
    : 0

  if (remainingMs <= 0) {
    // Eine abgelaufene Sperre gibt einen vollständig frischen Satz an
    // Versuchen frei, statt den Zähler auf dem Maximum stehen zu lassen.
    if (state.lockedUntil) {
      map[employeeId] = { failedAttempts: 0, lockedUntil: null }
      saveMap(map)
    }
    return { isLocked: false, remainingMs: 0, failedAttempts: 0 }
  }
  return { isLocked: true, remainingMs, failedAttempts: state.failedAttempts }
}

export function registerFailedAttempt(employeeId: string, now = new Date()): LockoutStatus {
  const map = loadMap()
  const state = getState(map, employeeId)
  const failedAttempts = state.failedAttempts + 1
  const lockedUntil =
    failedAttempts >= MAX_ATTEMPTS
      ? new Date(now.getTime() + LOCKOUT_DURATION_MS).toISOString()
      : state.lockedUntil

  map[employeeId] = { failedAttempts, lockedUntil }
  saveMap(map)
  return getLockoutStatus(employeeId, now)
}

export function registerSuccessfulPin(employeeId: string): void {
  const map = loadMap()
  map[employeeId] = { failedAttempts: 0, lockedUntil: null }
  saveMap(map)
}
