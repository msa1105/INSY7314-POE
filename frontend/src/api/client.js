/**
 * client.js – Small wrapper around fetch for the HustleHub+ API.
 *
 * - Every call goes to the same origin (/api), proxied to the backend.
 * - The JWT is sent as a Bearer token when provided.
 * - Errors are normalised into ApiError with a user-safe message. Server
 *   errors (5xx) and network failures never show raw details to the user.
 */

export class ApiError extends Error {
  constructor(status, message, fields = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

const GENERIC_ERROR = 'Something went wrong. Please try again.'

let unauthorizedHandler = null

/** Registers a callback for 401 responses on authenticated requests (e.g. expired token). */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler
}

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }

  let data = {}
  try {
    data = await response.json()
  } catch {
    // Non-JSON response – fall through with an empty body
  }

  if (!response.ok) {
    if (response.status === 401 && token && unauthorizedHandler) {
      unauthorizedHandler()
    }
    const message = response.status >= 500 ? GENERIC_ERROR : (data.error || GENERIC_ERROR)
    throw new ApiError(response.status, message, Array.isArray(data.fields) ? data.fields : [])
  }

  return data
}

/** Converts the API's [{ field, message }] list into { field: firstMessage }. */
export function fieldErrorMap(fields = []) {
  return fields.reduce((acc, { field, message }) => {
    if (!acc[field]) acc[field] = message
    return acc
  }, {})
}
