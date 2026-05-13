# 11 — Bike Rental Vertical Example

## Goal

Add `bike_rental` as the first example of the reusable `rental_booking` app pattern.

This vertical should support businesses such as:

```text
bike rental
e-bike rental
bicycle hire
city bike rental
mountain bike rental
scooter/bike rental hybrid
```

The same app pattern can later support:

```text
scooter rental
kayak rental
ski rental
equipment rental
party equipment rental
tool rental
```

## Recommended package

```text
package_id: bike_rental_booking_plus
app_type: website_pwa
primary_goal: increase rental bookings
secondary_goals:
  - reduce phone calls
  - show clear rental options
  - support tourist customers
  - support group rentals
  - improve local SEO
```

## Pages

Recommended pages:

```text
Home
Bikes / Rental Catalog
Pricing
Booking
Routes / Local Tips
Group Rentals
FAQ
Contact
Terms / Policies
```

## Required features

```text
mobile-first website
rental catalog
pickup and return date/time form
pricing table
pickup/return instructions
add-ons
contact form
map/location section
FAQ
SEO metadata
admin approval before deploy
```

## Optional features

```text
online payment deposit
live inventory availability
multilingual content
route recommendations
hotel delivery request
group booking
partner hotel landing page
seasonal campaign landing pages
waiver upload placeholder
```

## Required customer inputs

```text
business name
address
phone
email
opening hours
bike/rental item list
pricing rules
pickup rules
return rules
cancellation policy
deposit policy
photos
brand/logo
```

## Example rental item fields

```text
name
category
description
quantity
hourly price
half-day price
daily price
weekly price
deposit amount
image
active/inactive
```

## AI content rules

AI may draft:

```text
hero copy
bike category descriptions
generic FAQ answers
SEO title and meta description
campaign copy
route page placeholders
booking confirmation text
```

AI must not invent:

```text
prices
availability
insurance terms
legal waiver text
deposit amount
safety guarantees
reviews
partnerships with hotels/tourism organizations
certifications
exact route safety claims
```

## Example generated site concept

```text
Hero:
  Explore the city by bike.
  Rent city bikes, e-bikes, and family-friendly accessories.

Primary CTA:
  Request a bike rental

Secondary CTA:
  View prices

Catalog:
  City bikes
  E-bikes
  Mountain bikes
  Kids bikes
  Add-ons: helmet, lock, child seat, basket

Booking form:
  pickup date/time
  return date/time
  bike type
  quantity
  add-ons
  customer name
  phone/email
  notes

Policy placeholders:
  [PLACEHOLDER: confirm deposit policy]
  [PLACEHOLDER: confirm cancellation policy]
  [PLACEHOLDER: confirm rental agreement / waiver]
```

## Lead scoring for bike rental

High opportunity signs:

```text
no website
only social media page
no online booking form
unclear prices
tourist-heavy location
seasonal demand
many competitors with better websites
no multilingual content
no route/trip pages
```

Lower priority signs:

```text
already has modern booking system
complex franchise/enterprise system
no reachable contact
unclear whether business is active
business only operates through a marketplace
```

## Campaign examples

### Summer tourist campaign

Goal:

```text
increase daily rentals during tourist season
```

Assets:

```text
landing page
Google/social ad copy
email/WhatsApp copy
route recommendation content
coupon placeholder
```

### E-bike weekend campaign

Goal:

```text
promote premium e-bike rentals for weekend trips
```

### Hotel partner campaign

Goal:

```text
create landing pages for hotel guests and local tourism partners
```

Important: do not claim actual hotel partnerships unless confirmed.

## QA checklist

```text
[ ] At least one rental item exists
[ ] Booking form requires pickup date/time
[ ] Booking form requires return date/time
[ ] Return time must be after pickup time
[ ] Prices are confirmed or placeholders
[ ] Deposit policy is confirmed or placeholder
[ ] Legal waiver text is placeholder unless supplied
[ ] No fake customer reviews
[ ] No fake hotel partnerships
[ ] No exact inventory availability unless integrated
[ ] Contact details exist
[ ] Mobile layout works
[ ] Admin approval required before deploy
```

## Recommended implementation mode

Start with:

```text
Mode A: Blueprint-only vertical
```

If `rental-booking-pwa` does not exist yet, create it as a reusable template, not as a bike-only template.

Do not create `bike-rental-pwa` first unless bike rental requires many unique modules.

## Files included in this bundle

```text
blueprints/bike-rental/blueprint.yaml
blueprints/bike-rental/input.schema.json
blueprints/bike-rental/app_config.example.json
blueprints/bike-rental/campaign_playbook.yaml
blueprints/bike-rental/qa_checklist.md
examples/db/002_vertical_onboarding_and_rental.sql
for-codex/ADD_BUSINESS_TYPE_PROMPT.md
for-codex/CODEX_HANDOFF_WORKFLOW.md
```
