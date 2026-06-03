import type { CustomerOrder, CustomerOrderItem } from "@/app/lib/medusa-auth";

export const RECENT_ORDER_STORAGE_KEY = "bayblaze-recent-order";

export type OrderGroups = {
  completedOrders: CustomerOrder[];
  pendingOrders: CustomerOrder[];
};

export type OrdersResponse = {
  orders?: CustomerOrder[];
  error?: string;
};

export function isCustomerOrder(value: unknown): value is CustomerOrder {
  if (!value || typeof value !== "object") {
    return false;
  }

  return typeof (value as { id?: unknown }).id === "string";
}

export function getOrderReference(order?: CustomerOrder | null) {
  if (!order) {
    return "";
  }

  if (order.custom_display_id) {
    return order.custom_display_id;
  }

  if (order.display_id !== null && order.display_id !== undefined) {
    return String(order.display_id);
  }

  return order.id.slice(-8).toUpperCase();
}

export function getOrderTrackingHref(order?: CustomerOrder | null) {
  const reference = getOrderReference(order);

  return reference ? `/orders/${encodeURIComponent(reference)}` : "";
}

export function formatOrderNumber(order: CustomerOrder) {
  return `#${getOrderReference(order)}`;
}

export function formatOrderStatus(status?: string | null) {
  if (!status) {
    return "Pending";
  }

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getScheduledDeliveryDisplay(order: CustomerOrder) {
  const display = order.metadata?.scheduled_delivery_display;

  return typeof display === "string" && display.trim() ? display : "";
}

export function formatOrderDate(date?: string | null) {
  if (!date) {
    return "Just now";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(parsedDate);
}

export function formatOrderTotal(total?: number | null, currencyCode = "usd") {
  if (typeof total !== "number") {
    return "Total pending";
  }

  return new Intl.NumberFormat("en-US", {
    currency: currencyCode.toUpperCase(),
    style: "currency",
  }).format(total);
}

export function getOrderItemTitle(item: CustomerOrderItem) {
  return item.title ?? item.product_title ?? "Product";
}

export function getVariantLabel(item: CustomerOrderItem) {
  if (!item.variant_title || item.variant_title === "Default Variant") {
    return "";
  }

  return item.variant_title;
}

export function getOrderItemTotal(item: CustomerOrderItem) {
  if (typeof item.total === "number") {
    return item.total;
  }

  if (typeof item.unit_price !== "number" || typeof item.quantity !== "number") {
    return null;
  }

  return item.unit_price * item.quantity;
}

export function getOrderTimestamp(order: CustomerOrder) {
  if (!order.created_at) {
    return 0;
  }

  const timestamp = Date.parse(order.created_at);

  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function isCompletedOrder(order: CustomerOrder) {
  return ["archived", "canceled", "completed"].includes(order.status ?? "");
}

export function sortOrdersByNewest(orders: CustomerOrder[]) {
  return [...orders].sort((firstOrder, secondOrder) => {
    return getOrderTimestamp(secondOrder) - getOrderTimestamp(firstOrder);
  });
}

export function groupOrdersByLifecycle(orders: CustomerOrder[]): OrderGroups {
  const sortedOrders = sortOrdersByNewest(orders);

  return {
    completedOrders: sortedOrders.filter(isCompletedOrder),
    pendingOrders: sortedOrders.filter((order) => !isCompletedOrder(order)),
  };
}

export function mergeOrderLists(
  priorityOrders: CustomerOrder[],
  fallbackOrders: CustomerOrder[],
) {
  const mergedOrders = new Map<string, CustomerOrder>();

  for (const order of [...priorityOrders, ...fallbackOrders]) {
    if (order.id && !mergedOrders.has(order.id)) {
      mergedOrders.set(order.id, order);
    }
  }

  return sortOrdersByNewest([...mergedOrders.values()]);
}

export function getOrderRecipient(order: CustomerOrder) {
  const address = order.shipping_address;
  const name = [address?.first_name, address?.last_name]
    .filter(Boolean)
    .join(" ");

  return name || order.email || "Bayblaze customer";
}

export function formatDeliveryAddress(order: CustomerOrder) {
  const address = order.shipping_address;

  if (!address) {
    return "Address unavailable";
  }

  return [
    address.address_1,
    address.address_2,
    [address.city, address.province].filter(Boolean).join(", "),
    address.postal_code,
  ]
    .filter(Boolean)
    .join(" ");
}
