# LocalGrowth AI — macOS Start Here

This is the combined **Codex-ready macOS bundle**. It contains the product documentation, starter repository, blueprints, migrations, Rancher/Supabase/local LLM references, and safe macOS scripts.

## What this bundle is for

Use this bundle as the real starting repository for implementation.

```text
localgrowth-ai/
  AGENTS.md
  README_START_HERE_MACOS.md
  CODEX_STARTUP_COMMANDS_MACOS.md
  .codex/config.toml
  .env.example
  Makefile
  apps/api/
  apps/web/
  apps/worker/
  blueprints/
  docs/
  for-codex/
  infra/
  migrations/
  scripts/macos/
```

Run all setup and Codex commands from the repo root:

```bash
cd ~/code/localgrowth-ai
```

Do **not** run Codex from `docs/`, `for-codex/`, or `apps/api/`.

---

## Fast path on macOS

After downloading `localgrowth-ai-codex-ready-macos.zip` into `~/Downloads`:

```bash
mkdir -p ~/code
cd ~/code
unzip ~/Downloads/localgrowth-ai-codex-ready-macos.zip
cd localgrowth-ai
chmod +x setup_macos.sh start_codex_macos.sh verify_macos.sh START_ON_MACOS.command scripts/macos/*.sh
./setup_macos.sh
./scripts/macos/04_install_codex_cli.sh
./start_codex_macos.sh
```

The first Codex run uses this safe command:

```bash
codex --sandbox workspace-write --ask-for-approval on-request
```

---

## What `./setup_macos.sh` does

It safely runs:

```bash
./scripts/macos/00_check_prereqs.sh
./scripts/macos/02_bootstrap_local.sh
./scripts/macos/03_init_git_snapshot.sh
```

It will:

- check macOS prerequisites;
- create `.env` from `.env.example` only if `.env` does not exist;
- clean generated Node/test cache folders;
- start local Docker services only if Docker is installed and running;
- install workspace dependencies with pnpm;
- run API, web, and worker tests;
- initialize Git only if this folder is not already a Git repo;
- create an initial commit only if Git user name/email are already configured.

It does **not**:

- connect to production Supabase;
- connect to Rancher;
- connect to real local LLMs;
- deploy anything;
- send outreach;
- scrape Google Maps;
- overwrite your `.env`.

Sprint 1 uses:

```env
LLM_MODE=fake
ENABLE_REAL_OUTREACH=false
ENABLE_PRODUCTION_DEPLOY=false
ENABLE_CODEX_HANDOFF=false
```

---

## If prerequisites are missing

Run:

```bash
./scripts/macos/00_check_prereqs.sh
```

If Homebrew is installed and you want the script to install common dev tools, run:

```bash
./scripts/macos/01_install_prereqs_with_homebrew.sh
```

That script asks before installing anything.

Minimum tools for the first implementation session:

```text
Git
Node.js/npm
pnpm
Codex CLI
```

Docker is recommended but optional for the very first tests.

---

## Install Codex CLI

Run:

```bash
./scripts/macos/04_install_codex_cli.sh
```

Or manually:

```bash
npm i -g @openai/codex@latest
codex --version
```

Then sign in on first run:

```bash
codex
```

---

## Start the first Codex task

Run:

```bash
./start_codex_macos.sh
```

This starts Codex from the correct repo root and preloads the Sprint 1 Task 2 prompt from:

```text
for-codex/CODEX_START_TASK_02_PROMPT.md
```

After Codex finishes, verify manually:

```bash
git status
git diff
./verify_macos.sh
```

Commit only after reviewing the changes:

```bash
git add .
git commit -m "Implement Sprint 1 Task 2"
```

---

## Continue with Task 3

After Task 2 is reviewed and committed:

```bash
./scripts/macos/06_start_codex_task3.sh
```

---

## Recovery commands

Show Codex changes:

```bash
git status
git diff
```

Undo uncommitted Codex changes:

```bash
./scripts/macos/10_undo_uncommitted_codex_changes.sh
```

That script requires typing `DELETE` before it runs `git restore .` and `git clean -fd`.
