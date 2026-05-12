# Stack Decisions for MVP Implementation

Use these decisions unless the existing repository already has a committed alternative.

## Backend

```text
Language: Python 3.12
Framework: FastAPI
Validation: Pydantic v2
Database: SQLAlchemy 2.x
Migrations: Alembic
Testing: pytest
Linting: ruff
Typing: mypy
Package manager: uv
```

## Worker

```text
Worker: Celery
Broker: Redis
Backend: Redis initially, database records for durable agent state
```

## Frontend

```text
Framework: Next.js App Router
Language: TypeScript
Package manager: pnpm
Testing: add later after admin skeleton exists
```

## Data

```text
Database: self-hosted Supabase Postgres
Vector extension: pgvector
Object storage: Supabase Storage or S3-compatible storage
```

## LLM

```text
Agents call an internal OpenAI-compatible LLM gateway.
Local development starts with LLM_MODE=fake.
Production uses gateway aliases such as classifier, extractor, profiler, proposal_writer, coder, judge, and embedding.
```

## Repo rule

Do not add a large framework or orchestration system unless the current sprint requires it. Start deterministic. Add LangGraph or a workflow engine later if simple state machines become insufficient.
