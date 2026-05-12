# 09 — Adding Business Types with Blueprints

## Purpose

This document explains how LocalGrowth AI should support more business types without creating fragile one-off apps. The correct model is a **blueprint-driven vertical system**.

A new business type is added as a structured vertical module containing:

```text
blueprint
input schema
app config example
template mapping
agent matching rules
campaign playbook
QA checklist
tests
pgvector/RAG document records
```

The AI and Codex do not truly "learn" the business type in the training sense. They read and follow the blueprint, schemas, examples, repository instructions, and tests.

## Two different meanings of "add a business"

### 1. Add a new customer business

Example: add a new restaurant customer, salon customer, or bike rental customer after the vertical already exists.

This should be handled from the admin UI only:

```text
Admin creates customer
  -> selects existing business type
  -> fills or imports business data
  -> system generates CGP
  -> system generates proposal
  -> system generates app config
  -> admin approves preview
  -> deploy
```

Codex is normally **not needed** for this case.

### 2. Add a new business type / vertical

Example: add `bike_rental` when the platform only supports restaurants and salons.

This requires vertical onboarding:

```text
Admin starts vertical wizard
  -> chooses app pattern
  -> defines required data
  -> defines pages/features
  -> defines AI rules
  -> defines QA checks
  -> approves vertical draft
  -> submits controlled Codex task
  -> Codex prepares repo changes and tests
  -> human reviews PR
  -> vertical becomes active
```

Codex is useful here because it can update repository files, schemas, tests, docs, and template support.

## App patterns

Business types should map to reusable app patterns.

| App pattern | Example verticals | Main modules |
|---|---|---|
| `reservation_booking` | restaurant, event venue | reservations, opening hours, guest count, menu/services |
| `appointment_booking` | salon, barber, spa, clinic | services, staff, time slots, reminders |
| `rental_booking` | bike rental, ski rental, kayak rental, scooter rental | inventory, pickup, return, add-ons, deposit |
| `direct_booking` | hotel, apartment, tour operator | availability, rooms/packages, payment request |
| `service_quote` | cleaning, repair, landscaping | service areas, quote form, photos, job details |
| `membership` | gym, club, studio | memberships, classes, subscriptions |
| `catalog_contact` | small shop, showroom | product/service catalog, inquiry form |

The goal is to avoid one custom app for every business type.

## Vertical module structure

Recommended structure:

```text
examples/blueprints/<vertical-id>/
  blueprint.yaml
  input.schema.json
  app_config.example.json
  campaign_playbook.yaml
  qa_checklist.md
```

The production repository can place these under `blueprints/<vertical-id>/` instead of `examples/blueprints/<vertical-id>/`.

## Blueprint fields

A complete blueprint should include:

```yaml
id: bike_rental
name: Bike Rental
version: 1.0.0
status: draft | active | deprecated
app_pattern: rental_booking
default_template: rental-booking-pwa

business_problem:
  summary: ...
  common_gaps: []

recommended_solution:
  package_id: ...
  app_type: website_pwa
  primary_goal: ...

pages: []
features:
  required: []
  optional: []

data_requirements:
  required: []
  optional: []

ai_generation_rules:
  allowed_to_generate: []
  must_mark_as_placeholder: []
  forbidden: []

qa_checks: []
```

## Vertical registry

Every vertical must be registered:

```yaml
verticals:
  bike_rental:
    name: Bike Rental
    app_pattern: rental_booking
    template_id: rental-booking-pwa
    status: draft
    reusable_for:
      - scooter_rental
      - kayak_rental
      - ski_rental
```

The registry lets the platform classify leads and choose the correct blueprint.

## Classification and synonyms

Each vertical should have synonyms:

```yaml
bike_rental:
  keywords:
    - bike rental
    - bicycle rental
    - bicycle hire
    - e-bike rental
    - rent a bike
    - bike hire
```

The lead classifier should map these terms to `bike_rental` and then to the `rental_booking` app pattern.

## Data requirements

The input schema defines what the system needs from the business owner or admin.

For bike rental, required data may include:

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
```

Unknown values should stay as placeholders.

## Do-not-invent rules

Every vertical must define data the AI is not allowed to invent.

For bike rental:

```text
prices
inventory availability
legal waiver text
insurance terms
deposit amount
customer reviews
hotel partnerships
safety guarantees
certifications
```

## When a new template is needed

Use an existing template if possible.

Good:

```text
bike_rental -> rental_booking -> rental-booking-pwa
scooter_rental -> rental_booking -> rental-booking-pwa
kayak_rental -> rental_booking -> rental-booking-pwa
```

Create a new template only when the vertical needs modules that cannot be represented by existing patterns.

Examples requiring custom template work:

```text
multi-location inventory
real-time availability calendar
maintenance tracking
complex waivers
fleet sizing logic
customer membership portal
```

## Vertical maturity states

Use explicit states:

```text
draft
admin_review
codex_ready
implementation_in_progress
pr_open
testing
approved
active
deprecated
```

Only `active` verticals should be available for automated lead matching and app generation.

## Blueprint ingestion into pgvector

After a vertical is approved and merged, index the blueprint into the vector store:

```text
blueprint.yaml
README/explanation
campaign playbook
QA checklist
example app config
approved examples
```

Store metadata:

```json
{
  "document_type": "vertical_blueprint",
  "vertical_id": "bike_rental",
  "version": "1.0.0",
  "status": "active"
}
```

The agents then retrieve the blueprint during CGP, proposal, app config, and campaign generation.

## Checklist for adding any new business type

```text
[ ] Define vertical ID
[ ] Decide if this is a new customer or new vertical
[ ] Choose app pattern
[ ] Reuse existing template if possible
[ ] Create blueprint.yaml
[ ] Create input.schema.json
[ ] Create app_config.example.json
[ ] Create campaign_playbook.yaml
[ ] Create qa_checklist.md
[ ] Register vertical
[ ] Add classifier synonyms
[ ] Add blueprint matcher rules
[ ] Add missing-data rules
[ ] Add do-not-invent rules
[ ] Add reusable database module if needed
[ ] Add tests
[ ] Run one fake customer example
[ ] Generate preview app
[ ] Admin/developer reviews
[ ] Merge and activate
[ ] Embed blueprint into pgvector
```
