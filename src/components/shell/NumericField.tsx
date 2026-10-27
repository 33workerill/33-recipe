import { useContext, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumericValidityContext } from '@/components/shell/numeric-validity-context'

export function NumericField({
  id,
  label,
  value,
  onChange,
  min = 0,
  step = 'any',
}: {
  id: string
  label: string
  value?: number
  onChange: (value?: number) => void
  min?: number
  step?: string
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value))
  const [invalid, setInvalid] = useState(false)
  const reportValidity = useContext(NumericValidityContext)
  useEffect(() => () => reportValidity(id, false), [id, reportValidity])

  const update = (raw: string) => {
    setText(raw)
    if (raw.trim() === '') {
      setInvalid(false)
      reportValidity(id, false)
      onChange()
      return
    }
    const normalized = raw.trim().replace(',', '.')
    const parsed = Number(normalized)
    if (
      !/^\d+(?:\.\d+)?$/.test(normalized) ||
      !Number.isFinite(parsed) ||
      parsed < min ||
      (step === '1' && !Number.isInteger(parsed))
    ) {
      setInvalid(true)
      reportValidity(id, true)
      return
    }
    setInvalid(false)
    reportValidity(id, false)
    onChange(parsed)
  }

  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(event) => update(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined}
        placeholder="—"
      />
      {invalid && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          Введите число не меньше {min}; можно использовать запятую.
        </p>
      )}
    </div>
  )
}
