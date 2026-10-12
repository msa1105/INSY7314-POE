/* Meta Open Source, 2024
 * useState
 * React Documentation
 * https://react.dev/reference/react/useState
 * Accessed: 12 October 2026
 */

/* Meta Open Source, 2024
 * Conditional Rendering
 * React Documentation
 * https://react.dev/learn/conditional-rendering
 * Accessed: 12 October 2026
 */

/* MDN contributors, 2026
 * <select>: The HTML Select element
 * MDN Web Docs
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select
 * Accessed: 11 October 2026
 */

import { useState } from 'react'
import FormField from './FormField'
import Alert from './Alert'
import ProgressBar from './ProgressBar'
import { fieldErrorMap } from '../api/client'
import { decodeEntities } from '../utils/format'
import { GIG_CATEGORIES, validateGig } from '../utils/validation'

const EMPTY = { title: '', description: '', price: '', category: '' }

function toFormValues(gig) {
  if (!gig) return EMPTY
  return {
    title: decodeEntities(gig.title),
    description: decodeEntities(gig.description),
    price: String(gig.price),
    category: decodeEntities(gig.category),
  }
}

/** 4-step wizard form for creating or editing a gig. */
export default function GigForm({ initialGig, onSubmit, onCancel }) {
  const [step, setStep] = useState(1)
  const [values, setValues] = useState(() => toFormValues(initialGig))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [published, setPublished] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const isEdit = Boolean(initialGig)

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    setErrors((errs) => ({ ...errs, [name]: undefined }))
    setPublished(false)
  }

  function handleNext() {
    setStep((s) => s + 1)
  }

  function handleBack() {
    setStep((s) => s - 1)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    setPublished(false)

    const clientErrors = validateGig(values)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) {
      if (clientErrors.title) setStep(1)
      else if (clientErrors.description) setStep(2)
      else if (clientErrors.category) setStep(3)
      else if (clientErrors.price) setStep(4)
      return
    }

    setSubmitting(true)
    try {
      if (onSubmit) {
        await onSubmit({
          title: values.title.trim(),
          description: values.description.trim(),
          price: Number(values.price),
          category: values.category,
        })
      }
      setPublished(true)
      if (!isEdit) {
        setValues(EMPTY)
        setStep(1)
      }
    } catch (err) {
      setErrors(fieldErrorMap(err.fields))
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2 className="form__title">{isEdit ? 'Edit gig' : 'Create a new gig'}</h2>

      <ProgressBar step={step} totalSteps={4} />

      <Alert type="error">{formError}</Alert>
      {published && <Alert type="success">Gig published</Alert>}

      {step === 1 && (
        <FormField
          label="Title"
          name="title"
          value={values.title}
          onChange={handleChange}
          error={errors.title}
          maxLength={100}
          placeholder="e.g. Professional logo design"
        />
      )}

      {step === 2 && (
        <FormField
          label="Description"
          name="description"
          as="textarea"
          rows={4}
          value={values.description}
          onChange={handleChange}
          error={errors.description}
          maxLength={2000}
          placeholder="What will the client get?"
        />
      )}

      {step === 3 && (
        <FormField
          label="Category"
          name="category"
          as="select"
          value={values.category}
          onChange={handleChange}
          error={errors.category}
        >
          <option value="" disabled>Choose a category</option>
          {GIG_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </FormField>
      )}

      {step === 4 && (
        <FormField
          label="Price (ZAR)"
          name="price"
          type="number"
          min="1"
          max="1000000"
          step="0.01"
          inputMode="decimal"
          value={values.price}
          onChange={handleChange}
          error={errors.price}
        />
      )}

      <div className="form__actions">
        {step > 1 && (
          <button type="button" className="btn btn--ghost" onClick={handleBack}>
            Back
          </button>
        )}

        {step < 4 ? (
          <button type="button" className="btn btn--primary" onClick={handleNext}>
            Next
          </button>
        ) : (
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish'}
          </button>
        )}

        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
