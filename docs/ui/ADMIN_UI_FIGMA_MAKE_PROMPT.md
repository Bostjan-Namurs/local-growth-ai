# Figma Make Prompt — LocalGrowth AI Admin UI

Paste this into Figma Make.

---

Create an interactive SaaS admin dashboard prototype for a product called **LocalGrowth AI**.

## Product context

LocalGrowth AI is an AI-assisted platform for discovering local businesses, generating a Customer Growth Profile, preparing a proposal, generating a website/app preview from business-type blueprints, handing approved new verticals to Codex, and deploying approved customer apps.

The Admin UI is used by internal operators, not by the local business customer.

The most important product rule:

**AI output is never silently trusted. Admins must clearly see what is verified, what is AI-generated, what is a placeholder, and what needs approval.**

## Design style

Create a polished B2B SaaS admin interface.

Visual direction:
- modern, calm, professional
- clean dashboard layout
- light theme first
- subtle borders and cards
- strong table readability
- clear status badges
- no playful colors
- no childish illustrations
- no huge gradients
- no marketing landing page style

Use a design style compatible with:
- Next.js
- Tailwind CSS
- shadcn/ui-style components
- desktop-first admin dashboard

## Layout

Use a persistent admin shell:

- left sidebar navigation
- topbar with page title, search, environment badge, user menu
- main content area with cards, tables, panels, and approval bars

Sidebar navigation:

Dashboard
Pipeline
- Leads
- Businesses
- Proposals
- Generated Apps
- Campaigns
Automation
- Agent Runs
- Approvals
- Deployments
Configuration
- Business Types
- Blueprints
- Templates
- LLM Gateway
- Data Sources
System
- Settings
- Audit Logs

## Key UI concept

Every record must show these visual trust states:

- Verified
- AI draft
- Placeholder
- Needs review
- Approved
- Rejected
- Failed
- Deployed

Use clear badges and labels.

Use these semantic status colors conceptually:
- Verified: green/success
- AI draft: blue or purple/info
- Placeholder: amber/warning
- Needs review: orange/warning
- Approved: green/success
- Rejected/Failed: red/danger
- Deployed: green/success
- Draft: gray/neutral

## Screens to create

Create an interactive prototype with these screens.

### 1. Dashboard

Purpose: show operator what needs attention.

Cards:
- New leads
- Qualified leads
- Proposals waiting approval
- Preview apps generated
- Deployments waiting approval
- Active customers
- Failed agent runs
- LLM gateway status

Sections:
- Recent activity timeline
- Today’s approval queue
- System health panel
- Top opportunity leads

Use realistic mock data.

### 2. Lead Inbox

Route concept: `/leads`

Show a table of discovered businesses.

Columns:
- Business name
- Business type
- City
- Website status
- Opportunity score
- Source
- Compliance status
- Recommended package
- Lead status
- Actions

Example rows:
- Ljubljana Bike Rental — Bike Rental — Ljubljana — No booking — 86 — OSM/licensed dataset — Allowed — Rental Booking Plus — Qualified
- Bistro Aurora — Restaurant — Ljubljana — Weak mobile site — 78 — licensed dataset — Allowed — Reservation Plus — New
- Urban Cuts — Salon — Maribor — Facebook only — 82 — manual import — Allowed — Booking Plus — Needs review

Actions:
- View profile
- Generate CGP
- Generate proposal
- Reject lead

Add filters:
- business type
- city
- opportunity score
- compliance status
- website status

### 3. Business Profile / CGP

Route concept: `/leads/{businessId}`

Show a single business profile.

Sections:
- Business details
- Source records
- Website audit
- Digital gaps
- Customer Growth Profile
- Recommended package
- Missing data
- Admin notes

Very important: visually separate:
- verified facts
- AI inferences
- missing data
- placeholders

Example verified facts:
- Business name
- Address
- Phone
- Source

Example AI inferences:
- likely tourist customers
- needs booking flow
- should use rental booking app pattern

Example missing data:
- opening hours
- exact rental prices
- deposit policy
- photos

### 4. Proposal Review

Route concept: `/proposals/{proposalId}`

Show generated proposal for admin approval.

Sections:
- Generated proposal text
- Suggested package
- Setup price
- Monthly price
- Generated outreach message
- Missing customer data
- Risk warnings
- Approval panel

Actions:
- Approve proposal
- Request regeneration
- Edit manually
- Reject proposal
- Generate preview app

Add warning:
“Outreach sending is disabled in MVP. Admin may copy approved text manually.”

