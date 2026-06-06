import { createHmac, timingSafeEqual } from "crypto";

export const ADDRESS_VALIDATION_PROVIDER = "google_address_validation";

export type AddressValidationCustomer = {
  address?: unknown;
  city?: unknown;
  state?: unknown;
  zip?: unknown;
};

export type ValidatedCheckoutAddress = {
  address: string;
  city: string;
  formatted_address?: string;
  google_place_id?: string;
  latitude?: number;
  longitude?: number;
  state: string;
  zip: string;
};

export type AddressValidationMetadata = {
  address_validation_formatted_address?: string;
  address_validation_latitude?: number;
  address_validation_longitude?: number;
  address_validation_place_id?: string;
  address_validation_provider?: typeof ADDRESS_VALIDATION_PROVIDER;
  address_validation_status?: "accepted";
  address_validated_at?: string;
};

type AddressValidationTokenPayload = {
  address: ValidatedCheckoutAddress;
  address_hash: string;
  expires_at: string;
  provider: typeof ADDRESS_VALIDATION_PROVIDER;
  status: "accepted";
  validated_at: string;
  version: 1;
};

type CheckoutAddressValidationInput = {
  token?: unknown;
};

type VerifyCheckoutAddressValidationResult =
  | {
      error: string;
      metadata?: never;
    }
  | {
      error?: never;
      metadata: AddressValidationMetadata;
    };

const defaultAddressValidationTokenTtlMinutes = 60;

export function isGoogleAddressValidationConfigured() {
  return Boolean(getGoogleAddressValidationApiKey());
}

export function createAddressValidationToken(address: ValidatedCheckoutAddress) {
  const normalizedAddress = normalizeAddressValidationCustomer(address);

  if (!normalizedAddress) {
    throw new Error("A complete delivery address is required.");
  }

  const validatedAt = new Date();
  const expiresAt = new Date(
    validatedAt.getTime() + getAddressValidationTokenTtlMs(),
  );
  const payload: AddressValidationTokenPayload = {
    address: {
      ...address,
      address: normalizedAddress.address,
      city: normalizedAddress.city,
      state: normalizedAddress.state,
      zip: normalizedAddress.zip,
    },
    address_hash: getCheckoutAddressHash(normalizedAddress),
    expires_at: expiresAt.toISOString(),
    provider: ADDRESS_VALIDATION_PROVIDER,
    status: "accepted",
    validated_at: validatedAt.toISOString(),
    version: 1,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyCheckoutAddressValidation(
  addressValidation: CheckoutAddressValidationInput | undefined,
  customer: AddressValidationCustomer,
): VerifyCheckoutAddressValidationResult {
  if (!isGoogleAddressValidationConfigured()) {
    return { metadata: {} };
  }

  if (
    !addressValidation ||
    typeof addressValidation.token !== "string" ||
    !addressValidation.token.trim()
  ) {
    return {
      error:
        "Confirm a valid delivery address before placing your order.",
    };
  }

  const payload = parseAddressValidationToken(addressValidation.token);

  if (!payload) {
    return {
      error:
        "Delivery address validation could not be confirmed. Please verify the address again.",
    };
  }

  if (Date.parse(payload.expires_at) < Date.now()) {
    return {
      error: "Delivery address validation expired. Please verify the address again.",
    };
  }

  const normalizedCustomer = normalizeAddressValidationCustomer(customer);

  if (
    !normalizedCustomer ||
    payload.address_hash !== getCheckoutAddressHash(normalizedCustomer)
  ) {
    return {
      error:
        "Delivery address changed after validation. Please verify the address again.",
    };
  }

  return {
    metadata: {
      address_validation_formatted_address: payload.address.formatted_address,
      address_validation_latitude: payload.address.latitude,
      address_validation_longitude: payload.address.longitude,
      address_validation_place_id: payload.address.google_place_id,
      address_validation_provider: ADDRESS_VALIDATION_PROVIDER,
      address_validation_status: payload.status,
      address_validated_at: payload.validated_at,
    },
  };
}

export function normalizeAddressValidationCustomer(
  customer?: AddressValidationCustomer,
) {
  if (!customer) {
    return null;
  }

  const normalized = {
    address: normalizeAddressValue(customer.address),
    city: normalizeAddressValue(customer.city),
    state: normalizeAddressValue(customer.state).toUpperCase(),
    zip: normalizeAddressValue(customer.zip),
  };

  return normalized.address && normalized.city && normalized.state && normalized.zip
    ? normalized
    : null;
}

export function getGoogleAddressValidationApiKey() {
  return (
    process.env.GOOGLE_MAPS_ADDRESS_VALIDATION_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
    ""
  );
}

function parseAddressValidationToken(token: string) {
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
    ) as AddressValidationTokenPayload;

    if (
      payload.version !== 1 ||
      payload.provider !== ADDRESS_VALIDATION_PROVIDER ||
      payload.status !== "accepted" ||
      !payload.address_hash ||
      !payload.address
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getCheckoutAddressHash(
  customer: ReturnType<typeof normalizeAddressValidationCustomer>,
) {
  if (!customer) {
    throw new Error("A complete delivery address is required.");
  }

  return createHmac("sha256", getAddressValidationTokenSecret())
    .update(
      [
        customer.address.toLowerCase(),
        customer.city.toLowerCase(),
        customer.state,
        customer.zip.replace(/\D/g, ""),
      ].join("|"),
    )
    .digest("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getAddressValidationTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function getAddressValidationTokenSecret() {
  const secret =
    process.env.ADDRESS_VALIDATION_TOKEN_SECRET ??
    process.env.AGE_VERIFICATION_TOKEN_SECRET ??
    process.env.EMAIL_VERIFICATION_SECRET;

  if (!secret) {
    throw new Error(
      "ADDRESS_VALIDATION_TOKEN_SECRET, AGE_VERIFICATION_TOKEN_SECRET, or EMAIL_VERIFICATION_SECRET is required when Google Address Validation is enabled.",
    );
  }

  return secret;
}

function getAddressValidationTokenTtlMs() {
  const minutes = Number(
    process.env.ADDRESS_VALIDATION_TOKEN_TTL_MINUTES ??
      defaultAddressValidationTokenTtlMinutes,
  );

  return (
    (Number.isFinite(minutes) && minutes > 0
      ? minutes
      : defaultAddressValidationTokenTtlMinutes) *
    60 *
    1000
  );
}

function normalizeAddressValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}
