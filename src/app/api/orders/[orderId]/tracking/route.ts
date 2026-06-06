import { formatDeliveryAddress, getOrderReference } from "@/app/domain/orders";
import { getCustomerToken } from "@/app/lib/customer-session";
import {
  retrieveOrderByReference,
  type CustomerOrder,
} from "@/app/lib/medusa-auth";

type IsoChronosTrackingResponse = {
  tracking?: unknown;
};

const isochronosBaseUrl =
  process.env.ISOCHRONOS_BASE_URL?.replace(/\/$/, "") ||
  process.env.ISOCHRONOS_API_URL?.replace(/\/$/, "") ||
  "";

const isochronosAdminToken = process.env.ISOCHRONOS_ADMIN_TOKEN?.trim() || "";
const isochronosTrackingPath =
  process.env.ISOCHRONOS_ORDER_TRACKING_PATH ?? "/orders/live-tracking";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await context.params;
  const customerToken = await getCustomerToken();
  const order = await retrieveOrderByReference(orderId, customerToken).catch(
    () => null,
  );

  if (!order) {
    return Response.json({ error: "Order not found." }, { status: 404 });
  }

  const orderReference = getOrderReference(order) || order.id;
  const driverUid = getAssignedDriverUid(order);
  const customerLocation = getCustomerLocation(order);
  const customerAddress = formatDeliveryAddress(order);

  if (!driverUid) {
    return Response.json({
      tracking: {
        orderId: order.id,
        orderReference,
        status: "awaiting_assignment",
        message: "Driver assignment pending.",
        customerLocation: customerLocation
          ? { ...customerLocation, address: customerAddress }
          : null,
      },
    });
  }

  if (!isochronosBaseUrl || !isochronosAdminToken) {
    return Response.json({
      tracking: {
        orderId: order.id,
        orderReference,
        driverUid,
        status: "tracking_unavailable",
        message: "Live tracking is not configured yet.",
        customerLocation: customerLocation
          ? { ...customerLocation, address: customerAddress }
          : null,
      },
    });
  }

  const response = await fetch(
    new URL(isochronosTrackingPath, isochronosBaseUrl),
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${isochronosAdminToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        orderId: order.id,
        orderReference,
        driverUid,
        destination: customerLocation
          ? { ...customerLocation, address: customerAddress }
          : undefined,
        customerAddress,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return Response.json({
      tracking: {
        orderId: order.id,
        orderReference,
        driverUid,
        status: "tracking_unavailable",
        message: "Live tracking could not be loaded right now.",
        customerLocation: customerLocation
          ? { ...customerLocation, address: customerAddress }
          : null,
      },
    });
  }

  const payload = (await response.json()) as IsoChronosTrackingResponse;
  return Response.json(payload);
}

function getAssignedDriverUid(order: CustomerOrder) {
  const metadata = order.metadata ?? {};

  return readString(
    metadata.driverUid,
    metadata.driver_uid,
    metadata.assignedDriverUid,
    metadata.assigned_driver_uid,
  );
}

function getCustomerLocation(order: CustomerOrder) {
  const metadata = order.metadata ?? {};
  const lat = readNumber(
    metadata.address_validation_latitude,
    metadata.delivery_latitude,
    metadata.customer_latitude,
    metadata.latitude,
  );
  const lng = readNumber(
    metadata.address_validation_longitude,
    metadata.delivery_longitude,
    metadata.customer_longitude,
    metadata.longitude,
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function readString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readNumber(...values: unknown[]) {
  for (const value of values) {
    const number = typeof value === "number" ? value : Number(value);

    if (Number.isFinite(number)) {
      return number;
    }
  }

  return null;
}
