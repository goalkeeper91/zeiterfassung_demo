interface PinPadProps {
  value: string
  maxLength: number
  onDigit: (digit: string) => void
  onBackspace: () => void
  onClear: () => void
  disabled?: boolean
  error?: boolean
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back']

export function PinPad({
  value,
  maxLength,
  onDigit,
  onBackspace,
  onClear,
  disabled = false,
  error = false,
}: PinPadProps) {
  return (
    <div className="w-full max-w-xs">
      <div
        className={`mb-8 flex justify-center gap-4 ${error ? 'animate-shake' : ''}`}
        aria-label={`${value.length} von ${maxLength} Ziffern eingegeben`}
      >
        {Array.from({ length: maxLength }).map((_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full border-2 transition-colors ${
              i < value.length
                ? error
                  ? 'border-red-500 bg-red-500'
                  : 'border-slate-900 bg-slate-900'
                : 'border-slate-300 bg-transparent'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => {
          if (key === 'clear') {
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={onClear}
                className="h-16 rounded-2xl text-base font-medium text-slate-500 transition-colors active:bg-slate-200 disabled:opacity-40"
              >
                Löschen
              </button>
            )
          }
          if (key === 'back') {
            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={onBackspace}
                aria-label="Letzte Ziffer löschen"
                className="h-16 rounded-2xl text-2xl font-medium text-slate-500 transition-colors active:bg-slate-200 disabled:opacity-40"
              >
                ⌫
              </button>
            )
          }
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onDigit(key)}
              className="h-16 rounded-2xl bg-slate-100 text-3xl font-semibold text-slate-900 transition-colors active:bg-slate-200 disabled:opacity-40"
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
