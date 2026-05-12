.PHONY: help install dev-up dev-down api-dev admin-dev worker-dev lint typecheck test test-api test-agents test-blueprints test-worker format

help:
	@echo "LocalGrowth AI commands"
	@echo "  make install          Install dependencies"
	@echo "  make dev-up           Start local Postgres/pgvector and Redis"
	@echo "  make dev-down         Stop local services"
	@echo "  make api-dev          Run FastAPI app"
	@echo "  make admin-dev        Run Next.js admin UI"
	@echo "  make worker-dev       Run Celery worker"
	@echo "  make lint             Run lint checks"
	@echo "  make typecheck        Run type checks"
	@echo "  make test             Run all tests"
	@echo "  make test-api         Run API tests"
	@echo "  make test-agents      Run agent tests"
	@echo "  make test-blueprints  Run blueprint tests"
	@echo "  make test-worker      Run worker tests"

install:
	@echo "Install commands will be implemented after app skeleton is created."

dev-up:
	docker compose -f docker-compose.dev.yml up -d

dev-down:
	docker compose -f docker-compose.dev.yml down

api-dev:
	cd apps/api && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

admin-dev:
	cd apps/admin-ui && pnpm dev

worker-dev:
	cd apps/worker && uv run celery -A worker worker --loglevel=info

lint:
	@echo "Run ruff/eslint after skeleton exists."

typecheck:
	@echo "Run mypy/tsc after skeleton exists."

test: test-api test-agents test-blueprints test-worker

test-api:
	@echo "Run pytest apps/api/tests after API skeleton exists."

test-agents:
	@echo "Run pytest packages/agents/tests after agent package exists."

test-blueprints:
	@echo "Run pytest packages/blueprints/tests after loader exists."

test-worker:
	@echo "Run pytest apps/worker/tests after worker exists."

format:
	@echo "Run ruff format and frontend formatter after skeleton exists."
