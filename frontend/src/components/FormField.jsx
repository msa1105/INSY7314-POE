import { useId } from 'react'

/** Labelled input with an accessible inline error message. */
export default function FormField({ label, error, hint, as = 'input', children, ...inputProps }) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`
  const Control = as
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={`field${error ? ' field--invalid' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <Control id={id} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} {...inputProps}>
        {children}
      </Control>
      {hint && !error && <p id={hintId} className="field__hint">{hint}</p>}
      {error && <p id={errorId} className="field__error" role="alert">{error}</p>}
    </div>
  )
}
