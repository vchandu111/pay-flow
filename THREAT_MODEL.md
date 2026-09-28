# Threat Model: PayFlow

## 1. System context

PayFlow is a digital wallet / money-transfer reference application (Node 20 / TypeScript / Express 5 backend, Prisma 6 ORM over PostgreSQL 16, React 19 / Vite / Tailwind frontend, npm-workspaces monorepo) built as a security-training lab rather than a production system. A customer can register, hold an INR wallet, top up via a simulated payment provider, send money to other registered users via email/phone lookup, manage beneficiaries, and view transaction history. The `main` branch is documented as a frozen "clean" baseline (proper authorization, input validation, parameterized queries, argon2id password hashing, audit logging, security headers, rate limiting). This checkout (`security-testing-v2`) is **not** that baseline: the repository's git history contains 18 branches (`vuln-001` … `vuln-018`), each documented as injecting exactly one CWE-mapped bug for a SAST/DAST/AI-review comparison exercise, and direct inspection of the current source (not just `git log`) confirms nearly all 18 are cumulatively merged into this branch's live code.

This matters for how the table below should be read: every threat backed by a `VULN-NNN` evidence ID was **independently re-confirmed by reading the current source** during this analysis (see the file:line references embedded in section 3), not inferred from history alone. Likelihood scores reflect that these are live, exploitable code paths today, not closed issues. The application has no containerization, CI, or infrastructure-as-code yet; it runs as a local Node process against a local Postgres instance. A Phase 3 "operations portal" for internal staff (with roles/permissions) is specced in `details.md` but not built, so it introduces no entry points yet.

## 2. Assets

| asset | description | sensitivity |
|---|---|---|
| User credentials & PII | `passwordHash`, name, email, phone, dateOfBirth, address on the `User` table | critical |
| Auth/session tokens | Short-lived access JWT + rotating hashed refresh-token chain with reuse detection | critical |
| Wallet balance | `Wallet.balance` (Decimal 14,2) and `status` (ACTIVE/SUSPENDED) | critical |
| Transaction/transfer ledger | `Transaction` table recording money movement; integrity matters as much as confidentiality | critical |
| Underlying Postgres database | The database itself, reachable if query construction is unsafe; also holds dev-role credentials | critical |
| Beneficiary PII | `Beneficiary.identifier` (email/phone) + name used to route transfers | high |
| Audit log integrity | `AuditLog` events (LOGIN, PASSWORD_CHANGE, TRANSFER_SENT, REFRESH_TOKEN_REUSE_DETECTED, etc.); no write-once/checksum enforcement observed | high |
| Service availability | Auth, wallet, transfer, and top-up endpoints | medium |

## 3. Entry points & trust boundaries

