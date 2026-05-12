# 01 — Product Documentation

## Product name

**LocalGrowth AI**

## One-line description

LocalGrowth AI discovers underserved local businesses, generates a source-backed growth profile, proposes a ready-made digital solution, builds a template-based website/app/reservation system, deploys it after approval, and generates marketing campaigns for ongoing growth.

## Product thesis

Small local businesses need websites, booking flows, mobile-friendly customer experiences, review funnels, and simple campaigns. Most do not need a custom software agency project. They need a fast, affordable, vertical-specific package.

The platform should therefore not behave like a general “AI website generator.” It should behave like a **vertical growth automation platform**:

```text
Find business -> qualify opportunity -> generate profile -> match blueprint -> generate proposal -> preview app -> approve -> deploy -> campaign -> monetize
```

## Target customers

### Primary customers

- Restaurants and cafés.
- Salons and barbers.
- Small hotels, apartments, and local accommodation providers.
- Local service businesses with appointment needs.

### Internal users

- Platform admin.
- Sales operator.
- Template/app operator.
- Campaign operator.
- Support operator.

### External users

- Business owner.
- Business staff member managing bookings/content.
- End customer using generated app/site.

## Core product modules

### 1. Lead discovery and qualification

Discovers or imports businesses from compliant sources, deduplicates records, classifies verticals, checks whether they have an adequate digital presence, and calculates an opportunity score.

Output:

```json
{
  "business_id": "uuid",
  "business_name": "Example Bistro",
  "vertical": "restaurant",
  "website_status": "missing_or_weak",
  "opportunity_score": 83,
  "recommended_package": "restaurant_reservation_plus",
  "source_compliance_status": "approved"
}
```

### 2. Customer Growth Profile — CGP

A structured profile that explains what the business likely needs and what data is missing.

Example sections:

- business summary,
- digital gaps,
- likely customer segments,
- recommended app package,
- missing facts,
- proof/source references,
- confidence score.

### 3. Proposal generator

Generates a proposal for the business owner.

Proposal includes:

- current situation,
- recommended solution,
- features,
- setup fee,
- monthly plan,
- optional add-ons,
- preview app/mockup link,
- outreach draft,
- next-step call-to-action.

### 4. Blueprint-based app generator

Builds from approved vertical blueprints.

A blueprint defines:

- pages,
- features,
- required business data,
- optional integrations,
- design style constraints,
- SEO schema,
- campaign templates,
- generated app config schema.

The LLM should generate app configuration and content, not unrestricted production code.

### 5. Admin approval system

Human approval is required before:

- sending outreach,
- generating customer-facing claims,
- deploying production apps,
- activating billing,
- sending campaigns,
- changing customer subscription plan.

### 6. Campaign generator

Generates marketing campaign kits for business acquisition and for the business’s own customers.

Channels:

- email,
- WhatsApp/SMS draft,
- Facebook/Instagram post,
- landing page,
- Google/social ad copy,
- review request flow,
- seasonal campaign.

Sending/publishing must remain approval-based in the MVP.

### 7. Monetization and subscription management

Revenue streams:

- setup fee,
- monthly hosting/support fee,
- booking/CRM module fee,
- campaign package fee,
- transaction fee,
- white-label/reseller plan.

## Recommended MVP verticals

Start with **restaurants/cafés** and **salons/barbers**.

### Why restaurants/cafés

- Easy to understand digital gaps.
- Clear value from digital menu, reservations, offers, reviews, and mobile website.
- Strong campaign use cases.

### Why salons/barbers

- Strong booking need.
- Repeat-customer reminders.
- Staff/service/pricing pages are template-friendly.
- Campaigns are easy to package.

## Product packages

### Restaurant Basic

- Mobile website.
- Menu page.
- Opening hours.
- Location/contact.
- WhatsApp/contact button.
- Basic SEO metadata.
- Review links.

Suggested price:

