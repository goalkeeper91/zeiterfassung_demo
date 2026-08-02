import { useEffect, useRef } from 'react'

/**
 * Ruft `onIdle` auf, wenn für `timeoutMs` keine der überwachten
 * Interaktionen (Touch/Maus/Tastatur) stattgefunden hat. Für den
 * Kiosk-Modus: Rückkehr zum PIN-Screen, wenn ein Mitarbeiter den
 * Vorgang nicht abschließt.
 */
export function useIdleTimeout(onIdle: () => void, timeoutMs: number) {
  const onIdleRef = useRef(onIdle)
  onIdleRef.current = onIdle

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => onIdleRef.current(), timeoutMs)
    }

    const events = ['pointerdown', 'keydown'] as const
    events.forEach((event) => window.addEventListener(event, reset))
    reset()

    return () => {
      clearTimeout(timer)
      events.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [timeoutMs])
}
