# Notes & Disclosures

This document fulfills the DOO Builders League submission requirement to explicitly state AI tools used, key decisions, and intentional limitations.

## AI Tools Used
- **Google Antigravity**: Used as an autonomous coding agent to architect and implement the OOP/SOLID refactoring, configure testing, set up Zod validation schemas, and debug build failures.
- **Claude (Anthropic)**: Used for independent code review and live verification against the running app and the deployed production URL (not just reading the code). It caught and helped fix several real bugs that had been reported as already resolved but were not: a runtime `ReferenceError` in the confidence-scoring pipeline that crashed every decision evaluation, a Zod validation bypass that let malformed known-action payloads silently reach the engine, a `.gitignore` file corrupted by mixed text encoding that was silently ignoring all new files from Git, a `@types/node`/`vitest` peer-dependency conflict that broke the Vercel build, and a Vercel "Deployment Protection" setting that made the live demo URL unreachable without a Vercel login.
- **Vercel (Deployment)**: For live Next.js demo hosting.

## Key Architectural Decisions
- **Manual Dependency Injection**: Rather than using a heavy DI framework like Inversify, we used a manual composition root (`container.ts`). This keeps the codebase lightweight and highly readable for judges while still demonstrating strong Dependency Inversion principles.
- **Fail-Closed by Default**: Unknown actions, missing critical schemas, or extreme risk scenarios intentionally halt the evaluation early or produce a 100/100 risk score and `refuse` state.
- **Cryptographic Chain of Custody**: We seal each action's decision output with HMAC SHA-256 (`HmacIntegrityService.ts`). The hash of the previous log entry is included in the new entry's signature, creating an append-only, tamper-evident ledger.

## Honest Limitations (What breaks and why)

To be completely transparent about the current constraints of this demo:

1. **In-Memory Audit Log**:
   The `AuditRepository` currently stores the chain of custody in an array in memory. 
   **When it breaks:** If the Vercel serverless function cold-starts or if the Next.js dev server restarts, the audit log is wiped. In a real-world scenario, this repository must be backed by a durable database (e.g., PostgreSQL, Redis, or a blockchain ledger).

2. **Client-Trusted Context**:
   The engine currently accepts the `userRole` and `timeOfRequest` directly from the client payload (simulated in the UI). 
   **When it breaks:** A malicious client could send `userRole: 'admin'` to falsely lower their risk score. In production, this context must be securely extracted from a verified JWT or server-side session, not trusted from the request body.

3. **Missing "Time-Travel" Validation**:
   The `timeOfRequest` is checked against business hours, but we do not strictly validate if the timestamp is artificially set to the past or future by the client.

4. **Synchronous Validation Limits**:
   The `MissingInfoValidator` statically checks if keys exist in the payload. It does not perform asynchronous lookups (e.g., verifying if a `receiptId` actually exists in a real Stripe/database system).
