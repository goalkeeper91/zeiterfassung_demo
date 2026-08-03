import type { Employee } from '../providers/types'

interface EmployeeSelectProps {
  employees: Employee[]
  onSelect: (employee: Employee) => void
}

export function EmployeeSelect({ employees, onSelect }: EmployeeSelectProps) {
  return (
    <div className="flex w-full max-w-xs flex-col items-center">
      <h1 className="text-2xl font-semibold text-slate-900">Wer bist du?</h1>
      <p className="mt-1 mb-8 text-slate-500">Mitarbeiter auswählen</p>

      <select
        defaultValue=""
        onChange={(event) => {
          const employee = employees.find((candidate) => candidate.id === event.target.value)
          if (employee) onSelect(employee)
        }}
        aria-label="Mitarbeiter auswählen"
        className="h-16 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-lg text-slate-900"
      >
        <option value="" disabled>
          Bitte wählen…
        </option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
      </select>
    </div>
  )
}
