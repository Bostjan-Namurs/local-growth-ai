# 04 — Agent System and Codex Implementation Documentation

## Purpose

This document defines the agent system in a way that a coding agent such as Codex can implement incrementally.

The system must be deterministic, auditable, and approval-based. Agents should assist operators; they should not independently scrape, contact customers, deploy production apps, or activate billing.

## Agent architecture pattern

Use this pattern:

```text
Agent input -> tools/RAG -> LLM call if needed -> schema validation -> QA/checks -> persisted output -> next state
```

Do not let agents call arbitrary tools. Each agent gets a narrow toolset.

## Shared AgentState

Core state fields:

```json
{
  "run_id": "uuid",
  "business_id": "uuid",
  "workflow": "lead_to_preview",
  "stage": "business_profile",
  "inputs": {},
  "outputs": {},
  "errors": [],
  "approvals": [],
  "source_records": [],
  "model_usage": [],
  "created_at": "timestamp"
}
```

See `examples/agents/agent_state.schema.json`.

## Agent registry

| Agent | Purpose | Model alias | Human approval |
|---|---|---|---|
| SourceComplianceAgent | Validate source/license/allowed use | classifier | for new source types |
| LeadImportAgent | Import/deduplicate lead | none/classifier | no |
| WebsiteAuditAgent | Check digital presence | extractor | no |
| BusinessProfileAgent | Generate CGP | extractor | yes before proposal use |
| BlueprintMatcherAgent | Match vertical blueprint | classifier | optional |
| ProposalAgent | Generate sales proposal | writer | yes |
| AppSpecAgent | Convert proposal to app spec | extractor/writer | yes |
| ContentAgent | Generate app content | writer | yes before customer visibility |
| CodePlannerAgent | Generate template/config plan | coder | yes before build |
| AppQAAgent | Validate preview and claims | judge | yes for failed/uncertain |
| DeploymentAgent | Deploy approved app | none/coder | yes |
| CampaignAgent | Generate campaign drafts | writer | yes before send |
| MonetizationAgent | Suggest plan/pricing | classifier/writer | yes |

## Agent 1: SourceComplianceAgent

### Objective

Determine whether the lead source can be used for the requested operation.

### Inputs

```json
{
  "source_type": "manual_import | licensed_dataset | osm_extract | google_places | website | customer_submitted",
  "source_url": "string",
  "raw_data_categories": ["business_name", "address", "phone"],
  "intended_use": "lead_generation | proposal | customer_app | marketing"
}
```

### Output

```json
{
  "allowed": true,
  "allowed_use": ["lead_generation", "proposal"],
  "disallowed_use": ["bulk_marketing_without_basis"],
  "requires_attribution": false,
  "requires_opt_out": true,
  "retention_days": 365,
  "risk_level": "low | medium | high",
  "notes": "string"
}
```

### Rules

- Google Maps scraping is not an allowed source path.
- Public Nominatim is not a bulk discovery backend.
- Sole trader/contact-person data may be personal data.
- Unknown source terms require admin review.

## Agent 2: LeadImportAgent

### Objective

Normalize and deduplicate businesses.

### Inputs

```json
{
  "name": "string",
  "address": "string",
  "phone": "string",
  "email": "string",
  "website_url": "string",
  "category": "string",
  "source_record_id": "uuid"
}
```

### Output

```json
{
  "business_id": "uuid",
  "dedupe_status": "new | existing | possible_duplicate",
  "confidence": 0.91
}
```

### Tools

- Postgres search.
- Basic fuzzy matching.
- Optional embedding search for similar business names.

## Agent 3: WebsiteAuditAgent

### Objective

Audit whether the business has a usable digital presence.

### Inputs

```json
{
  "business_id": "uuid",
  "website_url": "string",
  "business_name": "string"
}
```

### Output

```json
{
  "website_found": true,
  "website_url": "https://example.com",
  "has_https": true,
  "has_mobile_layout": true,
  "has_booking": false,
  "has_menu_or_services": true,
  "has_clear_cta": false,
  "seo_score": 54,
  "performance_score": 62,
  "issues": ["no online reservation", "weak CTA"],
  "opportunity_score_delta": 22
}
```

### Tools

- HTTP client.
- Playwright browser.
- HTML parser.
- Optional screenshot tool.
- Robots.txt checker for crawling beyond homepage.

## Agent 4: BusinessProfileAgent

### Objective

Create the Customer Growth Profile.

### Inputs

- business record,
- source records,
- website audit,
- vertical knowledge retrieved from pgvector,
- approved blueprint snippets.

### Output

```json
{
  "business_summary": "string",
  "vertical": "restaurant",
  "digital_gaps": ["no reservation system"],
  "likely_customer_segments": ["local lunch customers"],
  "recommended_package": "restaurant_reservation_plus",
  "missing_data": ["opening hours", "menu photos"],
  "claims": [
    {
      "claim": "Website has no visible online reservation system.",
      "source": "website_audit",
      "confidence": 0.88
    }
  ],
  "confidence": 0.79
}
```

### Rules

- Do not invent opening hours, menu items, photos, or staff names.
- Any uncertain claim must be marked with low confidence or missing data.

## Agent 5: BlueprintMatcherAgent

### Objective

Select the best app blueprint.

### Output

```json
{
  "blueprint_id": "restaurant_reservation_plus",
  "match_score": 0.86,
  "required_inputs_missing": ["menu_items", "opening_hours"],
  "recommended_addons": ["review_request_flow"]
}
```

## Agent 6: ProposalAgent

### Objective

Generate a sales proposal for admin review.

### Output sections

