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

## Repository layout

```
payflow/
├── backend/    # Express API (auth, users, wallets, transfers, beneficiaries, transactions)
├── frontend/   # React app
├── tests/      # backend integration tests (auth, wallet, transfers, beneficiaries, transactions)
├── scripts/    # local dev tooling (DB setup)
└── details.md  # full product spec
```
