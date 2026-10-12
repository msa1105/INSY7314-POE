# Changelog

## Now / Next / Known issues

- **Now:** Job requests (client → freelancer, accept/decline) built and tested. Awaiting review.
- **Next:**
  - Update the Postman collection and Newman evidence for the request/respond flow.
  - Update the README (features, endpoints, RBAC table).
  - Add Part 2 screenshots and the demo video link.
- **Known issues:**
  - `docker-compose.yml` still targets the old JSON store and has no MongoDB service.
  - The frontend CSP is only sent by `npm run preview`, not `npm run dev`.
  - The Postman collection and Newman results still describe instant booking.

## 2026-10-12 – Job requests replace instant booking

A client now sends a freelancer a **job request**: the work details and the amount they are willing to pay. The freelancer accepts or declines. Accepting counts as the simulated payment.

- **API**
  - `POST /api/transactions` takes `{ gigId, details, amount }` and creates a `pending` request. `details` is validated (10–2000 characters) and HTML-escaped; `amount` must be between 1 and 1 000 000.
  - New `PATCH /api/transactions/:id` takes `{ status: "accepted" | "declined" }`. It is freelancer-only, and only the freelancer who received the request may respond. A conditional update means each request can be answered once; a second attempt gets a 409.
  - Income and admin volume now count `accepted` requests only. The statuses are now `pending`, `accepted` and `declined` (`completed` and `refunded` were removed).
- **Frontend**
  - "Book now" became "Request job", which opens a form for work details and an offer that defaults to the asking price. The form validates inline.
  - Freelancers get Accept/Decline buttons on pending requests in "Requests & income". Clients see the status of each request in "My requests".
- **Tests:** backend 61 → 75 (all passing), frontend 26 → 30 (all passing).
