# Bike Rental QA Checklist

## App config validation

- [ ] `vertical_id` is `bike_rental`.
- [ ] `template_id` is `rental-booking-pwa`.
- [ ] At least one rental item exists.
- [ ] Contact details are present or marked as placeholders.
- [ ] Opening hours are present or marked as missing data.

## Booking validation

- [ ] Pickup date/time is required.
- [ ] Return date/time is required.
- [ ] Return date/time must be after pickup date/time.
- [ ] Quantity must be positive.
- [ ] Customer name and contact are required.

## Content validation

- [ ] No invented prices.
- [ ] No invented live availability.
- [ ] No invented reviews.
- [ ] No invented hotel/tourism partnerships.
- [ ] No legal waiver text unless supplied by customer/admin.
- [ ] No insurance claims unless supplied by customer/admin.
- [ ] No safety guarantees.
- [ ] Deposit and cancellation policy are confirmed or placeholders.

## Deployment validation

- [ ] Preview app builds successfully.
- [ ] Mobile layout is usable.
- [ ] SEO title and meta description exist.
- [ ] Admin approval exists before production deployment.
- [ ] Audit log contains blueprint version and app config version.
