# Demo script: "Why AI-assisted review catches what a general security scanner can't"

**Total time:** ~18–20 min · **Repo:** PayFlow · **Tools:** SonarQube (local, already running at localhost:9000) + Claude Code
**Thesis:** SAST tools like SonarQube pattern-match against a fixed rule catalog. They're reliable for known-bad literals and generic code smells, and structurally blind to anything requiring business/semantic reasoning — like "does this handler check the caller owns this resource?" An AI reader catches exactly that gap.

---

## Pre-flight checklist (do 10 min before the audience arrives)

- [ ] SonarQube server running: `~/sonarqube/bin/macosx-universal-64/sonar.sh status` → should say "SonarQube is running"
  - If not: `export JAVA_HOME=/opt/homebrew/opt/openjdk@21 && export PATH="$JAVA_HOME/bin:$PATH" && ~/sonarqube/bin/macosx-universal-64/sonar.sh start`
- [ ] Browser tab open to `http://localhost:9000/dashboard?id=payflow-vuln-001` (log in, dismiss the change-password nag if it reappears)
- [ ] Terminal open at `/Users/chandrasekhar/Desktop/Payflow`, on branch `main` (clean state) — confirm with `git branch --show-current`
- [ ] Have `backend/VULN-FINDINGS.md` open in an editor tab as backup evidence (already contains the full 8-finding scan from earlier — your safety net if the live re-run behaves differently)
- [ ] Know your Sonar token (stored earlier as `squ_1da3c...`) — don't paste it on screen if this is recorded/streamed

---

## Part 1 — Frame the claim (2 min, no screen needed yet)

**Say:**
> "PayFlow has a deliberate security lab built into it — 18 branches, each with exactly one injected vulnerability, documented in the README. I ran SonarQube — a real, industry-standard static analysis tool — against five of them. It's free, it's fast, and it caught zero of the five. I want to show you why, and then show you what did catch one of them on the first try."

**Key line to land:** *"This isn't 'SonarQube is bad.' It's 'pattern-matching has a hard edge, and knowing where that edge is matters more than which tool you buy.'"*

---

## Part 2 — Show SonarQube's real limit, live (5 min)

```bash
cd /Users/chandrasekhar/Desktop/Payflow
git checkout vuln-001-transaction-detail-idor
git diff v1.0.0-clean-baseline vuln-001-transaction-detail-idor -- backend/
```

**Point at the diff on screen** — it's short and dramatic:
```diff
- if (!tx || (tx.senderWalletId !== wallet.id && tx.receiverWalletId !== wallet.id)) {
+ if (!tx) {
```

**Say:** *"One authorization check, deleted. Any logged-in user can now read any other user's transaction by guessing a UUID. Let's see what SonarQube says about this branch."*

Switch to the browser tab (`http://localhost:9000/dashboard?id=payflow-vuln-001`). Click **Security** in the left nav.

**Point at:** 0 Vulnerabilities, 0 Security Hotspots.

**Say:** *"Same 31 maintainability nits as the clean baseline. Nothing new. Nothing security-flagged. Zero."*

