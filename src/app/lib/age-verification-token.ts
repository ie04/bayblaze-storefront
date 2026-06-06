import { createHmac, timingSafeEqual } from "crypto";

import {
  AGE_VERIFICATION_PROVIDER,
  type AgeVerificationCustomer,
  type AgeVerificationMetadata,
  getAgeVerificationCustomerFingerprint,
  getReusableAgeVerificationMetadata,
  normalizeAgeVerificationCustomer,
} from "@/app/domain/age-verification";
import { isAgeCheckerConfigured } from "@/app/lib/agechecker-net";

type AgeVerificationTokenPayload = {
  customer_hash: string;
  expires_at: string;
  provider: typeof AGE_VERIFICATION_PROVIDER;
  status: "accepted";
  uuid: string;
  verified_at: string;
  version: 1;
};

type VerifyAgeVerificationTokenResult =
  | {
      error: string;
      metadata?: never;
    }
  | {
      error?: never;
      metadata: AgeVerificationMetadata;
    };

type CheckoutAgeVerificationInput = {
  token?: unknown;
};

const defaultAgeVerificationTokenTtlMinutes = 60;

export function createAgeVerificationToken({
  customer,
  uuid,
}: {
  customer: AgeVerificationCustomer;
  uuid: string;
}) {
  const normalizedCustomer = normalizeAgeVerificationCustomer(customer);

  if (!normalizedCustomer) {
    throw new Error("Customer details are required for age verification.");
  }

  const verifiedAt = new Date();
  const expiresAt = new Date(
    verifiedAt.getTime() + getAgeVerificationTokenTtlMs(),
  );
  const payload: AgeVerificationTokenPayload = {
    customer_hash: getAgeVerificationCustomerHash(normalizedCustomer),
    expires_at: expiresAt.toISOString(),
    provider: AGE_VERIFICATION_PROVIDER,
    status: "accepted",
    uuid,
    verified_at: verifiedAt.toISOString(),
    version: 1,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyCheckoutAgeVerification(
  ageVerification: CheckoutAgeVerificationInput | undefined,
  customer: AgeVerificationCustomer,
  reusableMetadata?: AgeVerificationMetadata | null,
): VerifyAgeVerificationTokenResult {
  if (!isAgeCheckerConfigured()) {
    return { metadata: {} };
  }

  const savedMetadata = getReusableAgeVerificationMetadata(reusableMetadata);

  if (savedMetadata) {
    return { metadata: savedMetadata };
  }

  if (
    !ageVerification ||
    typeof ageVerification.token !== "string" ||
    !ageVerification.token.trim()
  ) {
    return {
      error: "Complete age verification before placing your order.",
    };
  }

  const payload = parseAgeVerificationToken(ageVerification.token);

  if (!payload) {
    return {
      error: "Age verification could not be confirmed. Please verify again.",
    };
  }

  if (Date.parse(payload.expires_at) < Date.now()) {
    return {
      error: "Age verification expired. Please verify again.",
    };
  }

  const normalizedCustomer = normalizeAgeVerificationCustomer(customer);

  if (
    !normalizedCustomer ||
    payload.customer_hash !== getAgeVerificationCustomerHash(normalizedCustomer)
  ) {
    return {
      error:
        "Customer details changed after age verification. Please verify again.",
    };
  }

  return {
    metadata: {
      age_verification_provider: AGE_VERIFICATION_PROVIDER,
      age_verification_status: payload.status,
      age_verification_uuid: payload.uuid,
      age_verification_source: "checkout",
      age_verified_at: payload.verified_at,
      age_verified_email: normalizedCustomer.email,
    },
  };
}

function parseAgeVerificationToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as AgeVerificationTokenPayload;

    if (
      payload.version !== 1 ||
      payload.provider !== AGE_VERIFICATION_PROVIDER ||
      payload.status !== "accepted" ||
      typeof payload.uuid !== "string" ||
      payload.uuid.length !== 32
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getAgeVerificationCustomerHash(
  customer: ReturnType<typeof normalizeAgeVerificationCustomer>,
) {
  if (!customer) {
    throw new Error("Customer details are required for age verification.");
  }

  return createHmac("sha256", getAgeVerificationTokenSecret())
    .update(getAgeVerificationCustomerFingerprint(customer))
    .digest("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getAgeVerificationTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function getAgeVerificationTokenSecret() {
  const secret =
    process.env.AGE_VERIFICATION_TOKEN_SECRET ??
    process.env.EMAIL_VERIFICATION_SECRET;

  if (!secret) {
    throw new Error(
      "AGE_VERIFICATION_TOKEN_SECRET or EMAIL_VERIFICATION_SECRET is required when AgeChecker.Net is enabled.",
    );
  }

  return secret;
}

function getAgeVerificationTokenTtlMs() {
  const minutes = Number(
    process.env.AGE_VERIFICATION_TOKEN_TTL_MINUTES ??
      defaultAgeVerificationTokenTtlMinutes,
  );

  return (
    (Number.isFinite(minutes) && minutes > 0
      ? minutes
      : defaultAgeVerificationTokenTtlMinutes) *
    60 *
    1000
  );
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}
