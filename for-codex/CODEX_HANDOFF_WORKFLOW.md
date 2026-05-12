# Codex Handoff Workflow

## Purpose

This workflow turns an admin-approved vertical draft into repository changes.

## Recommended stages

```text
1. Admin fills New Business Type Wizard
2. System generates draft artifacts
3. Admin reviews and approves draft
4. System creates Codex task bundle
5. Codex runs in an isolated workspace/branch
6. Codex writes files and tests
7. CI runs
8. Pull request is reviewed
9. Merge happens
10. Blueprint is indexed into pgvector
11. Admin activates vertical
```

## Early-stage manual process

Use this while the product is young:

```text
UI exports codex_task.json
Developer opens repository locally
Developer runs Codex CLI in repo
Developer pastes ADD_BUSINESS_TYPE_PROMPT.md + codex_task.json
Codex prepares changes
Developer reviews diff
Developer runs tests
Developer opens PR
```

## Controlled worker process

Use this after the workflow is stable:

```text
Backend receives approved vertical draft
Worker creates isolated workspace
Worker clones repository
Worker creates branch vertical/<vertical-id>
Worker writes codex_task.json
Worker invokes Codex CLI or Codex MCP integration
Worker runs tests
Worker commits changes
Worker opens PR
Worker stores logs in vertical_task_logs
```

## Guardrails

- Codex worker must not have production database credentials.
- Codex worker must not have production deployment permissions.
- Codex worker should only create branches and pull requests.
- Production activation must happen after merge and human approval.
- Generated migrations must be reviewed before applying to production.
- Legal/policy/safety content must remain placeholders unless supplied by an authorized human.

## What to log

```text
codex task id
vertical id
branch name
repository commit sha
prompt hash
input payload hash
files changed
test commands
test results
PR URL
manual review status
activation status
```

## Codex task status values

```text
created
queued
running
changes_created
tests_running
tests_failed
pr_open
review_required
merged
activated
failed
cancelled
```

## Rollback

If a vertical is activated incorrectly:

```text
set vertical status to deprecated or inactive
remove from lead matching
remove from app generation choices
keep historical app configs unchanged
create corrective PR
reindex active blueprints
```
