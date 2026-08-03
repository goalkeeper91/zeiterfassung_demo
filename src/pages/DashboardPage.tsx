import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { StatusBadge } from '../components/StatusBadge'
import { STORAGE_KEY } from '../data/timeTrackingStore'
import { formatDuration, formatTime } from '../lib/format'
import { useTimeTracking } from '../providers/TimeTrackingContext'
import { getPunchLabel, type DailyEmployeeSummary } from '../providers/types'

const TODAY_LABEL = new Date().toLocaleDateString('de-DE', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

export function DashboardPage() {
  const provider = useTimeTracking()
  const [overview, setOverview] = useState<DailyEmployeeSummary[] | null>(null)

  const reload = useCallback(() => {
    void provider.getDailyOverview().then(setOverview)
  }, [provider])

  useEffect(() => {
    reload()
  }, [reload])

  // localStorage feuert `storage` nur in anderen Tabs/Fenstern — genau das
  // Szenario, in dem das Terminal in einem Tab läuft und dieses Dashboard
  // daneben zur Präsentation offen ist.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === STORAGE_KEY) reload()
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [reload])

  return (
    <div className="min-h-svh bg-slate-50 p-4 sm:p-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500">{TODAY_LABEL}</p>
        </div>
        <Link to="/" className="text-sm text-slate-500 active:text-slate-700">
          Zurück zum Terminal
        </Link>
      </header>

      {!overview ? (
        <p className="text-slate-400">Lädt…</p>
      ) : (
        <div className="flex flex-col gap-3">
          {overview.map(({ employee, status, punches, workedMs }) => (
            <div
              key={employee.id}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-900">
                  {employee.name}
                </span>
                <StatusBadge status={status} />
              </div>

              {punches.length === 0 ? (
                <p className="mt-2 text-sm text-slate-400">
                  Noch keine Erfassung heute
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-slate-500">
                    {punches
                      .map(
                        (punch) =>
                          `${getPunchLabel(punch.type)} ${formatTime(punch.timestamp)}`,
                      )
                      .join(' · ')}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700">
                    Gearbeitet: {formatDuration(workedMs)}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
