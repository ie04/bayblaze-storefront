<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Memory

### BayBlaze Sharp Storefront UI System

The customer storefront uses a single sitewide visual language: sharp edges,
strong black borders, rectangular controls, Jost typography, BayBlaze green
action states, and minimal soft shadows.

- Treat the sharp black-border style as the source of truth for all customer UI.
- Prefer reusable classes from `src/app/globals.css`:
  - `bayblaze-sharp-card`
  - `bayblaze-sharp-card--cream`
  - `bayblaze-sharp-panel`
  - `bayblaze-sharp-panel-header`
  - `bayblaze-sharp-button`
  - `bayblaze-sharp-button--primary`
  - `bayblaze-sharp-button--dark`
  - `bayblaze-sharp-button--outline`
  - `bayblaze-sharp-input`
  - `bayblaze-sharp-badge`
  - `bayblaze-sharp-badge--green`
  - `bayblaze-sharp-divider`
  - `bayblaze-brand-wordmark`
- Do not introduce new soft/rounded design primitives for storefront UI.
- Avoid `rounded-full`, large `rounded-2xl`/`rounded-3xl` cards, pale tan borders,
  glassy cards, and soft floating shadows unless there is a specific functional
  reason such as a native browser/third-party widget constraint.
- Existing `bayblaze-soft-*` classes are compatibility shims only. New or touched
  UI should migrate toward `bayblaze-sharp-*` classes instead of expanding the
  soft system.
- Buttons, inputs, selects, chips, product cards, cart drawer surfaces, checkout
  panels, auth panels, and homepage cards should all use the sharp system.
- Preserve accessibility: visible focus states, strong contrast, readable text,
  and mobile tap targets of roughly 44px or larger.
- Do not change Medusa, cart, checkout, AgeChecker, Google Places, routing, or
  order logic merely to restyle UI. Visual refactors must preserve production
  behavior.

When code changes are complete, automatically commit and push the changes unless
the user explicitly says not to. Use a concise commit message that reflects the
completed work.

When infrastructure, deployment, environment variables, service topology,
runner setup, or cross-repo integration details change, update the relevant
`AGENTS.md` files in the same work session so future Codex/LLM sessions inherit
the current operating model.

### Internal Promo Tools

- The internal first-order promo QR generator lives at
  `src/app/internal/promo-qr/page.tsx` and is intentionally unlinked from
  customer navigation.
- Production deployments should set the server-only
  `INTERNAL_PROMO_TOOLS_TOKEN`. When configured, the generator only renders at
  `/internal/promo-qr?token=...`.
- The generated customer-facing promo link should use the canonical
  `?promo=first30` parameter from `src/app/domain/referral-offers.ts`.
- Keep QR promo URL construction in the referral offer domain helpers so the
  scanner claim flow and internal generator do not drift.

### IsoChronos Integration

IsoChronos-derived delivery intelligence now lives behind `bayblaze-api` for
storefront workflows. Treat `bayblaze-isochronos` as legacy rollback/reference
code, not an app-facing dependency.

- The storefront must consume delivery intelligence through `bayblaze-api`.
  Do not add direct storefront calls to the standalone IsoChronos service.
- Checkout address entry is the one intentional storefront-side Google Maps UI
  exception: the browser may load Places Autocomplete with
  `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY`, restricted to allowed website referrers
  and only the Maps JavaScript API / Places API.
- Raw address validation should happen server-side in the storefront checkout
  API through Google Address Validation, using a server-only key. Do not put the
  Address Validation key in client components.
- Storefront live delivery UI should prefer API-provided ETA snapshots and
  interpolation-friendly data instead of triggering frequent paid route
  refreshes.
- Public order tracking pages render live delivery maps through
  `src/app/orders/OrderLiveMap.tsx`. The client map only receives display-safe
  tracking JSON from `/api/orders/[orderId]/tracking`; server code retrieves the
  Medusa order, extracts assigned driver metadata and geocoded destination
  metadata, then calls `bayblaze-api` `POST /v1/orders/live-tracking` with
  server-only `BAYBLAZE_API_URL` and `BAYBLAZE_API_SERVICE_TOKEN`.
- Keep order and delivery UI display rules in the storefront domain layer, but
  keep delivery intelligence, routing cache behavior, and routing-related Google
  Maps spend out of page components.
- Checkout must run `bayblaze-api` pre-checkout delivery eligibility before
  triggering AgeChecker.Net or creating/finalizing a Medusa order. Rejected
  evaluations should show customer-facing coverage/inventory copy and must not
  spend an AgeChecker verification.
