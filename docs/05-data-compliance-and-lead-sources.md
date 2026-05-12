# 05 — Data Compliance and Lead Sources

## Purpose

This product depends on collecting and using business information. Production readiness requires a source compliance layer from day one.

This document is not legal advice. It is an engineering control plan that should be reviewed by legal counsel before automated outreach at scale.

## Data source principles

1. Track the source of every record.
2. Track source license and allowed use.
3. Track whether attribution is required.
4. Track whether the data contains personal data.
5. Track lawful basis/permission for marketing.
6. Provide opt-out/suppression handling.
7. Do not use disallowed sources for bulk lead generation.

## Google Maps / Google Places

Do not build the product around scraping Google Maps.

Safer options:

- Use allowed Google Maps/Places API use cases only.
- Respect attribution, storage, caching, and display rules.
- Do not export/scrape/bulk-copy Places content for separate lead products.
- Store only data you are permitted to store.
- Keep Google Places data separate from non-Google-map data when required.

## OSM / Nominatim

Do not use public Nominatim as a bulk discovery backend.

Safer options:

- Use OSM extracts with proper ODbL compliance.
- Host your own Nominatim or use a commercial geocoder when volume is needed.
- Cache appropriately.
- Provide attribution.
- Track share-alike obligations where applicable.

## Licensed datasets

Preferred for production lead discovery.

For each licensed source, store:

```json
{
  "source_name": "string",
  "license_name": "string",
  "contract_id": "string",
  "allowed_uses": ["lead_generation", "proposal_generation"],
  "disallowed_uses": [],
  "retention_days": 365,
  "attribution_required": false,
  "marketing_permission": "unknown | allowed | disallowed | requires_review"
}
```

## Customer-submitted data

Best data source for generated apps.

Use for:

- menu/service items,
- photos,
- pricing,
- opening hours,
- staff names,
- contact details,
- brand colors,
- campaign goals.

Customer-submitted facts should have highest trust.

## Public websites

Use public websites carefully:

- Respect robots.txt for crawling beyond basic page fetches.
- Do not copy large copyrighted text.
- Summarize and cite internal source references.
- Store only needed facts.
- Mark uncertain data.

## Personal data handling

Business names and company addresses may not always be personal data. However, sole-trader names, individual emails, employee names, direct phone numbers, and social profiles may be personal data.

Treat personal-data-like fields carefully:

- contact person name,
- direct email,
- mobile phone,
- sole proprietor name,
- personal social link,
- marketing engagement data.

## Marketing compliance controls

Before sending outreach or campaign messages:

- Check source allowed use.
- Check legal basis/consent status.
- Check suppression list.
- Include opt-out where required.
- Log send approval.
- Log message version.
- Do not send to opted-out contacts.

## Source records table requirements

Required fields:

- `source_type`,
- `source_url`,
- `license_name`,
- `allowed_use`,
- `attribution_required`,
- `contains_personal_data`,
- `retention_until`,
- `collected_at`,
- `raw_payload_hash`.

## Compliance states

```text
unknown
pending_review
approved
restricted
rejected
expired
```

## Engineering enforcement

- `SourceComplianceAgent` must run before lead use.
- Backend should block proposal generation for rejected sources.
- Backend should block outreach for restricted/unknown marketing status.
- Campaign send endpoints must check `suppression_list`.
- Admin UI must show source and compliance status.

## Lead source MVP recommendation

Start with:

1. manually imported leads,
2. customer referrals,
3. licensed local business datasets,
4. OSM extracts where compliant,
5. public business websites for audit only.

Avoid:

- Google Maps scraping,
- social network scraping,
- unlicensed review scraping,
- automated bulk outreach without review.
