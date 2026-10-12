# Attributions

Every external source, image, design reference and third-party library used in HustleHub+.
All links were tested and resolve. Accessed: 11 October 2026.

The code references (sections 1–2) also appear as comments directly above the code they informed, in this format:

```
/* Author, Year
 * Title
 * Source / Platform
 * Link
 * Accessed: DD Month YYYY
 */
```

---

## 0. Part 1 references (carried over)

These sources were cited in the Part 1 README and are still cited in the current one. Accessed: 4 September 2026.

| Reference | Used for |
|---|---|
| Barth, A. (2011) *The Web Origin Concept*. RFC 6454. RFC Editor. https://www.rfc-editor.org/info/rfc6454 | CORS allow-list (`app.js`) |
| Fielding, R.T. (2000) *Architectural Styles and the Design of Network-based Software Architectures*. PhD thesis. University of California, Irvine. https://www.ics.uci.edu/~fielding/pubs/dissertation/top.htm | REST API design |
| Graham, M., Hjorth, I. and Lehdonvirta, V. (2017) Digital labour and development: Impacts of global digital labour platforms and the gig economy on worker livelihoods. *Transfer: European Review of Labour and Research*, 23(2), pp. 135–162. https://doi.org/10.1177/1024258916687250 | Project context (introduction) |
| Hodges, J., Jackson, C. and Barth, A. (2012) *HTTP Strict Transport Security (HSTS)*. RFC 6797. RFC Editor. https://www.rfc-editor.org/info/rfc6797 | HSTS header (`app.js`) |
| Jones, M., Bradley, J. and Sakimura, N. (2015) *JSON Web Token (JWT)*. RFC 7519. RFC Editor. https://www.rfc-editor.org/info/rfc7519 | JWT authentication (`middleware/auth.js`) |
| National Institute of Standards and Technology (NIST) (2020) *Digital Identity Guidelines: Authentication and Lifecycle Management*. NIST Special Publication 800-63B. U.S. Department of Commerce. https://pages.nist.gov/800-63-3/sp800-63b.html | Password policy, bcrypt cost, token expiry |
| OWASP Foundation (2021) *OWASP Top Ten Web Application Security Risks*. https://owasp.org/projects/top-ten | Overall threat model (Security Measures) |
| Provos, N. and Mazières, D. (1999) A Future-Adaptable Password Scheme. In: *Proceedings of the 8th USENIX Security Symposium*. Washington, D.C., 23–26 August. Berkeley, CA: USENIX Association, pp. 81–88. https://www.usenix.org/legacy/events/usenix99/provos.html | bcrypt password hashing (`authController.js`) |
| Rescorla, E. (2026) *The Transport Layer Security (TLS) Protocol Version 1.3*. RFC 9846. RFC Editor. https://www.rfc-editor.org/info/rfc9846 | HTTPS-only API (`server.js`) |

## 1. Code references

