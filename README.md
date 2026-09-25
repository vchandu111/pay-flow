# PayFlow

PayFlow is a fictional digital wallet and money-transfer platform, built as a clean, security-conscious reference application. See [`details.md`](./details.md) for the full product spec.

**Current scope: Phase 1 (Foundation) + Phase 2 (Money Movement).** Authentication, user profile, wallet (with a simulated "Add Money" flow), sending money between users, beneficiaries, and a filterable transaction history with detail view. Withdraw, statements, notifications, and the operations portal are not yet built.

## Stack

- Backend: Node.js, TypeScript, Express, Prisma, PostgreSQL
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Tests: Jest + Supertest (backend), Vitest + React Testing Library (frontend)

## Local setup

Requires Node.js 20+ and Homebrew PostgreSQL 16 (`brew install postgresql@16`) — no Docker is required.

```bash
npm install
npm run db:up          # starts postgresql@16 and creates payflow_dev / payflow_test
cp .env.example .env   # then fill in ACCESS_TOKEN_SECRET / REFRESH_TOKEN_SECRET via `openssl rand -hex 32`
npm run db:migrate
npm run db:seed
npm run dev             # backend on :4000, frontend on :5180
```

### Seeded dev accounts

| Email | Password |
|---|---|
| alex@example.com | Password123! |
| priya@example.com | Password123! |

Dev-only credentials — never reused outside local development.

## Tests

```bash
npm test                 # backend, against payflow_test
npm run test:frontend    # frontend
```

## Known accepted dependency finding

`npm audit` reports high-severity issues in `deepmerge-ts`, pulled in transitively by
the `prisma` CLI's own config loader (`@prisma/config`). This affects every current
Prisma 6.x/7.x CLI release — there is no fixed version yet. It is **not** reachable at
runtime: the running server only depends on `@prisma/client`, which does not pull in
this chain, and the CLI is only ever run locally/in CI against our own trusted schema,
never on attacker-controlled input. Re-check `npm audit` when bumping Prisma.

## Security lab

`main` (tagged `v1.0.0-clean-baseline`) is the frozen, reviewed clean baseline —
built to the §16 rules in `details.md` (proper authz, input validation, parameterized
queries, secure password hashing, secure session handling, audit logging, tests). It
should never contain a known vulnerability.

Each vulnerability lives on its own branch, forked directly from `v1.0.0-clean-baseline`,
so any one of them can be checked out, studied, scanned, and fixed in isolation without
touching the others. Where a vulnerability regresses behavior an existing test already
covers, that test is left in place and failing **on purpose** — it's the detection
signal, not a bug in the branch. Where no existing test covers the affected surface,
the commit message says so explicitly rather than implying coverage that isn't there.

| Branch | Category | Vulnerability |
|---|---|---|
| `vuln-001-transaction-detail-idor` | Broken Access Control (IDOR) | `GET /api/transactions/:id` drops the sender/receiver ownership check — any authenticated user can view any transaction by guessing its UUID. |
| `vuln-002-beneficiary-delete-idor` | Broken Access Control (IDOR) | New `DELETE /api/beneficiaries/:id` never checks `ownerUserId` — any user can delete any other user's saved beneficiaries. |
| `vuln-003-profile-mass-assignment` | Mass Assignment (CWE-915) | `PATCH /api/users/me` gains `.passthrough()` and spreads the body straight into the Prisma update — lets a caller overwrite `email` (bypassing its documented immutability) or even `passwordHash` directly. |
| `vuln-004-transfer-race-condition` | Race Condition / TOCTOU (CWE-367) | The atomic conditional-debit transfer is reverted to check-then-act. Verified exploitable: two concurrent ₹80 transfers from a ₹100 balance both succeed, leaving the wallet at **-₹60** in the database. |
| `vuln-005-negative-transfer-amount` | Business Logic Validation | Transfer amount's `.positive()` check is removed — a negative amount reverses the debit/credit, crediting the "sender" instead. |
| `vuln-006-transfer-amount-precision` | Business Logic Validation | The 2-decimal-place guard on transfer amounts is removed, allowing sub-cent amounts that accumulate rounding drift. |
| `vuln-007-jwt-exposed-to-js` | Broken Authentication | The access token is also returned in the login/register JSON body (not just the httpOnly cookie) — exposes it to any XSS on the page via JS-accessible storage. |
| `vuln-008-weak-password-hashing` | Broken Authentication | argon2id is swapped for unsalted SHA-256 — instantly crackable via rainbow tables, no functional test catches it. |
| `vuln-009-user-enumeration` | Broken Authentication | Login returns different error messages for "no such email" vs "wrong password" — enables account enumeration. |
| `vuln-010-missing-auth-rate-limit` | Broken Authentication | Rate limiting is removed from `/login` and `/register` — enables credential stuffing / brute force. |
| `vuln-011-password-change-session-leak` | Broken Session Management | Changing your password no longer revokes other active sessions — a stolen session survives a password reset. |
| `vuln-012-csrf-origin-check-removed` | CSRF | The `Origin`-header verification middleware is removed from mutating routes, reopening CSRF on state-changing endpoints. |
| `vuln-013-sql-injection-transaction-search` | Injection (SQLi) | New `GET /api/transactions/search?q=` endpoint builds a raw SQL query via string concatenation instead of a parameterized query. |
| `vuln-014-stored-xss-transaction-note` | XSS | The transaction detail page renders the `note` field via `dangerouslySetInnerHTML` — a malicious note left by a sender executes in the recipient's browser when they view the transaction. |
| `vuln-015-verbose-error-stack-trace` | Information Disclosure | The global error handler leaks `err.stack`/internal messages in 500 responses instead of a generic message. |
| `vuln-016-recipient-lookup-over-exposure` | Information Disclosure | The transfer recipient-lookup endpoint returns the full user profile (phone, wallet balance) instead of just name + identifier. |
| `vuln-017-vulnerable-dependency-jsonwebtoken` | Vulnerable Dependency | `jsonwebtoken` is pinned to an old version with known advisories, flagged by `npm audit`. |
| `vuln-018-cors-wildcard-misconfiguration` | Security Misconfiguration | CORS is changed to reflect any `Origin` with `credentials: true`, allowing any site to make authenticated cross-origin requests. |

Each branch's own commit message has the full detail: exact mechanism, which test(s) it
breaks and why, and the fix. Process, matching `details.md` §18's lifecycle:

```
CLEAN VERSION → introduce vulnerability → VULNERABLE VERSION → scanner
→ FINDING → AI analysis → ROOT CAUSE → FIX → VERIFICATION → CLEAN VERSION
```

## Repository layout

```
payflow/
├── backend/    # Express API (auth, users, wallets, transfers, beneficiaries, transactions)
├── frontend/   # React app
├── tests/      # backend integration tests (auth, wallet, transfers, beneficiaries, transactions)
├── scripts/    # local dev tooling (DB setup)
└── details.md  # full product spec
```
