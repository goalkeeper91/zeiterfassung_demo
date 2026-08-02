import { useCallback, useEffect, useState } from 'react'

/**
 * Fullscreen-Toggle für den Kiosk-Modus. Ein echtes Kiosk-Tablet würde den
 * Browser ohnehin mit `--kiosk` im Vollbild starten — für die Demo im
 * normalen Browserfenster braucht es diesen manuellen Schalter, weil die
 * Fullscreen API nur auf eine echte Nutzer-Interaktion hin reagiert.
 */
export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(
    () => document.fullscreenElement !== null,
  )

  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement !== null)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [])

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void document.documentElement.requestFullscreen().catch(() => {
        // Manche Browser/Kontexte (z.B. iframe ohne allow="fullscreen")
        // verweigern die Anfrage — dann bleibt es beim normalen Fenster.
      })
    }
  }, [])

  return { isFullscreen, toggle }
}
