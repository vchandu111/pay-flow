# OWASP ZAP baseline scan — PayFlow (`security-testing` branch)

**Target:** `http://localhost:5180` (frontend dev server, scanned via `host.docker.internal:5180` from a ZAP Docker container)
**Scanner:** ZAP 2.17.0, `zap-baseline.py` (passive scan only — no active/attack payloads sent)
**Scanned:** 2026-09-25T11:29:46Z

**Total: 8 warnings, 0 failures, 59 passive checks passed.** 7 URLs discovered (basic spider — a client-rendered SPA, so only static entry points were found, not app routes like `/login` or `/dashboard`).

> This is a **passive baseline scan of the Vite dev server**, not production. Vite's dev server doesn't set the security headers a production reverse proxy/CDN or the backend's `helmet()` config might already set — verify against your actual prod deployment before treating these as confirmed gaps. Coverage is also shallow: ZAP's standard spider can't execute JS, so it never reached authenticated app routes. An Ajax Spider (headless-browser) pass or an active scan would be needed for real route coverage.

## All findings

| risk | alert | affected URLs | notes |
|---|---|---|---|
| Medium | Content Security Policy (CSP) Header Not Set | `/`, `/robots.txt`, `/sitemap.xml` (3) | No `Content-Security-Policy` header — mitigates XSS/data-injection impact. |
| Medium | Missing Anti-clickjacking Header | `/`, `/robots.txt`, `/sitemap.xml` (3) | No `X-Frame-Options` or CSP `frame-ancestors` — pages can be framed by other origins. |
| Low | Cross-Origin-Embedder-Policy Header Missing or Invalid | `/`, `/robots.txt`, `/sitemap.xml` (3) | No `Cross-Origin-Embedder-Policy` header. |
| Low | Cross-Origin-Opener-Policy Header Missing or Invalid | `/`, `/robots.txt`, `/sitemap.xml` (3) | No `Cross-Origin-Opener-Policy` header. |
| Low | Cross-Origin-Resource-Policy Header Missing or Invalid | `/`, `/robots.txt`, `/sitemap.xml`, `/src/main.tsx` (4) | No `Cross-Origin-Resource-Policy` header. |
| Low | Permissions Policy Header Not Set | `/`, `/@vite/client`, `/robots.txt`, `/sitemap.xml`, `/src/main.tsx` (5) | No `Permissions-Policy` header restricting browser features (camera, mic, geolocation, etc.). |
| Low | X-Content-Type-Options Header Missing | `/`, `/@vite/client`, `/robots.txt`, `/sitemap.xml`, `/src/main.tsx` (5) | No `X-Content-Type-Options: nosniff` — allows MIME-sniffing on older browsers. |
| Informational | Information Disclosure - Suspicious Comments | `/@vite/client` (1) | Comment referencing rollup's `\0` virtual-module convention — this is Vite's own dev tooling file, not application code; not actionable. |
| Informational | Storable but Non-Cacheable Content | `/`, `/robots.txt`, `/sitemap.xml`, `/src/main.tsx` (4) | `Cache-Control: no-cache` on storable content — informational, expected for a dev server. |
| Informational | Modern Web Application | `/`, `/robots.txt`, `/sitemap.xml` (3) | ZAP detected this is a JS-rendered SPA and recommends its Ajax/Client Spider for real coverage. |

## Comparison with the other scans

`VULN-FINDINGS.md` (AI-based static review) and `sonar-findings.md` (SonarQube SAST) both found business-logic vulnerabilities (SQL injection, stored XSS, IDOR, CORS wildcard misconfiguration, etc.) baked into the app's source code. This ZAP pass is a **different layer entirely** — it only checked HTTP response headers on the dev server's static entry points, so it can't confirm or refute those code-level findings. None of the 8 warnings above overlap with the planted vulnerabilities; they're generic hardening gaps (missing security headers) that a reverse proxy or `helmet()` config would typically close in production.

To get ZAP coverage that actually exercises the planted vulnerabilities (stored XSS, CORS wildcard, IDOR), a follow-up scan needs either:
- an **Ajax Spider** pass so ZAP can log in and reach authenticated SPA routes, or
- ZAP pointed directly at the **backend API** (`:4000`) with real request bodies/auth tokens, since the vulnerabilities live in API request handling, not static frontend files.
