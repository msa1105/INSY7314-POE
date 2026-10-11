# HustleHub+ – Secure Freelance Marketplace

> **INSY7314 POE – Part 1: Secure Backend Foundations**

HustleHub+ is a secure freelance marketplace platform that allows freelancers to advertise services and clients to browse and book those services. This repository contains the backend API built for Part 1, establishing the secure foundational layer of the MERN-stack system.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Intended Users](#intended-users)
3. [Architecture Diagram](#architecture-diagram)
4. [Backend Structure](#backend-structure)
5. [Input Validation & Error Handling](#input-validation--error-handling)
6. [API Endpoints](#api-endpoints)
7. [Security Deep Dive & Technical Specification](#security-deep-dive--technical-specification)
   - [Security Decisions Review](#security-decisions-review)
   - [Password Hashing](#password-hashing)
   - [Token-Based Authentication](#token-based-authentication)
   - [HTTPS & Transport Security](#https--transport-security)
   - [5. Threat Matrix](#5-threat-matrix)
   - [Input Validation & Sanitisation](#input-validation--sanitisation)
   - [Additional Security Controls](#additional-security-controls)
8. [Getting Started](#getting-started)
9. [Running the API](#running-the-api)
10. [Running Tests](#running-tests)
11. [Postman Collection & Verification Screenshots](#postman-collection--verification-screenshots)
    - [Health Check](#1-health-check)
    - [User Registration & Input Validation](#2-user-registration--input-validation)
    - [Authentication & Login](#3-authentication--login)
    - [Protected Routes & JWT Verification](#4-protected-routes--jwt-verification)
    - [Role-Based Access Control & Gig Management](#5-role-based-access-control-rbac--gig-management)
12. [Demonstration Video](#demonstration-video)
13. [What's Left for Part 2](#whats-left-for-part-2)

---

## System Overview

**HustleHub+** is a secure freelance marketplace platform that connects freelancers offering professional services with clients who need to hire them. The platform allows freelancers to advertise their skills through service listings ("gigs"), while clients can browse, search, and book those services with simulated payments.

### Purpose

The South African freelance economy is growing rapidly, yet many platforms lack adequate security measures to protect user data and financial information. HustleHub+ was designed to address this gap by building security into the foundation of the system from day one — not as an afterthought.

### Key Goals

- **Secure authentication** — Passwords are hashed with bcrypt; sessions are managed via short-lived JWTs
- **Role-based access control** — Clients, freelancers, and admins each have distinct permissions enforced at the middleware level
- **Data protection** — All traffic is encrypted over HTTPS; sensitive fields are never exposed in API responses or logs
- **Input safety** — Every user input is validated and sanitised before reaching business logic, preventing injection and XSS attacks

### Technology Stack (MERN)

The platform is designed and implemented following the **MERN architecture**:

| Layer   | Technology                | Status    |
| ------- | ------------------------- | --------- |
| MongoDB | Database (document store) | Part 2    |
| Express | Backend REST API          | ✅ Part 1 |
| React   | Frontend SPA              | Part 2    |
| Node.js | Server runtime            | ✅ Part 1 |

The platform processes sensitive information including user credentials, transactional records, and income-related data. Security is treated as a **primary design concern**, not an afterthought.

---

## Intended Users

HustleHub+ supports three user roles, each with distinct capabilities and access levels enforced through role-based access control (RBAC):

| Role           | Description                                                                                                                             | Key Permissions                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Freelancer** | Registers on the platform, creates and manages service listings (gigs), receives bookings and payments, views income and tax dashboard. | Create/update/delete own gigs, view income summary    |
| **Client**     | Registers on the platform, browses and searches freelancer gigs, places bookings, makes simulated payments.                             | Browse gigs, book services, make payments             |
| **Admin**      | Platform administrator. Can view all users and manage platform content.                                                                 | View all users, delete any gig, view all transactions |

Access control is enforced at two levels:

1. **Authentication** (`authenticate` middleware) — Verifies the JWT token is valid; rejects unauthenticated requests with HTTP 401
2. **Authorisation** (`authorise(...roles)` middleware) — Checks the user's role against the permitted roles for each endpoint; rejects unauthorised requests with HTTP 403

---

## Architecture Diagram

The following diagram illustrates the full request flow through the HustleHub+ backend, including security boundaries at each layer:

![HustleHub+ Architecture Diagram](architecture_diagram.jpg)

### Security Boundaries

The architecture enforces security at every layer of the request lifecycle:

| Boundary      | Layer                                 | Protection                                                                             |
| ------------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| **Transport** | HTTPS/TLS                             | All data encrypted in transit; HTTP is never exposed                                   |
| **Perimeter** | Helmet, CORS, Rate Limiter            | Security headers set, origins whitelisted, brute-force mitigated                       |
| **Input**     | express-validator, Body Parser (10KB) | All input validated/sanitised before reaching controllers; oversized payloads rejected |
| **Identity**  | JWT Authentication                    | Token verified on every protected request; expired/tampered tokens rejected (401)      |
| **Access**    | RBAC Authorisation                    | Role checked against endpoint permissions; unauthorised roles rejected (403)           |
| **Output**    | Secure Error Handler                  | Stack traces, file paths, and internal details never sent to client                    |
| **Data**      | bcrypt, `omitPassword()`              | Passwords hashed before storage; password hashes stripped from all API responses       |

### Mermaid Diagram

```mermaid
flowchart TD
    Client["Client (Browser / Postman)"]
    Client -->|"HTTPS / TLS"| SecurityLayer

    subgraph Backend["Node.js + Express Backend (Port 5000)"]
        SecurityLayer["Security Middleware\nHelmet · CORS · Rate Limiter · Morgan"]
        SecurityLayer --> BodyParser["Body Parser (10KB limit)"]
        BodyParser --> Routes["API Routes\n/api/auth · /api/users · /api/gigs · /api/transactions"]
        Routes --> Middleware["Request Middleware\nexpress-validator · JWT Auth · RBAC Authorise"]
        Middleware --> Controllers["Controllers\nauthController · userController · gigController · transactionController"]
    end

    Controllers --> DataLayer

    subgraph DataLayer["Data Layer"]
        JSONStore["JSON File Store (Part 1)\nusers.json · gigs.json · transactions.json"]
        MongoDB[("MongoDB (Part 2)")]
        JSONStore -.->|"Migration"| MongoDB
    end
```

---

## Backend Structure

The backend follows a clear **separation of concerns** pattern, dividing code into distinct layers:

| Layer            | Purpose                                                                  | Files                                                                                    |
| ---------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| **Routes**       | Define API endpoints and attach validation chains + middleware           | `authRoutes.js`, `userRoutes.js`, `gigRoutes.js`, `transactionRoutes.js`                 |
| **Middleware**   | Cross-cutting concerns (auth, validation, error handling, rate limiting) | `auth.js`, `validate.js`, `errorHandler.js`, `rateLimiter.js`                            |
| **Controllers**  | Business logic — process validated requests and return responses         | `authController.js`, `userController.js`, `gigController.js`, `transactionController.js` |
| **Data / Store** | Persistence layer — read/write to JSON file stores (MongoDB in Part 2)   | `userStore.js`, `gigStore.js`, `transactionStore.js`                                     |
| **Config**       | Application constants and configuration values                           | `constants.js`                                                                           |

This separation ensures that each layer has a single responsibility: routes handle HTTP routing, middleware handles cross-cutting security concerns, controllers handle business logic, and stores handle data persistence. This makes the codebase easier to test, maintain, and extend.

### Folder Tree

```
backend/
├── server.js                        # HTTPS server entry point
├── generate-certs.js                # Self-signed SSL certificate generator
├── package.json
├── .env.example                     # Environment variable template
├── .gitignore
│
├── ssl/                             # SSL certs (git-ignored)
│   ├── server.key
│   └── server.cert
│
├── logs/                            # Application logs (git-ignored)
│   └── app.log
│
└── src/
    ├── app.js                       # Express app setup (middleware stack, route mounting)
    │
    ├── config/
    │   └── constants.js             # App-wide constants (roles, JWT config)
    │
    ├── controllers/
    │   ├── authController.js        # register(), login() – bcrypt hashing + JWT signing
    │   ├── userController.js        # getProfile(), getAllUsers()
    │   ├── gigController.js         # listGigs(), getGig(), createGig(), updateGig(), deleteGig()
    │   └── transactionController.js # createTransaction(), getIncome(), getAllTransactions()
    │
    ├── middleware/
    │   ├── auth.js                  # authenticate() – JWT verification
    │   │                            # authorise(...roles) – RBAC enforcement
    │   ├── errorHandler.js          # Global error handler (no stack trace leakage)
    │   ├── rateLimiter.js           # General (100/15min) + auth-specific (20/15min) rate limiting
    │   └── validate.js              # express-validator result handler → 422 responses
    │
    ├── routes/
    │   ├── authRoutes.js            # POST /api/auth/register, /api/auth/login
    │   ├── userRoutes.js            # GET  /api/users/profile, /api/users
    │   ├── gigRoutes.js             # CRUD /api/gigs
    │   └── transactionRoutes.js     # POST /api/transactions, GET /api/transactions/income
    │
    ├── utils/
    │   ├── logger.js                # Structured logger (console + file, no passwords logged)
    │   ├── userStore.js             # File-based user persistence
    │   ├── gigStore.js              # File-based gig persistence
    │   └── transactionStore.js      # File-based transaction persistence
    │
    └── data/
        ├── users.json               # User store (git-tracked as empty [])
        ├── gigs.json                # Gig store  (git-tracked as empty [])
        └── transactions.json        # Transaction store (git-tracked as empty [])

tests/
└── auth.test.js                     # Jest + Supertest integration tests
```

### Request Lifecycle

Every API request flows through the following pipeline:

```
Client Request
  → Helmet (security headers)
  → CORS (origin check)
  → Rate Limiter (brute-force protection)
  → Body Parser (JSON, 10KB limit)
  → Route matched
    → express-validator (input validation/sanitisation)
    → validate middleware (reject 422 if invalid)
    → authenticate (JWT token verification, if protected route)
    → authorise (role check, if role-restricted route)
    → Controller (business logic)
      → Store (data read/write)
  → Response sent
  → errorHandler (catches any unhandled errors — no stack traces leaked)
```

---

## Input Validation & Error Handling

### Input Validation

All user-supplied input is validated and sanitised **before** reaching any controller or business logic. This is implemented using the `express-validator` library, with validation chains defined directly in the route files.

**How it works:**

1. **Validation chains** in route files (e.g., `authRoutes.js`) define the rules for each field
2. The **`validate` middleware** (`src/middleware/validate.js`) checks the results
3. If validation fails → HTTP **422 Unprocessable Entity** with a structured `fields` array
4. If validation passes → request continues to the controller

**Registration validation rules:**

| Field      | Validation Rules                                                                     | Sanitisation                        |
| ---------- | ------------------------------------------------------------------------------------ | ----------------------------------- |
| `name`     | Required, 2–80 characters                                                            | Trimmed, HTML-escaped (`.escape()`) |
| `email`    | Required, valid email format                                                         | Trimmed, normalised to lowercase    |
| `password` | Required, ≥8 chars, must contain uppercase, lowercase, number, and special character | None (hashed by bcrypt immediately) |
| `role`     | Optional, must be `"client"` or `"freelancer"`                                       | Trimmed                             |

**What this prevents:**

| Attack                         | How it's prevented                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **SQL/NoSQL injection**        | Sanitisation strips dangerous characters before they reach the data layer                                                          |
| **Cross-site scripting (XSS)** | `.escape()` HTML-encodes special characters like `<`, `>`, `&` in string fields                                                    |
| **bcrypt denial-of-service**   | Password length capped at 128 characters (bcrypt has a 72-byte input limit; extremely long inputs without a cap could exhaust CPU) |
| **Logic errors**               | Type checking and length constraints prevent unexpected data from causing failures                                                 |

**Example validation error response (422):**

```json
{
  "error": "Validation failed.",
  "fields": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters."
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter."
    },
    {
      "field": "password",
      "message": "Password must contain at least one number."
    },
    {
      "field": "password",
      "message": "Password must contain at least one special character."
    }
  ]
}
```

### Error Handling

The global error handler (`src/middleware/errorHandler.js`) is the **last line of defence** against accidental information disclosure. It ensures that internal system details are **never** leaked to the client.

**What the error handler strips from responses:**

| Information             | Leaked?     | Why                                                                        |
| ----------------------- | ----------- | -------------------------------------------------------------------------- |
| Stack traces            | ❌ Never    | Reveals file paths, line numbers, and internal function names to attackers |
| File system paths       | ❌ Never    | Exposes server directory structure                                         |
| Internal error messages | ⚠️ Dev only | Shown only when `NODE_ENV=development`; hidden in production               |
| Detailed error objects  | ❌ Never    | Only a generic message is sent to the client                               |

**How it works:**

- **Client errors (4xx):** The error's own message is returned (e.g., "Invalid email or password")
- **Server errors (5xx) in production:** A generic `"Internal server error. Please try again later."` is returned
- **Server errors (5xx) in development:** The error message is returned with a `hint: "Check server logs for details."`
- **All errors:** Full error details (including stack trace) are logged server-side to `logs/app.log` for debugging

```javascript
// From errorHandler.js — client never sees the stack trace
const response = {
  error:
    statusCode < 500
      ? err.message || "Request error."
      : isDev
        ? err.message
        : "Internal server error. Please try again later.",
};
```

---

## API Endpoints

### Public Endpoints

| Method | Endpoint             | Description                           |
| ------ | -------------------- | ------------------------------------- |
| GET    | `/api/health`        | Health check                          |
| POST   | `/api/auth/register` | Register new user (client/freelancer) |
| POST   | `/api/auth/login`    | Authenticate and receive JWT          |

### Protected Endpoints (require `Authorization: Bearer <token>`)

| Method | Endpoint                   | Role Required               | Description                         |
| ------ | -------------------------- | --------------------------- | ----------------------------------- |
| GET    | `/api/users/profile`       | Any authenticated           | Get own user profile                |
| GET    | `/api/users`               | Admin only                  | List all users                      |
| GET    | `/api/gigs`                | Any authenticated           | Browse all gigs                     |
| GET    | `/api/gigs/:id`            | Any authenticated           | Get single gig                      |
| POST   | `/api/gigs`                | Freelancer only             | Create a new gig                    |
| PUT    | `/api/gigs/:id`            | Freelancer (owner)          | Update own gig                      |
| DELETE | `/api/gigs/:id`            | Freelancer (owner) or Admin | Delete a gig                        |
| POST   | `/api/transactions`        | Client only                 | Book a gig (simulated payment)      |
| GET    | `/api/transactions/income` | Freelancer only             | View income summary + estimated tax |
| GET    | `/api/transactions`        | Admin only                  | View all platform transactions      |

### Request / Response Examples

**Register (POST /api/auth/register)**

```json
// Request body
{
  "name": "Alice Dlamini",
  "email": "alice@example.com",
  "password": "SecurePass1!",
  "role": "client"
}

// 201 Created response
{
  "message": "Registration successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Alice Dlamini",
    "email": "alice@example.com",
    "role": "client",
    "createdAt": "2026-08-04T11:00:00.000Z"
  }
}
```

**Login (POST /api/auth/login)**

```json
// Request body
{ "email": "alice@example.com", "password": "SecurePass1!" }

// 200 OK response
{
  "message": "Login successful.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": "...", "name": "Alice Dlamini", "email": "alice@example.com", "role": "client" }
}
```

**Validation Error (422)**

```json
{
  "error": "Validation failed.",
  "fields": [
    {
      "field": "password",
      "message": "Password must contain at least one special character."
    },
    { "field": "email", "message": "A valid email address is required." }
  ]
}
```

---

## Security Deep Dive & Technical Specification

### Security Decisions Review

HustleHub+ employs defense in depth with layered controls across transport, authentication, authorization, traffic shaping, and error handling. HTTPS/TLS 1.2+ (RSA 2048-bit, SHA-256) guards against MITM and credential theft (OWASP API7). Passwords are protected with bcryptjs and 12 rounds of salt in case of database breach and brute force attack (API2). Timing attack is avoided through normalizing response times with a dummy hash (API2). Stateless JWTs (HS256) protect from session hijacking (API2). RBAC middleware (authenticate/authorise) prevents privilege escalation (API1). helmet enables HSTS and security headers protecting against clickjacking and downgrade attacks (API7). express-rate-limit limits auth routes to 20 req/15 min for credential stuffing protection (API4). An omitPassword sanitization and centralized error handling prevent credential and stack trace leakage (API3).

---

### Password Hashing

Plaintext passwords are never stored, not kept in memory, or logged; they are always hashed via bcrypt.hash() at sign up. Unlike generic-purpose hashing functions like MD5 and SHA-family, which are very fast to crack on GPU/ASIC, bcrypt offers three major advantages: configurable work factor (cost 12, or 4,096 iterations, ~250-350ms each, bcrypt default cost); 128-bit per hash random salts encoded within crypt string, protecting from rainbow tables; memory hard Eksblowfish core protecting from GPU parallelization.

Differences in response time for existing and non-existing users (~5ms vs ~300ms) may reveal valid emails through timing attack. HustleHub+ compares provided password with dummy hash if there is no user found, equalizing CPU processing time and providing the same error message:

```javascript
const DUMMY_HASH = '$2b$12$invalidhashfortimingnormalizationpurposesonly';
const hashToCompare = user ? user.passwordHash : DUMMY_HASH;
const isMatch = await bcrypt.compare(password, hashToCompare);
if (!user || !isMatch) return res.status(401).json({ error: 'Invalid email or password.' });
```

Cap of password length at the validation step prevents CPU from exhaustion from huge inputs; bcrypt truncates password at 72 characters anyway.

**Implementation details:**
- **Algorithm used:** bcrypt (via `bcryptjs`)
- **Salt rounds:** Configurable via `BCRYPT_SALT_ROUNDS` environment variable (default: `12`)
- **Storage:** Hash is stored as a 60-character string in the `passwordHash` field
- **Output sanitisation:** The field is stripped from all API responses using the `omitPassword()` helper before any user object is sent to the client
- **Logging hygiene:** Passwords are never logged — only user IDs and roles appear in log files

---

### Token-Based Authentication

JWT allows stateless authentication without any sessions on the server side. Upon logging in, the server performs validation, constant-time comparison, and signing of token (HMAC-SHA256). Further requests pass token as bearer credential; authenticate validates signature and token expiry, authorise check for role.

Payloads contain non-sensitive claims only (id, email, role, iat, exp, iss, aud) — no passwords and database keys. Claims issuer/audience limit token usage to hustlehub-api/hustlehub-client, so no possible replay attacks across services. Token is expired after one hour; 256+ bit secret protects from brute force, and validation is limited to HS256, making alg:none impossible:

```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
```

Authentication route protection employs both middlewares:

```javascript
router.get('/api/users', authenticate, authorise('admin'), getAllUsers);
```

**Token payload structure (claims):**

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "client",
  "iat": 1722768000,
  "exp": 1722771600,
  "iss": "hustlehub-api",
  "aud": "hustlehub-client"
}
```

**Security measures:**
| Measure | Detail |
|---------|--------|
| Algorithm pinning | `algorithms: ['HS256']` specified on `jwt.verify()` — prevents the "alg:none" attack where an attacker sets the algorithm to none in a crafted token |
| Secret strength | `JWT_SECRET` loaded from environment (never hardcoded). Must be at minimum 64 random characters |
| Short expiry | Default 1 hour; configurable via `JWT_EXPIRES_IN` |
| Issuer + Audience | `iss: 'hustlehub-api'` and `aud: 'hustlehub-client'` prevent token reuse across services |
| Error messages | Expired vs invalid tokens return clear but non-revealing messages |

---

### HTTPS & Transport Security

TLS is the base of other security layers, providing confidentiality (AES-GCM/ChaCha20-Poly1305), integrity (MACs) and server authentication, making MITM and DNS spoofing attacks impossible. HustleHub+ has no unsecured HTTP listeners, using Node's https module with 2048-bit RSA and SHA-256 certificate. HSTS with max-age=31536000 and includeSubDomains forces upgrade to HTTPS.

**Implementation details:**
- `server.js` loads SSL key and certificate files and creates an `https.createServer()` instance.
- SSL files are generated locally using OpenSSL via `node generate-certs.js`.
- Certificates are **git-ignored** — each developer generates their own locally.
- The `Strict-Transport-Security` (HSTS) header is set via Helmet with `maxAge: 31536000` (1 year), instructing browsers to always use HTTPS.
- **For production:** A certificate from a trusted Certificate Authority (CA) such as Let's Encrypt should replace the self-signed certificate. The self-signed certificate is for local development only.

---

### 5. Threat Matrix

| Threat (CWE/API) | Mitigation |
|---|---|
| MITM (CWE-319/API7) | TLS 1.2+, HSTS |
| Credential cracking (CWE-916/API2) | bcrypt, 12 rounds |
| User enumeration (CWE-208/API2) | Dummy-hash timing normalization |
| Algorithm confusion (CWE-327/API2) | HS256 pinning |
| Privilege escalation (CWE-285/API1) | Centralized RBAC |
| Brute force/DoS (CWE-307/API4) | Tiered rate limiting |
| Bcrypt exhaustion (CWE-400/API4) | 128-char password cap |
| Info disclosure (CWE-209/API3) | Error sanitization |

---

### Additional Security Controls

#### Helmet (HTTP Security Headers)

`helmet` automatically sets the following HTTP response headers:

| Header                            | Purpose                                                   |
| --------------------------------- | --------------------------------------------------------- |
| `Content-Security-Policy`         | Restricts sources of scripts/styles/images to prevent XSS |
| `Strict-Transport-Security`       | Forces HTTPS for 1 year                                   |
| `X-Content-Type-Options: nosniff` | Prevents MIME type sniffing                               |
| `X-Frame-Options: DENY`           | Prevents clickjacking                                     |
| `X-XSS-Protection`                | Enables browser XSS filter                                |
| `Referrer-Policy`                 | Controls referrer information leakage                     |

#### CORS (Cross-Origin Resource Sharing)

Only requests from the configured `CORS_ORIGIN` (default: `https://localhost:3000`) are accepted. All other origins receive a CORS error. This prevents malicious websites from making authenticated API requests using a victim's stored credentials.

#### Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Auth routes** (`/api/auth/*`): Stricter — 20 requests per 15 minutes per IP

This mitigates credential-stuffing and brute-force login attacks.

#### Secure Error Handling

The global error handler (`src/middleware/errorHandler.js`) ensures that:

- Stack traces are **never** sent to the client
- File system paths are **never** exposed
- Internal error messages are only shown in development mode
- All errors are logged server-side with full details for debugging

#### Request Body Size Limit

JSON request bodies are limited to **10KB** to prevent large payload denial-of-service attacks:

```javascript
app.use(express.json({ limit: "10kb" }));
```

#### Structured Logging

All key system events (registrations, logins, failed auth attempts, forbidden access) are logged to both console and `logs/app.log` with timestamps. Logs never contain passwords or full token values. This supports security auditing and incident response.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- OpenSSL (for generating SSL certificates)
  - Windows: Install via [Win32 OpenSSL](https://slproweb.com/products/Win32OpenSSL.html) or `choco install openssl`
  - macOS: `brew install openssl`
  - Linux: `sudo apt install openssl`

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ST10445928/INSY7314.git
cd INSY7314/backend

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and set JWT_SECRET to a long random string (min 64 chars)
# You can generate one with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 4. Generate SSL certificate
node generate-certs.js
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=<your-long-random-secret>
JWT_EXPIRES_IN=1h
SSL_KEY_PATH=./ssl/server.key
SSL_CERT_PATH=./ssl/server.cert
CORS_ORIGIN=https://localhost:3000
BCRYPT_SALT_ROUNDS=12
```

> ⚠️ **Never commit your `.env` file.** It is listed in `.gitignore`.

---

## Running the API

```bash
# Start in development mode (with auto-restart on changes)
npm run dev

# Start in production mode
npm start
```

The API will be available at `https://localhost:5000`.

> **Note:** Because the certificate is self-signed, Postman will show an SSL warning. In Postman settings, disable "SSL certificate verification" for local testing.

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Watch mode (re-runs on file changes)
npm run test:watch
```

Tests are located in `tests/auth.test.js` and use **Jest** + **Supertest**. They reset the user store before each test to ensure isolation.

---

## Postman Collection & Verification Screenshots

The file `hustlehub_api.postman_collection.json` (in the repo root) contains a complete Postman collection with:

- All endpoints with example request bodies
- Automated test scripts that validate status codes and response shapes
- Auto-capture of JWT token from login/register responses into the `{{token}}` collection variable

**To use:**

1. Open Postman → Import → select `hustlehub_api.postman_collection.json`
2. In Postman Settings → turn off SSL certificate verification (required for self-signed development certificates)
3. Run "Register – Valid Client" first, then run other requests
4. Use "Run Collection" to execute all tests automatically

---

### Test Execution Screenshots & Verification

Below are the verified test execution results captured from Postman, confirming status codes, response payloads, security controls, and RBAC enforcement.

#### 1. Health Check

##### `GET /api/health` – Service Health Verification

Validates that the HTTPS server is online, responding with HTTP `200 OK`, and outputting system status and version.

![GET /api/health - Service Health Check](images/postman1.png)

---

#### 2. User Registration & Input Validation

##### `POST /api/auth/register` – Register Valid Client

Registers a client (`Alice Dlamini`, `alice@hustlehub.test`). Confirms password hashing via bcrypt (no plaintext or `passwordHash` exposed in the response), returns HTTP `201 Created`, and issues an initial JWT token.

![POST /api/auth/register - Register Valid Client](images/postman2.png)

##### `POST /api/auth/register` – Register Valid Freelancer

Registers a freelancer user (`Bob Nkosi`, `bob@hustlehub.test`) with the `freelancer` role. Returns HTTP `201 Created` with signed token.

![POST /api/auth/register - Register Valid Freelancer](images/postman3.png)

##### `POST /api/auth/register` – Duplicate Email Prevention (409 Conflict)

Attempts to register with an already-existing email (`alice@hustlehub.test`). Returns HTTP `409 Conflict` with a clean error message, preventing account duplication and data collisions.

![POST /api/auth/register - Duplicate Email (409 Conflict)](images/postman4.png)

##### `POST /api/auth/register` – Password Strength Validation (422 Unprocessable Entity)

Validates input sanitisation and password complexity rules (minimum 8 characters, uppercase, number, special character). Returns HTTP `422 Unprocessable Entity` with a structured `fields` error array.

![POST /api/auth/register - Weak Password Validation (422)](images/postman5.png)

##### `POST /api/auth/register` – Email Format Validation (422 Unprocessable Entity)

Rejects invalid email format (`not-an-email`). Enforces strict RFC email validation with HTTP `422 Unprocessable Entity`.

![POST /api/auth/register - Invalid Email Validation (422)](images/postman6.png)

---

#### 3. Authentication & Login

##### `POST /api/auth/login` – Valid Credentials Login

Authenticates valid client credentials against bcrypt hash. Returns HTTP `200 OK` and a signed JWT containing user claims, which is automatically saved to the `{{token}}` collection variable.

![POST /api/auth/login - Valid Credentials Login](images/postman7.png)

##### `POST /api/auth/login` – Wrong Password Rejection (401 Unauthorized)

Provides timing-attack-resistant authentication comparison. Returns generic HTTP `401 Unauthorized` without revealing credential validity.

![POST /api/auth/login - Wrong Password (401 Unauthorized)](images/postman8.png)

##### `POST /api/auth/login` – Unknown Email Rejection (401 Unauthorized)

Prevents account enumeration by executing a constant-time dummy hash comparison for non-existent users, returning generic HTTP `401 Unauthorized`.

![POST /api/auth/login - Unknown Email (401 Unauthorized)](images/postman9.png)

---

#### 4. Protected Routes & JWT Verification

##### `GET /api/users/profile` – Profile Access With Valid Bearer Token

Verifies JWT token signature and expiry via `authenticate` middleware. Returns HTTP `200 OK` with sanitized user profile (`passwordHash` is omitted).

![GET /api/users/profile - Profile Access With Token](images/postman10.png)

##### `GET /api/users/profile` – Missing Token Access Rejection (401 Unauthorized)

Rejects unauthenticated requests attempting to access protected endpoints without an Authorization header, returning HTTP `401 Unauthorized`.

![GET /api/users/profile - Missing Token (401 Unauthorized)](images/postman11.png)

##### `GET /api/users/profile` – Invalid / Tampered Token Rejection (401 Unauthorized)

Verifies algorithm pinning and signature authenticity. Rejects malformed or altered tokens with HTTP `401 Unauthorized`.

![GET /api/users/profile - Invalid Token (401 Unauthorized)](images/postman12.png)

---

#### 5. Role-Based Access Control (RBAC) & Gig Management

##### `POST /api/gigs` – RBAC Enforcement: Client Forbidden (403 Forbidden)

Demonstrates role-based access control. When a user with the `client` role attempts to create a gig, the `authorise('freelancer', 'admin')` middleware intercepts and rejects the request with HTTP `403 Forbidden`.

![POST /api/gigs - RBAC Forbidden for Client (403 Forbidden)](images/postman13.png)

##### `POST /api/gigs` – Successful Gig Creation by Freelancer (201 Created)

When authenticated as a `freelancer`, the gig is validated and created successfully, associating the listing with the freelancer's ID. Returns HTTP `201 Created`.

![POST /api/gigs - Successful Gig Creation (201 Created)](images/postman14.png)

##### `GET /api/gigs` – List All Gigs (200 OK)

Retrieves active service listings in the marketplace with HTTP `200 OK`.

![GET /api/gigs - List All Gigs (200 OK)](images/postman15.png)

---

## Demonstration Video

A complete video demonstration of the HustleHub+ Part 1 Secure Backend Foundations is available on YouTube. The video walks through:
- Secure server startup over HTTPS with TLS 1.2+ certificate loading
- Health check API verification (`GET /api/health`)
- Input validation and sanitization rejecting invalid email formats and weak passwords (`422 Unprocessable Entity`)
- Timing-attack-resistant authentication comparisons (`200 OK` vs `401 Unauthorized`)
- Bearer token issuance and profile retrieval (`GET /api/users/profile`)
- Protected route verification without a token (`401 Unauthorized`) and with a tampered token (`401 Unauthorized`)
- Role-Based Access Control (RBAC) enforcement preventing clients from creating gigs (`403 Forbidden`) and allowing freelancers (`201 Created`)

> 🎬 **Watch the Demonstration Video on YouTube**:  
> **[https://youtu.be/tYWpZ3LTc-E](https://youtu.be/tYWpZ3LTc-E)**

[![HustleHub+ Backend API Demo Video](https://img.youtube.com/vi/tYWpZ3LTc-E/maxresdefault.jpg)](https://youtu.be/tYWpZ3LTc-E)

---

## What's Left for Part 2

| Item                 | Description                                                | Status                                                          |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- |
| MongoDB integration  | Replace JSON file store with Mongoose + MongoDB            | Planned                                                         |
| React frontend       | Full SPA with login, registration, gig browsing, dashboard | Planned                                                         |
| Booking system       | Client books a gig → transaction record created            | Planned                                                         |
| Income tracking      | Freelancer dashboard showing earnings                      | Planned                                                         |
| Tax calculation      | Estimated tax obligations display                          | Planned                                                         |
| Dockerisation        | Containerise backend + frontend                            | Planned                                                         |
| CI/CD pipeline       | GitHub Actions with automated tests and security scans     | Planned                                                         |
| Architecture diagram | MERN system diagram                                        | ✅ Included                                                     |
| Demo video           | Screen recording of API in action                          | ✅ Completed ([Watch on YouTube](https://youtu.be/tYWpZ3LTc-E)) |
| Postman screenshots  | Screenshots of all API responses                           | ✅ Completed (15 screenshots documented)                        |

