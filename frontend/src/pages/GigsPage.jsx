import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/endpoints'
import GigCard from '../components/GigCard'
import Alert from '../components/Alert'
import FormField from '../components/FormField'
import { fieldErrorMap } from '../api/client'
import { decodeEntities, formatRand } from '../utils/format'
import { validateRequest } from '../utils/validation'

/**
 * Browse all gigs. Clients send a job request (work details + the amount
 * they are willing to pay) that the freelancer then accepts or declines;
 * admins can remove any listing.
 */
export default function GigsPage() {
  const { token, user } = useAuth()
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingGig, setPendingGig] = useState(null)
  const [form, setForm] = useState({ details: '', amount: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.listGigs(token)
      setGigs(data.gigs)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  function openRequest(gig) {
    setSuccess('')
    setError('')
    setFieldErrors({})
    setForm({ details: '', amount: String(gig.price) }) // offer defaults to the asking price
    setPendingGig(gig)
  }

  function updateField(event) {
    const { name, value } = event.target
    setForm((f) => ({ ...f, [name]: value }))
    if (fieldErrors[name]) setFieldErrors((e) => ({ ...e, [name]: validateRequest({ ...form, [name]: value })[name] }))
  }

  async function submitRequest(event) {
    event.preventDefault()
    const errors = validateRequest(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    setSending(true)
    setError('')
    try {
      const { transaction } = await api.sendRequest(token, pendingGig.id, form)
      setSuccess(`Request sent for "${decodeEntities(transaction.gigTitle)}" (offer: ${formatRand(transaction.amount)}). You'll be charged (simulated) only if the freelancer accepts.`)
      setPendingGig(null)
    } catch (err) {
      setError(err.message)
      setFieldErrors(fieldErrorMap(err.fields))
    } finally {
      setSending(false)
    }
  }

  async function handleAdminDelete(gig) {
    if (!window.confirm(`Remove "${decodeEntities(gig.title)}" from the marketplace?`)) return
    try {
      await api.deleteGig(token, gig.id)
      setSuccess('Gig removed.')
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const isClient = user.role === 'client'

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <h1>Browse gigs</h1>
          <p className="muted">
            {isClient ? 'Find a freelancer and send them a job request.' : 'All services currently listed on HustleHub+.'}
          </p>
        </div>
        {user.role === 'freelancer' && <Link to="/my-gigs" className="btn btn--primary">+ New gig</Link>}
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">
        {success && <>{success} {isClient && <Link to="/bookings">View my requests →</Link>}</>}
      </Alert>

      {pendingGig && (
        <form className="card confirm form" role="dialog" aria-labelledby="request-title" onSubmit={submitRequest} noValidate>
          <h2 id="request-title">Request a job</h2>
          <p>
            <strong>{decodeEntities(pendingGig.title)}</strong> – asking price{' '}
            <strong>{formatRand(pendingGig.price)}</strong>
          </p>
          <FormField
            label="Work details"
            as="textarea"
            name="details"
            rows={4}
            maxLength={2000}
            value={form.details}
            onChange={updateField}
            error={fieldErrors.details}
            hint="Describe what you need, deadlines and any requirements."
          />
          <FormField
            label="Your offer (R)"
            type="number"
            name="amount"
            min="1"
            max="1000000"
            step="0.01"
            inputMode="decimal"
            value={form.amount}
            onChange={updateField}
            error={fieldErrors.amount}
          />
          <p className="muted">The freelancer accepts or declines. Payment is simulated and only happens on acceptance.</p>
          <div className="form__actions">
            <button type="submit" className="btn btn--primary" disabled={sending}>
              {sending ? 'Sending…' : 'Send request'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setPendingGig(null)} disabled={sending}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="muted">Loading gigs…</p>
      ) : gigs.length === 0 ? (
        <div className="empty">No gigs listed yet.</div>
      ) : (
        <div className="grid">
          {gigs.map((gig) => (
            <GigCard
              key={gig.id}
              gig={gig}
              onRequest={isClient ? openRequest : undefined}
              onDelete={user.role === 'admin' ? handleAdminDelete : undefined}
            />
          ))}
        </div>
      )}
    </section>
  )
}