| entry_point | description | trust_boundary | reachable_assets |
|---|---|---|---|
| Auth routes (register/login/refresh/logout) | Issues sessions; unauthenticated by design | unauth HTTP → app logic | User credentials & PII, Auth/session tokens |
| Authenticated API routes (users/wallets/transfers/beneficiaries/transactions) | Gated by `requireAuth`, scoped by `req.user.id` in the service layer | authenticated user → own data | User credentials & PII, Wallet balance, Transaction/transfer ledger, Beneficiary PII |
| requireAuth / JWT verification | Reads the `payflow_at` httpOnly cookie, verifies the JWT | unauth request → authenticated context | Auth/session tokens |
| CORS policy | `cors({ origin: true, credentials: true })` confirmed live at `backend/src/app.ts:30` — reflects any Origin, allows credentials | any external website → victim's authenticated session | User credentials & PII, Auth/session tokens, Wallet balance, Transaction/transfer ledger, Beneficiary PII |
| CSRF Origin-check (verifyOrigin) | Implemented in `middleware/verifyOrigin.ts` but confirmed **not** imported/mounted in `app.ts` | cross-origin browser → state-changing request (currently unenforced) | Wallet balance, Transaction/transfer ledger |
| Auth rate limiting | `authLimiter` defined in `rateLimit.ts` but confirmed never applied to any route; only the blanket `apiLimiter` (300/15min) covers `/api` | brute-force / credential-stuffing boundary on login+register | User credentials & PII, Auth/session tokens |
| Transactions free-text search | Confirmed: `prisma.$queryRawUnsafe` with `q` and `wallet.id` string-interpolated directly into SQL; no `validate()` middleware on this route unlike its siblings | authenticated user input → raw SQL against the DB | Transaction/transfer ledger, Underlying Postgres database |
| Object-reference & mass-assignment boundary | Confirmed live: `getTransactionById` has no ownership check before returning a transaction; `deleteBeneficiary` deletes by id alone, ignoring `callerUserId`; `updateProfile`'s Zod schema uses `.passthrough()` and is spread directly into `prisma.update`'s `data` | authenticated user → other users' records / own record's protected fields | User credentials & PII, Transaction/transfer ledger, Beneficiary PII |
| Transfer creation business logic | Confirmed: amount schema has only `.max(500000)`, no `.positive()` or decimal-place refine; balance check-then-decrement runs inside `prisma.$transaction` with an explicit 100ms sleep between check and decrement; receiver wallet `ACTIVE` status not re-checked at credit time; `addMoney` doesn't check wallet suspension; no idempotency key accepted on either endpoint | authenticated user → wallet balance integrity | Wallet balance, Transaction/transfer ledger |
| Password change / session revocation | Confirmed: `changePassword` verifies the current password and rehashes, but never revokes outstanding refresh tokens | authenticated user action → should invalidate other sessions | Auth/session tokens |
| Stored content rendering / recipient lookup exposure | Confirmed: `TransactionDetailPage` renders a transfer note via `dangerouslySetInnerHTML`; `lookupRecipient` returns another user's email, phone, and live wallet balance from an identifier lookup | sender-controlled data → victim's browser DOM; authenticated caller → another user's PII/balance | Auth/session tokens, User credentials & PII, Beneficiary PII |
| Client-side token storage | Confirmed: `loginRequest`/`registerRequest` write the access token into `localStorage` despite the httpOnly-cookie design intent documented elsewhere in the code | JS execution context → token material | Auth/session tokens |
| Error handler | Confirmed: the unhandled-exception path returns the raw `Error.message` and `.stack` in the JSON response body | internal failure → external response body | Underlying Postgres database, User credentials & PII |
| Supply chain / dependency versions | Confirmed `jsonwebtoken` pinned at `8.5.1` (pre-9.x; documented in-repo as having 3 known GHSAs from the vuln-017 exercise); no dependabot/CI to catch drift | build-time dependency code running in-process | Auth/session tokens, Underlying Postgres database |
| Local dev infrastructure | `scripts/setup-db.sh` hardcodes a weak Postgres password (`payflow`) and grants the app role `CREATEDB` (more than runtime needs); no Dockerfile/k8s/terraform/CI present | developer workstation → local Postgres instance | Underlying Postgres database |

## 4. Threats

