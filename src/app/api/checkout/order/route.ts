import {
  getBayBlazeAccountFromSession,
  getCustomerToken,
} from "@/app/lib/customer-session";
import {
  getBayBlazeAccountToken,
  previewBayBlazeDiscountCode,
} from "@/app/lib/bayblaze-account";
import { verifyCheckoutAddressValidation } from "@/app/domain/address-validation";
import {
  formatScheduledDelivery,
  type ValidDeliveryTiming,
  validateDeliveryTiming,
} from "@/app/domain/delivery-scheduling";
import {
  getReusableAgeVerificationMetadata,
  normalizeAgeVerificationCustomer,
} from "@/app/domain/age-verification";
import { normalizePreCheckoutRoutingItems } from "@/app/domain/pre-checkout-routing";
import {
  getReferralOfferDiscountAmount,
  getReferralOfferFromCookieHeader,
  getReferralOfferOrderMetadata,
  getReferralOfferTotal,
} from "@/app/domain/referral-offers";
import {
  getCheckoutPromoDiscountAmount,
  getCheckoutPromoMetadata,
  moneyToCents,
  normalizeCheckoutPromoCode,
  type CheckoutPromoCodePreview,
} from "@/app/domain/checkout-promo-codes";
import { verifyCheckoutAgeVerification } from "@/app/lib/age-verification-token";
import { verifyCheckoutRoutingEvaluation } from "@/app/lib/pre-checkout-routing-token";

type CheckoutItem = {
  id?: string;
  availableQuantity?: number;
  variantId?: string;
  productId?: string;
  productHandle?: string;
  inventoryState?: string;
  image?: string;
  name?: string;
  price?: string;
  flavor?: string;
  quantity?: number;
};

type ValidCheckoutItem = CheckoutItem & {
  variantId: string;
  quantity: number;
  name: string;
};

type CheckoutCustomer = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
};

type CheckoutRequestBody = {
  address_validation?: {
    token?: unknown;
  };
  age_verification?: {
    token?: unknown;
  };
  customer?: CheckoutCustomer;
  delivery?: {
    checkout_opened_at?: unknown;
    mode?: unknown;
    scheduled_at?: unknown;
  };
  items?: CheckoutItem[];
  promo?: {
    code?: unknown;
  };
  routing?: {
    token?: unknown;
  };
};

type MedusaCustomer = {
  id: string;
  email?: string | null;
  metadata?: Record<string, unknown> | null;
};

type MedusaCustomerResponse = {
  customer: MedusaCustomer;
};

type MedusaCart = {
  id: string;
  email?: string;
  region_id?: string;
  currency_code?: string;
  shipping_address?: {
    first_name?: string | null;
    last_name?: string | null;
    address_1?: string | null;
    address_2?: string | null;
    city?: string | null;
    province?: string | null;
    postal_code?: string | null;
    country_code?: string | null;
    phone?: string | null;
  } | null;
  payment_collection?: {
    id: string;
  } | null;
};

type MedusaOrder = {
  id: string;
  display_id?: number;
  custom_display_id?: string;
  email?: string;
  metadata?: Record<string, unknown> | null;
  shipping_address?: MedusaCart["shipping_address"];
};

type MedusaShippingOption = {
  id: string;
  name?: string;
};

type MedusaPaymentProvider = {
  id: string;
  is_enabled?: boolean;
};

type MedusaPaymentCollection = {
  id: string;
};

type MedusaCompleteCartResponse =
  | {
      type: "order";
      order: MedusaOrder;
    }
  | {
      type: "cart";
      cart: MedusaCart;
      error?: {
        message?: string;
        name?: string;
        type?: string;
      };
    };

const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:9000";

const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const defaultRegionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID;
const preferredShippingOptionId =
  process.env.MEDUSA_SHIPPING_OPTION_ID ??
  process.env.NEXT_PUBLIC_MEDUSA_SHIPPING_OPTION_ID;
const preferredPaymentProviderId =
  process.env.MEDUSA_PAYMENT_PROVIDER_ID ??
  process.env.NEXT_PUBLIC_MEDUSA_PAYMENT_PROVIDER_ID;

