import { createContext, useContext } from 'react'
import { LocalMockProvider } from './LocalMockProvider'
import type { TimeTrackingProvider } from './types'

// Einziger Ort, an dem entschieden wird, welcher Provider aktiv ist.
// Für den Wechsel zu Blink (Phase 5) reicht es, hier eine BlinkProvider-
// Instanz einzusetzen — der Rest der App bleibt unverändert.
export const defaultTimeTrackingProvider: TimeTrackingProvider =
  new LocalMockProvider()

export const TimeTrackingContext = createContext<TimeTrackingProvider>(
  defaultTimeTrackingProvider,
)

export function useTimeTracking(): TimeTrackingProvider {
  return useContext(TimeTrackingContext)
}
