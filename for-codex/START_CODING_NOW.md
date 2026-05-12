# Start Coding Now

The documentation is now ready enough to begin implementation.

## Step 1

Copy documentation into the real repo root:

```text
AGENTS.md
README.md
docs/
for-codex/
examples/
```

## Step 2

Copy the local dev examples:

```text
examples/dev/.env.example -> .env.example
examples/dev/docker-compose.dev.yml -> docker-compose.dev.yml
examples/dev/Makefile -> Makefile
examples/ci/github-actions-test.yml -> .github/workflows/test.yml
```

## Step 3

Run Codex with:

```text
for-codex/SPRINT_01_TASK_01_REPO_SCAFFOLD.md
```

## Step 4

After Task 1, run:

```bash
make test
```

## Step 5

Continue with:

```text
for-codex/SPRINT_01_TASK_02_CONFIG_HEALTH_BLUEPRINTS.md
for-codex/SPRINT_01_TASK_03_FAKE_LLM_AND_AGENT_RUNS.md
```

## Important limits

Do not start post-MVP documentation now.
Do not add new verticals beyond restaurant, salon, and bike rental before the first working vertical slice.
Do not enable real outreach or production deployment until approval flows are implemented.
