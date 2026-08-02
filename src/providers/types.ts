// Gemeinsamer Vertrag für alle Zeiterfassungs-Provider. LocalMockProvider
// (Phase 3, lokale Daten) und der spätere BlinkProvider (Phase 5, echte API)
// implementieren dieselbe Schnittstelle — die UI kennt nur dieses Interface,
// nie die konkrete Datenquelle dahinter.

export interface Employee {
  pin: string
  name: string
}

export type PunchType = 'clock_in' | 'break_start' | 'break_end' | 'clock_out'
export type ShiftStatus = 'not_started' | 'working' | 'on_break' | 'finished'

export interface Punch {
  id: string
  employeePin: string
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
  /** Sucht den Mitarbeiter zu einer eingegebenen PIN. */
  findEmployeeByPin(pin: string): Promise<Employee | undefined>
  /** Aktueller Schichtstatus, abgeleitet aus den bisherigen Punches des Tages. */
  getShiftStatus(employeePin: string): Promise<ShiftStatus>
  /** Welche Punch-Typen im aktuellen Status als Nächstes erlaubt sind. */
  getAllowedPunchTypes(employeePin: string): Promise<PunchType[]>
  /** Erfasst einen Punch. Wirft, wenn der Typ im aktuellen Status nicht erlaubt ist. */
  recordPunch(employeePin: string, type: PunchType): Promise<Punch>
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
