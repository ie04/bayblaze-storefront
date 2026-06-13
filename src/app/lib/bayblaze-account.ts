import { cookies } from "next/headers";

export const BAYBLAZE_ACCOUNT_TOKEN_COOKIE = "bayblaze_account_token";

export type BayBlazeAccountRole = "admin" | "driver" | "inventory";
export type BayBlazeAccountBadge = "customer" | "employee";

export type BayBlazeAccount = {
  badges: BayBlazeAccountBadge[];
  disabled: boolean;
  displayName: string;
  email: string;
  roles: BayBlazeAccountRole[];
  settings: {
    ageVerificationDisabled: boolean;
  };
  uid: string;
};

type BayBlazeAccountSessionResponse = {
  account: BayBlazeAccount;
  session: {
    email: string;
    token: string;
    uid: string;
  };
};

const apiBaseUrl = (
  process.env.BAYBLAZE_API_URL ||
  process.env.NEXT_PUBLIC_BAYBLAZE_API_URL ||
  "http://localhost:3040"
).replace(/\/$/, "");

export async function getBayBlazeAccountToken() {
  const cookieStore = await cookies();

  return cookieStore.get(BAYBLAZE_ACCOUNT_TOKEN_COOKIE)?.value;
}

export async function retrieveBayBlazeAccount(token: string) {
  const response = await bayblazeApiRequest<{ account: BayBlazeAccount }>("/v1/auth/me", {
    token,
  });

  return response.account;
}

export async function loginBayBlazeCustomerAccount(email: string, password: string) {
  return bayblazeApiRequest<BayBlazeAccountSessionResponse>("/v1/customer/auth/login", {
    body: { email, password },
    method: "POST",
  });
}

export async function createBayBlazeCustomerAccount(input: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}) {
  return bayblazeApiRequest<BayBlazeAccountSessionResponse>("/v1/customer/auth/accounts", {
    body: input,
    method: "POST",
  });
}

async function bayblazeApiRequest<T>(
  path: string,
  options: {
    body?: unknown;
    method?: string;
    token?: string;
  } = {},
) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    method: options.method || "GET",
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    throw new Error(readErrorMessage(payload, response.status));
  }

  return payload as T;
}

function readErrorMessage(payload: unknown, status: number) {
  if (
    typeof payload === "object" &&
    payload &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return `BayBlaze account request failed with HTTP ${status}.`;
}
