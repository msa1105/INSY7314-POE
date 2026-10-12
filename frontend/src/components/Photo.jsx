/* MDN contributors, 2026
 * <img>: The Image Embed element
 * MDN Web Docs
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img
 * Accessed: 11 October 2026
 */
/* MDN contributors, 2026
 * object-fit
 * MDN Web Docs
 * https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-fit
 * Accessed: 11 October 2026
 */

/**
 * A cover photo with its photographer credit. The image fills its container
 * (object-fit: cover in CSS); the credit links to the photo on Unsplash.
 */
export default function Photo({ photo, className = '', eager = false }) {
  return (
    <figure className={`photo ${className}`}>
      <img
        src={photo.src}
        alt={photo.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
      <figcaption className="photo__credit">
        Photo: <a href={photo.link} target="_blank" rel="noopener noreferrer">{photo.author}</a> / Unsplash
      </figcaption>
    </figure>
  )
}
