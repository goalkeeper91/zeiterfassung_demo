import { useEffect, useState } from 'react'

/**
 * Verbindungsstatus fürs Kiosk-UI. Aktuell rein informativ (die
 * Mock-Datenhaltung läuft ohnehin lokal), legt aber die Anzeige-Fläche für
 * die echte Offline-Queue an, sobald in Phase 4/5 tatsächlich gegen die
 * Blink-API synchronisiert wird.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
