import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { PinPad } from '../components/PinPad'
import { ShiftMenu } from '../components/ShiftMenu'
import { PunchConfirmation } from '../components/PunchConfirmation'
import { useTimeTracking } from '../providers/TimeTrackingContext'
import type { Employee, PunchType } from '../providers/types'
import { useIdleTimeout } from '../hooks/useIdleTimeout'
import { useFullscreen } from '../hooks/useFullscreen'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { usePinLockout } from '../hooks/usePinLockout'
import { MAX_ATTEMPTS } from '../data/pinLockoutStore'
import { formatTime } from '../lib/format'

const PIN_LENGTH = 4
const IDLE_TIMEOUT_MS = 15_000
const CONFIRMATION_DISPLAY_MS = 2_500

type ScreenState =
  | { status: 'idle'; pin: string; error: boolean }
  | { status: 'checking'; pin: string }
  | { status: 'menu'; employee: Employee; allowedPunchTypes: PunchType[] }
  | { status: 'confirmed'; employee: Employee; type: PunchType; time: string }

export function KioskPage() {
  const provider = useTimeTracking()
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
  const isOnline = useOnlineStatus()
  const {
    isLocked: isPinLocked,
    remainingMs: lockoutRemainingMs,
    failedAttempts,
    reportFailedAttempt,
    reportSuccess,
  } = usePinLockout()
  const [screen, setScreen] = useState<ScreenState>({
    status: 'idle',
    pin: '',
    error: false,
  })

  const reset = useCallback(() => {
    setScreen({ status: 'idle', pin: '', error: false })
  }, [])

  useIdleTimeout(reset, IDLE_TIMEOUT_MS)

  useEffect(() => {
    if (screen.status !== 'confirmed') return
    const timer = setTimeout(reset, CONFIRMATION_DISPLAY_MS)
    return () => clearTimeout(timer)
  }, [screen.status, reset])

  // Löst den PIN-Check gegen den Provider aus, sobald die PIN vollständig
  // ist. Das `cancelled`-Flag verhindert, dass eine veraltete Antwort noch
  // greift (u.a. relevant unter StrictMode, das Effects im Dev-Modus doppelt
  // ausführt) und ist später auch die Grundlage für echte Netzwerk-Requests.
  useEffect(() => {
    if (screen.status !== 'checking') return
    let cancelled = false
    const pin = screen.pin

    void (async () => {
      const employee = await provider.findEmployeeByPin(pin)
      if (cancelled) return

      if (!employee) {
        reportFailedAttempt()
        setScreen({ status: 'idle', pin, error: true })
        setTimeout(reset, 800)
        return
      }

      reportSuccess()
      const allowedPunchTypes = await provider.getAllowedPunchTypes(employee.pin)
      if (cancelled) return
      setScreen({ status: 'menu', employee, allowedPunchTypes })
    })()

    return () => {
      cancelled = true
    }
  }, [screen, provider, reset, reportFailedAttempt, reportSuccess])

  const handleDigit = (digit: string) => {
    if (isPinLocked) return
    setScreen((prev) => {
      if (prev.status !== 'idle' || prev.error) return prev
      const nextPin = prev.pin + digit
      if (nextPin.length < PIN_LENGTH) {
        return { status: 'idle', pin: nextPin, error: false }
      }
      return { status: 'checking', pin: nextPin }
    })
  }

  const handleBackspace = () => {
    setScreen((prev) =>
      prev.status !== 'idle'
        ? prev
        : { status: 'idle', pin: prev.pin.slice(0, -1), error: false },
    )
  }

  const handlePunch = async (type: PunchType) => {
    if (screen.status !== 'menu') return
    const employee = screen.employee
    const punch = await provider.recordPunch(employee.pin, type)
    setScreen({
      status: 'confirmed',
      employee,
      type,
      time: formatTime(punch.timestamp),
    })
  }

  const remainingLockoutSeconds = Math.ceil(lockoutRemainingMs / 1000)

  return (
    <div className="relative flex min-h-svh flex-col bg-white">
      {!isOnline && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-800">
          Kein Internetzugang — Erfassung läuft lokal weiter
        </div>
      )}

      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Vollbild verlassen' : 'Vollbild starten'}
        className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full text-lg text-slate-300 active:bg-slate-100 active:text-slate-500"
      >
        {isFullscreen ? '⤡' : '⛶'}
      </button>

      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {screen.status === 'confirmed' ? (
          <PunchConfirmation
            employeeFirstName={screen.employee.name.split(' ')[0]}
            type={screen.type}
            time={screen.time}
          />
        ) : screen.status === 'menu' ? (
          <ShiftMenu
            employee={screen.employee}
            allowedPunchTypes={screen.allowedPunchTypes}
            onSelect={handlePunch}
          />
        ) : (
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-semibold text-slate-900">
              {screen.status === 'checking'
                ? 'Einen Moment…'
                : isPinLocked
                  ? 'Gesperrt'
                  : 'PIN eingeben'}
            </h1>
            <p className="mt-1 text-slate-500">
              {screen.status === 'checking'
                ? 'PIN wird geprüft'
                : isPinLocked
                  ? `Zu viele Fehlversuche — weiter in ${remainingLockoutSeconds}s`
                  : screen.error
                    ? 'PIN nicht erkannt'
                    : 'Bitte melde dich an'}
            </p>
            {!isPinLocked && screen.status === 'idle' && failedAttempts > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                Noch {MAX_ATTEMPTS - failedAttempts} Versuche
              </p>
            )}
            <div className="mt-8">
              <PinPad
                value={screen.pin}
                maxLength={PIN_LENGTH}
                onDigit={handleDigit}
                onBackspace={handleBackspace}
                onClear={reset}
                error={screen.status === 'idle' && screen.error}
                disabled={screen.status === 'checking' || isPinLocked}
              />
            </div>
          </div>
        )}

        <Link
          to="/dashboard"
          className="mt-12 text-sm text-slate-300 active:text-slate-500"
        >
          Admin-Dashboard
        </Link>
      </div>
    </div>
  )
}
