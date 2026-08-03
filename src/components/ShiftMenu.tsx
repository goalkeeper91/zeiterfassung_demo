import { getPunchLabel, type Employee, type Punch, type PunchType } from '../providers/types'
import { formatTime } from '../lib/format'

interface ShiftMenuProps {
  employee: Employee
  allowedPunchTypes: PunchType[]
  todaysPunches: Punch[]
  onSelect: (type: PunchType) => void
  onChangePin: () => void
  onBack: () => void
}

export function ShiftMenu({
  employee,
  allowedPunchTypes,
  todaysPunches,
  onSelect,
  onChangePin,
  onBack,
}: ShiftMenuProps) {
  return (
    <div className="w-full max-w-xs text-center">
      <h1 className="text-3xl font-semibold text-slate-900">
        Hallo, {employee.name.split(' ')[0]}
      </h1>
      <p className="mt-2 text-slate-500">Was möchtest du erfassen?</p>

      <div className="mt-8 flex flex-col gap-3">
        {allowedPunchTypes.map((type, index) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={`h-16 rounded-2xl px-8 text-lg font-medium transition-colors ${
              index === 0
                ? 'bg-slate-900 text-white active:bg-slate-700'
                : 'bg-slate-100 text-slate-900 active:bg-slate-200'
            }`}
          >
            {getPunchLabel(type)}
          </button>
        ))}
      </div>

      {todaysPunches.length > 0 && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">
          <p className="mb-2 text-xs font-medium tracking-wide text-slate-400 uppercase">
            Heute
          </p>
          <p className="text-sm text-slate-600">
            {todaysPunches
              .map((punch) => `${getPunchLabel(punch.type)} ${formatTime(punch.timestamp)}`)
              .join(' · ')}
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-center gap-6 text-sm">
        <button
          type="button"
          onClick={onChangePin}
          className="text-slate-400 active:text-slate-600"
        >
          PIN ändern
        </button>
        <button type="button" onClick={onBack} className="text-slate-400 active:text-slate-600">
          Zurück
        </button>
      </div>
    </div>
  )
}
