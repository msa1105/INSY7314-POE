import { useState } from 'react'
import FormField from './FormField'
import Alert from './Alert'
import { fieldErrorMap } from '../api/client'
import { decodeEntities } from '../utils/format'
import { validateGig } from '../utils/validation'

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

/** Create / edit form for a gig. `onSubmit` receives the cleaned values. */
export default function GigForm({ initialGig, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => toFormValues(initialGig))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isEdit = Boolean(initialGig)

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    setErrors((errs) => ({ ...errs, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const clientErrors = validateGig(values)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) return

    setSubmitting(true)
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        price: Number(values.price),
        category: values.category.trim(),
      })
      if (!isEdit) setValues(EMPTY)
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
      <Alert type="error">{formError}</Alert>

      <FormField
        label="Title" name="title" value={values.title} onChange={handleChange}
        error={errors.title} maxLength={100} placeholder="e.g. Professional logo design"
      />
      <FormField
        label="Description" name="description" as="textarea" rows={4} value={values.description}
        onChange={handleChange} error={errors.description} maxLength={2000}
        placeholder="What will the client get?"
      />
      <div className="form__row">
        <FormField
          label="Price (ZAR)" name="price" type="number" min="1" step="0.01" value={values.price}
          onChange={handleChange} error={errors.price}
        />
        <FormField
          label="Category" name="category" value={values.category} onChange={handleChange}
          error={errors.category} maxLength={50} placeholder="e.g. Design"
        />
      </div>

      <div className="form__actions">
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create gig'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  )
}
