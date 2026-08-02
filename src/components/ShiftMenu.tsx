import { getPunchLabel, type Employee, type PunchType } from '../providers/types'

interface ShiftMenuProps {
  employee: Employee
  allowedPunchTypes: PunchType[]
  onSelect: (type: PunchType) => void
}

export function ShiftMenu({ employee, allowedPunchTypes, onSelect }: ShiftMenuProps) {
  return (
    <div className="text-center">
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
    </div>
  )
}