*(Optional, if time allows: re-run the scan live to prove it's not a stale dashboard —)*
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21 && export PATH="$JAVA_HOME/bin:$PATH"
sonar-scanner -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.token=<TOKEN> \
  -Dsonar.projectKey=payflow-vuln-001
```
Takes ~10s. Refresh the dashboard — still zero.

**Why, in one sentence:** *"SonarQube's rules look for known bad shapes of code — a dangerous function call, a bad literal. There's no bad shape here. The bug is an absent line, and you can't pattern-match an absence."*

---

## Part 3 — Run the AI review live (6–8 min)

To keep this fast and reliable in front of an audience, scope the live run to **one module** (transactions) instead of the full 7-module fan-out from the earlier full scan — same bug, ~30–60 seconds instead of several minutes.

**Say before running:** *"Now I'll point an AI reader at the same branch, same file. No special tooling required — I'm going to ask it to read this code like a security reviewer would, and tell me what it finds."*

Prompt to run live (paste into Claude Code):

```
Do an authorized static security review of backend/src/transactions/ on the
current branch (vuln-001-transaction-detail-idor) in this PayFlow repo. This
is my own repo; the branch intentionally contains one injected vulnerability
for a training exercise, already disclosed in the README. Read-only — don't
run or build anything. Report any authorization, injection, or business-logic
issue you find with file:line, root cause, exploit scenario, and fix.
```

**While it runs, say:** *"It's reading transactions.controller.ts, routes.ts, schemas.ts, and service.ts, and reasoning about what should be true — not matching against a list."*

**Expected result** (this is what happened earlier in this exact session, high confidence it reproduces on the same branch/files):
- Flags `getTransactionById` in `transactions.service.ts` — missing ownership filter, HIGH severity, ~0.9+ confidence
- Usually also notices the contrast with `listTransactions`, which does the check correctly

**If the live run finds something differently worded or ranks it differently** (it's non-deterministic — flag this honestly): pivot to the backup —

**Say:** *"Here's a scan I ran earlier the same way, scoped to the whole backend, seven modules in parallel — F-001, HIGH, 0.97 confidence, the exact bug, plus 7 things nobody asked it to look for."* → open `backend/VULN-FINDINGS.md`, scroll to F-001, then the summary table.

**Key line to land:** *"It didn't just find the planted bug. It found a suspended-wallet bypass, a rate-limit bypass, a TOCTOU race — real issues sitting in code that was never touched for this demo. That's the difference between matching patterns and reading for intent."*

---

## Part 4 — The "why," backed by the tool's own docs (3 min)

**Say:** *"I didn't just declare SonarQube is limited — I went and read its own rule documentation to prove it."*

Show (screenshot or live fetch) the SonarQube rule doc for `S4790` (weak hashing) — point at this exact line:

> *"For non-sensitive use cases such as data integrity or fingerprinting, use a modern cryptographic hash function such as **SHA-256**..."*

**Say:** *"When PayFlow's password hasher was swapped from argon2id to raw SHA-256 — a real, textbook password-storage bug — SonarQube's own rule recommends SHA-256 as the fix for a different problem (collision resistance). The rule can't tell 'hash used for a password' from 'hash used for a file checksum.' Same function name, different intent — and intent is exactly what pattern matching can't see."*

*(This is a strong visual beat — the tool's own "compliant" example is the thing that made it blind.)*

---

## Part 5 — Close with the comparison, not a verdict (2 min)

Put this table on screen (or describe it):

| | SonarQube (SAST) | AI-based review |
|---|---|---|
| Catches known-bad literals & sinks | Yes, reliably | Yes |
| Catches generic code smells | Yes (31 real ones, free) | Not its job |
| Catches missing authorization checks | **No — structural blind spot** | **Yes** |
| Deterministic / CI-gateable | Yes | No |
| Cost per run | Free, ~10s | Real $, minutes |
| Explains its own misses | Yes — traced to exact rule docs | No |

**Closing line:** *"The takeaway isn't 'switch tools.' It's: run SonarQube always, because it's free and it never misses what it's built to catch — and run an AI reader at the checkpoints that matter, PR review or pre-release, because that's the only one of the two that can ask 'does this code do what it's supposed to do,' not just 'does this code look like a known bad shape.'"*

---

## Anticipated Q&A

**"Isn't the AI just going to hallucinate findings?"**
→ Yes, that's a real risk — that's why the source pipeline this is modeled on (`anthropics/defending-code-reference-harness`) has a dedicated `/triage` step: multiple independent verification passes, false-positive removal, before anything reaches a human. We skipped that step for time in this scan; in production you wouldn't.

**"Why not just write more SonarQube rules for these cases?"**
→ You can, for the CORS/crypto-literal ones — those are one bad-pattern-away misses. You can't write a rule for "every possible missing authorization check" — that's app-specific by definition; there's no generic AST shape for it.

**"How much does this cost to run regularly?"**
→ Scales with codebase size and how often you run it. Realistic model: continuous SonarQube in CI (near-zero marginal cost) + AI review gated to PR review or pre-release, not every commit.

**"Is this reproducible / can I trust one run?"**
→ No — flag this directly. Non-determinism is real. That's a genuine tradeoff versus SAST's determinism, not a solved problem.

---

## Reference material already on disk (for follow-up questions after the demo)

- `backend/VULN-FINDINGS.json` / `.md` — full 8-finding scan across all 7 backend modules
- SonarQube dashboards: `payflow-vuln-001`, `-013`, `-008`, `-014`, `-018` (all 0 security findings)
- `payflow-sonar-demo` branch/project — 2 confirmed true-positive SonarQube hits (weak hash, weak PRNG), proving the tool *does* work when the pattern matches exactly
