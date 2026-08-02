// Statische Mitarbeiterliste hinter LocalMockProvider (Phase 3).
// Ein BlinkProvider würde dieselben Daten per API abrufen.
import type { Employee } from '../providers/types'

export const mockEmployees: Employee[] = [
  { pin: '1234', name: 'Max Mustermann' },
  { pin: '2222', name: 'Erika Musterfrau' },
  { pin: '4711', name: 'Alex Beispiel' },
]

export function findEmployeeByPin(pin: string): Employee | undefined {
  return mockEmployees.find((employee) => employee.pin === pin)
}
