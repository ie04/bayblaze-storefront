import { randomUUID } from "crypto";

import {
  getPreCheckoutRoutingAddress,
  normalizePreCheckoutRoutingItems,
  type IsoChronosPreCheckoutEvaluation,
  type NormalizedPreCheckoutRoutingItem,
} from "@/app/domain/pre-checkout-routing";
import {
  createPreCheckoutRoutingToken,
  isPreCheckoutRoutingConfigured,
} from "@/app/lib/pre-checkout-routing-token";

type PreflightRequestBody = {
  customer?: {
    address?: unknown;
    city?: unknown;
    state?: unknown;
    zip?: unknown;
  };
  delivery?: {
    mode?: unknown;
    scheduled_at?: unknown;
  };
  items?: Parameters<typeof normalizePreCheckoutRoutingItems>[0];
};

const isochronosBaseUrl =
  (process.env.ISOCHRONOS_BASE_URL ?? process.env.ISOCHRONOS_API_URL ?? "")
    .trim()
    .replace(/\/$/, "");
const isochronosAdminToken = process.env.ISOCHRONOS_ADMIN_TOKEN?.trim();

export async function POST(request: Request) {
  let body: PreflightRequestBody;

  try {
    body = (await request.json()) as PreflightRequestBody;
  } catch {
    return jsonError("Invalid delivery eligibility request.", 400);
  }

  if (!isPreCheckoutRoutingConfigured() || !isochronosBaseUrl) {
    return jsonError(
      "Delivery eligibility checks are not configured yet. Please try again soon.",
      503,
    );
  }

  const itemNormalization = normalizePreCheckoutRoutingItems(body.items);

  if ("error" in itemNormalization) {
    return jsonError(
      itemNormalization.error ?? "Invalid checkout inventory.",
      400,
    );
  }

  const routingItems = itemNormalization.items;

  const destinationAddress = getPreCheckoutRoutingAddress(body.customer);

  if (!destinationAddress) {
    return jsonError("Please enter a delivery address before checking out.", 400);
  }

  const requestedDeliveryMode =
    body.delivery?.mode === "scheduled" ? "SCHEDULED" : "NOW";
  const checkoutId = randomUUID();
  let evaluation: IsoChronosPreCheckoutEvaluation;

  try {
    evaluation = await evaluateWithIsoChronos({
      checkoutId,
      destinationAddress,
      items: routingItems,
      requestedDeliveryMode,
    });
  } catch {
    return jsonError(
      "Unable to check delivery eligibility right now. Please try again.",
      502,
    );
  }

  if (!evaluation.accepted) {
    return Response.json({
      accepted: false,
      decision: evaluation.decision,
      message:
        evaluation.customerMessage ??
        "Sorry, BayBlaze cannot reasonably fulfill this delivery yet. We are actively working to expand our coverage area.",
      reason: evaluation.reason,
    });
  }

  const token = createPreCheckoutRoutingToken({
    customer: body.customer ?? {},
    delivery: body.delivery,
    evaluation,
    items: routingItems,
  });

  return Response.json({
    accepted: true,
    confirmation: {
      title: evaluation.confirmation?.title ?? "Confirm delivery details",
      requirements:
        evaluation.confirmation?.requirements?.length
          ? evaluation.confirmation.requirements
          : [
              "Confirm the delivery address is correct.",
              "Confirm you will be present at the estimated delivery time.",
              "Confirm you will have your physical ID on hand when the driver arrives.",
            ],
    },
    decision: evaluation.decision,
    estimatedMinutes: evaluation.routingContext?.routeScore?.durationMinutes,
    message:
      evaluation.customerMessage ??
      "BayBlaze can accept this checkout if you confirm the delivery details before age verification.",
    token,
  });
}

async function evaluateWithIsoChronos({
  checkoutId,
  destinationAddress,
  items,
  requestedDeliveryMode,
}: {
  checkoutId: string;
  destinationAddress: string;
  items: NormalizedPreCheckoutRoutingItem[];
  requestedDeliveryMode: "NOW" | "SCHEDULED";
}) {
  const headers = new Headers({
    "content-type": "application/json",
  });

  if (isochronosAdminToken) {
    headers.set("authorization", `Bearer ${isochronosAdminToken}`);
  }

  const response = await fetch(
    `${isochronosBaseUrl}/routing/pre-checkout/eligibility`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        checkoutId,
        destination: {
          address: destinationAddress,
        },
        items,
        requestedDeliveryMode,
        promisedWindowMinutes:
          requestedDeliveryMode === "NOW" ? 60 : undefined,
        priority: "NORMAL",
        createdAt: new Date().toISOString(),
      }),
      cache: "no-store",
    },
  );

  const data = (await response.json().catch(() => ({}))) as
    | IsoChronosPreCheckoutEvaluation
    | { error?: string; message?: string };

  if (!response.ok) {
    throw new Error(
      "error" in data
        ? data.error ?? data.message ?? "IsoChronos routing failed."
        : "IsoChronos routing failed.",
    );
  }

  return data as IsoChronosPreCheckoutEvaluation;
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
