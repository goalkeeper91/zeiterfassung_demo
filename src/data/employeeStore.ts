// Verwaltet PINs oberhalb der statischen Stammdaten (data/mockEmployees.ts):
// die Werks-PIN kommt vom Chef bei Neuanlage, Mitarbeiter können sie danach
// selbst ändern (siehe TerminalPage "PIN ändern"). Änderungen werden als
// Override pro Mitarbeiter-ID in localStorage abgelegt, damit sie einen
// Reload überleben, ohne die Stammdaten selbst anzufassen.
import { mockEmployees } from './mockEmployees'
import type { Employee } from '../providers/types'

const STORAGE_KEY = 'zeiterfassung.employee-pins'

function loadPinOverrides(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function savePinOverrides(overrides: Record<string, string>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}

export function getEmployees(): Employee[] {
  const overrides = loadPinOverrides()
  return mockEmployees.map((employee) =>
    overrides[employee.id] ? { ...employee, pin: overrides[employee.id] } : employee,
  )
}

export function getEmployeeById(employeeId: string): Employee | undefined {
  return getEmployees().find((employee) => employee.id === employeeId)
}

export function setEmployeePin(employeeId: string, newPin: string): void {
  const overrides = loadPinOverrides()
  overrides[employeeId] = newPin
  savePinOverrides(overrides)
}
