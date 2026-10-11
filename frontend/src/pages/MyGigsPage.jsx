import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import * as api from '../api/endpoints'
import GigCard from '../components/GigCard'
import GigForm from '../components/GigForm'
import Alert from '../components/Alert'
import { decodeEntities } from '../utils/format'

/** Freelancer dashboard: create, edit and delete your own gigs. */
export default function MyGigsPage() {
  const { token } = useAuth()
  const [gigs, setGigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await api.listMyGigs(token)
      setGigs(data.gigs)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function handleCreate(values) {
    await api.createGig(token, values)
    setSuccess('Gig created and listed on the marketplace.')
    load()
  }

  async function handleUpdate(values) {
    await api.updateGig(token, editing.id, values)
    setEditing(null)
    setSuccess('Gig updated.')
    load()
  }

  async function handleDelete(gig) {
    if (!window.confirm(`Delete "${decodeEntities(gig.title)}"? This cannot be undone.`)) return
    setError('')
    try {
      await api.deleteGig(token, gig.id)
      setSuccess('Gig deleted.')
      if (editing?.id === gig.id) setEditing(null)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page">
      <div className="page__header">
        <div>
          <h1>My gigs</h1>
          <p className="muted">Create and manage the services you offer.</p>
        </div>
      </div>

      <Alert type="error">{error}</Alert>
      <Alert type="success">{success}</Alert>

      <div className="split">
        <div>
          {editing ? (
            <GigForm key={editing.id} initialGig={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} />
          ) : (
            <GigForm onSubmit={handleCreate} />
          )}
        </div>

        <div>
          <h2 className="section-title">Your listings ({gigs.length})</h2>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : gigs.length === 0 ? (
            <div className="empty">You have no gigs yet. Create your first one.</div>
          ) : (
            <div className="stack">
              {gigs.map((gig) => (
                <GigCard
                  key={gig.id}
                  gig={gig}
                  onEdit={(g) => { setSuccess(''); setEditing(g) }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
