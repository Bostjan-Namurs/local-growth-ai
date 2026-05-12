Read AGENTS.md first.

Then read:
- for-codex/IMPLEMENTATION_BRIEF.md
- for-codex/SPRINT_01_TASK_02_CONFIG_HEALTH_BLUEPRINTS.md
- docs/12-pre-coding-decision-lock.md
- docs/13-local-dev-bootstrap.md

Do not implement the full product.

We are starting from the combined macOS Codex-ready scaffold. Your task is to inspect the current repository, confirm what is already implemented, run the existing backend tests, and then implement only the missing items from Sprint 1 Task 2.

Rules:
- Keep LLM_MODE=fake.
- Do not connect to production Supabase.
- Do not connect to Rancher.
- Do not connect to real Ollama/vLLM services yet.
- Do not add Google Maps scraping.
- Do not add automatic outreach.
- Do not expose LLM endpoints publicly.
- Keep changes small and reviewable.
- Before editing, give a short implementation plan.
- After editing, run tests and summarize changed files.

Verification command:
- ./verify_macos.sh
