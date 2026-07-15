# BayBlaze Storefront

BayBlaze Storefront is the customer-facing commerce app for BayBlaze local
delivery. It presents product browsing, variant selection, cart and checkout
flows, customer account access, promo-code handling, order tracking, referral
hooks, and storefront activity tracking.

## Highlights

- Next.js, React, TypeScript, and Tailwind CSS.
- Product and variant browsing backed by BayBlaze commerce data.
- Cart, checkout, promo-code, local-delivery, and age-verification workflows.
- Customer account and OAuth routes.
- Storefront activity tracking for admin analytics.
- Public settings support for storewide price adjustments and testing toggles.

## Local Development

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Repository Notes

This frontend depends on configured BayBlaze API and commerce services for live
data and checkout behavior. Secrets and privileged backend credentials are not
stored in the browser app.
