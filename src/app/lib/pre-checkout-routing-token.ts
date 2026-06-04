import { createHmac, timingSafeEqual } from "crypto";

import {
  PRE_CHECKOUT_ROUTING_PROVIDER,
  getPreCheckoutRoutingFingerprint,
  type IsoChronosPreCheckoutEvaluation,
  type NormalizedPreCheckoutRoutingItem,
  type PreCheckoutRoutingCustomer,
  type PreCheckoutRoutingDelivery,
  type PreCheckoutRoutingMetadata,
} from "@/app/domain/pre-checkout-routing";

type PreCheckoutRoutingTokenPayload = {
  checkout_hash: string;
  classification?: string;
  decision: string;
  estimated_minutes?: number;
  expires_at: string;
  fulfillment_mode?: string;
  provider: typeof PRE_CHECKOUT_ROUTING_PROVIDER;
  status: "accepted" | "conditionally_accepted" | "manual_review";
  evaluated_at: string;
  version: 1;
};

type VerifyRoutingInput = {
  token?: unknown;
};

type VerifyRoutingResult =
  | {
      error: string;
      metadata?: never;
    }
  | {
      error?: never;
      metadata: PreCheckoutRoutingMetadata;
    };

const defaultRoutingTokenTtlMinutes = 30;

export function isPreCheckoutRoutingConfigured() {
  return Boolean(
    process.env.ISOCHRONOS_BASE_URL?.trim() ||
      process.env.ISOCHRONOS_API_URL?.trim(),
  );
}

export function createPreCheckoutRoutingToken({
  customer,
  delivery,
  evaluation,
  items,
}: {
  customer: PreCheckoutRoutingCustomer;
  delivery?: PreCheckoutRoutingDelivery;
  evaluation: IsoChronosPreCheckoutEvaluation;
  items: NormalizedPreCheckoutRoutingItem[];
}) {
  const evaluatedAt = new Date();
  const expiresAt = new Date(evaluatedAt.getTime() + getRoutingTokenTtlMs());
  const status = getRoutingStatus(evaluation.decision);
  const payload: PreCheckoutRoutingTokenPayload = {
    checkout_hash: getCheckoutHash({ customer, delivery, items }),
    classification: evaluation.classification,
    decision: evaluation.decision ?? "ACCEPTED",
    estimated_minutes:
      evaluation.routingContext?.routeScore?.durationMinutes,
    expires_at: expiresAt.toISOString(),
    fulfillment_mode: evaluation.routingContext?.fulfillmentMode,
    provider: PRE_CHECKOUT_ROUTING_PROVIDER,
    status,
    evaluated_at: evaluatedAt.toISOString(),
    version: 1,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyCheckoutRoutingEvaluation(
  routing: VerifyRoutingInput | undefined,
  {
    customer,
    delivery,
    items,
  }: {
    customer: PreCheckoutRoutingCustomer;
    delivery?: PreCheckoutRoutingDelivery;
    items: NormalizedPreCheckoutRoutingItem[];
  },
): VerifyRoutingResult {
  if (!isPreCheckoutRoutingConfigured()) {
    return { metadata: {} };
  }

  if (!routing || typeof routing.token !== "string" || !routing.token.trim()) {
    return {
      error: "Complete delivery eligibility confirmation before placing your order.",
    };
  }

  const payload = parseRoutingToken(routing.token);

  if (!payload) {
    return {
      error:
        "Delivery eligibility could not be confirmed. Please review your order and try again.",
    };
  }

  if (Date.parse(payload.expires_at) < Date.now()) {
    return {
      error:
        "Delivery eligibility confirmation expired. Please review your order and try again.",
    };
  }

  if (payload.checkout_hash !== getCheckoutHash({ customer, delivery, items })) {
    return {
      error:
        "Checkout details changed after delivery confirmation. Please confirm again.",
    };
  }

  return {
    metadata: {
      routing_provider: PRE_CHECKOUT_ROUTING_PROVIDER,
      routing_status: payload.status,
      routing_decision: payload.decision,
      routing_classification: payload.classification,
      routing_fulfillment_mode: payload.fulfillment_mode,
      routing_estimated_minutes: payload.estimated_minutes,
      routing_evaluated_at: payload.evaluated_at,
    },
  };
}

function parseRoutingToken(token: string) {
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
    ) as PreCheckoutRoutingTokenPayload;

    if (
      payload.version !== 1 ||
      payload.provider !== PRE_CHECKOUT_ROUTING_PROVIDER ||
      !["accepted", "conditionally_accepted", "manual_review"].includes(
        payload.status,
      ) ||
      typeof payload.checkout_hash !== "string" ||
      !payload.checkout_hash
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getRoutingStatus(decision?: string) {
  if (decision === "CONDITIONALLY_ACCEPTED") {
    return "conditionally_accepted";
  }

  if (decision === "MANUAL_REVIEW") {
    return "manual_review";
  }

  return "accepted";
}

function getCheckoutHash({
  customer,
  delivery,
  items,
}: {
  customer: PreCheckoutRoutingCustomer;
  delivery?: PreCheckoutRoutingDelivery;
  items: NormalizedPreCheckoutRoutingItem[];
}) {
  return createHmac("sha256", getRoutingTokenSecret())
    .update(getPreCheckoutRoutingFingerprint({ customer, delivery, items }))
    .digest("base64url");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getRoutingTokenSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function getRoutingTokenSecret() {
  const secret =
    process.env.ROUTING_EVALUATION_TOKEN_SECRET ??
    process.env.AGE_VERIFICATION_TOKEN_SECRET ??
    process.env.EMAIL_VERIFICATION_SECRET;

  if (!secret) {
    throw new Error(
      "ROUTING_EVALUATION_TOKEN_SECRET, AGE_VERIFICATION_TOKEN_SECRET, or EMAIL_VERIFICATION_SECRET is required when IsoChronos routing is enabled.",
    );
  }

  return secret;
}

function getRoutingTokenTtlMs() {
  const minutes = Number(
    process.env.ROUTING_EVALUATION_TOKEN_TTL_MINUTES ??
      defaultRoutingTokenTtlMinutes,
  );

  return (
    (Number.isFinite(minutes) && minutes > 0
      ? minutes
      : defaultRoutingTokenTtlMinutes) *
    60 *
    1000
  );
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}