### 5. Generated App / Preview

Route concept: `/apps/{appId}`

Show app generation status and preview approval.

Sections:
- Selected blueprint
- App pattern
- Template ID
- Generated app config
- Pages generated
- QA checklist
- Missing placeholders
- Preview URL panel
- Deployment panel

Statuses:
- Draft
- Generated
- QA passed
- Waiting approval
- Preview deployed
- Production deployed
- Failed

Actions:
- Generate preview
- Run QA
- Approve deployment
- Request changes
- Reject deployment

### 6. Business Type Wizard

Route concept: `/business-types/new`

This is for adding a new business type, such as Bike Rental.

Create a multi-step wizard:

Step 1: Business type basics
- Business type name
- Vertical ID
- Category
- Description
- Example synonyms

Step 2: App pattern selection
- Website only
- Appointment booking
- Reservation booking
- Rental booking
- Direct booking
- Membership
- Lead capture

Step 3: Required features
- catalog
- pricing
- booking form
- availability calendar
- pickup/return rules
- add-ons
- SEO
- admin approval

Step 4: Required customer inputs
- business name
- address
- phone
- email
- opening hours
- items/services
- prices
- policies
- photos

Step 5: AI rules
- allowed to generate
- must mark as placeholder
- forbidden to invent

Step 6: Campaign playbook
- launch campaign
- seasonal campaign
- group booking campaign
- partner/hotel campaign

Step 7: QA checklist
- schema exists
- registry mapping exists
- no fake prices
- no fake availability
- no fake reviews
- admin approval required

Step 8: Codex handoff
- generated files list
- files Codex may modify
- files Codex must not modify
- generated prompt preview
- Create Codex task button

Use Bike Rental as the default example.

### 7. Codex Handoff Screen

Route concept: `/business-types/{verticalId}/codex-handoff`

Show a detailed handoff package.

Sections:
- Vertical draft summary
- Files Codex will create
- Files Codex may modify
- Required tests
- Forbidden changes
- Generated Codex prompt
- Approval status

Example Codex will create:
- `blueprints/bike-rental/blueprint.yaml`
- `blueprints/bike-rental/input.schema.json`
- `blueprints/bike-rental/app_config.example.json`
- `blueprints/bike-rental/campaign_playbook.yaml`
- `blueprints/bike-rental/qa_checklist.md`

Example Codex may modify:
- `blueprints/registry.yaml`
- classifier synonym rules
- blueprint matcher tests

Example forbidden changes:
- no production deployment
- no customer data edits
- no campaign sending
- no public LLM endpoint exposure

### 8. Agent Runs

Route concept: `/agent-runs`

Show observability for all AI/agent actions.

Table columns:
- Agent name
- Related business
- Model alias
- Prompt version
- Status
- Duration
- Created at
- Actions

Detail panel:
- input summary
- output JSON
- errors
- approval status
- retry button

Agents:
- SourceComplianceAgent
- WebsiteAuditAgent
- BusinessProfilerAgent
- BlueprintMatcherAgent
- ProposalAgent
- AppSpecAgent
- QAAgent
- DeploymentAgent
- CampaignAgent

### 9. Settings / LLM Gateway

Route concept: `/settings/llm-gateway`

Show model aliases, not raw model names:
- classifier
- extractor
- profiler
- proposal_writer
- content_writer
- coder
- judge
- embedding

Show status:
- fake mode enabled
- gateway URL hidden/masked
- last health check
- request logging enabled

## Prototype interactions

Add realistic interactive behavior:

- clicking a lead opens Business Profile
- clicking “Generate proposal” opens Proposal Review
- clicking “Generate preview app” opens Generated App screen
- clicking Business Types → New opens wizard
- wizard steps are clickable
- final wizard step opens Codex Handoff screen
- approval buttons show confirmation modals
- failed agent run opens detail drawer

## Empty/loading/error states

Include examples of:
- empty lead table
- loading table skeleton
- failed agent run state
- blocked compliance state
- missing customer data warning
- production deployment requires approval warning

## Copy guidelines

Use direct operator-facing language.

Good:
- “Needs admin approval”
- “AI draft — verify before use”
- “Missing exact rental prices”
- “Production deploy disabled until QA passes”

Avoid:
- “Magic AI generated this”
- “Everything is ready automatically”
- “Send campaign now”

## Deliverable

Generate a high-quality interactive admin prototype with the screens above. Use realistic mock data and keep the interface production-oriented, clean, and easy for developers to implement in Next.js.

Do not create a marketing website. This is an internal operations/admin product.
