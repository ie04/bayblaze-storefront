export const FIRST_ORDER_QR_OFFER_CODE = "first30";
export const REFERRAL_OFFER_COOKIE = "bayblaze_referral_offer";
export const REFERRAL_OFFER_STORAGE_KEY = "bayblaze-referral-offer";

export type ReferralOfferSource = "qr" | "admin_promo";

export type ReferralOffer = {
  code: string;
  discountPercent: number;
  label: string;
  source: ReferralOfferSource;
};

const acceptedQueryKeys = ["promo", "qr", "discount", "offer", "ref"];
const acceptedQueryValues = [
  FIRST_ORDER_QR_OFFER_CODE,
  "first-order-30",
  "firstorder30",
  "first-order",
  "qr30",
];

export function getFirstOrderQrOffer(): ReferralOffer {
  return {
    code: FIRST_ORDER_QR_OFFER_CODE,
    discountPercent: 30,
    label: "30% off your first order",
    source: "qr",
  };
}

export function createAdminPromoReferralOffer({
  code,
  discountPercent,
}: {
  code: string;
  discountPercent: number;
}): ReferralOffer | null {
  const normalizedCode = normalizeReferralPromoCode(code);
  const normalizedDiscountPercent = normalizeDiscountPercent(discountPercent);

  if (!normalizedCode || normalizedDiscountPercent === null) {
    return null;
  }

  return {
    code: normalizedCode,
    discountPercent: normalizedDiscountPercent,
    label: `${formatDiscountPercent(normalizedDiscountPercent)} off with ${normalizedCode}`,
    source: "admin_promo",
  };
}

export function getReferralOfferFromSearchParams(searchParams: URLSearchParams) {
  for (const key of acceptedQueryKeys) {
    const value = searchParams.get(key);

    if (isFirstOrderQrOfferCode(value)) {
      return getFirstOrderQrOffer();
    }
  }

  return null;
}

export function isFirstOrderQrOfferCode(value: unknown) {
  return typeof value === "string" && acceptedQueryValues.includes(value.trim().toLowerCase());
}

export function isFirstOrderReferralOffer(offer?: ReferralOffer | null) {
  return Boolean(
    offer &&
      offer.source === "qr" &&
      isFirstOrderQrOfferCode(offer.code) &&
      offer.discountPercent === 30,
  );
}

export function getFirstOrderQrPromoUrl({
  landingPath = "/",
  origin,
}: {
  landingPath?: string;
  origin: string;
}) {
  const url = new URL(normalizeLandingPath(landingPath), origin);

  url.searchParams.set("promo", FIRST_ORDER_QR_OFFER_CODE);

  return url.toString();
}

export function serializeReferralOffer(offer: ReferralOffer) {
  return JSON.stringify(offer);
}

export function parseReferralOffer(value?: string | null) {
  if (!value) {
    return null;
  }

  for (const candidate of [value, safelyDecodeURIComponent(value)]) {
    if (!candidate) {
      continue;
    }

    try {
      const parsed = JSON.parse(candidate) as Partial<ReferralOffer>;

      if (isFirstOrderReferralOffer(parsed as ReferralOffer)) {
        return getFirstOrderQrOffer();
      }

      if (parsed.source === "admin_promo") {
        const offer = createAdminPromoReferralOffer({
          code: String(parsed.code || ""),
          discountPercent: Number(parsed.discountPercent),
        });

        if (offer) {
          return offer;
        }
      }
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

export function getReferralOfferFromCookieHeader(cookieHeader?: string | null) {
  const cookieValue = cookieHeader
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${REFERRAL_OFFER_COOKIE}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  const offer = parseReferralOffer(cookieValue);

  return isFirstOrderReferralOffer(offer) ? offer : null;
}

export function getReferralOfferDiscountAmount(subtotal: number, offer?: ReferralOffer | null) {
  if (!offer || subtotal <= 0) {
    return 0;
  }

  return roundMoney(subtotal * (offer.discountPercent / 100));
}

export function getReferralOfferTotal(subtotal: number, offer?: ReferralOffer | null) {
  return roundMoney(Math.max(0, subtotal - getReferralOfferDiscountAmount(subtotal, offer)));
}

export function getReferralOfferCustomerMetadata(offer?: ReferralOffer | null) {
  if (!isFirstOrderReferralOffer(offer)) {
    return {};
  }

  return {
    referral_offer_code: offer.code,
    referral_offer_discount_percent: offer.discountPercent,
    referral_offer_source: offer.source,
    referral_offer_status: "claimed",
  };
}

export function getReferralOfferOrderMetadata({
  discountAmount,
  offer,
  subtotal,
  totalAfterDiscount,
}: {
  discountAmount: number;
  offer?: ReferralOffer | null;
  subtotal: number;
  totalAfterDiscount: number;
}) {
  if (!isFirstOrderReferralOffer(offer) || discountAmount <= 0) {
    return {};
  }

  return {
    first_order_offer_code: offer.code,
    first_order_offer_discount_amount: discountAmount,
    first_order_offer_discount_percent: offer.discountPercent,
    first_order_offer_source: offer.source,
    first_order_offer_status: "applied",
    first_order_offer_subtotal: subtotal,
    first_order_offer_total_after_discount: totalAfterDiscount,
  };
}

export function getOrderFirstOrderOfferTotal(order: {
  metadata?: Record<string, unknown> | null;
  total?: number | null;
}) {
  const metadataTotal = order.metadata?.first_order_offer_total_after_discount;

  if (typeof metadataTotal === "number" && Number.isFinite(metadataTotal)) {
    return metadataTotal;
  }

  return typeof order.total === "number" ? order.total : null;
}

export function normalizeReferralPromoCode(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80).toUpperCase()
    : "";
}

function normalizeDiscountPercent(value: unknown) {
  const number = typeof value === "number" || typeof value === "string" ? Number(value) : Number.NaN;

  if (!Number.isFinite(number) || number <= 0 || number > 100) {
    return null;
  }

  return Math.round(number * 100) / 100;
}

function formatDiscountPercent(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(2)}%`;
}

function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

function safelyDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return "";
  }
}

function normalizeLandingPath(path: string) {
  const trimmedPath = path.trim();

  if (!trimmedPath || trimmedPath.startsWith("//")) {
    return "/";
  }

  if (trimmedPath.startsWith("http://") || trimmedPath.startsWith("https://")) {
    try {
      const url = new URL(trimmedPath);
      return `${url.pathname}${url.search}${url.hash}`;
    } catch {
      return "/";
    }
  }

  return trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
}
