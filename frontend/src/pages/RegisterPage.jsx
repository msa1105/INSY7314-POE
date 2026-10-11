import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import FormField from '../components/FormField'
import Alert from '../components/Alert'
import { fieldErrorMap } from '../api/client'
import { validateRegister } from '../utils/validation'

const INITIAL = { name: '', email: '', password: '', confirmPassword: '', role: 'client' }

export default function RegisterPage() {
  const { user, register } = useAuth()
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Once registered (session set), send freelancers to their dashboard
  if (user) return <Navigate to={user.role === 'freelancer' ? '/my-gigs' : '/gigs'} replace />

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    setErrors((errs) => ({ ...errs, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const clientErrors = validateRegister(values)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) return

    setSubmitting(true)
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
      })
    } catch (err) {
      setErrors(fieldErrorMap(err.fields))
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card form auth-card" onSubmit={handleSubmit} noValidate>
        <h1 className="form__title">Create your account</h1>
        <p className="muted">Hire talent or sell your skills.</p>
        <Alert type="error">{formError}</Alert>

        <fieldset className="role-picker">
          <legend>I want to</legend>
          {[
            { value: 'client', label: 'Hire freelancers', sub: 'Client' },
            { value: 'freelancer', label: 'Offer my services', sub: 'Freelancer' },
          ].map((opt) => (
            <label key={opt.value} className={`role-option${values.role === opt.value ? ' role-option--active' : ''}`}>
              <input
                type="radio" name="role" value={opt.value}
                checked={values.role === opt.value} onChange={handleChange}
              />
              <span className="role-option__label">{opt.label}</span>
              <span className="role-option__sub">{opt.sub}</span>
            </label>
          ))}
        </fieldset>

        <FormField
          label="Full name" name="name" autoComplete="name" maxLength={80}
          value={values.name} onChange={handleChange} error={errors.name}
        />
        <FormField
          label="Email" name="email" type="email" autoComplete="email"
          value={values.email} onChange={handleChange} error={errors.email}
        />
        <FormField
          label="Password" name="password" type="password" autoComplete="new-password" maxLength={128}
          value={values.password} onChange={handleChange} error={errors.password}
          hint="At least 8 characters with upper and lower case letters, a number and a special character."
        />
        <FormField
          label="Confirm password" name="confirmPassword" type="password" autoComplete="new-password"
          maxLength={128} value={values.confirmPassword} onChange={handleChange} error={errors.confirmPassword}
        />

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
        <p className="muted center">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  )
}
