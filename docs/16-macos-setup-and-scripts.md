# macOS setup and scripts

## Fast path

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

## Script order

```text
00_check_prereqs.sh
01_install_prereqs_with_homebrew.sh        optional
02_bootstrap_local.sh
03_init_git_snapshot.sh
04_install_codex_cli.sh
05_start_codex_task2.sh
06_start_codex_task3.sh                    after Task 2 is committed
07_open_codex_interactive.sh               optional
08_verify_local.sh
09_optional_codex_exec_task2.sh            optional, advanced
10_undo_uncommitted_codex_changes.sh       emergency rollback
```

## Safety guarantees

The setup scripts do not overwrite `.env`, do not deploy, do not connect to production Supabase, do not connect to Rancher, and do not enable real outreach.

## Recovery

Inspect changes:

```bash
git status
git diff
```

Undo uncommitted changes:

```bash
./scripts/macos/10_undo_uncommitted_codex_changes.sh
```
