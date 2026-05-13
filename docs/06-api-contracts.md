# 06 — API Contracts

## API principles

- Sprint 1 scaffold endpoints are mounted at the root, for example `/health`.
- Future product API endpoints may move under `/api/v1` when versioning is introduced.
- Auth required except health checks.
- Use UUID identifiers.
- Use typed status fields.
- Store generated outputs as versioned records.
- Use approvals as explicit records.

## Health

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

## Businesses

### Create/import business

```http
POST /api/v1/businesses
```

Request:

```json
{
  "name": "Example Bistro",
  "category": "restaurant",
  "address": "Example Street 1",
  "city": "Ljubljana",
  "country": "SI",
  "phone": "+386...",
  "email": null,
  "website_url": null,
  "source_record": {
    "source_type": "manual_import",
    "source_url": null,
    "license_name": "internal_manual",
    "allowed_use": ["lead_generation", "proposal_generation"],
    "contains_personal_data": false
  }
}
```

Response:

```json
{
  "business_id": "uuid",
  "dedupe_status": "new",
  "compliance_status": "approved"
}
```

### List businesses

```http
GET /api/v1/businesses?vertical=restaurant&status=qualified
```

### Get business

```http
GET /api/v1/businesses/{business_id}
```

## Website audits

### Start audit

```http
POST /api/v1/businesses/{business_id}/website-audits
```

Response:

```json
{
  "job_id": "uuid",
  "status": "queued"
}
```

### Get audit

```http
GET /api/v1/website-audits/{audit_id}
```

## Agent workflows

### Start lead-to-proposal workflow

```http
POST /api/v1/businesses/{business_id}/workflows/lead-to-proposal
```

Response:

```json
{
  "workflow_run_id": "uuid",
  "status": "queued"
}
```

### Get agent run

```http
GET /api/v1/agent-runs/{run_id}
```

### List agent runs for business

```http
GET /api/v1/businesses/{business_id}/agent-runs
```

## Customer Growth Profile

### Generate CGP

```http
POST /api/v1/businesses/{business_id}/customer-growth-profiles
```

Response:

```json
{
  "cgp_id": "uuid",
  "status": "generated",
  "approval_status": "pending"
}
```

### Approve CGP

```http
POST /api/v1/customer-growth-profiles/{cgp_id}/approve
```

Request:

```json
{
  "decision": "approved",
  "notes": "Ready for proposal."
}
```

## Proposals

### Generate proposal

```http
POST /api/v1/businesses/{business_id}/proposals
```

Request:

```json
{
  "cgp_id": "uuid",
  "pricing_model": "restaurant_reservation_plus"
}
```

### Approve proposal

```http
POST /api/v1/proposals/{proposal_id}/approve
```

## App generation

### Generate app spec

```http
POST /api/v1/proposals/{proposal_id}/app-spec
```

### Create preview

```http
POST /api/v1/generated-apps/{generated_app_id}/preview-builds
```

### Approve deployment

```http
POST /api/v1/generated-apps/{generated_app_id}/approve-deployment
```

### Deploy production

```http
POST /api/v1/generated-apps/{generated_app_id}/deploy
```

Must fail unless deployment approval exists and QA status is passed.

## Campaigns

### Generate campaign draft

```http
POST /api/v1/businesses/{business_id}/campaigns
```

Request:

```json
{
  "campaign_type": "weekend_reservation_push",
  "channels": ["landing_page", "social_post", "email_draft"],
  "goal": "increase weekend bookings"
}
```

### Approve campaign

```http
POST /api/v1/campaigns/{campaign_id}/approve
```

### Send/publish campaign

```http
POST /api/v1/campaigns/{campaign_id}/send
```

Must check:

- approval status,
- channel integration status,
- suppression list,
- legal basis/consent state.

## Approvals

Generic approval endpoint:

```http
POST /api/v1/approvals
```

Request:

```json
{
  "entity_type": "proposal",
  "entity_id": "uuid",
  "decision": "approved | rejected | needs_changes",
  "notes": "string"
}
```

## Webhooks/events

Recommended internal events:

```text
business.created
source.approved
website_audit.completed
cgp.generated
proposal.generated
proposal.approved
app_spec.generated
preview_build.completed
qa.completed
deployment.approved
deployment.completed
campaign.generated
campaign.approved
campaign.sent
```

## Error response format

```json
{
  "error": {
    "code": "SOURCE_NOT_ALLOWED",
    "message": "The selected source is not approved for this action.",
    "details": {}
  }
}
```
