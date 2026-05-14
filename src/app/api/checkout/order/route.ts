import { cookies } from "next/headers";

import { CUSTOMER_TOKEN_COOKIE } from "@/app/lib/medusa-auth";

type CheckoutItem = {
  id?: string;
  variantId?: string;
  productHandle?: string;
  name?: string;
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
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
};

type CheckoutRequestBody = {
  customer?: CheckoutCustomer;
  items?: CheckoutItem[];
};

type MedusaCart = {
  id: string;
  email?: string;
  region_id?: string;
  currency_code?: string;
  payment_collection?: {
    id: string;
  } | null;
};

type MedusaOrder = {
  id: string;
  display_id?: number;
  custom_display_id?: string;
  email?: string;
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

  const customer = body.customer as Required<CheckoutCustomer>;
  const items = body.items as ValidCheckoutItem[];
  const cookieStore = await cookies();
  const customerToken = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;

  try {
    const { cart } = await medusaStoreRequest<{ cart: MedusaCart }>(
      "/store/carts",
      {
        method: "POST",
        body: {
          region_id: defaultRegionId,
          email: customer.email,
          metadata: {
            source: "bayblaze-storefront",
          },
        },
      },
      customerToken,
    );
    let activeCart = cart;

    if (customerToken) {
      const { cart: customerCart } = await medusaStoreRequest<{
        cart: MedusaCart;
      }>(
        `/store/carts/${cart.id}/customer`,
        {
          method: "POST",
          body: {},
        },
        customerToken,
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
        customerToken,
      );
    }

    const address = {
      first_name: customer.first_name,
      last_name: customer.last_name,
      address_1: customer.address,
      city: customer.city,
      province: customer.state,
      postal_code: customer.zip,
      country_code: "us",
      phone: customer.phone,
    };

    const { cart: addressedCart } = await medusaStoreRequest<{
      cart: MedusaCart;
    }>(
      `/store/carts/${activeCart.id}`,
      {
        method: "POST",
        body: {
          email: customer.email,
          shipping_address: address,
          billing_address: address,
          metadata: {
            source: "bayblaze-storefront",
            payment_note: "Payment due on delivery",
            checkout_notes: customer.notes,
            requested_items: items.map((item) => ({
              name: item.name,
              flavor: item.flavor,
              quantity: item.quantity,
              product_handle: item.productHandle,
              variant_id: item.variantId,
            })),
          },
        },
      },
      customerToken,
    );

    const shippingOption = await selectShippingOption(
      addressedCart.id,
      customerToken,
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
      customerToken,
    );

    const paymentProvider = await selectPaymentProvider(addressedCart, customerToken);
    const paymentCollection = await createPaymentCollection(
      addressedCart,
      customerToken,
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
      customerToken,
    );

    const completedCart = await medusaStoreRequest<MedusaCompleteCartResponse>(
      `/store/carts/${addressedCart.id}/complete`,
      {
        method: "POST",
      },
      customerToken,
    );

    if (completedCart.type === "cart") {
      return jsonError(
        completedCart.error?.message ??
          "Medusa could not complete this cart. Please review the order details and try again.",
        422,
      );
    }

    return Response.json({
      order: completedCart.order,
      message: "Order placed.",
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 502);
  }
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

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to place order in Medusa right now.";
}
