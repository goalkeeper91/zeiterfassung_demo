import { getShiftStatusLabel, type ShiftStatus } from '../providers/types'

const STATUS_STYLES: Record<ShiftStatus, string> = {
  not_started: 'bg-slate-100 text-slate-500',
  working: 'bg-emerald-100 text-emerald-700',
  on_break: 'bg-amber-100 text-amber-700',
  finished: 'bg-slate-200 text-slate-600',
}

export function StatusBadge({ status }: { status: ShiftStatus }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${STATUS_STYLES[status]}`}
    >
      {getShiftStatusLabel(status)}
    </span>
  )
}
