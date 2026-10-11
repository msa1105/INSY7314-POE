import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/endpoints'
import Alert from '../components/Alert'
import { decodeEntities, formatDate, formatRand } from '../utils/format'

/** Admin overview: every user and every transaction on the platform. */
export default function AdminPage() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [tab, setTab] = useState('users')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([api.listUsers(token), api.listAllTransactions(token)])
      .then(([u, t]) => {
        if (cancelled) return
        setUsers(u.users)
        setTransactions(t.transactions)
      })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [token])

  const volume = transactions.reduce((sum, tx) => sum + tx.amount, 0)

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <h1>Admin</h1>
          <p className="muted">Platform users and transactions.</p>
        </div>
      </div>

      <Alert type="error">{error}</Alert>

      <div className="stats">
        <div className="card stat"><span className="stat__label">Users</span><span className="stat__value">{users.length}</span></div>
        <div className="card stat"><span className="stat__label">Transactions</span><span className="stat__value">{transactions.length}</span></div>
        <div className="card stat"><span className="stat__label">Booking volume</span><span className="stat__value">{formatRand(volume)}</span></div>
      </div>

      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'users'} className={`tab${tab === 'users' ? ' tab--active' : ''}`} onClick={() => setTab('users')}>Users</button>
        <button type="button" role="tab" aria-selected={tab === 'transactions'} className={`tab${tab === 'transactions' ? ' tab--active' : ''}`} onClick={() => setTab('transactions')}>Transactions</button>
      </div>

      {loading ? (
        <p className="muted">Loading…</p>
      ) : tab === 'users' ? (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{decodeEntities(u.name)}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge badge--${u.role}`}>{u.role}</span></td>
                  <td>{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead><tr><th>Date</th><th>Gig</th><th>Client</th><th>Freelancer</th><th>Status</th><th className="num">Amount</th></tr></thead>
            <tbody>
              {transactions.length === 0 && (
                <tr><td colSpan="6" className="muted">No transactions yet.</td></tr>
              )}
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{formatDate(tx.createdAt)}</td>
                  <td>{decodeEntities(tx.gigTitle)}</td>
                  <td>{tx.client ? decodeEntities(tx.client.name) : '—'}</td>
                  <td>{tx.freelancer ? decodeEntities(tx.freelancer.name) : '—'}</td>
                  <td><span className={`status status--${tx.status}`}>{tx.status}</span></td>
                  <td className="num">{formatRand(tx.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
