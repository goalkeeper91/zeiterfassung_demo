// Gemeinsamer Vertrag für alle Zeiterfassungs-Provider. LocalMockProvider
// (Phase 3, lokale Daten) und der spätere BlinkProvider (Phase 5, echte API)
// implementieren dieselbe Schnittstelle — die UI kennt nur dieses Interface,
// nie die konkrete Datenquelle dahinter.

export interface Employee {
  id: string
  pin: string
  name: string
}

export type PunchType = 'clock_in' | 'break_start' | 'break_end' | 'clock_out'
export type ShiftStatus = 'not_started' | 'working' | 'on_break' | 'finished'

export interface Punch {
  id: string
  employeeId: string
  type: PunchType
  timestamp: string
}

export interface DailyEmployeeSummary {
  employee: Employee
  status: ShiftStatus
  punches: Punch[]
  workedMs: number
}

export interface TimeTrackingProvider {
  /** Für dieses Terminal hinterlegte Mitarbeiter (zur Auswahl vor der PIN-Eingabe). */
  getEmployees(): Promise<Employee[]>
  /** Prüft die eingegebene PIN gegen den zuvor ausgewählten Mitarbeiter. */
  verifyPin(employeeId: string, pin: string): Promise<boolean>
  /** Setzt eine neue PIN für den Mitarbeiter (Selbstverwaltung nach dem Einloggen). */
  changePin(employeeId: string, newPin: string): Promise<void>
  /** Aktueller Schichtstatus, abgeleitet aus den bisherigen Punches des Tages. */
  getShiftStatus(employeeId: string): Promise<ShiftStatus>
  /** Welche Punch-Typen im aktuellen Status als Nächstes erlaubt sind. */
  getAllowedPunchTypes(employeeId: string): Promise<PunchType[]>
  /** Bisherige Punches des Mitarbeiters für den heutigen Tag. */
  getTodaysPunches(employeeId: string): Promise<Punch[]>
  /** Erfasst einen Punch. Wirft, wenn der Typ im aktuellen Status nicht erlaubt ist. */
  recordPunch(employeeId: string, type: PunchType): Promise<Punch>
  /** Tagesübersicht aller Mitarbeiter fürs Admin-Dashboard. */
  getDailyOverview(): Promise<DailyEmployeeSummary[]>
}

const PUNCH_LABELS: Record<PunchType, string> = {
  clock_in: 'Arbeitsbeginn',
  break_start: 'Pause',
  break_end: 'Pause beenden',
  clock_out: 'Feierabend',
}

export function getPunchLabel(type: PunchType): string {
  return PUNCH_LABELS[type]
}

const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  not_started: 'Nicht eingestempelt',
  working: 'Arbeitet',
  on_break: 'Pause',
  finished: 'Feierabend',
}

export function getShiftStatusLabel(status: ShiftStatus): string {
  return SHIFT_STATUS_LABELS[status]
}
