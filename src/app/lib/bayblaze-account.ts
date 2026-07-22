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
  commerce?: {
    customer?: {
      email?: string | null;
      id: string;
    };
    customerToken?: string;
  };
  redirectTo?: string;
  session: {
    email: string;
    token: string;
    uid: string;
  };
};

export type BayBlazeDiscountCodePreviewItem = {
  quantity: number;
  unitPriceCents: number;
};

export type BayBlazeDiscountCodePreview = {
  amountNeededCents?: number;
  bogoBuyQuantity?: number;
  bogoDiscountedQuantity?: number;
  bogoFreeQuantity?: number;
  category: string;
  code: string;
  codeType?: "discount" | "bogo";
  commissionPercent?: number;
  discountAmountCents: number;
  discountPercent: number;
  eligible: boolean;
  ineligibilityReason?: "minimum_spend";
  message?: string;
  minimumSpendCents: number;
  ownerUid?: string;
  singleUsePerAccount?: boolean;
  subtotalCents: number;
  usageLimit: number;
  usedCount: number;
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
  metadata?: Record<string, unknown>;
  password: string;
}) {
  return bayblazeApiRequest<BayBlazeAccountSessionResponse>("/v1/customer/auth/accounts", {
    body: input,
    method: "POST",
  });
}

export async function startBayBlazeGoogleOAuth(input: {
  callbackUrl: string;
  redirectTo: string;
}) {
  return bayblazeApiRequest<{
    authorizationUrl: string;
    expiresInSeconds: number;
  }>("/v1/auth/google/start", {
    body: {
      ...input,
      commerce: "storefront",
    },
    method: "POST",
  });
}

export async function completeBayBlazeGoogleOAuth(input: {
  callbackUrl: string;
  code: string;
  state: string;
}) {
  return bayblazeApiRequest<BayBlazeAccountSessionResponse>("/v1/auth/google/callback", {
    body: input,
    method: "POST",
  });
}

export async function previewBayBlazeDiscountCode(
  token: string,
  input: {
    code: string;
    items?: BayBlazeDiscountCodePreviewItem[];
    subtotalCents?: number;
  },
) {
  return bayblazeApiRequest<BayBlazeDiscountCodePreview>(
    "/v1/customer/discount-codes/preview",
    {
      body: input,
      method: "POST",
      token,
    },
  );
}

export async function previewPublicBayBlazeDiscountCode(input: {
  code: string;
  items?: BayBlazeDiscountCodePreviewItem[];
  subtotalCents?: number;
}) {
  return bayblazeApiRequest<BayBlazeDiscountCodePreview>(
    "/v1/discount-codes/preview",
    {
      body: input,
      method: "POST",
    },
  );
}

export async function recordBayBlazeDiscountCodeUse(
  token: string,
  input: {
    code: string;
    customerEmail?: string;
    customerId?: string;
    isCustomerFirstOrder?: boolean;
    orderId: string;
  },
) {
  return bayblazeApiRequest<{ code?: string; status?: string }>(
    "/v1/customer/discount-codes/use",
    {
      body: input,
      method: "POST",
      token,
    },
  );
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
    throw new BayBlazeApiError(response.status, readErrorMessage(payload, response.status), payload);
  }

  return payload as T;
}

export class BayBlazeApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly payload: unknown,
  ) {
    super(message);
  }
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
