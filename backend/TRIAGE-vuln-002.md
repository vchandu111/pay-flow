# Triage Report — VULN-002 (beneficiaries module)

1 in -> 0 duplicates, 0 false positives, 1 confirmed (0 high / 1 med / 0 low), 0 need manual test

Context: manual run following `anthropics/defending-code-reference-harness` `/triage` methodology; environment = internet-facing web service, authenticated users; 3-vote adversarial verification.

## Act on these

### [MEDIUM] deleteBeneficiary deletes by id alone, ignoring caller identity (IDOR)  (f001)
`backend/src/beneficiaries/beneficiaries.service.ts:42` | auth-bypass (IDOR / broken access control) | claimed HIGH (alignment -2) | confidence 9.0/10
**Owner:** component: beneficiaries/; top committer chandra sekhar
**Verdict:** exploitable, votes {true_positive: 3, false_positive: 0, cannot_verify: 0}
**Preconditions (2):**
- Attacker must be an authenticated user (any registered account — self-serve signup)
- Attacker must know or guess the target beneficiary's UUID

**Threat-model match:** Tenant-to-tenant data leakage / tampering across accounts
**Why:** All 3 independent adversarial verifiers confirmed this as a real, reachable, unmitigated broken-access-control bug. `deleteBeneficiaryHandler` passes `req.user!.id` through to `deleteBeneficiary(_callerUserId, id)`, which never uses the underscore-prefixed `_callerUserId` and deletes `prisma.beneficiary.delete({ where: { id } })` with no `ownerUserId` filter — unlike `listBeneficiaries`/`addBeneficiary` in the same file, which both correctly scope by owner. `requireAuth` on the route only checks the session is valid, not that the caller owns the resource. Severity is derived as MEDIUM (not the scanner's claimed HIGH) because exploitation needs an authenticated attacker plus a target UUID, but the impact — silent, irreversible cross-account deletion of a saved payee — is serious enough to fix immediately.
**Reachability evidence:** backend/src/beneficiaries/beneficiaries.controller.ts:26, backend/src/beneficiaries/beneficiaries.routes.ts:9, backend/src/beneficiaries/beneficiaries.routes.ts:13

## Dropped

| id | title | file:line | why dropped |
|----|-------|-----------|-------------|
| (none) | — | — | — |
