.PHONY: dev-up dev-down test test-api test-agents test-blueprints lint typecheck format api-dev web-dev worker-dev

dev-up:
	docker compose -f docker-compose.dev.yml up -d

dev-down:
	docker compose -f docker-compose.dev.yml down

api-dev:
	cd apps/api && python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

web-dev:
	cd apps/web && pnpm dev

worker-dev:
	cd apps/worker && python worker.py

lint:
	cd apps/api && python -m ruff check app tests
	cd apps/web && pnpm lint

typecheck:
	cd apps/api && python -m mypy app
	cd apps/web && pnpm typecheck

test:
	$(MAKE) test-api
	$(MAKE) test-blueprints
	$(MAKE) test-agents

test-api:
	cd apps/api && python -m pytest tests

test-blueprints:
	cd apps/api && python -m pytest tests/test_blueprints.py

test-agents:
	cd apps/api && python -m pytest tests/test_agents.py

format:
	cd apps/api && python -m ruff format app tests
