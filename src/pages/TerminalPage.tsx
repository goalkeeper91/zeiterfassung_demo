import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { PinPad } from '../components/PinPad'
import { EmployeeSelect } from '../components/EmployeeSelect'
import { ShiftMenu } from '../components/ShiftMenu'
import { PunchConfirmation } from '../components/PunchConfirmation'
import { useTimeTracking } from '../providers/TimeTrackingContext'
import type { Employee, Punch, PunchType } from '../providers/types'
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
  | { status: 'select' }
  | { status: 'pin'; employee: Employee; pin: string; error: boolean }
  | { status: 'checking'; employee: Employee; pin: string }
  | {
      status: 'menu'
      employee: Employee
      allowedPunchTypes: PunchType[]
      todaysPunches: Punch[]
    }
  | { status: 'confirmed'; employee: Employee; type: PunchType; time: string }
  | {
      status: 'changePin'
      employee: Employee
      step: 'enter' | 'confirm'
      firstPin: string
      pin: string
      error: boolean
    }
  | { status: 'pinChanged'; employee: Employee }

export function TerminalPage() {
  const provider = useTimeTracking()
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen()
  const isOnline = useOnlineStatus()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [screen, setScreen] = useState<ScreenState>({ status: 'select' })

  const currentEmployeeId = screen.status === 'select' ? null : screen.employee.id
  const {
    isLocked: isPinLocked,
    remainingMs: lockoutRemainingMs,
    failedAttempts,
    reportFailedAttempt,
    reportSuccess,
  } = usePinLockout(currentEmployeeId)

  useEffect(() => {
    void provider.getEmployees().then(setEmployees)
  }, [provider])

  const resetToSelect = useCallback(() => {
    setScreen({ status: 'select' })
  }, [])

  useIdleTimeout(resetToSelect, IDLE_TIMEOUT_MS)

  const enterMenu = useCallback(
    async (employee: Employee) => {
      const [allowedPunchTypes, todaysPunches] = await Promise.all([
        provider.getAllowedPunchTypes(employee.id),
        provider.getTodaysPunches(employee.id),
      ])
      setScreen({ status: 'menu', employee, allowedPunchTypes, todaysPunches })
    },
    [provider],
  )

  useEffect(() => {
    if (screen.status !== 'confirmed' && screen.status !== 'pinChanged') return
    const timer = setTimeout(resetToSelect, CONFIRMATION_DISPLAY_MS)
    return () => clearTimeout(timer)
  }, [screen.status, resetToSelect])

  // Prüft die PIN gegen den zuvor ausgewählten Mitarbeiter. Das
  // `cancelled`-Flag verhindert, dass eine veraltete Antwort noch greift
  // (u.a. relevant unter StrictMode, das Effects im Dev-Modus doppelt
  // ausführt) und ist später auch die Grundlage für echte Netzwerk-Requests.
  useEffect(() => {
    if (screen.status !== 'checking') return
    let cancelled = false
    const { employee, pin } = screen

    void (async () => {
      const valid = await provider.verifyPin(employee.id, pin)
      if (cancelled) return

      if (!valid) {
        reportFailedAttempt()
        setScreen({ status: 'pin', employee, pin, error: true })
        setTimeout(() => {
          setScreen((prev) =>
            prev.status === 'pin' && prev.employee.id === employee.id
              ? { status: 'pin', employee, pin: '', error: false }
              : prev,
          )
        }, 800)
        return
      }

      reportSuccess()
      await enterMenu(employee)
    })()

    return () => {
      cancelled = true
    }
  }, [screen, provider, reportFailedAttempt, reportSuccess, enterMenu])

  // Vergleicht die PIN-Bestätigung mit der zuerst eingegebenen neuen PIN,
  // sobald beide Ziffernblöcke vollständig sind, und speichert bei Erfolg.
  useEffect(() => {
    if (screen.status !== 'changePin' || screen.step !== 'confirm') return
    if (screen.error) return // Mismatch schon behandelt - sonst löst das eigene
    // `setScreen({ ...error: true })` unten diesen Effect erneut aus (gleicher
    // step/gleiche pin-Länge) und legt bei jedem Re-Render einen weiteren
    // 800ms-Reset-Timer an, die dann laufend die Retry-Eingabe überschreiben.
    if (screen.pin.length < PIN_LENGTH) return
    const { employee, firstPin, pin } = screen

    if (pin !== firstPin) {
      setScreen({ status: 'changePin', employee, step: 'confirm', firstPin, pin, error: true })
      setTimeout(() => {
        setScreen((prev) =>
          prev.status === 'changePin' && prev.employee.id === employee.id
            ? { status: 'changePin', employee, step: 'enter', firstPin: '', pin: '', error: false }
            : prev,
        )
      }, 800)
      return
    }

    let cancelled = false
    void (async () => {
      await provider.changePin(employee.id, pin)
      if (cancelled) return
      setScreen({ status: 'pinChanged', employee })
    })()
    return () => {
      cancelled = true
    }
  }, [screen, provider])

  const handleSelectEmployee = (employee: Employee) => {
    setScreen({ status: 'pin', employee, pin: '', error: false })
  }

  const handleDigit = (digit: string) => {
    if (isPinLocked) return
    setScreen((prev) => {
      if (prev.status !== 'pin' || prev.error) return prev
      const nextPin = prev.pin + digit
      if (nextPin.length < PIN_LENGTH) {
        return { ...prev, pin: nextPin }
      }
      return { status: 'checking', employee: prev.employee, pin: nextPin }
    })
  }

  const handleBackspace = () => {
    setScreen((prev) => (prev.status !== 'pin' ? prev : { ...prev, pin: prev.pin.slice(0, -1) }))
  }

  const handlePunch = async (type: PunchType) => {
    if (screen.status !== 'menu') return
    const employee = screen.employee
    const punch = await provider.recordPunch(employee.id, type)
    setScreen({
      status: 'confirmed',
      employee,
      type,
      time: formatTime(punch.timestamp),
    })
  }

  const handleOpenChangePin = () => {
    if (screen.status !== 'menu') return
    setScreen({
      status: 'changePin',
      employee: screen.employee,
      step: 'enter',
      firstPin: '',
      pin: '',
      error: false,
    })
  }

  const handleChangePinDigit = (digit: string) => {
    setScreen((prev) => {
      if (prev.status !== 'changePin' || prev.error) return prev
      const nextPin = prev.pin + digit
      if (nextPin.length < PIN_LENGTH) {
        return { ...prev, pin: nextPin }
      }
      if (prev.step === 'enter') {
        return {
          status: 'changePin',
          employee: prev.employee,
          step: 'confirm',
          firstPin: nextPin,
          pin: '',
          error: false,
        }
      }
      return { ...prev, pin: nextPin }
    })
  }

  const handleChangePinBackspace = () => {
    setScreen((prev) =>
      prev.status !== 'changePin' ? prev : { ...prev, pin: prev.pin.slice(0, -1) },
    )
  }

  const handleCancelChangePin = () => {
    if (screen.status !== 'changePin') return
    void enterMenu(screen.employee)
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
        {screen.status === 'select' && (
          <EmployeeSelect employees={employees} onSelect={handleSelectEmployee} />
        )}

        {(screen.status === 'pin' || screen.status === 'checking') && (
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-semibold text-slate-900">
              {screen.status === 'checking'
                ? 'Einen Moment…'
                : isPinLocked
                  ? 'Gesperrt'
                  : `PIN für ${screen.employee.name.split(' ')[0]}`}
            </h1>
            <p className="mt-1 text-slate-500">
              {screen.status === 'checking'
                ? 'PIN wird geprüft'
                : isPinLocked
                  ? `Zu viele Fehlversuche — weiter in ${remainingLockoutSeconds}s`
                  : screen.error
                    ? 'PIN nicht erkannt'
                    : 'Bitte PIN eingeben'}
            </p>
            {!isPinLocked && screen.status === 'pin' && failedAttempts > 0 && (
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
                onClear={() =>
                  setScreen((prev) =>
                    prev.status === 'pin' ? { ...prev, pin: '', error: false } : prev,
                  )
                }
                error={screen.status === 'pin' && screen.error}
                disabled={screen.status === 'checking' || isPinLocked}
              />
            </div>
            <button
              type="button"
              onClick={resetToSelect}
              className="mt-6 text-sm text-slate-400 active:text-slate-600"
            >
              Anderen Mitarbeiter wählen
            </button>
          </div>
        )}

        {screen.status === 'menu' && (
          <ShiftMenu
            employee={screen.employee}
            allowedPunchTypes={screen.allowedPunchTypes}
            todaysPunches={screen.todaysPunches}
            onSelect={handlePunch}
            onChangePin={handleOpenChangePin}
            onBack={resetToSelect}
          />
        )}

        {screen.status === 'confirmed' && (
          <PunchConfirmation
            employeeFirstName={screen.employee.name.split(' ')[0]}
            type={screen.type}
            time={screen.time}
          />
        )}

        {screen.status === 'changePin' && (
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-semibold text-slate-900">
              {screen.step === 'enter' ? 'Neue PIN eingeben' : 'PIN bestätigen'}
            </h1>
            <p className="mt-1 text-slate-500">
              {screen.error
                ? 'PINs stimmen nicht überein'
                : screen.step === 'enter'
                  ? 'Wähle eine neue 4-stellige PIN'
                  : 'Gib die neue PIN erneut ein'}
            </p>
            <div className="mt-8">
              <PinPad
                value={screen.pin}
                maxLength={PIN_LENGTH}
                onDigit={handleChangePinDigit}
                onBackspace={handleChangePinBackspace}
                onClear={() =>
                  setScreen((prev) => (prev.status === 'changePin' ? { ...prev, pin: '' } : prev))
                }
                error={screen.error}
              />
            </div>
            <button
              type="button"
              onClick={handleCancelChangePin}
              className="mt-6 text-sm text-slate-400 active:text-slate-600"
            >
              Abbrechen
            </button>
          </div>
        )}

        {screen.status === 'pinChanged' && (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
              ✓
            </div>
            <h1 className="text-2xl font-semibold text-slate-900">PIN geändert</h1>
            <p className="mt-1 text-slate-500">
              {screen.employee.name.split(' ')[0]}, deine neue PIN ist aktiv.
            </p>
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
