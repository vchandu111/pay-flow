# PayFlow — vulnerability scan findings (security-testing branch)

**Branch:** `security-testing` (main + all 18 VULN branches merged)
**Scanned:** 2026-09-25
**Method:** parallel fan-out static review, 7 focus-area subagents, following the `/vuln-scan` skill from `anthropics/defending-code-reference-harness`, scoped to only the modules touched by the merged VULN branches.

## Summary

| id | severity | category | file:line | title | known vuln |
|---|---|---|---|---|---|
| F-AUTH-01 | HIGH | weak-crypto | password.ts:3 | Passwords hashed with unsalted SHA-256 | VULN-008 |
| F-TXN-01 | HIGH | sql-injection | transactions.service.ts:120 | SQLi in transaction search via `$queryRawUnsafe` | VULN-013 |
| F-TXN-02 | HIGH | idor | transactions.service.ts:143 | `getTransactionById` has no ownership check | VULN-001 |
| F-USR-01 | HIGH | mass-assignment | users.schemas.ts:5 | `.passthrough()` lets caller set email/passwordHash | VULN-003 |
| F-FE-01 | HIGH | xss | TransactionDetailPage.tsx:62 | Stored XSS via `dangerouslySetInnerHTML` on note | VULN-014 |
| F-MW-01 | HIGH | cors-misconfiguration | app.ts:32 | CORS reflects any Origin with credentials | VULN-018 |
| F-XFER-01 | HIGH | business-logic-validation-gap | transfers.schemas.ts:11 | No positivity check — negative amount reverses transfer | VULN-005 (+ VULN-006, see note) |
| F-XFER-02 | HIGH | toctou | transfers.service.ts:69 | Check-then-act balance race, 100ms injected window | VULN-004 |
| F-AUTH-04 | HIGH | rate-limit-bypass | auth.routes.ts:8 | `authLimiter` defined but never applied | VULN-010 |
| F-BEN-01 | HIGH | idor | beneficiaries.service.ts:42 | Delete beneficiary has no ownership check | VULN-002 |
| F-USR-02 | MEDIUM | session-management | users.service.ts:57 | Password change doesn't revoke other sessions | VULN-011 |
| F-FE-02 | MEDIUM | token-exposure | authApi.ts:19 | Access token stored in localStorage | VULN-007 |
| F-MW-02 | MEDIUM | csrf | verifyOrigin.ts:14 | CSRF Origin check exists but never mounted | VULN-012 |
| F-MW-03 | MEDIUM | information-disclosure | errorHandler.ts:14 | Stack traces leaked in all environments | VULN-015 |
| F-XFER-03 | MEDIUM | data-exposure | transfers.service.ts:40 | Recipient lookup over-exposes email/phone/balance | VULN-016 |
| F-AUTH-02 | MEDIUM | user-enumeration | auth.service.ts:60 | Login distinguishes unknown email vs wrong password | VULN-009 |
| F-AUTH-05 | MEDIUM | session-management | auth.controller.ts:20 | Access token also returned in JSON body | VULN-007 (dup of F-FE-02) |
| F-MW-04 | LOW | vulnerable-dependency | package.json:26 | `jsonwebtoken` pinned to 8.5.1 | VULN-017 |
| F-AUTH-03 | LOW | user-enumeration | auth.service.ts:20 | Register reveals which field (email/phone) collided | — (baseline) |
| F-AUTH-06 | LOW | timing-side-channel | password.ts:9 | Non-constant-time hash comparison | — (baseline) |

**Total: 20 findings (10 HIGH, 7 MEDIUM, 3 LOW), 3 low-confidence (<0.4).**

## Coverage vs. the 18 planted vulnerabilities

**17 / 18 directly surfaced.** VULN-007 was independently caught from both vantage points (backend response body: F-AUTH-05; frontend localStorage: F-FE-02) — a good sign, that's exactly the kind of duplicate a `/triage` dedup pass is meant to collapse into one owned finding.

**1 miss (partial): VULN-006.** When `vuln-005-negative-transfer-amount` and `vuln-006-transfer-amount-precision` were merged onto `security-testing`, both vulnerabilities landed on the same schema line (`transfers.schemas.ts`), since the conflict resolution removed both the `.positive()` check and the decimal-precision `.refine()` together. The transfers-module scanner reported the missing positivity check (F-XFER-01, HIGH) but did not separately call out the missing precision guard. The precision bug is still live in the code — it just wasn't independently flagged as its own finding, because the two vulnerabilities now share a diff hunk.

**3 bonus findings**, not among the 18 planted vulnerabilities — pre-existing baseline behavior the scan surfaced along the way:
- F-AUTH-03 (register-endpoint field-level enumeration)
- F-AUTH-06 (non-constant-time hash comparison)
- F-MW-04's confidence (0.35) reflects that the *use* of `jsonwebtoken` here has no concrete exploit chain today — correctly down-scored rather than dropped.

## Next step

These are static candidates, not verified. `/triage` (or the manual 3-vote adversarial verification used for VULN-002 — see `backend/TRIAGE-vuln-002.json`) would dedupe F-FE-02/F-AUTH-05, confirm/refute each finding, and re-rank by derived exploitability.
