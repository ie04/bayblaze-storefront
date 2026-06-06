export const PRE_CHECKOUT_ROUTING_PROVIDER = "isochronos";

export type InventoryLocationState = "ON_VEHICLE" | "IN_WAREHOUSE";

export type PreCheckoutRoutingCustomer = {
  address?: unknown;
  city?: unknown;
  state?: unknown;
  zip?: unknown;
};

export type PreCheckoutRoutingDelivery = {
  mode?: unknown;
  scheduled_at?: unknown;
};

export type PreCheckoutRoutingCartItemInput = {
  id?: unknown;
  productId?: unknown;
  variantId?: unknown;
  name?: unknown;
  quantity?: unknown;
  availableQuantity?: unknown;
  inventoryState?: unknown;
};

export type NormalizedPreCheckoutRoutingItem = {
  itemId: string;
  productId: string;
  variantId: string;
  title?: string;
  requestedQuantity: number;
  availableQuantity: number;
  inventoryState: InventoryLocationState;
};

export type PreCheckoutRoutingMetadata = {
  routing_provider?: typeof PRE_CHECKOUT_ROUTING_PROVIDER;
  routing_status?: "accepted" | "conditionally_accepted" | "manual_review";
  routing_decision?: string;
  routing_classification?: string;
  routing_fulfillment_mode?: string;
  routing_estimated_minutes?: number;
  routing_evaluated_at?: string;
};

export type IsoChronosPreCheckoutEvaluation = {
  accepted?: boolean;
  decision?: string;
  classification?: string;
  customerMessage?: string;
  reason?: string;
  confirmation?: {
    title?: string;
    requirements?: string[];
  };
  normalizedCandidate?: {
    destination?: {
      address?: string;
    };
  };
  routingContext?: {
    fulfillmentMode?: string;
    routeScore?: {
      durationMinutes?: number;
    };
  };
};

type NormalizeItemsResult =
  | {
      error: string;
      items?: never;
    }
  | {
      error?: never;
      items: NormalizedPreCheckoutRoutingItem[];
    };

const validInventoryStates = new Set<InventoryLocationState>([
  "ON_VEHICLE",
  "IN_WAREHOUSE",
]);

export function normalizePreCheckoutRoutingItems(
  items?: PreCheckoutRoutingCartItemInput[],
): NormalizeItemsResult {
  if (!items?.length) {
    return {
      error: "Add at least one product to your cart before placing an order.",
    };
  }

  const normalizedItems: NormalizedPreCheckoutRoutingItem[] = [];

  for (const item of items) {
    const itemLabel =
      typeof item.name === "string" && item.name.trim()
        ? item.name.trim()
        : "this item";
    const itemId = normalizeString(item.id);
    const productId = normalizeString(item.productId);
    const variantId = normalizeString(item.variantId);
    const title = normalizeString(item.name);
    const requestedQuantity = normalizePositiveInteger(item.quantity);
    const availableQuantity = normalizeNonNegativeInteger(item.availableQuantity);
    const inventoryState = item.inventoryState;

    if (!itemId || !productId || !variantId) {
      return {
        error: `Please re-add ${itemLabel} to your cart before checking out.`,
      };
    }

    if (
      typeof inventoryState !== "string" ||
      !validInventoryStates.has(inventoryState as InventoryLocationState)
    ) {
      return {
        error: `Please re-add ${itemLabel} to your cart so BayBlaze can verify delivery inventory.`,
      };
    }

    if (availableQuantity === undefined) {
      return {
        error: `Please re-add ${itemLabel} to your cart so BayBlaze can verify available inventory.`,
      };
    }

    if (requestedQuantity === undefined) {
      return {
        error: "Cart item quantities must be whole numbers greater than zero.",
      };
    }

    if (requestedQuantity > availableQuantity) {
      return {
        error: `${itemLabel} has only ${availableQuantity} available. Please update your cart quantity.`,
      };
    }

    normalizedItems.push({
      itemId,
      productId,
      variantId,
      title: title || undefined,
      requestedQuantity,
      availableQuantity,
      inventoryState: inventoryState as InventoryLocationState,
    });
  }

  return { items: normalizedItems };
}

export function getPreCheckoutRoutingAddress(
  customer?: PreCheckoutRoutingCustomer,
) {
  if (!customer) {
    return "";
  }

  const address = normalizeString(customer.address);
  const city = normalizeString(customer.city);
  const state = normalizeString(customer.state).toUpperCase();
  const zip = normalizeString(customer.zip);

  return [address, city, state, zip].filter(Boolean).join(", ");
}

export function getPreCheckoutRoutingFingerprint({
  customer,
  delivery,
  items,
}: {
  customer: PreCheckoutRoutingCustomer;
  delivery?: PreCheckoutRoutingDelivery;
  items: NormalizedPreCheckoutRoutingItem[];
}) {
  const addressFingerprint = [
    normalizeString(customer.address).toLowerCase(),
    normalizeString(customer.city).toLowerCase(),
    normalizeString(customer.state).toUpperCase(),
    normalizeString(customer.zip).replace(/\D/g, ""),
  ].join("|");
  const deliveryFingerprint = [
    normalizeString(delivery?.mode).toLowerCase(),
    normalizeString(delivery?.scheduled_at),
  ].join("|");
  const itemsFingerprint = [...items]
    .sort((first, second) => {
      return first.variantId.localeCompare(second.variantId);
    })
    .map((item) => {
      return [
        item.itemId,
        item.productId,
        item.variantId,
        item.requestedQuantity,
        item.availableQuantity,
        item.inventoryState,
      ].join(":");
    })
    .join(";");

  return [addressFingerprint, deliveryFingerprint, itemsFingerprint].join("||");
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNonNegativeInteger(value: unknown) {
  const integer = normalizeInteger(value);

  return integer !== undefined && integer >= 0 ? integer : undefined;
}

function normalizePositiveInteger(value: unknown) {
  const integer = normalizeInteger(value);

  return integer !== undefined && integer >= 1 ? integer : undefined;
}

function normalizeInteger(value: unknown) {
  if (typeof value === "string" && !value.trim()) {
    return undefined;
  }

  const number =
    typeof value === "number" || typeof value === "string"
      ? Number(value)
      : Number.NaN;

  return Number.isInteger(number) ? number : undefined;
}
