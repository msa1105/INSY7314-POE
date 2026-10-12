import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/endpoints'
import Alert from '../components/Alert'
import EmptyState from '../components/EmptyState'
import StatusLabel from '../components/StatusLabel'
import { Check, ClipboardList, Receipt, Wallet, Briefcase, X } from 'lucide-react'
import { decodeEntities, formatDate, formatRand } from '../utils/format'

/**
 * Clients: job requests they have sent and whether each was accepted.
 * Freelancers: requests received for their gigs (accept or decline pending
 * ones) plus an income summary built from accepted requests.
 */
export default function BookingsPage() {
  const { token, user } = useAuth()
  const isFreelancer = user.role === 'freelancer'
  const [transactions, setTransactions] = useState([])
  const [income, setIncome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [respondingId, setRespondingId] = useState(null)
  const [version, setVersion] = useState(0) // bump to reload after a response

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [mine, summary] = await Promise.all([
          api.listMyBookings(token),
          isFreelancer ? api.getIncome(token) : Promise.resolve(null),
        ])
        if (cancelled) return
        setTransactions(mine.transactions)
        setIncome(summary)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [token, isFreelancer, version])

  async function handleRespond(tx, status) {
    setRespondingId(tx.id)
    setError('')
    setSuccess('')
    try {
      const { message } = await api.respondToRequest(token, tx.id, status)
      setSuccess(message)
      setVersion((v) => v + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setRespondingId(null)
    }
  }

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <h1>{isFreelancer ? 'Requests & income' : 'My requests'}</h1>
          <p className="muted">
            {isFreelancer ? 'Job requests clients have sent you. Accepting one counts as payment.' : 'Job requests you have sent to freelancers.'}
          </p>
        </div>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>

      {isFreelancer && income && (
        <div className="stats">
          <div className="card stat">
            <span className="stat__icon"><Wallet aria-hidden="true" /></span>
            <span className="stat__label">Total income</span>
            <span className="stat__value">{formatRand(income.totalIncome)}</span>
          </div>
          <div className="card stat">
            <span className="stat__icon"><Briefcase aria-hidden="true" /></span>
            <span className="stat__label">Accepted jobs</span>
            <span className="stat__value">{income.bookings}</span>
          </div>
          <div className="card stat">
            <span className="stat__icon"><Receipt aria-hidden="true" /></span>
            <span className="stat__label">Estimated tax ({income.taxRate})</span>
            <span className="stat__value">{formatRand(income.estimatedTax)}</span>
          </div>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : transactions.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No requests yet">
          {isFreelancer ? 'Requests from clients will show up here.' : <><Link to="/gigs">Browse gigs</Link> to send your first job request.</>}
        </EmptyState>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Gig</th>
                <th>{isFreelancer ? 'Client' : 'Freelancer'}</th>
                <th>Work details</th>
                <th>Status</th>
                <th className="num">Offer</th>
                {isFreelancer && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const party = isFreelancer ? tx.client : tx.freelancer
                return (
                  <tr key={tx.id}>
                    <td>{formatDate(tx.createdAt)}</td>
                    <td>{decodeEntities(tx.gigTitle)}</td>
                    <td>{party ? decodeEntities(party.name) : '—'}</td>
                    <td className="details">{decodeEntities(tx.details)}</td>
                    <td><StatusLabel status={tx.status} /></td>
                    <td className="num">{formatRand(tx.amount)}</td>
                    {isFreelancer && (
                      <td>
                        {tx.status === 'pending' && (
                          <div className="form__actions">
                            <button type="button" className="btn btn--primary btn--sm" disabled={respondingId === tx.id}
                              onClick={() => handleRespond(tx, 'accepted')}><Check aria-hidden="true" />Accept</button>
                            <button type="button" className="btn btn--ghost btn--sm" disabled={respondingId === tx.id}
                              onClick={() => handleRespond(tx, 'declined')}><X aria-hidden="true" />Decline</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
