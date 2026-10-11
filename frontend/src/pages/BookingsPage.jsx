import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/endpoints'
import Alert from '../components/Alert'
import { decodeEntities, formatDate, formatRand } from '../utils/format'

/**
 * Clients: bookings they have made.
 * Freelancers: bookings received for their gigs plus an income summary.
 */
export default function BookingsPage() {
  const { token, user } = useAuth()
  const isFreelancer = user.role === 'freelancer'
  const [transactions, setTransactions] = useState([])
  const [income, setIncome] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
  }, [token, isFreelancer])

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <h1>{isFreelancer ? 'Bookings & income' : 'My bookings'}</h1>
          <p className="muted">
            {isFreelancer ? 'Bookings clients have made for your gigs.' : 'Services you have booked.'}
          </p>
        </div>
      </div>

      <Alert type="error">{error}</Alert>

      {isFreelancer && income && (
        <div className="stats">
          <div className="card stat">
            <span className="stat__label">Total income</span>
            <span className="stat__value">{formatRand(income.totalIncome)}</span>
          </div>
          <div className="card stat">
            <span className="stat__label">Bookings</span>
            <span className="stat__value">{income.bookings}</span>
          </div>
          <div className="card stat">
            <span className="stat__label">Estimated tax ({income.taxRate})</span>
            <span className="stat__value">{formatRand(income.estimatedTax)}</span>
          </div>
        </div>
      )}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : transactions.length === 0 ? (
        <div className="empty">
          {isFreelancer ? 'No bookings yet.' : <>No bookings yet. <Link to="/gigs">Browse gigs</Link></>}
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Gig</th>
                <th>{isFreelancer ? 'Client' : 'Freelancer'}</th>
                <th>Status</th>
                <th className="num">Amount</th>
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
                    <td><span className={`status status--${tx.status}`}>{tx.status}</span></td>
                    <td className="num">{formatRand(tx.amount)}</td>
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
