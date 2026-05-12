# Sprint 1 Task 3 — Fake LLM Client and Agent Run Logging Skeleton

Use this after Tasks 1 and 2 are complete.

## Prompt

```text
Read AGENTS.md and docs/04-agent-system-codex-implementation.md.

Implement Sprint 1 Task 3: fake LLM client and agent run logging skeleton.

Requirements:
1. Create an LLM client interface that supports model aliases: classifier, extractor, writer, coder, judge, embedding.
2. Implement fake mode responses for tests.
3. Add no real network call unless LLM_MODE is local or cluster.
4. Add typed request/response models for LLM calls.
5. Add agent run logging service skeleton that can store in memory for tests and is ready for database storage later.
6. Add tests for fake classifier, fake proposal writer, and fake judge.
7. Add tests confirming real LLM calls are not attempted in fake mode.
8. Do not implement full autonomous agent workflow yet.

Before coding, write a short plan.
After coding, summarize files changed and commands run.
```

## Acceptance criteria

- fake LLM client works deterministically;
- model aliases are used instead of raw model names;
- agent run logging skeleton exists;
- tests pass in fake mode;
- no external LLM server is required for tests.
