# Admin UI Codex Task Sequence

Use these as separate Codex sessions. Do not run all tasks as one giant task.

## Task UI-01: Static Admin Shell

Prompt: use `for-codex/ADMIN_UI_IMPLEMENTATION_PROMPT.md`.

Deliverable:

```text
Admin shell
Sidebar
Topbar
Dashboard
Lead Inbox
Business Profile
Proposal Review
Generated App Preview
Business Types
Agent Runs
Settings
mock data
```

## Task UI-02: Add UI Tests and Empty States

After UI-01 is reviewed and committed, ask Codex:

```text
Add focused tests for Admin UI components and pages. Add EmptyState, LoadingSkeleton, WarningPanel, and disabled risky action states. Do not connect real API yet.
```

## Task UI-03: Connect Safe Backend Endpoints

After backend health/blueprints endpoints are stable, ask Codex:

```text
Connect only safe read-only endpoints: /health, /version, /blueprints. Keep leads, proposals, apps, and agent runs mocked. Add API client abstraction.
```

## Task UI-04: Business Type Wizard Persistence

After vertical draft backend exists, ask Codex:

```text
Connect Business Type Wizard to the vertical draft API. Save draft only. Do not run Codex automatically. Do not activate vertical automatically.
```

## Task UI-05: Codex Handoff Package

After handoff API exists, ask Codex:

```text
Implement Codex Handoff screen that shows generated files, allowed modifications, forbidden changes, required tests, and generated prompt. Admin can approve creation of handoff package only. Do not auto-run Codex from UI.
```
