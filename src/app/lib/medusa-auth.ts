export const CUSTOMER_TOKEN_COOKIE = "bayblaze_customer_token";

export type Customer = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  metadata?: Record<string, unknown> | null;
  phone?: string | null;
};

export type CustomerOrderProductImage = {
  url?: string | null;
};

export type CustomerOrderProduct = {
  id?: string | null;
  thumbnail?: string | null;
  images?: CustomerOrderProductImage[] | null;
};

export type CustomerOrderVariant = {
  id?: string | null;
  product_id?: string | null;
  product?: CustomerOrderProduct | null;
};

export type CustomerOrderItem = {
  id?: string | null;
  product_handle?: string | null;
  product_id?: string | null;
  title?: string | null;
  product_title?: string | null;
  variant_id?: string | null;
  variant_title?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  total?: number | null;
  thumbnail?: string | null;
  variant?: CustomerOrderVariant | null;
};

export type CustomerOrderAddress = {
  first_name?: string | null;
  last_name?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  phone?: string | null;
};

export type CustomerOrderShippingMethod = {
  id?: string | null;
  name?: string | null;
  amount?: number | null;
  total?: number | null;
};

export type CustomerOrder = {
  id: string;
  display_id?: number | string | null;
  custom_display_id?: string | null;
  email?: string | null;
  status?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  total?: number | null;
  currency_code?: string | null;
  created_at?: string | null;
  metadata?: Record<string, unknown> | null;
  shipping_address?: CustomerOrderAddress | null;
  billing_address?: CustomerOrderAddress | null;
  shipping_methods?: CustomerOrderShippingMethod[];
  items?: CustomerOrderItem[];
};

type MedusaTokenResponse = {
  token: string;
};

type MedusaCustomerResponse = {
  customer: Customer;
};

type MedusaOrdersResponse = {
  orders: CustomerOrder[];
};

type MedusaOrderResponse = {
  order: CustomerOrder;
};

type MedusaOAuthResponse = {
  location?: string;
  token?: string;
};

type RequestOptions = RequestInit & {
  token?: string;
  usePublishableKey?: boolean;
};

const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:9000";

const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const orderListFields = [
  "id",
  "display_id",
  "custom_display_id",
  "email",
  "status",
  "total",
  "currency_code",
  "created_at",
  "metadata",
].join(",");

const orderDetailFields = [
  "id",
  "display_id",
  "custom_display_id",
  "email",
  "status",
  "payment_status",
  "fulfillment_status",
  "total",
  "currency_code",
  "created_at",
  "metadata",
  "*items",
  "*items.variant",
  "*items.variant.product",
  "*items.variant.product.images",
  "*shipping_address",
  "*billing_address",
  "*shipping_methods",
].join(",");


