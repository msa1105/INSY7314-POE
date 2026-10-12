import { CircleCheck, CircleX, Clock } from 'lucide-react'

const ICONS = { pending: Clock, accepted: CircleCheck, declined: CircleX }

/** Request status as coloured text with an icon (pending / accepted / declined). */
export default function StatusLabel({ status }) {
  const Icon = ICONS[status] ?? Clock
  return (
    <span className={`status status--${status}`}>
      <Icon aria-hidden="true" />
      {status}
    </span>
  )
}
