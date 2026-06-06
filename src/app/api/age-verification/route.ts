import {
  AGE_VERIFICATION_PROVIDER,
  AGECHECKER_SUPPORT_EMAIL,
  normalizeAgeVerificationCustomer,
} from "@/app/domain/age-verification";
import { getCustomerToken } from "@/app/lib/customer-session";
import { validateAgeCheckerUuid } from "@/app/lib/agechecker-net";
import { createAgeVerificationToken } from "@/app/lib/age-verification-token";

type AgeVerificationRequestBody = {
  customer?: {
    first_name?: unknown;
    last_name?: unknown;
    email?: unknown;
    phone?: unknown;
    address?: unknown;
    city?: unknown;
    state?: unknown;
    zip?: unknown;
  };
  uuid?: unknown;
};

type MedusaCustomerResponse = {
  customer: {
    id: string;
    email?: string | null;
    metadata?: Record<string, unknown> | null;
  };
};

const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:9000";

const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export async function POST(request: Request) {
  let body: AgeVerificationRequestBody;

  try {
    body = (await request.json()) as AgeVerificationRequestBody;
  } catch {
    return jsonError("Invalid age verification request.", 400);
  }

  if (typeof body.uuid !== "string" || body.uuid.length !== 32) {
    return jsonError("Complete age verification before checkout.", 400);
  }

  try {
    const verification = await validateAgeCheckerUuid(body.uuid);

    if (verification.status !== "accepted") {
      return jsonError(
        getAgeCheckerStatusMessage(verification.status, verification.reason),
        403,
      );
    }

    const token = createAgeVerificationToken({
      customer: body.customer ?? {},
      uuid: body.uuid,
    });

    await saveAcceptedAgeVerificationForAuthenticatedCustomer(
      body.customer ?? {},
      body.uuid,
    ).catch(() => undefined);

    return Response.json({
      provider: AGE_VERIFICATION_PROVIDER,
      status: "accepted",
      token,
      uuid: body.uuid,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 502);
  }
}

async function saveAcceptedAgeVerificationForAuthenticatedCustomer(
  customer: NonNullable<AgeVerificationRequestBody["customer"]>,
  uuid: string,
) {
  const customerToken = await getCustomerToken();

  if (!customerToken) {
    return;
  }

  const normalizedCustomer = normalizeAgeVerificationCustomer(customer);

  if (!normalizedCustomer) {
    return;
  }

  const { customer: accountCustomer } =
    await medusaStoreRequest<MedusaCustomerResponse>(
      "/store/customers/me",
      {},
      customerToken,
    );
  const accountEmail = accountCustomer.email?.trim().toLowerCase();

  if (!accountEmail || accountEmail !== normalizedCustomer.email) {
    return;
  }

  const existingMetadata = isPlainObject(accountCustomer.metadata)
    ? accountCustomer.metadata
    : {};
  const verifiedAt = new Date().toISOString();

  await medusaStoreRequest<MedusaCustomerResponse>(
    "/store/customers/me",
    {
      method: "POST",
      body: {
        metadata: {
          ...existingMetadata,
          age_verification_provider: AGE_VERIFICATION_PROVIDER,
          age_verification_status: "accepted",
          age_verification_uuid: uuid,
          age_verification_source: "account",
          age_verified_account_id: accountCustomer.id,
          age_verified_at: verifiedAt,
          age_verified_email: normalizedCustomer.email,
        },
      },
    },
    customerToken,
  );
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
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new Error("Medusa customer age verification metadata update failed.");
  }

  return (await response.json()) as T;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getAgeCheckerStatusMessage(status?: string, reason?: string) {
  if (status === "denied") {
    return `Age verification was not approved. Contact ${AGECHECKER_SUPPORT_EMAIL} if you need help.`;
  }

  if (status === "photo_id") {
    return "AgeChecker.Net needs a photo ID before checkout can continue.";
  }

  if (status === "signature") {
    return "AgeChecker.Net needs your signature before checkout can continue.";
  }

  if (status === "not_created" && reason === "location_blocked") {
    return "AgeChecker.Net cannot approve orders from this location.";
  }

  return `Age verification is still pending. Contact ${AGECHECKER_SUPPORT_EMAIL} if you need help.`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Age verification is unavailable right now.";
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
