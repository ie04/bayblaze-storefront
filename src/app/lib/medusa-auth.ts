export const CUSTOMER_TOKEN_COOKIE = "bayblaze_customer_token";

export type Customer = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
};

export type CustomerOrderItem = {
  id?: string | null;
  title?: string | null;
  product_title?: string | null;
  variant_title?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  total?: number | null;
  thumbnail?: string | null;
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

type RequestOptions = RequestInit & {
  token?: string;
  usePublishableKey?: boolean;
};

const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:9000";

const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const orderFields = [
  "id",
  "display_id",
  "custom_display_id",
  "email",
  "status",
  "total",
  "currency_code",
  "created_at",
  "*items",
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

function normalizeCustomerOrder(order: CustomerOrder): CustomerOrder {
  return {
    ...order,
    items: order.items?.map((item) => ({
      ...item,
      thumbnail: normalizeMedusaAssetUrl(item.thumbnail),
    })),
  };
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

export async function registerCustomer(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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

export async function retrieveCustomerOrders(token: string) {
  const params = new URLSearchParams({
    limit: "10",
    fields: orderFields,
  });
  const data = await medusaRequest<MedusaOrdersResponse>(
    `/store/orders?${params.toString()}`,
    {
      token,
      usePublishableKey: true,
    },
  );

  return data.orders.map(normalizeCustomerOrder);
}

export async function retrieveOrder(orderId: string, token?: string) {
  const params = new URLSearchParams({
    fields: orderFields,
  });
  const data = await medusaRequest<MedusaOrderResponse>(
    `/store/orders/${encodeURIComponent(orderId)}?${params.toString()}`,
    {
      token,
      usePublishableKey: true,
    },
  );

  return normalizeCustomerOrder(data.order);
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

    return normalizeCustomerOrder(data.order);
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
