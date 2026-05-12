# Sprint 1 Task 2 — Config, Health, and Blueprint Loader

Use this after Task 1 is complete.

## Prompt

```text
Read AGENTS.md and docs/12, docs/13, docs/14.

Implement Sprint 1 Task 2: config, health, and blueprint loader.

Requirements:
1. Ensure backend config is typed and loaded from environment variables.
2. Add GET /health returning status, app_env, llm_mode, and database_configured boolean.
3. Add GET /version returning app name and version.
4. Implement a blueprint registry loader that reads blueprints/registry.yaml.
5. Implement GET /blueprints returning registered verticals.
6. Implement GET /blueprints/{vertical_id} returning the matching blueprint metadata.
7. Add tests for config, health, version, registry loader, and missing blueprint handling.
8. Keep LLM mode fake; do not call real models.
9. Do not add prohibited automation.

Before coding, write a short plan.
After coding, summarize files changed and commands run.
```

## Acceptance criteria

- `/health` works;
- `/version` works;
- `/blueprints` works;
- blueprint loader tests pass;
- missing or invalid blueprint files fail clearly;
- no real LLM dependency is required.
