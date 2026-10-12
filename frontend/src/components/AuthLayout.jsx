import Photo from './Photo'

/**
 * Two-column layout for the login and register pages: the form on the left,
 * a photo with a short message on the right. The photo is hidden on narrow
 * screens so the form always comes first on a phone.
 */
export default function AuthLayout({ photo, heading, text, children }) {
  return (
    <div className="auth-split">
      <div className="auth-split__form">{children}</div>
      <aside className="auth-split__media">
        <Photo photo={photo} eager />
        <div className="auth-split__message">
          <p className="auth-split__heading">{heading}</p>
          <p className="auth-split__text">{text}</p>
        </div>
      </aside>
    </div>
  )
}
