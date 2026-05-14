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

export type CustomerOrder = {
  id: string;
  display_id?: number | string | null;
  status?: string | null;
  total?: number | null;
  currency_code?: string | null;
  created_at?: string | null;
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

type RequestOptions = RequestInit & {
  token?: string;
  usePublishableKey?: boolean;
};

const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:9000";

const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

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
    fields: "id,display_id,status,total,currency_code,created_at,*items",
  });
  const data = await medusaRequest<MedusaOrdersResponse>(
    `/store/orders?${params.toString()}`,
    {
      token,
      usePublishableKey: true,
    },
  );

  return data.orders;
}
