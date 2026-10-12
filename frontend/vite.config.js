import fs from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * Vite configuration for the HustleHub+ React frontend.
 *
 * - The app runs on https://localhost:3000, reusing the backend's local
 *   SSL certificate (run `npm run generate-certs` in /backend first).
 * - Requests to /api are proxied to the HTTPS backend, so the browser only
 *   ever talks to one origin and the self-signed certificate is not a problem.
 * - Security headers (including a strict Content Security Policy) are sent
 *   when serving the production build with `npm run preview`.
 */

const SSL_DIR = path.resolve(__dirname, '../backend/ssl')
const keyFile = path.join(SSL_DIR, 'server.key')
const certFile = path.join(SSL_DIR, 'server.cert')
const https = fs.existsSync(keyFile) && fs.existsSync(certFile)
  ? { key: fs.readFileSync(keyFile), cert: fs.readFileSync(certFile) }
  : undefined

const API_TARGET = process.env.VITE_API_TARGET || 'https://localhost:5000'

// Content Security Policy for the built app: only our own scripts, styles,
// images and API calls are allowed; no inline scripts, plugins or framing.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

const proxy = {
  '/api': { target: API_TARGET, changeOrigin: true, secure: false },
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    https,
    proxy,
    // CSP is left out in dev only: Vite's hot reload injects inline scripts.
    headers: SECURITY_HEADERS,
  },
  preview: {
    port: 3000,
    strictPort: true,
    https,
    proxy,
    headers: { ...SECURITY_HEADERS, 'Content-Security-Policy': CSP },
  },
  build: {
    sourcemap: false, // don't ship source code to the browser
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
