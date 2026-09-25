# SonarQube findings — PayFlow (`security-testing` branch)

**Project key:** `payflow` · **Dashboard:** http://localhost:9000/dashboard?id=payflow
**Scanned:** 2026-09-25T15:27:09+05:30

**Total: 32 issues** — 32 code smells, 0 bugs, **0 vulnerabilities**, **0 security hotspots**.
Severity: 3 MAJOR, 29 MINOR (0 CRITICAL, 0 BLOCKER).
Ratings: security 1.0 (A), reliability 1.0 (A), maintainability 1.0 (A).

> Scanned on the security-testing branch, which contains all 18 deliberately injected vulnerabilities (see VULN-FINDINGS.json in repo root for the AI-based scan of the same branch). SonarQube reported 0 vulnerabilities and 0 security hotspots despite this -- all 32 findings below are non-security code smells (style/accessibility/best-practice).

## All findings

| severity | rule | file:line | message |
|---|---|---|---|
| MAJOR | `typescript:S6481` | `frontend/src/features/auth/AuthContext.tsx:44` | The object passed as the value prop to the Context provider changes every render. To fix this con... |
| MAJOR | `typescript:S6819` | `frontend/src/features/beneficiaries/AddBeneficiaryForm.tsx:37` | Use <dialog> instead of the "dialog" role to ensure accessibility across all devices. |
| MAJOR | `typescript:S6819` | `frontend/src/features/wallet/AddMoneyModal.tsx:37` | Use <dialog> instead of the "dialog" role to ensure accessibility across all devices. |
| MINOR | `typescript:S6353` | `backend/src/auth/auth.schemas.ts:11` | Use concise character class syntax '\d' instead of '[0-9]'. |
| MINOR | `typescript:S7786` | `backend/src/auth/tokens.ts:27` | `new Error()` is too unspecific for a type check. Use `new TypeError()` instead. |
| MINOR | `typescript:S1874` | `backend/src/config/env.ts:26` | The signature '(): $ZodFlattenedError<{ NODE_ENV: "development" \| "test" \| "production"; PORT: ... |
| MINOR | `typescript:S1874` | `backend/src/middleware/validate.ts:2` | 'ZodTypeAny' is deprecated. |
| MINOR | `typescript:S1874` | `backend/src/middleware/validate.ts:6` | 'ZodTypeAny' is deprecated. |
| MINOR | `typescript:S1874` | `backend/src/middleware/validate.ts:7` | 'ZodTypeAny' is deprecated. |
| MINOR | `typescript:S6353` | `backend/src/shared/contact.ts:3` | Use concise character class syntax '\d' instead of '[0-9]'. |
| MINOR | `typescript:S6582` | `backend/src/transfers/transfers.service.ts:29` | Prefer using an optional chain expression instead, as it's more concise and easier to read. |
| MINOR | `typescript:S1874` | `backend/src/users/users.schemas.ts:17` | '(): ZodObject<{ name: ZodOptional<ZodString>; phone: ZodOptional<ZodString>; dateOfBirth: ZodOpt... |
| MINOR | `typescript:S6759` | `frontend/src/components/Button.tsx:12` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6759` | `frontend/src/components/Card.tsx:3` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6759` | `frontend/src/components/ProtectedRoute.tsx:5` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6759` | `frontend/src/features/auth/AuthContext.tsx:17` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6353` | `frontend/src/features/auth/schemas.ts:8` | Use concise character class syntax '\d' instead of '[0-9]'. |
| MINOR | `typescript:S6353` | `frontend/src/features/auth/schemas.ts:14` | Use concise character class syntax '\d' instead of '[0-9]'. |
| MINOR | `typescript:S6759` | `frontend/src/features/beneficiaries/AddBeneficiaryForm.tsx:16` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6759` | `frontend/src/features/beneficiaries/BeneficiaryList.tsx:3` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6353` | `frontend/src/features/beneficiaries/schemas.ts:4` | Use concise character class syntax '\d' instead of '[0-9]'. |
| MINOR | `typescript:S6759` | `frontend/src/features/profile/ChangePasswordForm.tsx:11` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6759` | `frontend/src/features/profile/ProfileForm.tsx:17` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6759` | `frontend/src/features/profile/ProfileForm.tsx:102` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6353` | `frontend/src/features/profile/schemas.ts:6` | Use concise character class syntax '\d' instead of '[0-9]'. |
| MINOR | `typescript:S6353` | `frontend/src/features/profile/schemas.ts:19` | Use concise character class syntax '\d' instead of '[0-9]'. |
| MINOR | `typescript:S6353` | `frontend/src/features/transfers/schemas.ts:4` | Use concise character class syntax '\d' instead of '[0-9]'. |
| MINOR | `typescript:S6759` | `frontend/src/features/wallet/AddMoneyModal.tsx:16` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6759` | `frontend/src/features/wallet/TransactionList.tsx:5` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6759` | `frontend/src/features/wallet/WalletSummary.tsx:5` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6759` | `frontend/src/pages/SendMoneyPage.tsx:142` | Mark the props of the component as read-only. |
| MINOR | `typescript:S6759` | `frontend/src/pages/TransactionDetailPage.tsx:73` | Mark the props of the component as read-only. |

## Comparison with the AI-based scan

See `VULN-FINDINGS.md` for the parallel AI-based static review of the same branch: 20 findings, 10 HIGH / 7 MEDIUM / 3 LOW, covering 17 of the 18 deliberately injected vulnerabilities (SQL injection, stored XSS, IDOR x3, mass assignment, weak crypto, CORS misconfiguration, missing rate limiting, CSRF gap, TOCTOU race condition, and more).

SonarQube, scanning the identical code, reported **zero** of them — 0 vulnerabilities, 0 security hotspots. Its 32 findings are entirely style/accessibility/deprecation code smells (unmemoized context values, ARIA role vs. native element, deprecated Zod API usage), none of which touch the planted security bugs. This is the expected outcome of rule-based pattern matching against vulnerabilities that hinge on missing business-logic checks (an absent `ownerUserId` filter, an absent `.positive()` validator) rather than a recognizable bad code shape.
