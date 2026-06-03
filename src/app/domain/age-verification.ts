export const AGE_VERIFICATION_PROVIDER = "agechecker.net";
export const AGECHECKER_POPUP_SCRIPT_URL =
  "https://cdn.agechecker.net/static/popup/v1/popup.js";
export const AGECHECKER_SUPPORT_EMAIL = "help@agechecker.net";

export type AgeVerificationCustomer = {
  first_name?: unknown;
  last_name?: unknown;
  email?: unknown;
  phone?: unknown;
  address?: unknown;
  city?: unknown;
  state?: unknown;
  zip?: unknown;
};

export type NormalizedAgeVerificationCustomer = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
};

export type AgeVerificationMetadata = {
  age_verification_provider?: typeof AGE_VERIFICATION_PROVIDER;
  age_verification_status?: "accepted";
  age_verification_uuid?: string;
  age_verified_at?: string;
};

const requiredCustomerFields: Array<keyof NormalizedAgeVerificationCustomer> = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "zip",
];

export function normalizeAgeVerificationCustomer(
  customer?: AgeVerificationCustomer,
) {
  if (!customer) {
    return null;
  }

  const normalizedCustomer = {
    first_name: normalizeCustomerValue(customer.first_name),
    last_name: normalizeCustomerValue(customer.last_name),
    email: normalizeCustomerValue(customer.email).toLowerCase(),
    phone: normalizeCustomerValue(customer.phone),
    address: normalizeCustomerValue(customer.address),
    city: normalizeCustomerValue(customer.city),
    state: normalizeCustomerValue(customer.state).toUpperCase(),
    zip: normalizeCustomerValue(customer.zip),
  };

  return requiredCustomerFields.every((field) => normalizedCustomer[field])
    ? normalizedCustomer
    : null;
}

export function getAgeVerificationCustomerFingerprint(
  customer: NormalizedAgeVerificationCustomer,
) {
  return [
    customer.first_name.toLowerCase(),
    customer.last_name.toLowerCase(),
    customer.email,
    customer.phone.replace(/\D/g, ""),
    customer.address.toLowerCase(),
    customer.city.toLowerCase(),
    customer.state,
    customer.zip.replace(/\D/g, ""),
  ].join("|");
}

function normalizeCustomerValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
