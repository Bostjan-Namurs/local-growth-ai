Read `AGENTS.md` first.

Then read:

- `README_START_HERE.md`
- `for-codex/IMPLEMENTATION_BRIEF.md`
- `for-codex/SPRINT_01_TASK_02_CONFIG_HEALTH_BLUEPRINTS.md`
- `docs/12-pre-coding-decision-lock.md`
- `docs/13-local-dev-bootstrap.md`
- `docs/14-codex-first-sprint-operating-model.md`

Do not implement the full product.

We are starting from the combined Codex-ready scaffold. Your task is to inspect the current repository, confirm what is already implemented, run the existing backend tests, and then implement only the missing items from Sprint 1 Task 2.

Rules:

- Keep `LLM_MODE=fake`.
- Do not connect to production Supabase.
- Do not connect to Rancher.
- Do not add Google Maps scraping.
- Do not add automatic outreach or campaign sending.
- Do not expose LLM endpoints publicly.
- Do not create arbitrary customer app code without approved templates and schema validation.
- Keep changes small and reviewable.
- Before editing, give a short implementation plan.
- After editing, run tests and summarize changed files.

Expected verification commands:

```bash
make test
make test-api
make test-blueprints
make test-agents
```

If a command fails because the scaffold is incomplete, explain the failure and fix only the minimal project-scaffold issue needed for Sprint 1 Task 2.
