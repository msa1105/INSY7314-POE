import { decodeEntities, formatRand } from '../utils/format'

/**
 * A single gig listing. The action buttons shown depend on the props the
 * page passes in, which in turn depend on the user's role.
 */
export default function GigCard({ gig, onRequest, onEdit, onDelete }) {
  const freelancerName = typeof gig.freelancer === 'object' ? gig.freelancer?.name : null

  return (
    <article className="card gig-card">
      <div className="gig-card__top">
        <span className="chip">{decodeEntities(gig.category)}</span>
        <span className="gig-card__price">{formatRand(gig.price)}</span>
      </div>
      <h3 className="gig-card__title">{decodeEntities(gig.title)}</h3>
      <p className="gig-card__desc">{decodeEntities(gig.description)}</p>
      {freelancerName && <p className="gig-card__by">by {decodeEntities(freelancerName)}</p>}

      {(onRequest || onEdit || onDelete) && (
        <div className="gig-card__actions">
          {onRequest && (
            <button type="button" className="btn btn--primary" onClick={() => onRequest(gig)}>
              Request job
            </button>
          )}
          {onEdit && (
            <button type="button" className="btn btn--secondary" onClick={() => onEdit(gig)}>Edit</button>
          )}
          {onDelete && (
            <button type="button" className="btn btn--danger" onClick={() => onDelete(gig)}>Delete</button>
          )}
        </div>
      )}
    </article>
  )
}