| # | Reference | Used in |
|---|---|---|
| 1 | adnan kamili (2016) *Is bcrypt.compare vulnerable to timing attack*. Stack Overflow. https://stackoverflow.com/questions/35620979/is-bcrypt-compare-vulnerable-to-timing-attack | `backend/src/controllers/authController.js` (dummy hash for timing-safe login) |
| 2 | Daniel Gartmann (2016) *How to prevent user enumeration attacks for a login system?* Stack Overflow. https://stackoverflow.com/questions/35827127/how-to-prevent-user-enumeration-attacks-for-a-login-system | `backend/src/controllers/authController.js` (generic login errors) |
| 3 | OWASP Foundation (n.d.a) *Authentication Cheat Sheet*. OWASP Cheat Sheet Series. https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html | `backend/src/controllers/authController.js` |
| 4 | Mongoose (n.d.) *How to Use findOneAndUpdate() in Mongoose*. Mongoose Documentation. https://mongoosejs.com/docs/tutorials/findoneandupdate.html | `backend/src/controllers/transactionController.js` (accept/decline only once) |
| 5 | Auth0 (n.d.) *node-jsonwebtoken: JsonWebToken implementation for node.js*. GitHub. https://github.com/auth0/node-jsonwebtoken | `backend/src/middleware/auth.js` (algorithm, issuer, audience checks) |
| 6 | daniel (2012) *JavaScript NoSQL Injection prevention in MongoDB*. Stack Overflow. https://stackoverflow.com/questions/13436467/javascript-nosql-injection-prevention-in-mongodb | `backend/src/middleware/sanitize.js` |
| 7 | Micah Bala (2019) *How to implement validation in a separate file using express-validator*. Stack Overflow. https://stackoverflow.com/questions/55772477/how-to-implement-validation-in-a-separate-file-using-express-validator | `backend/src/middleware/fieldRules.js` |
| 8 | express-validator (n.d.) *The Validation Chain*. express-validator Documentation. https://express-validator.github.io/docs/guides/validation-chain | `backend/src/middleware/fieldRules.js` |
| 9 | OWASP Foundation (n.d.b) *Input Validation Cheat Sheet*. OWASP Cheat Sheet Series. https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html | `backend/src/middleware/fieldRules.js` (allow-lists) |
| 10 | user606521 (2014) *How to remove control characters from string?* Stack Overflow. https://stackoverflow.com/questions/26741455/how-to-remove-control-characters-from-string | `backend/src/middleware/fieldRules.js` |
| 11 | maerics (2011) *Matching a Unicode "name" with a JavaScript Regular Expression*. Stack Overflow. https://stackoverflow.com/questions/5571096/matching-a-unicode-name-with-a-javascript-regular-expression | `backend/src/middleware/fieldRules.js` (name rule) |
| 12 | MDN contributors (2026f) *Unicode character class escape: \p{...}, \P{...}*. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape | `backend/src/middleware/fieldRules.js` |
| 13 | Alexander (2020) *Validate input is within a numeric range, possibly a float, using express-validator*. Stack Overflow. https://stackoverflow.com/questions/63404065/validate-input-is-within-a-numeric-range-possibly-a-float-using-express-valida | `backend/src/middleware/fieldRules.js` (money rule) |
| 14 | xyz83242 (2019) *express-rate-limit - catching the message*. Stack Overflow. https://stackoverflow.com/questions/58486616/express-rate-limit-catching-the-message | `backend/src/middleware/rateLimiter.js` (JSON 429 message) |
| 15 | Helmet.js (n.d.) *Helmet.js*. Helmet Documentation. https://helmetjs.github.io/ | `backend/src/app.js` (security headers, CSP) |
| 16 | Timespace (2014) *Where to store JWT in browser? How to protect against CSRF?* Stack Overflow. https://stackoverflow.com/questions/27067251/where-to-store-jwt-in-browser-how-to-protect-against-csrf | `frontend/src/auth/AuthContext.jsx` |
| 17 | MDN contributors (2025) *Window: sessionStorage property*. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage | `frontend/src/auth/AuthContext.jsx` |
| 18 | user1210233 (2015) *What does it mean when they say React is XSS protected?* Stack Overflow. https://stackoverflow.com/questions/33644499/what-does-it-mean-when-they-say-react-is-xss-protected | `frontend/src/utils/format.js` |

## 2. UI components and techniques

| # | Reference | Used in |
|---|---|---|
| 19 | Lucide Contributors (n.d.) *Lucide for React*. Lucide Documentation. https://lucide.dev/guide/react | Icons in `NavBar.jsx`, `GigCard.jsx`, `StatusLabel.jsx`, `EmptyState.jsx` and the pages |
| 20 | React Router (n.d.) *NavLink*. React Router Documentation. https://reactrouter.com/api/components/NavLink | `frontend/src/components/NavBar.jsx` (active page) |
| 21 | MDN contributors (2026e) *<select>: The HTML Select element*. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/select | `frontend/src/components/GigForm.jsx` (category dropdown) |
| 22 | MDN contributors (2026b) *<img>: The Image Embed element*. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img | `frontend/src/components/Photo.jsx` |
| 23 | MDN contributors (2026c) *object-fit*. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/object-fit | `frontend/src/components/Photo.jsx`, `frontend/src/index.css` |
| 24 | MDN contributors (2026a) *Basic concepts of grid layout*. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Basic_concepts | `frontend/src/index.css` (split login/register layout, grids) |
| 25 | MDN contributors (2026d) *prefers-reduced-motion*. MDN Web Docs. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion | `frontend/src/index.css` |

| 26a | Mermaid (n.d.) *About Mermaid*. Mermaid Documentation. https://mermaid.js.org/intro/ | Architecture, job request and data model diagrams in `README.md` |

## 3. Images

The photos are free to use under the Unsplash License. They are stored in `frontend/public/images/` and served from the app's own origin, and each photographer is credited on screen where the photo appears.

