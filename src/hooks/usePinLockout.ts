import { useCallback, useEffect, useState } from 'react'
import {
  getLockoutStatus,
  registerFailedAttempt,
  registerSuccessfulPin,
  type LockoutStatus,
} from '../data/pinLockoutStore'

export function usePinLockout() {
  const [status, setStatus] = useState<LockoutStatus>(() => getLockoutStatus())

  useEffect(() => {
    if (!status.isLocked) return
    const interval = setInterval(() => setStatus(getLockoutStatus()), 1000)
    return () => clearInterval(interval)
  }, [status.isLocked])

  const reportFailedAttempt = useCallback(() => {
    setStatus(registerFailedAttempt())
  }, [])

  const reportSuccess = useCallback(() => {
    registerSuccessfulPin()
    setStatus(getLockoutStatus())
  }, [])

  return { ...status, reportFailedAttempt, reportSuccess }
}
