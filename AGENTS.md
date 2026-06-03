<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Memory

When code changes are complete, automatically commit and push the changes unless
the user explicitly says not to. Use a concise commit message that reflects the
completed work.

When infrastructure, deployment, environment variables, service topology,
runner setup, or cross-repo integration details change, update the relevant
`AGENTS.md` files in the same work session so future Codex/LLM sessions inherit
the current operating model.

### IsoChronos Integration

IsoChronos lives in the sibling repository `bayblaze-isochronos`. Treat it as
BayBlaze's backend-only delivery intelligence service and not as a frontend app.

- The storefront should consume delivery intelligence from IsoChronos through
  backend/API boundaries rather than calling Google Maps APIs directly from
  browser code.
- Never expose Google Maps API keys or paid Google Maps request logic in
  storefront client components.
- Address autocomplete, geocoding, routing, live ETA, order partitioning, and
  Google Maps usage guardrails belong in IsoChronos or a backend that delegates
  to IsoChronos.
- Storefront live delivery UI should prefer IsoChronos ETA snapshots and
  interpolation-friendly data instead of triggering frequent paid route
  refreshes.
- Keep order and delivery UI display rules in the storefront domain layer, but
  keep delivery intelligence, coordinates, cache behavior, and Google Maps cost
  controls out of page components.

### Storefront Domain Model

The storefront should model business concepts explicitly instead of duplicating
display and data-shaping rules inside page components.

- The order domain lives in `src/app/domain/orders.ts`. Treat this as the
  canonical place for customer-order identity, display formatting, lifecycle
  grouping, sorting, recent-order storage, item totals, recipient display, and
  delivery-address formatting.
- `CustomerOrder` and related transport-facing types still originate in
  `src/app/lib/medusa-auth.ts` because they mirror the Medusa payload shape.
  Domain helpers should accept those Medusa-shaped order objects and expose the
  storefront meaning the UI needs.
- Order identity is represented by `getOrderReference(order)`: prefer
  `custom_display_id`, then `display_id`, then the uppercase last 8 characters
  of the Medusa id. Use `formatOrderNumber(order)` when rendering a `#...`
  label, and `getOrderTrackingHref(order)` when linking to the public tracking
  page.
- Order lifecycle grouping belongs to the domain layer. Use
  `groupOrdersByLifecycle(orders)` for dashboard pending/completed buckets,
  `isCompletedOrder(order)` for single-order checks, and
  `sortOrdersByNewest(orders)` when a plain newest-first list is needed.
- Order list reconciliation belongs to the domain layer. Use
  `mergeOrderLists(priorityOrders, fallbackOrders)` when combining fresh Medusa
  orders with a locally saved recent order so new checkout results do not
  temporarily disappear before Medusa catches up.
- Order item presentation belongs to the domain layer. Use
  `getOrderItemTitle(item)`, `getVariantLabel(item)`, and
  `getOrderItemTotal(item)` instead of recomputing labels or totals inside
  account, orders, or tracking UI components.
- Money/date/status presentation for orders belongs to the domain layer. Use
  `formatOrderTotal`, `formatOrderDate`, and `formatOrderStatus` rather than
  creating local `Intl` formatters for order UI.
- Delivery-facing order copy belongs to the domain layer. Use
  `getOrderRecipient(order)` and `formatDeliveryAddress(order)` for tracking
  and delivery summary surfaces.
- The recent checkout order session key is `RECENT_ORDER_STORAGE_KEY` from the
  order domain. Do not duplicate the string in checkout or account components.
- Customer auth-session cookie reading is centralized in
  `src/app/lib/customer-session.ts` via `getCustomerToken()`. Server pages and
  route handlers that only need the current customer token should use this
  helper instead of importing `cookies()` and `CUSTOMER_TOKEN_COOKIE` directly.
- Customer Google OAuth starts at
  `src/app/api/auth/oauth/google/start/route.ts` and returns through
  `src/app/api/auth/oauth/google/callback/route.ts`. The callback exchanges the
  Google query params with Medusa, creates a Medusa customer on first OAuth
  login when needed, refreshes the Medusa JWT so it includes the customer actor,
  and sets the same `CUSTOMER_TOKEN_COOKIE` used by email/password auth. Keep
  OAuth provider secrets and callback URL configuration in the Medusa backend;
  the storefront should only initiate and complete the server-side flow.
- App-level client providers belong in `src/app/providers.tsx`. Keep
  `src/app/layout.tsx` as a server component and wrap children through the
  provider boundary there. Add future global client contexts to `Providers`
  rather than sprinkling providers through individual routes.
- Homepage carousel configuration lives in `src/app/domain/home-carousels.ts`.
  Use `HomeCarouselDefinition<TItem>` for common carousel facts such as id,
  title, destination href, link label, items, empty text, arrow labels, slide
  width class, and Swiper class. Define concrete homepage carousels as domain
  objects there, such as `shopByCategoryCarousel` and
  `getBestSellersCarousel(products)`, rather than hard-coding these properties
  in individual homepage components.
- Homepage carousel behavior and visual shell live in
  `src/app/home/HomeCarousel.tsx`. Best Sellers and Shop by Category should use
  this shared component and only provide their item renderer card. Do not
  reimplement Swiper lifecycle state, arrow looping, header layout, link
  rendering, slide spacing, or readiness opacity separately for each carousel.
