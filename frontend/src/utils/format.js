/**
 * format.js – Display helpers.
 *
 * The API HTML-escapes text before storing it (stored-XSS defence), so a
 * title like "Bob's logo" comes back as "Bob&#x27;s logo". decodeEntities
 * turns those entities back into plain characters for display. This is safe
 * because React always renders strings as text (never as HTML), so a decoded
 * "<script>" is shown literally and never executed.
 */

/* user1210233, 2015
 * What does it mean when they say React is XSS protected?
 * Stack Overflow
 * https://stackoverflow.com/questions/33644499/what-does-it-mean-when-they-say-react-is-xss-protected
 * Accessed: 11 October 2026
 */
const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#x5C;': '\\',
  '&#96;': '`',
}

export function decodeEntities(value) {
  if (typeof value !== 'string') return value
  return value.replace(/&(amp|lt|gt|quot|#x27|#x2F|#x5C|#96);/g, (match) => ENTITIES[match])
}

const currency = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })

export function formatRand(amount) {
  return currency.format(Number(amount) || 0)
}

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}
