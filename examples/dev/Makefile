.PHONY: help install dev dev-up dev-down db-apply-migrations db-check-supabase db-smoke-postgres db-sync-blueprints api-dev admin-dev worker-dev lint lint-backend typecheck typecheck-backend test test-api test-agents test-backend test-blueprints test-web test-worker format

help:
	@echo "LocalGrowth AI commands"
	@echo "  make install          Install dependencies"
	@echo "  make dev              Start local Postgres/pgvector and Redis"
	@echo "  make dev-up           Start local Postgres/pgvector and Redis"
	@echo "  make dev-down         Stop local services"
	@echo "  make api-dev          Run Fastify API"
	@echo "  make admin-dev        Run Next.js admin UI"
	@echo "  make worker-dev       Run TypeScript worker"
	@echo "  make db-check-supabase Prompt and check approved Supabase DB connectivity"
	@echo "  make db-apply-migrations Prompt or use DATABASE_URL to apply DB migrations"
	@echo "  make db-sync-blueprints Prompt or use DATABASE_URL to sync blueprint catalog rows"
	@echo "  make db-smoke-postgres Prompt or use DATABASE_URL to run Postgres persistence smoke"
	@echo "  make lint             Run lint checks"
	@echo "  make lint-backend     Run backend lint checks"
	@echo "  make typecheck        Run type checks"
	@echo "  make typecheck-backend Run backend type checks"
	@echo "  make test             Run all tests"
	@echo "  make test-api         Run API tests"
	@echo "  make test-backend     Run API and worker tests"
	@echo "  make test-agents      Run agent tests"
	@echo "  make test-blueprints  Run blueprint tests"
	@echo "  make test-web         Run admin web tests"
	@echo "  make test-worker      Run worker tests"

install:
	pnpm install

dev: dev-up

dev-up:
	docker compose -f docker-compose.dev.yml up -d

dev-down:
	docker compose -f docker-compose.dev.yml down

db-check-supabase:
	./scripts/db/check_supabase_connection.sh

db-apply-migrations:
	./scripts/db/apply_migrations.sh

db-sync-blueprints:
	./scripts/db/with_supabase_database_url.sh pnpm --dir apps/api db:sync-blueprints

db-smoke-postgres:
	DATA_STORE=postgres ./scripts/db/with_supabase_database_url.sh pnpm --dir apps/api smoke:postgres-store

api-dev:
	pnpm --dir apps/api dev

admin-dev: web-dev

web-dev:
	pnpm --dir apps/web dev

worker-dev:
	pnpm --dir apps/worker dev

lint:
	pnpm --dir apps/api lint
	pnpm --dir apps/web lint
	pnpm --dir apps/worker lint

lint-backend:
	pnpm --dir apps/api lint
	pnpm --dir apps/worker lint

typecheck:
	pnpm --dir apps/api typecheck
	pnpm --dir apps/web typecheck
	pnpm --dir apps/worker typecheck

typecheck-backend:
	pnpm --dir apps/api typecheck
	pnpm --dir apps/worker typecheck

test: test-api test-agents test-blueprints test-web test-worker

test-api:
	pnpm --dir apps/api test

test-backend: test-api test-worker

test-agents:
	pnpm --dir apps/api test:agents

test-blueprints:
	pnpm --dir apps/api test:blueprints

test-web:
	pnpm --dir apps/web test

test-worker:
	pnpm --dir apps/worker test

format:
	pnpm --dir apps/api typecheck
	pnpm --dir apps/worker typecheck