- Accepted or conditionally accepted routing evaluations should show the
  customer confirmation modal first. Only the `I Confirm` action should trigger
  AgeChecker.Net, and only successful AgeChecker verification should call the
  Medusa order creation route.
- The storefront signs short-lived routing evaluation checkout tokens and the
  Medusa order route verifies them when `bayblaze-api` routing is configured.
  Required server env for production routing is `BAYBLAZE_API_URL`,
  `BAYBLAZE_API_SERVICE_TOKEN`, and a signing secret via
  `ROUTING_EVALUATION_TOKEN_SECRET` or the existing verification secret
  fallback.
- Cart items sent to `bayblaze-api` routing must be normalized to variant-level
  sellable units and must carry explicit Medusa-owned `productId`, `variantId`,
  `inventoryState`, `availableQuantity`, and requested `quantity`. Do not infer
  missing inventory state or quantity in storefront code.

### Checkout Address Validation

Checkout address autocomplete and canonical address validation are owned by the
storefront checkout flow, not IsoChronos.

- The checkout page uses the Places API (New)
  `google.maps.places.PlaceAutocompleteElement` widget for customer address
  entry UX. The public browser key must be stored as
  `NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY` and restricted in Google Cloud to the
  storefront website referrers plus the Maps JavaScript API and Places API
  (New). Do not use legacy `google.maps.places.Autocomplete` unless the key is
  also intentionally authorized for the legacy Places API.
- Because `PlaceAutocompleteElement` is a Google web component rather than a
  normal Tailwind-styled `<input>`, force its checkout host element to
  `color-scheme: light` and apply the BayBlaze checkout field styling through
  `bayblaze-google-place-autocomplete`.
- The server-side Google Address Validation key must be stored as
  `GOOGLE_MAPS_ADDRESS_VALIDATION_API_KEY` and restricted to the Address
  Validation API. Do not expose it through any `NEXT_PUBLIC_*` variable.
- The checkout address validation signing secret is
  `ADDRESS_VALIDATION_TOKEN_SECRET`. Use a long random server-only value and set
  it in local `.env.local` plus the deployment environment, such as Vercel.
- `src/app/api/checkout/address/validate/route.ts` validates the delivery
  address and returns a signed checkout address token. The Medusa order route
  must verify this token before creating/finalizing an order when address
  validation is configured.
- The address-validation helper should accept address-shaped payloads, not only
  full checkout customer payloads, because Google Places selections do not
  include checkout-only fields such as delivery notes.
- `bayblaze-api` should receive already-normalized address/coordinate inputs for
  feasibility/routing. Routing modules should not own the checkout Places widget
  or raw customer address form UX.

### AgeChecker.Net Integration

The storefront enforces AgeChecker.Net before-payment checkout verification when
`NEXT_PUBLIC_AGECHECKER_KEY` or `AGECHECKER_API_KEY` is configured. Without
those env vars, checkout remains unblocked for local development and incomplete
deployments.

- The checkout UI loads the AgeChecker.Net popup from
  `https://cdn.agechecker.net/static/popup/v1/popup.js` in manual mode and
  passes the accepted UUID to `src/app/api/age-verification/route.ts`.
- The age verification API route validates accepted popup UUIDs server-side
  against `https://api.agechecker.net/v1/validate`, then mints a signed
  BayBlaze token scoped to the checkout customer details.
- `src/app/api/checkout/order/route.ts` requires that signed token before
  creating a Medusa cart/order whenever AgeChecker.Net is configured.
- Store only verification status/UUID/timestamp in Medusa cart and order
  metadata (`age_verification_provider`, `age_verification_status`,
  `age_verification_uuid`, `age_verified_at`). Do not store DOB, ID images, or
  sensitive identity document data in the storefront or Medusa metadata.
- `AGE_VERIFICATION_TOKEN_SECRET` should be a long server-only random value. If
  omitted, the storefront falls back to `EMAIL_VERIFICATION_SECRET`.
- Successful AgeChecker.Net verification should be reusable for the signed-in
  Medusa customer account so future orders on the same account/email can skip
  the AgeChecker popup and avoid repeated verification fees.
- Account-level age verification metadata should record only the minimum status
  needed for reuse, such as provider/status/UUID/timestamp/email. Do not store
  DOB, ID images, or sensitive identity document data in Medusa customer, cart,
  or order metadata.