- setup: EUR 299–699,
- monthly: EUR 49–99.

### Restaurant Reservation Plus

- Everything in Basic.
- Reservation flow.
- Admin booking list.
- Email confirmation.
- Review request flow.
- Campaign landing page.

Suggested price:

- setup: EUR 699–1,499,
- monthly: EUR 129–299.

### Salon Booking Plus

- Mobile website.
- Services/pricing.
- Staff profiles.
- Appointment booking.
- Reminder templates.
- First-visit campaign.

Suggested price:

- setup: EUR 499–1,299,
- monthly: EUR 99–249.

### Growth Package

- Monthly campaign generation.
- Landing pages.
- Social posts.
- Email/WhatsApp drafts.
- Analytics report.
- Conversion recommendations.

Suggested price:

- monthly: EUR 249–799 plus ad spend.

## User journey

### Internal sales/operator journey

1. Choose city and vertical.
2. Import/discover leads from allowed sources.
3. Review qualified lead list.
4. Open a business profile.
5. Generate CGP.
6. Generate proposal.
7. Generate preview app.
8. Approve outreach message.
9. Contact business manually or through approved campaign system.
10. Convert lead to customer.
11. Approve production deployment.
12. Activate subscription.
13. Generate monthly campaigns.

### Business owner journey

1. Receives personalized audit/proposal.
2. Opens preview website/app.
3. Confirms missing business facts.
4. Chooses package.
5. Approves content and launch.
6. Receives live website/app.
7. Receives monthly campaign suggestions.

### End customer journey

1. Visits generated website/app.
2. Views services/menu/gallery.
3. Makes reservation/booking/contact request.
4. Receives confirmation.
5. Receives follow-up/review request where legally allowed.

## Success metrics

### Lead quality

- qualified leads per source,
- opportunity score accuracy,
- percentage with missing/weak website,
- percentage reachable,
- conversion rate by vertical.

### Proposal quality

- admin approval rate,
- customer response rate,
- demo open rate,
- proposal-to-sale conversion rate.

### App generation quality

- preview generation success rate,
- time to preview,
- QA pass rate,
- number of manual edits per app,
- deployment success rate.

### Business outcomes

- bookings generated,
- form submissions,
- conversion rate,
- review requests sent,
- customer retention.

### Platform economics

- setup revenue,
- monthly recurring revenue,
- campaign revenue,
- churn,
- customer acquisition cost,
- gross margin.

## MVP scope

### Build now

- Lead import from compliant/manual sources.
- Source metadata and compliance state.
- Website detection/audit.
- Opportunity scoring.
- CGP generation.
- Proposal generation.
- Two vertical blueprints.
- Template-based preview generator.
- Admin approval dashboard.
- Local LLM gateway integration.
- Supabase/pgvector storage.
- Manual outreach workflow.

### Post-MVP

- Automated source integrations.
- Multi-language content generation.
- Customer self-service onboarding.
- Live booking payments.
- Automated campaign scheduling.
- White-label agency portal.
- Multi-tenant customer admin.

### Avoid in MVP

- Fully autonomous web crawling at scale.
- Google Maps scraping.
- Fully autonomous customer outreach.
- Fully autonomous production deployments.
- Native mobile apps.
- Too many business verticals.
- General-purpose website generation.

## Product risks

| Risk | Mitigation |
|---|---|
| Source/legal risk | Source compliance records, licensed sources, manual review, no Google Maps scraping default. |
| Hallucinated claims | Source-backed facts only; placeholders for unknowns. |
| Broken generated apps | Template-first generation and schema validation. |
| Low sales conversion | Use personalized audit + preview app, not generic pitch. |
| Overcomplex agent system | Start with deterministic workflow and small specialized agents. |
| LLM cost/latency | Local LLM gateway, small models for classification/extraction, larger models only when needed. |
| Customer churn | Provide monthly campaign/report value, not only hosting. |
