Read `AGENTS.md` first.

Then read:

- `docs/09-adding-business-types-blueprints.md`
- `docs/10-admin-ui-codex-handoff.md`
- `docs/11-bike-rental-vertical-example.md`
- `for-codex/ADD_BUSINESS_TYPE_PROMPT.md`

Goal: verify the bike rental vertical module and prepare any missing tests or registry validation.

Rules:

- Do not create a custom bike rental app template unless the reusable `rental-booking-pwa` app pattern cannot support it.
- Do not invent prices, legal waiver text, insurance terms, safety guarantees, partnerships, reviews, or exact availability.
- Unknown facts must remain placeholders.
- Keep Codex changes limited to blueprint/schema/registry/validation tests unless explicitly instructed otherwise.
