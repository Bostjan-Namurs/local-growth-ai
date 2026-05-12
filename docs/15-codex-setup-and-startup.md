# Codex setup and startup

This repository is prepared for Codex-assisted implementation on macOS.

## Correct working directory

Always run Codex from the repository root:

```bash
cd ~/code/localgrowth-ai
codex --sandbox workspace-write --ask-for-approval on-request
```

Do not run Codex from `docs/`, `for-codex/`, or `apps/api/`.

## Why root matters

`AGENTS.md` is at the repository root. Codex uses repository instruction files such as `AGENTS.md` before doing work, so starting from the root ensures it receives product rules, coding constraints, verification commands, and safety rules.

## Project-local Codex config

This repo includes:

```text
.codex/config.toml
```

It sets conservative project defaults:

```toml
approval_policy = "on-request"
sandbox_mode = "workspace-write"
web_search = "disabled"

[sandbox_workspace_write]
network_access = false
```

CLI flags still override project config.

## First task

Start with:

```bash
./start_codex_macos.sh
```

This launches Codex with:

```bash
codex --sandbox workspace-write --ask-for-approval on-request "$(cat for-codex/CODEX_START_TASK_02_PROMPT.md)"
```

## Safe development mode

The project starts in fake LLM mode:

```env
LLM_MODE=fake
ENABLE_REAL_OUTREACH=false
ENABLE_PRODUCTION_DEPLOY=false
ENABLE_CODEX_HANDOFF=false
```

This lets Codex implement and test code without contacting production infrastructure.