- Checkout should still require AgeChecker for guests or for signed-in users
  whose checkout email does not match the saved verified account email.

### Inventory and Cart Availability

Embedded Medusa under `bayblaze-api/medusa` remains the source of truth for
product variants and inventory-like storefront availability metadata. The old
standalone `bayblaze-medusa` repo is retired.

- Variant metadata may arrive from Medusa as numbers or numeric strings. Normalize
  `availableQuantity` defensively, and treat `0` as a valid explicit value, not
  as missing metadata.
- Every cart item must carry Medusa-owned `productId`, `variantId`,
  `inventoryState`, `availableQuantity`, and requested `quantity` so checkout and
  `bayblaze-api` routing can verify availability at the variant level.
- Product pages should show stock status only after a customer selects a variant
  for multi-variant products. Single-variant products may show stock status
  immediately.
- `Out of Stock` means Medusa/storefront availability is actually `0`. Do not
  display `Out of Stock` merely because the shopper already added every
  available unit to their cart; use separate copy such as `Max in Cart`.
- Checkout should reject stale cart items whose inventory metadata is missing or
  unverifiable and ask the customer to re-add the product so BayBlaze can confirm
  current availability.
- Storefront code should not fake inventory state or quantity. Missing
  `inventoryState` or `availableQuantity` should be treated as a data/config
  problem that must be fixed in Medusa or the inventory app.

### Centralized BayBlaze Accounts

The customer storefront uses the universal account system provided by
`bayblaze-api`. Firebase Auth remains behind the API, but the browser and
Next.js routes should treat `bayblaze-api` account routes as the identity
boundary.

- Customer signup/login should call `bayblaze-api`
  `POST /v1/customer/auth/accounts` and `POST /v1/customer/auth/login`.
- The storefront stores the BayBlaze account session in
  `bayblaze_account_token`. It still stores the Medusa customer token in
  `bayblaze_customer_token` for commerce reads such as customer profile and
  order history.
- Account pages and checkout policy checks should require a valid BayBlaze
  account session when they are using account-owned settings.
- Account records have `customer` or `employee` badges. Storefront access uses
  the `customer` badge. Employee accounts can be granted `driver`, `inventory`,
  and/or `admin` roles in `bayblaze-admin`.
- Google OAuth must route through `bayblaze-api`, not Medusa OAuth. The
  storefront start/callback routes call `bayblaze-api`
  `/v1/customer/auth/google/start` and `/v1/customer/auth/google/callback`,
  then set both `bayblaze_account_token` and the Medusa
  `bayblaze_customer_token` returned by the API's Medusa customer-session
  bridge.
- `settings.ageVerificationDisabled` is controlled from the admin dashboard and
  allows a matching signed-in customer email to bypass AgeChecker for testing.
  Keep the final bypass check in server-side checkout order code, not only in
  client UI.

### Catalog, Categories, and Shop Data

The storefront catalog must stay Medusa-owned. Do not reintroduce static `/shop`
product arrays, stale WordPress image URLs, or product data duplicated inside page
components.

- `/shop`, `/product/[handle]`, and homepage product carousels should load
  catalog data through `src/app/lib/medusa-products.ts`. That adapter must use
  the shared `bayblaze-api` inventory bridge (`GET /v1/inventory`) with
  server-only `BAYBLAZE_API_URL` and `BAYBLAZE_API_SERVICE_TOKEN`, matching the
  inventory app's common product data boundary instead of making direct Store
  API product reads from page code.
- `NEXT_PUBLIC_MEDUSA_BACKEND_URL` remains available for public asset URL
  normalization and other storefront Store API flows, but product catalog reads
  should not depend on the browser publishable key.
- Product images shown on `/shop` should come from Medusa-owned product or
  variant image fields returned by `bayblaze-api`, not hardcoded
  `bayblaze.net/wp-content/uploads/...` URLs.
- Product images uploaded through `bayblaze-inventory` are served by Medusa at
  `/bayblaze/inventory-images/...`. Keep this path allowed in `next.config.ts`
  image `remotePatterns` for both production `api.bayblaze.net` and local
  `localhost:9000`.
- `/shop` product cards should stay compact: render category, product name,
  price, sale badge, image, and action button, but do not render long Medusa
  product descriptions in the card grid.
- Customer-facing storefront categories are intentionally limited to exactly:
  `Vapes`, `Cones & Wraps`, and `Smoking Accessories`.
