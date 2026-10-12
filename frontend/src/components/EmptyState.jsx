import { Inbox } from 'lucide-react'

/** Friendly placeholder shown when a list has nothing in it yet. */
export default function EmptyState({ icon: Icon = Inbox, title, children }) {
  return (
    <div className="empty">
      <Icon aria-hidden="true" className="empty__icon" />
      <p className="empty__title">{title}</p>
      {children && <p className="empty__text">{children}</p>}
    </div>
  )
}