| id | threat | actor | surface | asset | impact | likelihood | status | controls | evidence |
|---|---|---|---|---|---|---|---|---|---|
| T1 | Account takeover and financial-record exposure via broken object-level authorization on transaction and beneficiary records | remote_auth | Authenticated API routes (users/wallets/transfers/beneficiaries/transactions), Object-reference & mass-assignment boundary | Transaction/transfer ledger, Beneficiary PII, User credentials & PII | critical | almost_certain | risk_accepted | none | VULN-001, VULN-002, TRIAGE-vuln-002 |
| T2 | Account hijack via mass assignment on the profile-update endpoint | remote_auth | Object-reference & mass-assignment boundary | User credentials & PII | critical | almost_certain | risk_accepted | none | VULN-003 |
| T3 | Data exfiltration or corruption via SQL injection in transaction search | remote_auth | Transactions free-text search | Transaction/transfer ledger, Underlying Postgres database | critical | almost_certain | risk_accepted | none | VULN-013 |
| T4 | Cross-origin account takeover via permissive CORS combined with absent CSRF defense | remote_unauth | CORS policy, CSRF Origin-check (verifyOrigin) | User credentials & PII, Auth/session tokens, Wallet balance, Transaction/transfer ledger, Beneficiary PII | critical | almost_certain | risk_accepted | none | VULN-012, VULN-018, SCAN-F007-csrf-failopen |
| T5 | Wallet balance corruption or fraud via business-logic gaps in transfer amount validation and check-then-act balance updates | remote_auth | Transfer creation business logic | Wallet balance, Transaction/transfer ledger | critical | almost_certain | risk_accepted | prisma $transaction wraps the writes; Decimal type for balance | VULN-004, VULN-005, VULN-006, SCAN-F003-receiver-status, SCAN-F004-addmoney, SCAN-idempotency |
| T6 | Credential compromise via weak password hashing, brute-forceable auth, forgeable tokens, and sessions that survive a password change | remote_unauth | Auth routes (register/login/refresh/logout), requireAuth / JWT verification, Auth rate limiting, Password change / session revocation, Supply chain / dependency versions | User credentials & PII, Auth/session tokens, Service availability | critical | almost_certain | risk_accepted | refresh-token rotation with reuse detection | VULN-008, VULN-009, VULN-010, VULN-011, VULN-017, SCAN-F002-trustproxy |
| T7 | Session hijack via XSS-accessible token storage combined with unsanitized stored-content rendering | remote_auth | Stored content rendering / recipient lookup exposure, Client-side token storage | Auth/session tokens, User credentials & PII | critical | almost_certain | risk_accepted | none | VULN-007, VULN-014, VULN-016 |
| T8 | Elevation of privilege via missing centralized authorization layer, making the next endpoint added the same way as transactions/beneficiaries just as likely to omit its ownership filter | remote_auth | Authenticated API routes (users/wallets/transfers/beneficiaries/transactions), Object-reference & mass-assignment boundary | Transaction/transfer ledger, Beneficiary PII, User credentials & PII | critical | likely | risk_accepted | none | |
| T9 | Tampering with transaction-ledger history via direct database access going undetected, since balances are a mutable running total with no append-only journal or checksum chain | insider | Transfer creation business logic | Transaction/transfer ledger, Audit log integrity | high | possible | risk_accepted | none | |
| T10 | Future dependency drift (like the jsonwebtoken downgrade) shipping unnoticed due to absence of automated dependency/CI security scanning | supply_chain | Supply chain / dependency versions | Auth/session tokens, Underlying Postgres database | high | possible | risk_accepted | none | |
| T11 | Information disclosure of internal implementation details via verbose error responses | remote_auth | Error handler | Underlying Postgres database, User credentials & PII | medium | almost_certain | risk_accepted | none | VULN-015 |
| T12 | Clickjacking and reduced defense-in-depth via missing security headers | remote_unauth | CORS policy | Auth/session tokens, User credentials & PII | medium | likely | risk_accepted | helmet used; CSP gated to production only, unverified any production deployment exists | ZAP-headers |
| T13 | Lateral access to the dev database via hardcoded, over-privileged credentials committed to a tracked setup script | local_user | Local dev infrastructure | Underlying Postgres database | low | likely | risk_accepted | none | INFRA-dbcreds |

**Owner statement (2026-09-28):** all 13 rows above are risk-accepted. T1–T7 and T11 are confirmed instances of the repo's intentional vuln-001..018 SAST/DAST/AI-review comparison exercise (per `demo-script.md`); T12–T13 are incidental findings (ZAP scan, dev setup script) not part of that numbered list; T8–T10 are structural gap-fill threats with no confirmed instance. The owner accepted all of them as-is for this training lab's current purpose, while confirming the section 8 mitigations remain the right fixes for whenever this code is adapted for real use.

## 5. Deprioritized

| threat | reason |
|---|---|
| Repudiation via insufficient request/action logging | pino-http request logging plus AuditLog business-event logging already cover the actors that exist today (single account holder per session, no shared/admin accounts yet) |
| Adjacent-network / physical MITM threats (ARP spoofing, rogue Wi-Fi) | Out of scope — local dev-only deployment today, no network topology to model |
| Cloud/insider threats to hosting infrastructure (IAM over-grant, lateral SA assumption) | Asset not present — no Terraform/k8s/cloud IaC exists in this repo yet |
| Resource-exhaustion DoS via untrusted file/media parsing | Asset not present — app has no file-upload or media-parsing entry point |

## 6. Open questions