function normalizeMedusaAssetUrl(url?: string | null) {
  if (!url) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${backendUrl}${url}`;
  }

  return url.replace(/^https?:\/\/localhost:9000(?=\/)/, backendUrl);
}

function normalizeCustomerOrder(
  order: CustomerOrder,
): CustomerOrder {
  const requestedItems = getRequestedOrderItems(
    order.metadata,
  );

  const items = order.items?.length
    ? order.items
    : readRequestedItems(order.metadata);

  return {
    ...order,
    items: items?.map((item, index) => {
      const requestedItem = findRequestedOrderItem(
        requestedItems,
        item,
        index,
      );

      return {
        ...item,
        thumbnail: normalizeMedusaAssetUrl(
          getOrderItemThumbnail(
            item,
            requestedItem,
          ),
        ),
      };
    }),
  };
}

type RequestedOrderItem = {
  flavor?: unknown;
  image?: unknown;
  name?: unknown;
  product_handle?: unknown;
  product_id?: unknown;
  quantity?: unknown;
  thumbnail?: unknown;
  variant_id?: unknown;
};

function getRequestedOrderItems(
  metadata?: Record<string, unknown> | null,
) {
  const requestedItems = metadata?.requested_items;

  if (!Array.isArray(requestedItems)) {
    return [] as RequestedOrderItem[];
  }

  return requestedItems.filter(
    (item): item is RequestedOrderItem =>
      Boolean(item) &&
      typeof item === "object",
  );
}

function readRequestedItems(
  metadata?: Record<string, unknown> | null,
): CustomerOrderItem[] | undefined {
  const requestedItems =
    getRequestedOrderItems(metadata);

  if (!requestedItems.length) {
    return undefined;
  }

  return requestedItems.map((item, index) => {
    const name =
      readRequestedItemString(item.name) ||
      "Product";

    const variantId =
      readRequestedItemString(item.variant_id);

    return {
      id:
        variantId ||
        `requested-item-${index}`,
      product_handle:
        readRequestedItemString(
          item.product_handle,
        ),
      product_id:
        readRequestedItemString(
          item.product_id,
        ),
      product_title: name,
      quantity:
        readNumber(item.quantity) ?? 1,
      thumbnail:
        readRequestedItemString(
          item.image,
        ) ||
        readRequestedItemString(
          item.thumbnail,
        ) ||
        null,
      title: name,
      variant_id: variantId,
      variant_title:
        readRequestedItemString(
          item.flavor,
        ),
    };
  });
}

function findRequestedOrderItem(
  requestedItems: RequestedOrderItem[],
  item: CustomerOrderItem,
  index: number,
) {
  const variantId =
    item.variant_id?.trim() ||
    item.variant?.id?.trim() ||
    "";

  const productId =
    item.product_id?.trim() ||
    item.variant?.product_id?.trim() ||
    item.variant?.product?.id?.trim() ||
    "";

  return (
    requestedItems.find((requestedItem) => {
      const requestedVariantId =
        readRequestedItemString(
          requestedItem.variant_id,
        );

      const requestedProductId =
        readRequestedItemString(
          requestedItem.product_id,
        );

      return (
        Boolean(
          variantId &&
            requestedVariantId === variantId,
        ) ||
        Boolean(
          productId &&
            requestedProductId === productId,
        )
      );
    }) ??
    requestedItems[index] ??
    null
  );
}

function getOrderItemThumbnail(
  item: CustomerOrderItem,
  requestedItem: RequestedOrderItem | null,
) {
  return (
    item.thumbnail?.trim() ||
    item.variant?.product?.thumbnail?.trim() ||
    item.variant?.product?.images?.find(
      (image) =>
        typeof image.url === "string" &&
        Boolean(image.url.trim()),
    )?.url?.trim() ||
    readRequestedItemString(
      requestedItem?.image,
    ) ||
    readRequestedItemString(
      requestedItem?.thumbnail,
    ) ||
    null
  );
}

function readRequestedItemString(
  value: unknown,
) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function readString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getHeaders(options: RequestOptions) {
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  if (options.token) {
    headers.set("authorization", `Bearer ${options.token}`);
  }

  if (options.usePublishableKey && publishableKey) {
    headers.set("x-publishable-api-key", publishableKey);
  }

  return headers;
}

async function medusaRequest<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${backendUrl}${path}`, {
    ...options,
    headers: getHeaders(options),
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "Something went wrong. Please try again.";

    try {
      const data = await response.json();
      message = data.message || data.error || message;
    } catch {
      // Keep the fallback message.
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function authenticateCustomer(email: string, password: string) {
  const data = await medusaRequest<MedusaTokenResponse>(
    "/auth/customer/emailpass",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );

  try {
    await retrieveCustomer(data.token);
  } catch {
    throw new Error(
      "Those credentials are valid, but they are not attached to a Bayblaze customer account. Please create a storefront account first.",
    );
  }

  return data.token;
}

function decodeJwtPayload(token: string) {
  const payload = token.split(".")[1];

  if (!payload) {
    throw new Error("Medusa returned an invalid authentication token.");
  }

  const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
  const paddedPayload = normalizedPayload.padEnd(
    Math.ceil(normalizedPayload.length / 4) * 4,
    "=",
  );

  return JSON.parse(Buffer.from(paddedPayload, "base64").toString("utf8")) as {
    actor_id?: string;
    user_metadata?: {
      email?: string;
      family_name?: string;
      given_name?: string;
      name?: string;
    };
  };
}

function getOAuthCustomerNameParts(metadata: {
  family_name?: string;
  given_name?: string;
  name?: string;
}) {
  const givenName = metadata.given_name?.trim();
  const familyName = metadata.family_name?.trim();

  if (givenName || familyName) {
    return {
      firstName: givenName || "Bayblaze",
      lastName: familyName || "Customer",
    };
  }

  const [firstName, ...rest] = metadata.name?.trim().split(/\s+/) ?? [];

  return {
    firstName: firstName || "Bayblaze",
    lastName: rest.join(" ") || "Customer",
  };
}

export async function getCustomerOAuthRedirect(provider: "google", callbackUrl: string) {
  const data = await medusaRequest<MedusaOAuthResponse>(
    `/auth/customer/${provider}`,
    {
      method: "POST",
      body: JSON.stringify({ callback_url: callbackUrl }),
    },
  );

  if (!data.location) {
    throw new Error("Medusa did not return an OAuth redirect URL.");
  }

  return data.location;
}

export async function completeCustomerOAuth(
  provider: "google",
  searchParams: URLSearchParams,
  customerMetadata?: Record<string, unknown>,
) {
  const callbackParams = new URLSearchParams(searchParams);
  const callback = await medusaRequest<MedusaOAuthResponse>(
    `/auth/customer/${provider}/callback?${callbackParams.toString()}`,
    {
      method: "GET",
    },
  );
  let token = callback.token;

  if (!token) {
    throw new Error("Medusa did not return an OAuth token.");
  }

  const decodedToken = decodeJwtPayload(token);

  if (!decodedToken.actor_id) {
    const metadata = decodedToken.user_metadata ?? {};
    const email = metadata.email?.trim();

    if (!email) {
      throw new Error("Google did not return a verified email address.");
    }

    const { firstName, lastName } = getOAuthCustomerNameParts(metadata);

    await medusaRequest<MedusaCustomerResponse>("/store/customers", {
      method: "POST",
      token,
      usePublishableKey: true,
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        metadata: customerMetadata,
      }),
    });

    const refreshed = await medusaRequest<MedusaOAuthResponse>(
      "/auth/token/refresh",
      {
        method: "POST",
        token,
      },
    );

    if (!refreshed.token) {
      throw new Error("Medusa did not refresh the OAuth token.");
    }

    token = refreshed.token;
  }

  return token;
}

export async function registerCustomer(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  metadata?: Record<string, unknown>;
}) {
  const registration = await medusaRequest<MedusaTokenResponse>(
    "/auth/customer/emailpass/register",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        password: input.password,
      }),
    },
  );

  await medusaRequest<MedusaCustomerResponse>("/store/customers", {
    method: "POST",
    token: registration.token,
    usePublishableKey: true,
    body: JSON.stringify({
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      metadata: input.metadata,
    }),
  });

  return authenticateCustomer(input.email, input.password);
}