- business summary,
- observed gaps,
- recommended package,
- proposed features,
- implementation plan,
- setup/monthly pricing,
- optional add-ons,
- outreach draft,
- required customer inputs.

### Rules

- Avoid guaranteed revenue claims.
- Avoid false statements about competitors.
- Use placeholders for unknown facts.
- Include clear admin/customer approval state.

## Agent 7: AppSpecAgent

### Objective

Convert an approved proposal into a machine-readable app spec.

### Output

```json
{
  "template_id": "restaurant-pwa-v1",
  "theme": {
    "style": "modern warm minimal",
    "primary_color": "placeholder"
  },
  "pages": ["home", "menu", "reservations", "contact"],
  "features": ["digital_menu", "reservation_request", "review_link"],
  "required_customer_inputs": ["menu_items", "photos", "opening_hours"],
  "deployment_target": "preview"
}
```

## Agent 8: ContentAgent

### Objective

Generate website/app content.

### Rules

- Use business-provided facts where available.
- Use placeholders for missing facts.
- Keep content vertical-specific.
- Avoid unsupported claims like “best in the city.”

### Output

```json
{
  "hero_title": "Book your table at Example Bistro",
  "hero_subtitle": "A simple reservation experience for lunch, dinner, and special occasions.",
  "sections": [],
  "seo": {
    "title": "Example Bistro | Reservations",
    "description": "Book a table at Example Bistro."
  },
  "placeholders": ["Add real menu items", "Confirm opening hours"]
}
```

## Agent 9: CodePlannerAgent

### Objective

Prepare the build plan and generated config. It does not generate arbitrary production code in MVP.

### Output

```json
{
  "template_repo": "templates/restaurant-pwa",
  "generated_files": [
    "app.config.json",
    "content.json",
    "theme.json"
  ],
  "build_commands": ["npm ci", "npm run validate", "npm run build"],
  "validation_schema": "restaurant-pwa.schema.json"
}
```

## Agent 10: AppQAAgent

### Objective

Validate the generated preview.

### Checks

- config schema valid,
- no missing required fields,
- no unsupported claims,
- no broken links,
- no secret exposure,
- mobile render check,
- basic accessibility check,
- SEO metadata present.

### Output

```json
{
  "qa_status": "passed | failed | needs_review",
  "issues": [],
  "blocking_issues": [],
  "recommendation": "approve_preview"
}
```

## Agent 11: DeploymentAgent

### Objective

Deploy only approved preview/production apps.

### Flow

```text
approved app spec
  -> create branch/repo
  -> generate app files
  -> run validation
  -> run build
  -> create preview URL
  -> admin approval
  -> deploy production
  -> store deployment metadata
```

### Rules

- No production deployment without approval record.
- No deployment if QA has blocking issues.
- No secrets in generated app files.

## Agent 12: CampaignAgent

### Objective

Generate marketing drafts.

### Campaign outputs

```json
{
  "campaign_name": "Weekend Reservation Push",
  "goal": "increase weekend bookings",
  "channels": ["landing_page", "facebook_post", "email_draft"],
  "assets": {
    "landing_page_headline": "Reserve your weekend table",
    "social_post": "...",
    "email_subject": "..."
  },
  "approval_required": true,
  "compliance_notes": ["Check opt-out before sending email/SMS"]
}
```

## Orchestration graph

```text
START
  -> SourceComplianceAgent
  -> LeadImportAgent
  -> WebsiteAuditAgent
  -> BusinessProfileAgent
  -> BlueprintMatcherAgent
  -> ProposalAgent
  -> ADMIN_APPROVAL_PROPOSAL
  -> AppSpecAgent
  -> ContentAgent
  -> CodePlannerAgent
  -> PreviewBuild
  -> AppQAAgent
  -> ADMIN_APPROVAL_DEPLOYMENT
  -> DeploymentAgent
  -> CampaignAgent
  -> ADMIN_APPROVAL_CAMPAIGN
END
```

## Codex implementation milestones

### Milestone 1: Repository bootstrap

- Create monorepo structure.
- Add backend, worker, admin UI placeholders.
- Add migrations folder.
- Add config for LLM gateway client.

### Milestone 2: Database and API

- Implement tables from `examples/db/001_initial_schema.sql`.
- Add basic CRUD API for businesses, source records, audits, profiles, proposals.
- Add approval endpoints.

### Milestone 3: LLM gateway adapter

- Implement OpenAI-compatible client wrapper.
- Support model aliases.
- Log all requests/responses metadata.
- Add test mode with fake LLM.

### Milestone 4: Agents

- Implement `AgentProtocol`.
- Implement SourceComplianceAgent.
- Implement BusinessProfileAgent using fake LLM first.
- Implement ProposalAgent.
- Add validation tests.

### Milestone 5: App generation

- Add blueprint loader.
- Add app spec generator.
- Add config/content generator.
- Add template validation.
- Add preview build stub.

### Milestone 6: Admin UI

- Lead inbox.
- Business detail.
- Agent run viewer.
- Proposal editor.
- Approval buttons.
- Preview app link.

### Milestone 7: Deployment and campaigns

- Add deployment controller stub.
- Add campaign draft generator.
- Add approval workflow.

## Prompt governance

Every prompt must have:

- name,
- version,
- owner,
- expected input schema,
- expected output schema,
- evaluation examples,
- date updated.

Prompt versions must be stored in code or a prompt registry table.

## Agent safety rules

- Never ignore source compliance failure.
- Never fabricate facts.
- Never send messages.
- Never deploy production without approval.
- Never bypass schema validation.
- Never expose hidden system prompts to customers.
