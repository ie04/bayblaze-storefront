import { createHmac, randomInt, timingSafeEqual } from "crypto";

export const REGISTRATION_VERIFICATION_COOKIE =
  "bayblaze_registration_verification";

export type PendingRegistration = {
  attempts: number;
  codeHash: string;
  email: string;
  expiresAt: number;
  firstName: string;
  lastName: string;
};

const verificationMaxAgeSeconds = 10 * 60;
const maxAttempts = 5;

function getVerificationSecret() {
  const secret =
    process.env.EMAIL_VERIFICATION_SECRET ||
    process.env.COOKIE_SECRET ||
    process.env.JWT_SECRET;

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("EMAIL_VERIFICATION_SECRET is required in production.");
  }

  return secret || "bayblaze-dev-email-verification-secret";
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getVerificationSecret())
    .update(value)
    .digest("base64url");
}

function hashVerificationCode(email: string, code: string) {
  return createHmac("sha256", getVerificationSecret())
    .update(`${email}:${code}`)
    .digest("hex");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function normalizeVerificationEmail(email: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

export function createVerificationCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function createPendingRegistration(input: {
  code: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  const pending: PendingRegistration = {
    attempts: 0,
    codeHash: hashVerificationCode(input.email, input.code),
    email: input.email,
    expiresAt: Date.now() + verificationMaxAgeSeconds * 1000,
    firstName: input.firstName,
    lastName: input.lastName,
  };

  return serializePendingRegistration(pending);
}

export function serializePendingRegistration(pending: PendingRegistration) {
  const payload = base64UrlEncode(JSON.stringify(pending));
  return `${payload}.${sign(payload)}`;
}

export function parsePendingRegistration(value?: string) {
  if (!value) {
    return undefined;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature || !safeEqual(signature, sign(payload))) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as PendingRegistration;

    if (
      typeof parsed.email !== "string" ||
      typeof parsed.codeHash !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      typeof parsed.attempts !== "number"
    ) {
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
}

export function verifyPendingRegistrationCode(
  pending: PendingRegistration,
  code: string,
) {
  return safeEqual(
    pending.codeHash,
    hashVerificationCode(pending.email, code.trim()),
  );
}

export function getRegistrationVerificationCookieOptions() {
  return {
    httpOnly: true,
    maxAge: verificationMaxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function getMaxVerificationAttempts() {
  return maxAttempts;
}

export async function sendRegistrationVerificationEmail({
  code,
  email,
}: {
  code: string;
  email: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const from = process.env.RESEND_FROM_EMAIL || "BAYBLAZE <noreply@bayblaze.net>";
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      html: `
        <h2>Your Bayblaze verification code is:</h2>
        <p style="font-size: 28px; font-weight: bold;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      `,
      subject: "Your Bayblaze verification code",
      to: email,
    }),
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to send verification email. Please try again.");
  }
}
