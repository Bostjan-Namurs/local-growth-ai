# Codex Startup Commands for macOS

## 1. Unzip into your code folder

```bash
mkdir -p ~/code
cd ~/code
unzip ~/Downloads/localgrowth-ai-codex-ready-macos.zip
cd localgrowth-ai
chmod +x setup_macos.sh start_codex_macos.sh verify_macos.sh START_ON_MACOS.command scripts/macos/*.sh
```

## 2. Check prerequisites

```bash
./scripts/macos/00_check_prereqs.sh
```

Optional Homebrew installer:

```bash
./scripts/macos/01_install_prereqs_with_homebrew.sh
```

## 3. Bootstrap local project

```bash
./setup_macos.sh
```

Equivalent manual sequence:

```bash
./scripts/macos/00_check_prereqs.sh
./scripts/macos/02_bootstrap_local.sh
./scripts/macos/03_init_git_snapshot.sh
```

## 4. Install Codex CLI

```bash
./scripts/macos/04_install_codex_cli.sh
```

Manual equivalent:

```bash
npm i -g @openai/codex@latest
codex --version
```

## 5. Start Codex safely

```bash
./start_codex_macos.sh
```

Manual equivalent:

```bash
codex --sandbox workspace-write --ask-for-approval on-request "$(cat for-codex/CODEX_START_TASK_02_PROMPT.md)"
```

## 6. Verify after Codex finishes

```bash
git status
git diff
./verify_macos.sh
```

## 7. Commit reviewed changes

```bash
git add .
git commit -m "Implement Sprint 1 Task 2"
```

## 8. Start Task 3 after Task 2 is committed

```bash
./scripts/macos/06_start_codex_task3.sh
```

## 9. Open Codex without preloaded task prompt

```bash
./scripts/macos/07_open_codex_interactive.sh
```

## 10. Emergency undo of uncommitted Codex changes

```bash
./scripts/macos/10_undo_uncommitted_codex_changes.sh
```
