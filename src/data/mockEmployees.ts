// Statische Mitarbeiter-Stammdaten hinter LocalMockProvider (Phase 3).
// Ein BlinkProvider würde dieselben Daten per API abrufen. `pin` ist hier
// der vom Chef vergebene Ausgangswert (Konvention: 0000 bei Neuanlage) —
// data/employeeStore.ts legt persistierte PIN-Änderungen der Mitarbeiter
// selbst darüber. Alex hat die Werks-PIN absichtlich noch nicht geändert,
// um den "PIN ändern"-Flow in der Demo zeigen zu können.
import type { Employee } from '../providers/types'

export const mockEmployees: Employee[] = [
  { id: 'max', pin: '1234', name: 'Max Mustermann' },
  { id: 'erika', pin: '2222', name: 'Erika Musterfrau' },
  { id: 'alex', pin: '0000', name: 'Alex Beispiel' },
]