| # | Reference | File | Shown on |
|---|---|---|---|
| 26 | Unsplash (n.d.) *License*. Unsplash. https://unsplash.com/license | – | – |
| 27 | Toa Heftiba (2018) *Cup of coffee, laptop computer, and red earphones plugged in laptop on brown wooden table* [Photograph]. Unsplash. https://unsplash.com/photos/cup-of-coffee-laptop-computer-and-red-earphones-plugged-in-laptop-on-brown-wooden-table-W6q15ddqqJo | `frontend/public/images/hero-workspace.jpg` | Browse gigs banner |
| 28 | Good Faces (2021) *Woman in gray sweater sitting on chair using macbook* [Photograph]. Unsplash. https://unsplash.com/photos/woman-in-gray-sweater-sitting-on-chair-using-macbook-gy5SlRW9OGA | `frontend/public/images/auth-login.jpg` | Log in page |
| 29 | Daniel Thomas (2020) *Person using black and silver laptop computer* [Photograph]. Unsplash. https://unsplash.com/photos/person-using-black-and-silver-laptop-computer-6_NXEMZbUq0 | `frontend/public/images/auth-register.jpg` | Register page |

Screenshots in `images/app/`, `images/Postman Part1/` and `images/Postman Part2/` are our own captures of this application.

## 4. Design inspiration

| # | Reference | How it was used |
|---|---|---|
| 30 | hipages Group (n.d.) *hipages*. https://hipages.com.au/ | Design language only (type weight, spacing, button and card styling). No code, text, images or branding were copied, and HustleHub+ keeps its own teal accent. |

## 5. Libraries and tools

Open-source packages used by the project (version as installed, licence from the package).

### Backend (`backend/package.json`)

| Package | Version | Licence | Purpose | Link |
|---|---|---|---|---|
| express | 4.22.3 | MIT | Web framework | https://expressjs.com/ |
| mongoose | 8.24.5 | MIT | MongoDB object modelling | https://mongoosejs.com/ |
| bcryptjs | 2.4.3 | MIT | Password hashing | https://github.com/dcodeIO/bcrypt.js |
| jsonwebtoken | 9.0.3 | MIT | JWT signing and verification | https://github.com/auth0/node-jsonwebtoken |
| helmet | 7.2.0 | MIT | Security headers and CSP | https://helmetjs.github.io/ |
| express-validator | 7.3.2 | MIT | Input validation and sanitisation | https://express-validator.github.io/ |
| express-rate-limit | 7.5.1 | MIT | Rate limiting | https://github.com/express-rate-limit/express-rate-limit |
| cors | 2.8.6 | MIT | CORS allow-list | https://github.com/expressjs/cors |
| morgan | 1.12.1 | MIT | HTTP request logging | https://github.com/expressjs/morgan |
| dotenv | 16.6.1 | BSD-2-Clause | Environment variables | https://github.com/motdotla/dotenv |
| uuid | 11.1.1 | MIT | Unique identifiers | https://github.com/uuidjs/uuid |
| jest | 30.5.2 | MIT | Test runner (dev) | https://jestjs.io/ |
| supertest | 7.2.2 | MIT | HTTP assertions (dev) | https://github.com/ladjs/supertest |
| mongodb-memory-server | 10.4.3 | MIT | In-memory MongoDB for tests and local DB (dev) | https://github.com/typegoose/mongodb-memory-server |
| selfsigned | 5.5.0 | MIT | Local SSL certificate generation (dev) | https://github.com/jfromaniello/selfsigned |
| eslint | 9.39.5 | MIT | Linting (dev) | https://eslint.org/ |
| cross-env | 7.0.3 | MIT | Cross-platform env vars in scripts (dev) | https://github.com/kentcdodds/cross-env |

### Frontend (`frontend/package.json`)

| Package | Version | Licence | Purpose | Link |
|---|---|---|---|---|
| react, react-dom | 19.3.0 | MIT | UI library | https://react.dev/ |
| react-router-dom | 7.18.4 | MIT | Routing | https://reactrouter.com/ |
| lucide-react | 1.55.0 | ISC | Icons | https://lucide.dev/ |
| vite, @vitejs/plugin-react | 8.3.4, 6.1.2 | MIT | Dev server and build | https://vite.dev/ |
| vitest | 5.0.3 | MIT | Test runner (dev) | https://vitest.dev/ |
| @testing-library/react, user-event, jest-dom | 16.3.3, 14.6.7, 7.0.1 | MIT | Component testing (dev) | https://testing-library.com/ |
| jsdom | 29.1.1 | MIT | Browser environment for tests (dev) | https://github.com/jsdom/jsdom |
| oxlint | 1.87.0 | MIT | Linting (dev) | https://oxc.rs/ |

### Tools and platforms

| Tool | Purpose | Link |
|---|---|---|
| Postman | API collection and manual testing | https://www.postman.com/ |
| Newman (v6) | Running the Postman collection from the command line | https://github.com/postmanlabs/newman |
| MongoDB | Database | https://www.mongodb.com/ |
| Docker | Containerised API and database | https://www.docker.com/ |
| GitHub Actions | Continuous integration | https://docs.github.com/en/actions |
