# The Decision Engine (DOO Builders League)

A submission for the DOO Builders League AI Challenge: **The Decision Engine**.

## Overview
This project implements an explicit governance layer for autonomous AI systems. It evaluates proposed actions against risk, confidence, reversibility, and context to determine if the action should be executed, escalated, deferred, asked about, or outright refused.

## Setup & Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deliberate Failure Test
Select the **Hacker 1M Transfer** scenario in the dashboard. 
The system correctly identifies the immense risk (1000000 amount), the lack of privileges (operator role), and the suspicious context (unknown location, 2 AM), and aggressively **REFUSES** the action, logging it securely in the tamper-proof audit trail.

## Deliverables
- [x] Live UI / Dashboard
- [x] 5 Decision States
- [x] 3 Wired-in Domains (Finance, DevOps, Operations)
- [x] Audit Trail with SHA-256
- [x] Deliberate Failure Test
- [x] Architecture Snapshot (`ARCHITECTURE.md`)
- [x] Two-Year Thesis (`THESIS.md`)
