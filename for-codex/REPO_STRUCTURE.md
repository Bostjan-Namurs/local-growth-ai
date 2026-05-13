# Current Repository Structure

This file reflects the current Sprint 1 TypeScript scaffold.

```text
localgrowth-ai/
  README.md
  AGENTS.md
  .env.example
  docker-compose.dev.yml
  Makefile

  apps/
    api/
      src/
        agents/
        db/
        llm/
        services/
        app.ts
        config.ts
        server.ts
      tests/
      scripts/
      package.json

    web/
      src/
        app/
        components/
        features/
        lib/
      tests/
      package.json

    worker/
      src/
        jobs.ts
        worker.ts
      tests/
      package.json

  blueprints/
    registry.yaml
    bike-rental/

  migrations/
    drizzle/

  scripts/
    db/
    macos/

  docs/
  for-codex/
```

## Dependency Direction

```text
apps/web       -> API contracts and read-only facade data
apps/api       -> local agents, LLM adapter, Drizzle schema, blueprint loader
apps/worker    -> local fake-mode job contract only during Sprint 1
blueprints     -> loaded by apps/api services
migrations     -> applied by scripts/db/apply_migrations.sh
```

Frontend must not import backend internals directly. Production queue, LLM gateway, Rancher deployment, and outreach integrations remain outside Sprint 1.
