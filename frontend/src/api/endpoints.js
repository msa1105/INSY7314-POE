import { apiRequest } from './client'

// Auth
export const register = (data) => apiRequest('/auth/register', { method: 'POST', body: data })
export const login = (data) => apiRequest('/auth/login', { method: 'POST', body: data })

// Gigs
export const listGigs = (token) => apiRequest('/gigs', { token })
export const listMyGigs = (token) => apiRequest('/gigs/mine', { token })
export const createGig = (token, gig) => apiRequest('/gigs', { method: 'POST', body: gig, token })
export const updateGig = (token, id, gig) => apiRequest(`/gigs/${id}`, { method: 'PUT', body: gig, token })
export const deleteGig = (token, id) => apiRequest(`/gigs/${id}`, { method: 'DELETE', token })

// Job requests / transactions
export const sendRequest = (token, gigId, { details, amount }) =>
  apiRequest('/transactions', { method: 'POST', body: { gigId, details, amount: Number(amount) }, token })
export const respondToRequest = (token, id, status) =>
  apiRequest(`/transactions/${id}`, { method: 'PATCH', body: { status }, token })
export const listMyBookings = (token) => apiRequest('/transactions/mine', { token })
export const getIncome = (token) => apiRequest('/transactions/income', { token })

// Admin
export const listUsers = (token) => apiRequest('/users', { token })
export const listAllTransactions = (token) => apiRequest('/transactions', { token })
