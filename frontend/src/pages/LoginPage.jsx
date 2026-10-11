import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import FormField from '../components/FormField'
import Alert from '../components/Alert'
import { fieldErrorMap } from '../api/client'
import { validateLogin } from '../utils/validation'

export default function LoginPage() {
  const { user, login, notice } = useAuth()
  const location = useLocation()
  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Once logged in (session set), return to the page that required login
  if (user) return <Navigate to={location.state?.from || '/gigs'} replace />

  function handleChange(e) {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    setErrors((errs) => ({ ...errs, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const clientErrors = validateLogin(values)
    setErrors(clientErrors)
    if (Object.keys(clientErrors).length) return

    setSubmitting(true)
    try {
      await login({ email: values.email.trim(), password: values.password })
    } catch (err) {
      setErrors(fieldErrorMap(err.fields))
      setFormError(err.message)
      setValues((v) => ({ ...v, password: '' })) // never keep a rejected password around
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card form auth-card" onSubmit={handleSubmit} noValidate>
        <h1 className="form__title">Welcome back</h1>
        <p className="muted">Log in to browse and book gigs.</p>
        <Alert type="info">{notice}</Alert>
        <Alert type="error">{formError}</Alert>

        <FormField
          label="Email" name="email" type="email" autoComplete="email"
          value={values.email} onChange={handleChange} error={errors.email}
        />
        <FormField
          label="Password" name="password" type="password" autoComplete="current-password"
          value={values.password} onChange={handleChange} error={errors.password} maxLength={128}
        />

        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
        <p className="muted center">
          New to HustleHub+? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  )
}
