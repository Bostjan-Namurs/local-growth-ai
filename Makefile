.PHONY: help install dev dev-up dev-down db-apply-migrations db-check-supabase db-smoke-postgres db-sync-blueprints test test-api test-agents test-backend test-blueprints test-web test-worker lint lint-backend typecheck typecheck-backend format api-dev admin-dev web-dev worker-dev

help:
	@printf "%s\n" "LocalGrowth AI commands"
	@printf "%s\n" ""
	@printf "%s\n" "Setup:"
	@printf "%s\n" "  make install              Install workspace dependencies"
	@printf "%s\n" "  make dev-up               Start local Postgres/Redis via Docker Compose"
	@printf "%s\n" "  make dev-down             Stop local Docker Compose services"
	@printf "%s\n" ""
	@printf "%s\n" "Development:"
	@printf "%s\n" "  make api-dev              Start API dev server"
	@printf "%s\n" "  make web-dev              Start admin web dev server"
	@printf "%s\n" "  make worker-dev           Start worker dev process"
	@printf "%s\n" ""
	@printf "%s\n" "Database:"
	@printf "%s\n" "  make db-check-supabase    Prompt and check approved Supabase DB connectivity"
	@printf "%s\n" "  make db-apply-migrations  Prompt and apply/baseline DB migrations"
	@printf "%s\n" "  make db-sync-blueprints   Prompt and sync blueprint catalog rows"
	@printf "%s\n" "  make db-smoke-postgres    Prompt and run Postgres persistence smoke"
	@printf "%s\n" ""
	@printf "%s\n" "Verification:"
	@printf "%s\n" "  make lint                 TypeScript lint/type checks"
	@printf "%s\n" "  make typecheck            TypeScript typecheck"
	@printf "%s\n" "  make test                 Run API, blueprint, agent, web, and worker tests"
	@printf "%s\n" "  make test-api             Run API tests"
	@printf "%s\n" "  make test-blueprints      Run blueprint tests"
	@printf "%s\n" "  make test-agents          Run agent tests"
	@printf "%s\n" "  make test-web             Run admin web tests"
	@printf "%s\n" "  make test-worker          Run worker tests"

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

install:
	pnpm install

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

test:
	$(MAKE) test-api
	$(MAKE) test-blueprints
	$(MAKE) test-agents
	$(MAKE) test-web
	$(MAKE) test-worker

test-api:
	pnpm --dir apps/api test

test-backend:
	$(MAKE) test-api
	$(MAKE) test-worker

test-blueprints:
	pnpm --dir apps/api test:blueprints

test-agents:
	pnpm --dir apps/api test:agents

test-web:
	pnpm --dir apps/web test

test-worker:
	pnpm --dir apps/worker test

format:
	pnpm --dir apps/api typecheck
	pnpm --dir apps/worker typecheck
