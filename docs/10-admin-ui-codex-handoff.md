# 10 — Admin UI to Codex Handoff

## Direct answer

Yes, an admin can start adding a new business type from the UI.

The admin should be guided through a **New Business Type Wizard**. At the end, the system should create a controlled **Vertical Implementation Request**. That request can be handed to Codex to prepare repository changes.

Codex can prepare most implementation artifacts for a new business type, but Codex should not directly activate the new vertical in production. It should work in a branch/workspace and produce files, tests, and a pull request for review.

## What Codex can prepare

Codex can prepare:

```text
blueprint.yaml
input.schema.json
app_config.example.json
campaign_playbook.yaml
qa_checklist.md
registry.yaml update
classifier synonym updates
blueprint matcher updates
agent test cases
schema validation tests
example generated customer config
migration for reusable modules, when needed
documentation updates
template updates, if scope allows
```

Codex should not be trusted to decide final legal, pricing, safety, insurance, certification, or regulatory content. It should create placeholders and mark those items for human review.

## Recommended handoff model

```text
Admin UI
  -> Vertical Draft
  -> Admin Approval
  -> Codex Task Bundle
  -> Isolated Codex Worker
  -> Git branch
  -> Code/config/docs/tests
  -> CI
  -> Pull request
  -> Human review
  -> Merge
  -> Blueprint reindex
  -> Activate vertical
```

## Why not direct production changes

Do not let Codex directly modify active production configuration because:

```text
new verticals may need legal review
AI can misunderstand app requirements
schemas may be incomplete
migrations can affect production data
new templates can break existing apps
campaign rules may be unsafe
customer-facing claims need review
```

The safe model is branch, tests, PR, review, activation.

## Admin wizard steps

### Step 1 — Choose operation type

The UI asks:

```text
Are you adding:
1. a new customer using an existing business type?
2. a new business type / vertical?
```

If option 1, no Codex handoff is needed.

If option 2, continue with the vertical wizard.

### Step 2 — Basic vertical identity

Fields:

```text
vertical_id: bike_rental
name: Bike Rental
category: rental
short_description
countries/markets where it should be used
status: draft
```

### Step 3 — App pattern selection

Admin chooses an app pattern:

```text
reservation_booking
appointment_booking
rental_booking
direct_booking
service_quote
membership
catalog_contact
```

For bike rental, choose:

```text
app_pattern = rental_booking
default_template = rental-booking-pwa
```

### Step 4 — Business problems and sales angle

Admin defines:

```text
common digital gaps
business pain points
recommended package
primary goal
secondary goals
```

Example:

```text
No online rental request form
Unclear prices
Tourists cannot quickly see bike types
No route recommendations
Too many phone calls for availability
```

### Step 5 — Required data

Admin defines what the customer must provide:

```text
business name
address
phone
email
opening hours
rental items
pricing rules
pickup rules
return rules
cancellation policy
photos
```

### Step 6 — Pages and features

Admin selects pages:

```text
home
catalog
pricing
booking
routes
faq
contact
terms/policies
```

Admin selects features:

```text
rental catalog
booking request form
pricing table
pickup/return rules
add-ons
deposit information
multilingual content
route recommendations
hotel delivery option
```

### Step 7 — AI generation rules

Admin defines what AI may generate:

```text
website copy
SEO title/meta
FAQ drafts
campaign ideas
route recommendation placeholders
```

Admin defines what AI must not invent:

```text
prices
exact availability
legal waiver text
insurance terms
safety guarantees
reviews
partnerships
certifications
```

### Step 8 — Campaign playbook

Admin defines campaign types:

```text
summer tourist rental campaign
e-bike weekend campaign
hotel partner campaign
group rental campaign
route landing page campaign
review request campaign
```

### Step 9 — QA checklist

Admin defines checks:

```text
booking return date must be after pickup date
at least one rental item required
prices confirmed or shown as placeholders
no fake reviews
no fake safety/legal guarantees
contact details present
admin approval required before production deploy
```

### Step 10 — Generate vertical draft

The system generates:

```text
blueprint.yaml draft
input.schema.json draft
app_config.example.json draft
campaign_playbook.yaml draft
qa_checklist.md draft
codex_task.json
```

### Step 11 — Admin approval