export async function retrieveCustomer(token: string) {
  const data = await medusaRequest<MedusaCustomerResponse>(
    "/store/customers/me",
    {
      token,
      usePublishableKey: true,
    },
  );

  return data.customer;
}

export async function retrieveCustomerOrders(
  token: string,
) {
  const params = new URLSearchParams({
    limit: "10",
    fields: orderListFields,
  });

  const data =
    await medusaRequest<MedusaOrdersResponse>(
      `/store/orders?${params.toString()}`,
      {
        token,
        usePublishableKey: true,
      },
    );

  const orders = await Promise.all(
    data.orders.map(async (order) => {
      try {
        return await retrieveOrder(
          order.id,
          token,
        );
      } catch {
        /*
         * Keep the order visible if one detailed request
         * fails. Metadata fallbacks may still provide the
         * address and requested item information.
         */
        return normalizeCustomerOrder(order);
      }
    }),
  );

  return orders.filter(isCustomerVisibleOrder);
}

export async function retrieveOrder(orderId: string, token?: string) {
  const params = new URLSearchParams({
    fields: orderDetailFields,
  });
  const data = await medusaRequest<MedusaOrderResponse>(
    `/store/orders/${encodeURIComponent(orderId)}?${params.toString()}`,
    {
      token,
      usePublishableKey: true,
    },
  );

  const order = normalizeCustomerOrder(data.order);

  if (!isCustomerVisibleOrder(order)) {
    throw new Error("Order not found.");
  }

  return order;
}

export async function retrieveOrderByReference(
  orderReference: string,
  token?: string,
) {
  try {
    const data = await medusaRequest<MedusaOrderResponse>(
      `/store/order-lookup/${encodeURIComponent(orderReference)}`,
      {
        usePublishableKey: true,
      },
    );

    const order = normalizeCustomerOrder(data.order);

    if (!isCustomerVisibleOrder(order)) {
      throw new Error("Order not found.");
    }

    return order;
  } catch {
    // Fall through to Medusa's native order retrieve route for deployments
    // that do not have the public lookup endpoint yet.
  }

  try {
    return await retrieveOrder(orderReference, token);
  } catch (error) {
    if (!token) {
      throw error;
    }

    const orders = await retrieveCustomerOrders(token);
    const order = orders.find((customerOrder) => {
      return (
        customerOrder.id === orderReference ||
        customerOrder.custom_display_id?.toLowerCase() ===
          orderReference.toLowerCase() ||
        String(customerOrder.display_id) === orderReference
      );
    });

    if (!order) {
      throw error;
    }

    return order;
  }
}

function isCustomerVisibleOrder(order: CustomerOrder) {
  const metadata = order.metadata ?? {};
  const orderStatus = readMetadataString(
    metadata.bayblaze_order_status,
    metadata.order_status,
  ).toLowerCase();

  return (
    metadata.bayblaze_deleted !== true &&
    order.status !== "deleted" &&
    orderStatus !== "deleted"
  );
}

function readMetadataString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}
