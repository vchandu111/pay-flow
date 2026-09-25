# PayFlow backend — vulnerability scan findings

**Branch:** `vuln-001-transaction-detail-idor`
**Scanned:** 2026-09-25
**Focus areas:** 7 (auth, transactions, transfers, beneficiaries, wallets, users, middleware/app wiring)
**Method:** static AI-based read (no code execution), one reviewer per module — following the `/vuln-scan` skill from `anthropics/defending-code-reference-harness`, run manually against this repo.

## Summary

| id | severity | category | file:line | title |
|---|---|---|---|---|
| F-001 | HIGH | idor | transactions.service.ts:95 | getTransactionById does not verify the transaction belongs to the caller's wallet |
| F-002 | MEDIUM | rate-limit-bypass | app.ts:22 | `trust proxy: 1` lets client-controlled X-Forwarded-For bypass rate limiting |
| F-003 | MEDIUM | toctou-authorization | transfers.service.ts:54 | Receiver wallet's ACTIVE status not re-verified atomically at credit time |
| F-004 | MEDIUM | business-logic-validation-gap | wallets.service.ts:67 | Add-money flow does not check wallet suspension status |
| F-005 | LOW | timing-side-channel | auth.service.ts:61 | Login timing difference undermines account-enumeration defense |
| F-006 | LOW | business-logic-validation | transfers.schemas.ts:15 | Floating-point precision check rejects valid 2-decimal amounts |
| F-007 | LOW | csrf | verifyOrigin.ts:21 | CSRF Origin check silently passes when Origin header absent |
| F-008 | LOW | sensitive-data-logging | logger.ts:7 | Logger redaction list omits token fields |

Total: 8 findings (1 HIGH, 3 MEDIUM, 4 LOW), 3 low-confidence (<0.4).

---

### F-001 — getTransactionById does not verify the transaction belongs to the caller's wallet (IDOR)
**Severity:** HIGH · **Confidence:** 0.97 · **This is the branch's injected vulnerability.**

`getTransactionById` validates the id is UUID-shaped and fetches the caller's own wallet, but the Prisma query filters only by transaction id — no `senderWalletId`/`receiverWalletId` check against the caller's wallet. Contrast with `listTransactions`, which correctly scopes with `OR: [{ receiverWalletId }, { senderWalletId }]`.

**Exploit:** any authenticated user who knows/guesses another user's transaction UUID gets the full detail (counterparty, amount, status, timestamps) regardless of ownership.

**Fix:** `findFirst({ where: { id, OR: [{ senderWalletId: wallet.id }, { receiverWalletId: wallet.id }] } })`, return `NotFoundError` on no match.

### F-002 — `trust proxy: 1` lets client-controlled X-Forwarded-For bypass rate limiting
**Severity:** MEDIUM · **Confidence:** 0.5

Express trusts the left-most `X-Forwarded-For` entry as client IP; `express-rate-limit` keys off it. Without a real trusted proxy stripping inbound XFF, any client can rotate the header to dodge the login rate limit.

**Fix:** set `trust proxy` to match real deployment topology, or disable it.

### F-003 — Receiver wallet's ACTIVE status not re-verified atomically at credit time (TOCTOU)
**Severity:** MEDIUM · **Confidence:** 0.35

Sender debit is an atomic conditional update; receiver credit has no equivalent status check, so a wallet suspended mid-transfer can still be credited.

**Fix:** make the credit conditional on `status: 'ACTIVE'` like the debit, roll back if no row updates.

### F-004 — Add-money flow does not check wallet suspension status
**Severity:** MEDIUM · **Confidence:** 0.7

`addMoney` credits the wallet with no status check, while transfers.service.ts enforces `ACTIVE` status for both sender and receiver. Inconsistent enforcement lets a suspended wallet still receive top-ups.

**Fix:** check `wallet.status !== 'ACTIVE'` in `addMoney` and throw the same `ForbiddenError` used elsewhere.

### F-005 — Login timing difference undermines account-enumeration defense
**Severity:** LOW · **Confidence:** 0.3

Unknown-email path returns fast (one DB lookup); wrong-password path additionally awaits an argon2id verify. Timing difference lets an attacker distinguish registered from unregistered emails despite an identical error body.

**Fix:** perform a dummy argon2 verify on the unknown-email path to equalize timing.

### F-006 — Floating-point precision check rejects valid 2-decimal amounts
**Severity:** LOW · **Confidence:** 0.5 · **Not a security bug — functional/correctness gap.**

`Number.isInteger(n * 100)` on IEEE-754 doubles false-rejects ~9% of valid whole-cent amounts (e.g. 19.99). Same policy reused for wallet top-ups.

**Fix:** validate precision via string pattern or a decimal library instead of float multiplication.

### F-007 — CSRF Origin check silently passes when Origin header absent
**Severity:** LOW · **Confidence:** 0.3

`verifyOrigin` only rejects a present-but-mismatched Origin; a missing header sails through unchecked.

**Fix:** fail closed — require Origin (or Referer) present and matching for mutating requests.

### F-008 — Logger redaction list omits token fields
**Severity:** LOW · **Confidence:** 0.25 · **Defense-in-depth, no live instance found.**

Pino redact config covers cookies/authorization headers/passwords but not `token`/`accessToken`/`refreshToken` field names.

**Fix:** extend the redact `paths` list defensively.

---

**Next step:** these are static candidates, not verified — the harness's own `/triage` skill would do rigorous N-vote verification and false-positive removal next. Not run here (no adapted triage pass performed); treat F-002/003/005/006/007/008 as needing human confirmation, F-001 and F-004 as high-confidence based on direct code inspection.
