import { getPunchLabel, type PunchType } from '../providers/types'

interface PunchConfirmationProps {
  employeeFirstName: string
  type: PunchType
  time: string
}

export function PunchConfirmation({
  employeeFirstName,
  type,
  time,
}: PunchConfirmationProps) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
        ✓
      </div>
      <h1 className="text-2xl font-semibold text-slate-900">
        {getPunchLabel(type)} erfasst
      </h1>
      <p className="mt-1 text-slate-500">
        {employeeFirstName} · {time} Uhr
      </p>
    </div>
  )
}