- [Owner-states] The system context, asset list, and entry points in section 1-3 are accurate as drafted, and the 13-threat list in section 4 is complete (no missing threat classes). Affects: overall model completeness. Verify by: revisit this model after Phase 3 (ops portal) is built, since it will add a new privileged actor and entry points not covered here.
- [Owner-states] All 13 threats are risk-accepted for this training lab's current purpose, and the section 8 mitigations are the right ones to apply "whenever this code is adapted for real use." Affects: `status` column for T1-T13. Verify by: re-open this model (or file a normal remediation backlog) the moment this codebase is repurposed toward any real deployment, staging, or production use — at that point every `risk_accepted` row should be re-scored as `unmitigated` and triaged for real.
- Is this app ever deployed beyond a local dev environment (staging/prod), and if so, is `NODE_ENV=production` set consistently so the `isProduction`-gated CSP in `helmet` actually takes effect?
- What is the intended production trust boundary for CORS — is `CORS_ORIGIN` (defined in `.env.example` but currently unused in `app.ts`, which hardcodes `origin: true`) meant to replace the current wildcard reflection?
- Who is expected to supply `ACCESS_TOKEN_SECRET`/`REFRESH_TOKEN_SECRET` in any deployed environment — is there a secrets-manager plan, or is `.env` hand-configured per environment?
- Is there an intended idempotency-key contract for the client's transfer/top-up requests, or is retry-safety expected to be handled entirely client-side?
- Is DoS/availability degradation acceptable at this stage, or does an eventual real-money deployment require SLA-backed availability controls?

## 7. Provenance

- mode: bootstrap-then-interview
- date: 2026-09-28
- target: /Users/chandrasekhar/Desktop/Payflow @ 717181d
- inputs: git log --all (19 security-relevant commits) + in-repo scan reports (sonar-findings.json/.md, .zap-reports/, backend/VULN-FINDINGS.json/.md, backend/TRIAGE-vuln-002.json/.md) + direct re-verification of current source for every VULN-NNN claim; owner interview (no design doc, no seed beyond this session's own bootstrap draft)
- owner: present, unnamed

## 8. Recommended mitigations

| mitigation | threat_ids | closes_class | effort |
|---|---|---|---|
| Add a centralized ownership/authorization check (e.g. scope every Prisma query by the authenticated user's id via a shared helper) instead of ad-hoc per-service checks | T1,T8 | yes | M |
| Replace `.passthrough()` Zod schemas with strict schemas that only ever spread an explicit allowlist of fields into Prisma update calls | T2 | yes | S |
| Parameterize all raw SQL (Prisma tagged-template `$queryRaw` or the query builder) and apply `validate()` middleware uniformly to every route | T3 | yes | S |
| Allowlist CORS origins from `CORS_ORIGIN` env config and re-mount the CSRF Origin-check middleware | T4 | yes | S |
| Replace check-then-act balance updates with a single atomic conditional UPDATE (`WHERE balance >= amount`), enforce `.positive()`/decimal-place validation, and add idempotency keys to transfer/top-up requests | T5 | partial | M |
| Restore argon2id password hashing, wire `authLimiter` onto auth routes, fix rate-limit keying (trust-proxy/XFF), pin `jsonwebtoken` to a patched version, and revoke sessions on password change | T6 | yes | M |
| Drop the access token from `localStorage`/JSON response bodies (rely solely on the httpOnly cookie) and sanitize user-supplied HTML (e.g. DOMPurify) before rendering instead of `dangerouslySetInnerHTML` | T7 | yes | S |
| Add an append-only ledger/journal table or checksum chain independent of the mutable wallet balance for tamper-evidence | T9 | partial | M |
| Add dependency-drift detection (Dependabot/Renovate + `npm audit`/OSV scan in CI) | T10 | yes | S |
| Return generic error messages/ids to clients and log full stack traces server-side only | T11 | yes | S |
| Enable CSP and the remaining security headers (X-Frame-Options/frame-ancestors, COOP/COEP/CORP, Permissions-Policy) regardless of `NODE_ENV` | T12 | yes | S |
| Replace the hardcoded dev DB password with a generated per-machine secret and scope the app's runtime DB role to least privilege (drop `CREATEDB`, use a separate migration credential) | T13 | yes | S |