Admin reviews and approves the vertical draft.

Approval means:

```text
the business logic is acceptable
the missing-data rules are acceptable
the do-not-invent rules are acceptable
the Codex task is ready to execute
```

### Step 12 — Codex handoff

The system creates a Codex task bundle.

Codex receives:

```text
vertical implementation request
expected files
acceptance criteria
do-not rules
verification commands
existing repo instructions
```

### Step 13 — PR review and activation

After Codex creates changes:

```text
CI runs tests
QA validates generated app config
admin/developer reviews PR
merge happens
blueprint is indexed into pgvector
vertical status becomes active
```

## Codex task modes

### Mode A — Blueprint-only vertical

Use this when an existing template already supports the business type.

Codex changes:

```text
blueprint files
registry
agent mapping tests
schema tests
campaign playbook
QA checklist
```

Example: `bike_rental` using `rental-booking-pwa`.

### Mode B — Template adaptation

Use this when an existing template needs small changes.

Codex changes:

```text
all Mode A files
small template component updates
config mapping updates
additional tests
```

Example: rental template already exists, but needs add-ons or route page support.

### Mode C — New template/module

Use this when no existing app pattern works.

Codex changes:

```text
all Mode A files
new template or module
new database migration
new API handlers
new tests
new docs
```

This should require developer review.

## Codex worker options

### Option 1 — Manual developer handoff

The UI exports the Codex task bundle. A developer runs Codex locally.

Best for early stage.

### Option 2 — GitHub issue / PR request

The UI creates an issue containing the Codex task. A developer or coding agent implements it.

Best when using GitHub workflow.

### Option 3 — Controlled Codex Worker

The backend starts a job that:

```text
clones repo into isolated workspace
creates branch
writes task bundle
invokes Codex CLI or Codex MCP integration
runs tests
commits changes
opens PR
stores logs
```

Best after the process is stable.

## Minimal Codex task bundle

```json
{
  "task_type": "add_business_vertical",
  "vertical_id": "bike_rental",
  "mode": "blueprint_only",
  "app_pattern": "rental_booking",
  "template_id": "rental-booking-pwa",
  "expected_files": [
    "examples/blueprints/bike-rental/blueprint.yaml",
    "examples/blueprints/bike-rental/input.schema.json",
    "examples/blueprints/bike-rental/app_config.example.json",
    "examples/blueprints/bike-rental/campaign_playbook.yaml",
    "examples/blueprints/bike-rental/qa_checklist.md"
  ],
  "must_update": [
    "examples/blueprints/registry.yaml",
    "agent classifier mappings",
    "blueprint matcher tests"
  ],
  "do_not_invent": [
    "prices",
    "inventory availability",
    "legal waiver text",
    "insurance terms",
    "customer reviews",
    "partnerships",
    "safety guarantees"
  ],
  "verification_commands": [
    "npm run lint",
    "npm run test",
    "npm run test:blueprints",
    "npm run test:agents"
  ],
  "acceptance_criteria": [
    "vertical loads from registry",
    "input schema validates sample data",
    "app config validates against template requirements",
    "classifier maps bike rental synonyms to bike_rental",
    "QA rules reject invented prices and reviews"
  ]
}
```

## API concept

```text
POST /api/admin/verticals/drafts
GET  /api/admin/verticals/drafts/{id}
POST /api/admin/verticals/drafts/{id}/generate
POST /api/admin/verticals/drafts/{id}/approve
POST /api/admin/verticals/drafts/{id}/create-codex-task
GET  /api/admin/codex-tasks/{id}
POST /api/admin/codex-tasks/{id}/approve-pr
POST /api/admin/verticals/{id}/activate
```

## Tables to support this workflow

```text
verticals
vertical_drafts
vertical_versions
vertical_codex_tasks
vertical_task_logs
vertical_activation_events
```

See `examples/db/002_vertical_onboarding_and_rental.sql`.

## Security and permissions

Only admin/developer roles should create Codex tasks.

Suggested roles:

```text
admin: can create/review drafts, cannot merge code automatically
developer: can approve Codex-generated PRs
owner: can activate vertical after merge
codex_worker: can create branch/PR, cannot deploy production directly
```

## Final rule

The UI can start the process. Codex can prepare the implementation. Humans approve activation.
