# Codex Prompt — Add a New Business Type / Vertical

Use this prompt when the admin-approved vertical draft is ready.

```text
Add support for a new business vertical: <vertical_id>.

Read and follow AGENTS.md before making changes.

Context:
- This platform is blueprint-driven.
- Do not create arbitrary production apps from scratch.
- Reuse an existing app pattern and template if possible.
- Unknown business facts must remain placeholders.
- Do not invent prices, reviews, legal terms, insurance terms, certifications, partnerships, availability, or safety guarantees.

Vertical request:
<PASTE vertical implementation request JSON here>

Required work:
1. Add or update examples/blueprints/registry.yaml.
2. Add examples/blueprints/<vertical-id>/blueprint.yaml.
3. Add examples/blueprints/<vertical-id>/input.schema.json.
4. Add examples/blueprints/<vertical-id>/app_config.example.json.
5. Add examples/blueprints/<vertical-id>/campaign_playbook.yaml.
6. Add examples/blueprints/<vertical-id>/qa_checklist.md.
7. Add classifier synonyms for the new vertical.
8. Add blueprint matcher mapping.
9. Add tests for:
   - registry loading,
   - blueprint loading,
   - input schema validation,
   - app config validation,
   - synonym classification,
   - QA do-not-invent rules.
10. Add database migration only if the vertical requires a reusable module not already present.
11. Update docs if the workflow or template behavior changes.

Verification commands:
- npm run lint
- npm run test
- npm run test:blueprints
- npm run test:agents

Acceptance criteria:
- The vertical loads from the registry.
- The input schema validates sample valid data and rejects invalid data.
- The app config example validates.
- Synonyms classify to the new vertical.
- QA rules reject invented prices/reviews/legal/safety claims where relevant.
- No production deployment or vertical activation is performed by this task.

When finished, summarize:
- files changed,
- tests run,
- failures or skipped checks,
- decisions made,
- remaining manual review items.
```
