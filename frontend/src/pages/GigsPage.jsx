import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/endpoints'
import GigCard from '../components/GigCard'
import Alert from '../components/Alert'
import { decodeEntities, formatRand } from '../utils/format'

/**
 * Browse all gigs. Clients can book (with a confirmation step and a
 * simulated payment); admins can remove any listing.
 */
export default function GigsPage() {
  const { token, user } = useAuth()
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pendingGig, setPendingGig] = useState(null)
  const [booking, setBooking] = useState(false)

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

  async function confirmBooking() {
    setBooking(true)
    setError('')
    try {
      const { transaction } = await api.bookGig(token, pendingGig.id)
      setSuccess(`Booking confirmed! ${formatRand(transaction.amount)} paid (simulated) for "${decodeEntities(transaction.gigTitle)}".`)
      setPendingGig(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setBooking(false)
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
            {isClient ? 'Find a freelancer and book their service.' : 'All services currently listed on HustleHub+.'}
          </p>
        </div>
        {user.role === 'freelancer' && <Link to="/my-gigs" className="btn btn--primary">+ New gig</Link>}
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">
        {success && <>{success} {isClient && <Link to="/bookings">View my bookings →</Link>}</>}
      </Alert>

      {pendingGig && (
        <div className="card confirm" role="dialog" aria-labelledby="confirm-title">
          <h2 id="confirm-title">Confirm booking</h2>
          <p>
            You are booking <strong>{decodeEntities(pendingGig.title)}</strong> for{' '}
            <strong>{formatRand(pendingGig.price)}</strong>.
          </p>
          <p className="muted">This is a simulated payment – no real money is charged.</p>
          <div className="form__actions">
            <button type="button" className="btn btn--primary" onClick={confirmBooking} disabled={booking}>
              {booking ? 'Processing…' : 'Confirm & pay'}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setPendingGig(null)} disabled={booking}>
              Cancel
            </button>
          </div>
        </div>
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
              onBook={isClient ? (g) => { setSuccess(''); setPendingGig(g) } : undefined}
              booking={booking && pendingGig?.id === gig.id}
              onDelete={user.role === 'admin' ? handleAdminDelete : undefined}
            />
          ))}
        </div>
      )}
    </section>
  )
}
