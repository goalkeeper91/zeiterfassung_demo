import { useCallback, useEffect, useState } from 'react'
import {
  getLockoutStatus,
  registerFailedAttempt,
  registerSuccessfulPin,
  type LockoutStatus,
} from '../data/pinLockoutStore'

const UNLOCKED: LockoutStatus = { isLocked: false, remainingMs: 0, failedAttempts: 0 }

/**
 * `employeeId` ist erst bekannt, sobald ein Mitarbeiter am Terminal
 * ausgewählt wurde (siehe TerminalPage) — vorher liefert der Hook einfach
 * "nicht gesperrt" und tut nichts.
 */
export function usePinLockout(employeeId: string | null) {
  const [status, setStatus] = useState<LockoutStatus>(() =>
    employeeId ? getLockoutStatus(employeeId) : UNLOCKED,
  )

  useEffect(() => {
    setStatus(employeeId ? getLockoutStatus(employeeId) : UNLOCKED)
  }, [employeeId])

  useEffect(() => {
    if (!employeeId || !status.isLocked) return
    const interval = setInterval(() => setStatus(getLockoutStatus(employeeId)), 1000)
    return () => clearInterval(interval)
  }, [employeeId, status.isLocked])

  const reportFailedAttempt = useCallback(() => {
    if (!employeeId) return
    setStatus(registerFailedAttempt(employeeId))
  }, [employeeId])

  const reportSuccess = useCallback(() => {
    if (!employeeId) return
    registerSuccessfulPin(employeeId)
    setStatus(getLockoutStatus(employeeId))
  }, [employeeId])

  return { ...status, reportFailedAttempt, reportSuccess }
}
