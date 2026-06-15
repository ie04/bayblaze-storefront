import { getOrderLifecycleStatus } from "@/app/domain/orders";
import { getCustomerToken } from "@/app/lib/customer-session";
import { retrieveOrderByReference } from "@/app/lib/medusa-auth";

const bayblazeApiUrl = process.env.BAYBLAZE_API_URL?.replace(/\/$/, "") || "";
const bayblazeApiToken = process.env.BAYBLAZE_API_SERVICE_TOKEN?.trim() || "";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const token = await getCustomerToken();

  try {
    const order = await retrieveOrderByReference(orderId, token);

    return Response.json({ order });
  } catch {
    return Response.json(
      { error: "Order not found." },
      { status: 404 },
    );
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const token = await getCustomerToken();
  const order = await retrieveOrderByReference(orderId, token).catch(() => null);

  if (!order) {
    return Response.json(
      { error: "Order not found." },
      { status: 404 },
    );
  }

  if (["completed", "canceled"].includes(getOrderLifecycleStatus(order))) {
    return Response.json(
      { error: "This order can no longer be canceled." },
      { status: 409 },
    );
  }

  if (!bayblazeApiUrl || !bayblazeApiToken) {
    return Response.json(
      { error: "Order cancellation is not configured." },
      { status: 503 },
    );
  }

  const response = await fetch(
    `${bayblazeApiUrl}/v1/orders/${encodeURIComponent(order.id)}/cancel`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${bayblazeApiToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ orderReference: orderId }),
      cache: "no-store",
    },
  );
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return Response.json(
      {
        error:
          readString(payload?.message, payload?.error) ||
          "Order cancellation failed.",
      },
      { status: response.status },
    );
  }

  return Response.json({
    canceled: true,
    orderId: order.id,
    result: payload,
  });
}

function readString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}