- All visible product/category UI should collapse Medusa category aliases into
  one of those three buckets. For example, `Disposable Vapes` maps to `Vapes`;
  `Cones & Rolling Papers`, `Pre-Rolled Cones`, `Wraps & Papers`, and similar
  rolling terms map to `Cones & Wraps`; `Lighters`, `Accessories`, and tool/add-on
  categories map to `Smoking Accessories`.
- Homepage category carousel data lives in
  `src/app/domain/home-carousels.ts` and should use the same three category
  buckets as `/shop`.
- Product page breadcrumbs should route customers back to `/shop?q=...` for the
  canonical storefront bucket rather than old `/product-category/...` paths.
- Product-page specification rows such as puffs, capacity, and battery are
  optional Medusa product metadata. Render only metadata that is present; do not
  show placeholder spec rows or require vape-specific attributes for wraps,
  cones, accessories, or products that do not have those specs.

### Checkout Flow and UI Rules

Checkout should preserve a clear, low-friction customer sequence:

1. Validate/canonicalize the delivery address.
2. Run `bayblaze-api` pre-checkout delivery eligibility.
3. Show the delivery details confirmation modal.
4. Only after `I Confirm`, run AgeChecker if needed.
5. Only after successful age verification/reuse, create the Medusa order.

Additional UI constraints:

- The delivery confirmation modal button should not use overly wide hero-button
  letter spacing; keep `I Confirm` readable as normal button text.
- Avoid spending AgeChecker verifications before routing eligibility and customer
  delivery confirmation succeed.
- Address validation, routing, AgeChecker, and order creation should expose
  distinct loading/error copy so failures are easy to diagnose.

### PWA Install Prompt

The storefront owns a custom PWA install prompt in
`src/app/components/pwa/PwaInstallPrompt.tsx`.

- Register `/sw.js` from the app-level provider boundary, not individual pages.
- The `beforeinstallprompt` handler should call `event.preventDefault()` only
  when BayBlaze is actually going to show its own install UI. If the customer
  has dismissed the install prompt or the app is already running standalone,
  do not intercept the browser's native install flow.
- The saved `BeforeInstallPromptEvent` should only call `.prompt()` from the
  user-initiated `Add app` button click. Do not try to auto-open the install
  prompt on page load.
- Keep the iOS install path as instructional copy because iOS Safari uses the
  share-sheet Add to Home Screen flow instead of the Chromium prompt event.

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
- Customer-visible order lifecycle should use `getOrderLifecycleStatus(order)`
  from `src/app/domain/orders.ts`, not raw `order.status`, because driver
  completion/cancellation is stored in Medusa order metadata
  `bayblaze_delivery_status` and should move orders into completed/canceled
  UI buckets.
- Delivery-facing order copy belongs to the domain layer. Use
  `getOrderRecipient(order)` and `formatDeliveryAddress(order)` for tracking
  and delivery summary surfaces. Address Line 2 must persist from checkout to
  Medusa `shipping_address.address_2`; also mirror it into order metadata keys
  `address_line_2`, `delivery_address_line_2`, and `checkout_address_line_2`
  so order display and label printing can fall back when Medusa does not return
  the nested shipping-address field.
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

## June 2026 Checkout, Tracking, and Label Contracts

- Checkout Address Line 2 is a customer-entered delivery detail only. It must sit
  under the main Address field in the checkout UI, must not use Google Places,
  and must not be included in geocoding or Address Validation requests.
- Address Line 2 must still persist everywhere operationally useful:
  `shipping_address.address_2` plus order/cart metadata keys `address_line_2`,
  `checkout_address_line_2`, and `delivery_address_line_2`. Customer-facing
  order summaries and driver/label surfaces should render it when present.
- Storefront order progress should read BayBlaze delivery lifecycle metadata from
  Medusa order metadata. `bayblaze_delivery_status = "out_for_delivery"` marks
  the customer timeline's Out for delivery step active; `completed` marks
  Delivered; `cancelled`/`canceled` marks canceled.
- The customer map at `/orders/[orderId]` should treat `awaiting_assignment` as a
  resolver/data issue when the order already appears in the driver app. Debug the
  full chain: Medusa order reference -> storefront tracking route ->
  `bayblaze-api` `/v1/orders/live-tracking` -> unified Firestore
  `driver_delivery_queues`.
- Failed, ignored, or ineligible promo/discount state must not block order
  placement unless a discount was actually applied and invalidates the cart.
  Promo errors should degrade to metadata/copy, not checkout failure.
- Label-printing is operationally downstream of successful order creation. A
  print failure or unavailable label-printer agent must never fail checkout.
