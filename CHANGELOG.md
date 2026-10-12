# Changelog

## Now / Next / Known issues

- **Now:** Screenshots retaken for the polished UI, full attributions list added. Pushed.
- **Next:**
  - Record the Part 2 demo video and add its link to the README.
- **Known issues:**
  - The frontend CSP is only sent by `npm run preview`, not `npm run dev` (documented in the README).
  - The git-native v3 collection under `postman/collections/` still only covers Part 1. The JSON collection is the complete one.

## 2026-10-12 – New screenshots and full attributions

- **Screenshots:** all ten `images/app/` screenshots were retaken with the polished UI.
- **Table fix:** table text now wraps (date, amount, status and actions stay on one line), so **Decline** is no longer cut off on Requests & income.
- **`ATTRIBUTIONS.md`:** one list of all 30 references (code, UI components, images, design inspiration) plus every library with its version and licence, and the tools used. All links tested. The README links to it.

## 2026-10-12 – UI polish, icons and stock photos

- **Icons:** `lucide-react` line icons on nav links, buttons, statuses, stats and empty states. Every icon is decorative (`aria-hidden`), so button names are unchanged.
- **Photos:** three Unsplash photos (free licence) are stored in `frontend/public/images/` and served from our own origin, so `img-src 'self'` still holds. Each photographer is credited on screen and referenced.
- **Layout:**
  - Login and register are now a split layout, with the form beside a photo and a short message. The photo is hidden on narrow screens.
  - Browse gigs has a photo banner.
- **Details:** initials avatars in the nav and on gig cards, icon tiles on the stats, and friendlier empty states. Gig cards lift slightly on hover, and the reduced-motion setting is respected. The work details column in tables has a minimum width.
- **New components:** `Photo`, `AuthLayout`, `Avatar`, `StatusLabel`, `EmptyState`, plus `assets/photos.js`.
- **References:** 11 new references cover the UI components, the CSS techniques and the three photos. They're in the code and in the README.
- **Checks:** checked in Chrome on login, register, browse gigs, requests & income and admin. Frontend tests 34/34, lint and build pass. The phone layout wasn't checked visually, because Chrome wouldn't resize.

## 2026-10-12 – README and references

- **README:** updated throughout for the Part 2 changes.
  - Features, RBAC and endpoints now describe job requests, including a request and a response example.
  - The validation rules, the input-hardening threat row and the new test counts are documented.
  - New sections cover running with Docker and CI.
  - The app screenshots are now in a grid, with links to the Part 1 and Part 2 Postman evidence.
  - There is a new References section.
- **References:** 18 references were added as comments above the code they informed, using the module's format (accessed 11 October 2026).
  - 10 are Stack Overflow questions. Each link was opened in a browser, and the author and year were read from the page.
  - 8 are official documentation (Mongoose, OWASP, Auth0 `jsonwebtoken`, Helmet, express-validator, MDN). Each returned HTTP 200 when tested.

## 2026-10-12 – Input hardening, category list, tooling fixes, Postman evidence

- **Validation:** a shared rule set (`backend/src/middleware/fieldRules.js`) is used by every route.
  - Text fields must really be text, so an array or object is rejected with 422 instead of crashing. An array password used to cause a 500.
  - Control characters are rejected. Descriptions may still contain line breaks.
  - Names allow only letters, spaces, apostrophes, hyphens and full stops. Titles use a character allow-list and must contain a letter.
  - Money is a plain amount with at most two decimals. Emails are at most 254 characters.
- **Category:** gigs choose from a fixed list of 10 categories, shown as a dropdown in the form and enforced by the API.
- **Frontend:** the client-side checks mirror the API rules.
- **Tests:** backend 103 (up from 75), frontend 34 (up from 30), Newman 63 requests and 126 assertions, all passing.
- **Tooling fixes:**
  - `npm run lint` in the backend now works: there's an ESLint 9 flat config, and `--ext` was removed from the script.
  - `docker-compose.yml` now has a MongoDB service and `MONGO_URI`.
  - `.dockerignore` excludes `.mongo-data/`, so the local database isn't copied into the image.
  - CI now lints, tests and builds the frontend, and lints the backend.
- **Evidence:**
  - The Vitest text and JUnit outputs were regenerated.
  - Ten app screenshots are in `images/app/`.
  - 63 Postman request/response screenshots are in `images/Postman Part2/`, taken in Postman web with the Desktop Agent against the local API.

## 2026-10-12 – Postman / Newman for job requests

- Folder 5 of `hustlehub_api.postman_collection.json` is now "Job Requests & Transactions". It covers sending a request, validation failures (missing details, invalid amount, bad gig id), the 401/403/404 cases, and each party seeing only their own requests.
- It also covers responding:
  - Pending requests are not counted as income.
  - The client, admin and other freelancers are refused (403).
  - Invalid status and invalid id return 422.
  - The owning freelancer can accept.
  - A second response is refused (409).
  - Income and tax are counted after acceptance.
- Newman run against the live API: 60 requests, 119 assertions, 0 failures. Results are saved in `postman/newman-results/`, which I checked contains no passwords, secrets or tokens.

## 2026-10-12 – UI restyle

Visual-only restyle that borrows hipages' design language. No features were added or removed.

- Navy ink text and a single teal accent (`#0f766e`, unchanged). White surfaces with hairline borders and no drop shadows.
- A floating white header bar. Heavy headings. Compact bold buttons: a filled primary, and outlined secondary ones.
- Removed the pills: role, category and status are now plain text labels (status is coloured text). Removed the "H" logo tile in favour of a wordmark.
- Stats sit in one bordered panel with dividers. The request form uses a grey band and is capped at 720px. Table actions stay on one line.
- System font stack, because the strict CSP blocks external font hosts.
- Checked in Chrome on the login, register, browse gigs, request form, my gigs and requests & income pages. Frontend tests: 30/30 passing.

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
