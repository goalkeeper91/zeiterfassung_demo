// Lokale Zustandsmaschine hinter LocalMockProvider (Phase 3), auf
// localStorage abgelegt. Kennt das TimeTrackingProvider-Interface nicht
// direkt — der Provider bildet seine Methoden auf diese Funktionen ab.

import type { Punch, PunchType, ShiftStatus } from '../providers/types'

export const STORAGE_KEY = 'zeiterfassung.punches'

// Von welchem Status aus welcher nächste Punch erlaubt ist.
const ALLOWED_NEXT: Record<ShiftStatus, PunchType[]> = {
  not_started: ['clock_in'],
  working: ['break_start', 'clock_out'],
  on_break: ['break_end'],
  finished: ['clock_in'],
}

function isSameDay(isoTimestamp: string, reference: Date): boolean {
  const date = new Date(isoTimestamp)
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  )
}

function loadAllPunches(): Punch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveAllPunches(punches: Punch[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(punches))
}

export function getTodaysPunches(employeeId: string, now = new Date()): Punch[] {
  return loadAllPunches()
    .filter((punch) => punch.employeeId === employeeId && isSameDay(punch.timestamp, now))
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

export function getShiftStatus(employeeId: string, now = new Date()): ShiftStatus {
  const todaysPunches = getTodaysPunches(employeeId, now)
  const last = todaysPunches.at(-1)
  if (!last) return 'not_started'

  switch (last.type) {
    case 'clock_in':
    case 'break_end':
      return 'working'
    case 'break_start':
      return 'on_break'
    case 'clock_out':
      return 'finished'
  }
}

export function getAllowedPunchTypes(status: ShiftStatus): PunchType[] {
  return ALLOWED_NEXT[status]
}

/**
 * Summiert die tatsächlich gearbeitete Zeit aus einer Punch-Liste. Ein noch
 * offenes Segment (Arbeitsbeginn/Pause-Ende ohne folgenden Punch) zählt bis
 * `now` mit — sodass die Übersicht auch während einer laufenden Schicht
 * einen sinnvollen Wert zeigt.
 */
export function calculateWorkedMs(punches: Punch[], now = new Date()): number {
  let totalMs = 0
  let segmentStart: number | null = null

  for (const punch of punches) {
    const time = new Date(punch.timestamp).getTime()
    if (punch.type === 'clock_in' || punch.type === 'break_end') {
      segmentStart = time
    } else if (segmentStart !== null) {
      totalMs += time - segmentStart
      segmentStart = null
    }
  }

  if (segmentStart !== null) {
    totalMs += now.getTime() - segmentStart
  }

  return totalMs
}

export function recordPunch(employeeId: string, type: PunchType, now = new Date()): Punch {
  const status = getShiftStatus(employeeId, now)
  if (!ALLOWED_NEXT[status].includes(type)) {
    throw new Error(`Punch "${type}" ist im Status "${status}" nicht erlaubt.`)
  }

  const punch: Punch = {
    id: crypto.randomUUID(),
    employeeId,
    type,
    timestamp: now.toISOString(),
  }

  const all = loadAllPunches()
  all.push(punch)
  saveAllPunches(all)
  return punch
}