export async function POST(request: Request) {
  let body: CheckoutRequestBody;

  try {
    body = (await request.json()) as CheckoutRequestBody;
  } catch {
    return jsonError("Invalid checkout request.", 400);
  }

  const validationError = validateCheckout(body);

  if (validationError) {
    return jsonError(validationError, 400);
  }

  const deliveryTiming = validateDeliveryTiming(body.delivery);

  if ("error" in deliveryTiming) {
    return jsonError(deliveryTiming.error, 400);
  }

  const customer = body.customer as Required<CheckoutCustomer>;
  const items = body.items as ValidCheckoutItem[];
  const normalizedRoutingItems = normalizePreCheckoutRoutingItems(body.items);

  if ("error" in normalizedRoutingItems) {
    return jsonError(
      normalizedRoutingItems.error ?? "Invalid checkout inventory.",
      400,
    );
  }

  const routingItems = normalizedRoutingItems.items;
  const routingEvaluation = verifyCheckoutRoutingEvaluation(body.routing, {
    customer,
    delivery: body.delivery,
    items: routingItems,
  });

  if (routingEvaluation.error) {
    return jsonError(routingEvaluation.error, 403);
  }

  const customerToken = await getCustomerToken();
  const [bayBlazeAccountToken, bayBlazeAccount, accountCustomer] = await Promise.all([
    getBayBlazeAccountToken(),
    getBayBlazeAccountFromSession(),
    customerToken ? retrieveAuthenticatedCustomer(customerToken).catch(() => null) : null,
  ]);
  const authenticatedCustomerToken = accountCustomer ? customerToken : undefined;
  const cachedAgeVerification = getAccountAgeVerificationMetadata(
    accountCustomer,
    customer,
  );
  const addressValidation = verifyCheckoutAddressValidation(
    body.address_validation,
    customer,
  );

  if (addressValidation.error) {
    return jsonError(addressValidation.error, 403);
  }

  const accountAgeVerificationBypass = getAccountAgeVerificationBypassMetadata(
    bayBlazeAccount,
    customer,
  );
  const ageVerification = accountAgeVerificationBypass
    ? {
        error: undefined,
        metadata: accountAgeVerificationBypass,
      }
    : verifyCheckoutAgeVerification(
        body.age_verification,
        customer,
        cachedAgeVerification,
      );

  if (ageVerification.error) {
    return jsonError(ageVerification.error, 403);
  }

  const deliveryMetadata = getDeliveryMetadata(deliveryTiming);
  const referralOffer = getReferralOfferFromCookieHeader(
    request.headers.get("cookie"),
  );
  const hasPriorOrders = authenticatedCustomerToken
    ? await customerHasExistingOrders(authenticatedCustomerToken)
    : false;
  const appliedReferralOffer = referralOffer && !hasPriorOrders ? referralOffer : null;

  const discountSubtotal = getCheckoutItemsSubtotal(items);
  const requestedPromoCode = normalizeCheckoutPromoCode(body.promo?.code);
  const firstOrderDiscount = getReferralOfferDiscountAmount(
    discountSubtotal,
    appliedReferralOffer,
  );
  let appliedPromo: CheckoutPromoCodePreview | null = null;

  if (requestedPromoCode) {
    const appliedPromoResult = await getAppliedCheckoutPromo({
      accountToken: bayBlazeAccountToken,
      code: requestedPromoCode,
      subtotal: discountSubtotal,
    }).catch((error: unknown) => error);

    if (appliedPromoResult instanceof CheckoutPromoError) {
      return jsonError(appliedPromoResult.message, appliedPromoResult.status);
    }

    if (appliedPromoResult instanceof Error) {
      return jsonError(appliedPromoResult.message, 400);
    }

    appliedPromo = appliedPromoResult as CheckoutPromoCodePreview;
  }
  const checkoutPromoDiscount = getCheckoutPromoDiscountAmount(
    discountSubtotal,
    appliedPromo,
  );
  const totalAfterDiscounts = roundMoney(
    Math.max(0, discountSubtotal - firstOrderDiscount - checkoutPromoDiscount),
  );
  const referralOfferMetadata = {
    ...getIgnoredReferralOfferMetadata({
      hasPriorOrders,
      offer: referralOffer,
    }),
    ...getReferralOfferOrderMetadata({
      discountAmount: firstOrderDiscount,
      offer: appliedReferralOffer,
      subtotal: discountSubtotal,
      totalAfterDiscount: getReferralOfferTotal(discountSubtotal, appliedReferralOffer),
    }),
  };
  const checkoutPromoMetadata = getCheckoutPromoMetadata({
    discountAmount: checkoutPromoDiscount,
    promo: appliedPromo,
    subtotal: discountSubtotal,
    totalAfterDiscount: totalAfterDiscounts,
  });
  const addressLine2 = normalizeOptionalString(customer.address_line_2);
  const addressLine2Metadata = addressLine2
    ? {
        address_line_2: addressLine2,
        checkout_address_line_2: addressLine2,
        delivery_address_line_2: addressLine2,
      }
    : {};
  const orderMetadata = {
    ...routingEvaluation.metadata,
    ...addressValidation.metadata,
    ...ageVerification.metadata,
    ...deliveryMetadata,
    ...referralOfferMetadata,
    ...checkoutPromoMetadata,
    ...addressLine2Metadata,
    delivery_address_1: customer.address.trim(),
    delivery_address_2: addressLine2 || undefined,
    delivery_city: customer.city.trim(),
    delivery_state: customer.state.trim(),
    delivery_postal_code: customer.zip.trim(),
    delivery_country_code: "us",
  };
  const shippingAddress = {
    first_name: customer.first_name.trim(),
    last_name: customer.last_name.trim(),
    address_1: customer.address.trim(),
    address_2: addressLine2 || null,
    city: customer.city.trim(),
    province: customer.state.trim(),
    postal_code: customer.zip.trim(),
    country_code: "us",
    phone: customer.phone.trim(),
  };

  try {
    const { cart } = await medusaStoreRequest<{ cart: MedusaCart }>(
      "/store/carts",
      {
        method: "POST",
        body: {
          region_id: defaultRegionId,
          email: customer.email.trim(),
          shipping_address: shippingAddress,
          metadata: {
            ...orderMetadata,
            source: "bayblaze-storefront",
          },
        },
      },
      authenticatedCustomerToken,
    );
    let activeCart = cart;

    if (authenticatedCustomerToken) {
      const { cart: customerCart } = await medusaStoreRequest<{
        cart: MedusaCart;
      }>(
        `/store/carts/${cart.id}/customer`,
        {
          method: "POST",
          body: {},
        },
        authenticatedCustomerToken,
      );

      activeCart = customerCart;
    }

    for (const item of items) {
      await medusaStoreRequest<{ cart: MedusaCart }>(
        `/store/carts/${activeCart.id}/line-items`,
        {
          method: "POST",
          body: {
            variant_id: item.variantId,
            quantity: item.quantity,
          },
        },
        authenticatedCustomerToken,
      );
    }

    const { cart: addressedCart } = await medusaStoreRequest<{
      cart: MedusaCart;
    }>(
      `/store/carts/${activeCart.id}`,
      {
        method: "POST",
        body: {
          email: customer.email.trim(),
          shipping_address: shippingAddress,
          metadata: {
            ...orderMetadata,
            source: "bayblaze-storefront",
            payment_note: "Payment due on delivery",
            checkout_notes: customer.notes,
            requested_items: items.map((item) => ({
              name: item.name,
              flavor: item.flavor,
              quantity: item.quantity,
              total_cents: getCheckoutItemTotalCents(item),
              unit_price_cents: getCheckoutItemUnitPriceCents(item),
              product_handle: item.productHandle,
              product_id: item.productId,
              variant_id: item.variantId,
              inventory_state: item.inventoryState,
              available_quantity: item.availableQuantity,
            })),
          },
        },
      },
      authenticatedCustomerToken,
    );

    if (!hasRequiredShippingAddress(addressedCart.shipping_address)) {
      return jsonError(
        "Medusa did not save the delivery address. Please review the address and try again.",
        502,
      );
    }

    const shippingOption = await selectShippingOption(
      addressedCart.id,
      authenticatedCustomerToken,
    );

    await medusaStoreRequest<{ cart: MedusaCart }>(
      `/store/carts/${addressedCart.id}/shipping-methods`,
      {
        method: "POST",
        body: {
          option_id: shippingOption.id,
          data: {},
        },
      },
      authenticatedCustomerToken,
    );

    const paymentProvider = await selectPaymentProvider(addressedCart, authenticatedCustomerToken);
    const paymentCollection = await createPaymentCollection(
      addressedCart,
      authenticatedCustomerToken,
    );

    await medusaStoreRequest<{ payment_collection: MedusaPaymentCollection }>(
      `/store/payment-collections/${paymentCollection.id}/payment-sessions`,
      {
        method: "POST",
        body: {
          provider_id: paymentProvider.id,
          data: {},
        },
      },
      authenticatedCustomerToken,
    );

    const completedCart = await medusaStoreRequest<MedusaCompleteCartResponse>(
      `/store/carts/${addressedCart.id}/complete`,
      {
        method: "POST",
      },
      authenticatedCustomerToken,
    );

    if (completedCart.type === "cart") {
      return jsonError(
        completedCart.error?.message ??
          "Medusa could not complete this cart. Please review the order details and try again.",
        422,
      );
    }

    return Response.json({
      order: {
        ...completedCart.order,
        shipping_address: completedCart.order.shipping_address ?? shippingAddress,
        metadata: {
          ...completedCart.order.metadata,
          ...orderMetadata,
        },
      },
      message: "Order placed.",
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 502);
  }
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getIgnoredReferralOfferMetadata({
  hasPriorOrders,
  offer,
}: {
  hasPriorOrders: boolean;
  offer: ReturnType<typeof getReferralOfferFromCookieHeader>;
}) {
  if (!offer || !hasPriorOrders) {
    return {};
  }

  return {
    first_order_offer_code: offer.code,
    first_order_offer_discount_percent: offer.discountPercent,
    first_order_offer_source: offer.source,
    first_order_offer_status: "ignored_prior_order",
  };
}

function getDeliveryMetadata(deliveryTiming: ValidDeliveryTiming) {
  if (deliveryTiming.mode === "now") {
    return {
      delivery_mode: "order_now",
    };
  }

  return {
    delivery_mode: "scheduled",
    scheduled_delivery_at: deliveryTiming.scheduledAt.toISOString(),
    scheduled_delivery_display: formatScheduledDelivery(
      deliveryTiming.scheduledAt,
    ),
  };
}

function validateCheckout(body: CheckoutRequestBody) {
  const customer = body.customer;
  const items = body.items;

  if (!items?.length) {
    return "Add at least one product to your cart before placing an order.";
  }

  const missingVariant = items.find((item) => !item.variantId);

  if (missingVariant) {
    return `Please re-add ${missingVariant.name ?? "the products"} to your cart before checking out.`;
  }

  const invalidQuantity = items.find((item) => {
    return !Number.isInteger(item.quantity) || Number(item.quantity) < 1;
  });

  if (invalidQuantity) {
    return "Cart item quantities must be whole numbers greater than zero.";
  }

  const requiredFields: (keyof CheckoutCustomer)[] = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "address",
    "city",
    "state",
    "zip",
  ];

  const missingField = requiredFields.find((field) => {
    const value = customer?.[field];
    return typeof value !== "string" || !value.trim();
  });

  if (missingField) {
    return "Please fill out all required checkout fields.";
  }

  return "";
}

function hasRequiredShippingAddress(
  address: MedusaCart["shipping_address"],
) {
  if (!address) {
    return false;
  }

  return [
    address.first_name,
    address.last_name,
    address.address_1,
    address.city,
    address.province,
    address.postal_code,
    address.country_code,
    address.phone,
  ].every((value) => typeof value === "string" && value.trim());
}

async function selectShippingOption(cartId: string, customerToken?: string) {
  const params = new URLSearchParams({ cart_id: cartId });
  const { shipping_options: shippingOptions } = await medusaStoreRequest<{
    shipping_options: MedusaShippingOption[];
  }>(`/store/shipping-options?${params.toString()}`, {}, customerToken);

  if (!shippingOptions.length) {
    throw new Error(
      "No Medusa shipping options are available for this cart. Configure a shipping option for the cart region.",
    );
  }

  return (
    shippingOptions.find((option) => option.id === preferredShippingOptionId) ??
    shippingOptions[0]
  );
}

async function selectPaymentProvider(cart: MedusaCart, customerToken?: string) {
  const params = new URLSearchParams();

  if (cart.region_id ?? defaultRegionId) {
    params.set("region_id", cart.region_id ?? (defaultRegionId as string));
  } else {
    params.set("cart_id", cart.id);
  }

  const { payment_providers: paymentProviders } = await medusaStoreRequest<{
    payment_providers: MedusaPaymentProvider[];
  }>(`/store/payment-providers?${params.toString()}`, {}, customerToken);
  const enabledPaymentProviders = paymentProviders.filter((provider) => {
    return provider.is_enabled !== false;
  });

  if (!enabledPaymentProviders.length) {
    throw new Error(
      "No Medusa payment providers are available for this cart. Configure the Manual System Payment Provider for pay-on-delivery checkout.",
    );
  }

  return (
    enabledPaymentProviders.find(
      (provider) => provider.id === preferredPaymentProviderId,
    ) ??
    enabledPaymentProviders.find((provider) =>
      provider.id.startsWith("pp_system_default"),
    ) ??
    enabledPaymentProviders[0]
  );
}

async function createPaymentCollection(
  cart: MedusaCart,
  customerToken?: string,
) {
  if (cart.payment_collection) {
    return cart.payment_collection;
  }

  const { payment_collection: paymentCollection } =
    await medusaStoreRequest<{
      payment_collection: MedusaPaymentCollection;
    }>(
      "/store/payment-collections",
      {
        method: "POST",
        body: {
          cart_id: cart.id,
        },
      },
      customerToken,
    );

  return paymentCollection;
}

async function retrieveAuthenticatedCustomer(customerToken: string) {
  const { customer } = await medusaStoreRequest<MedusaCustomerResponse>(
    "/store/customers/me",
    {},
    customerToken,
  );

  return customer;
}

async function getAppliedCheckoutPromo({
  accountToken,
  code,
  subtotal,
}: {
  accountToken?: string;
  code: string;
  subtotal: number;
}): Promise<CheckoutPromoCodePreview> {
  if (!accountToken) {
    throw new CheckoutPromoError(401, "Sign in or register to lock in this discount.");
  }

  try {
    return await previewBayBlazeDiscountCode(accountToken, {
      code,
      subtotalCents: moneyToCents(subtotal),
    });
  } catch (error) {
    throw new CheckoutPromoError(
      400,
      error instanceof Error
        ? error.message
        : "That promo code could not be applied.",
    );
  }
}

function getAccountAgeVerificationMetadata(
  accountCustomer: MedusaCustomer | null,
  checkoutCustomer: CheckoutCustomer,
) {
  const metadata = getReusableAgeVerificationMetadata(accountCustomer?.metadata);
  const normalizedCustomer = normalizeAgeVerificationCustomer(checkoutCustomer);
  const accountEmail = accountCustomer?.email?.trim().toLowerCase();

  if (!metadata || !normalizedCustomer || !accountCustomer || !accountEmail) {
    return null;
  }

  if (normalizedCustomer.email !== accountEmail) {
    return null;
  }

  if (metadata.age_verified_email && metadata.age_verified_email !== accountEmail) {
    return null;
  }

  return {
    ...metadata,
    age_verification_source: "account" as const,
    age_verified_account_id: accountCustomer.id,
    age_verified_email: accountEmail,
  };
}

function getAccountAgeVerificationBypassMetadata(
  account: Awaited<ReturnType<typeof getBayBlazeAccountFromSession>>,
  checkoutCustomer: CheckoutCustomer,
) {
  const normalizedCustomer = normalizeAgeVerificationCustomer(checkoutCustomer);
  const accountEmail = account?.email.trim().toLowerCase();

  if (
    account?.settings.ageVerificationDisabled !== true ||
    !accountEmail ||
    normalizedCustomer?.email !== accountEmail
  ) {
    return null;
  }

  return {
    age_verification_source: "account" as const,
    age_verified_account_id: account.uid,
    age_verified_at: new Date().toISOString(),
    age_verified_email: accountEmail,
  };
}

async function customerHasExistingOrders(customerToken: string) {
  try {
    const { orders } = await medusaStoreRequest<{ orders?: { id: string }[] }>(
      "/store/orders?limit=1&fields=id",
      {},
      customerToken,
    );

    return Boolean(orders?.length);
  } catch {
    return false;
  }
}

function getCheckoutItemsSubtotal(items: ValidCheckoutItem[]) {
  return items.reduce((total, item) => {
    return total + parsePrice(item.price) * item.quantity;
  }, 0);
}

function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

function getCheckoutItemUnitPriceCents(item: ValidCheckoutItem) {
  return Math.round(parsePrice(item.price) * 100);
}

function getCheckoutItemTotalCents(item: ValidCheckoutItem) {
  return getCheckoutItemUnitPriceCents(item) * item.quantity;
}

function parsePrice(price?: string) {
  if (!price) {
    return 0;
  }

  const number = Number(price.replace(/[^0-9.]/g, ""));

  return Number.isFinite(number) ? number : 0;
}

async function medusaStoreRequest<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { body?: Record<string, unknown> } = {},
  customerToken?: string,
) {
  const headers = new Headers(init.headers);

  if (publishableKey) {
    headers.set("x-publishable-api-key", publishableKey);
  }

  if (customerToken) {
    headers.set("authorization", `Bearer ${customerToken}`);
  }

  if (init.body) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers,
    body: init.body ? JSON.stringify(pruneUndefined(init.body)) : undefined,
    cache: "no-store",
  });

  const data = (await readJson(response)) as T & {
    message?: string;
    error?: string | { message?: string };
  };

  if (!response.ok) {
    const errorMessage =
      typeof data.error === "object"
        ? data.error.message
        : data.message ?? data.error;

    throw new Error(errorMessage || "Medusa request failed.");
  }

  return data as T;
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function pruneUndefined(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([key, entryValue]) => [
        key,
        isPlainObject(entryValue)
          ? pruneUndefined(entryValue as Record<string, unknown>)
          : entryValue,
      ]),
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

class CheckoutPromoError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to place order in Medusa right now.";
}
