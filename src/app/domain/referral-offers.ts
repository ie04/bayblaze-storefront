export const FIRST_ORDER_QR_OFFER_CODE = "first30";
export const REFERRAL_OFFER_COOKIE = "bayblaze_referral_offer";
export const REFERRAL_OFFER_STORAGE_KEY = "bayblaze-referral-offer";

export type ReferralOffer = {
  code: typeof FIRST_ORDER_QR_OFFER_CODE;
  discountPercent: 30;
  label: string;
  source: "qr";
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

export function getReferralOfferFromSearchParams(searchParams: URLSearchParams) {
  for (const key of acceptedQueryKeys) {
    const value = searchParams.get(key)?.trim().toLowerCase();

    if (value && acceptedQueryValues.includes(value)) {
      return getFirstOrderQrOffer();
    }
  }

  return null;
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

      if (
        parsed.code === FIRST_ORDER_QR_OFFER_CODE &&
        parsed.discountPercent === 30 &&
        parsed.source === "qr"
      ) {
        return getFirstOrderQrOffer();
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

  return parseReferralOffer(cookieValue);
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
  if (!offer) {
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
  if (!offer || discountAmount <= 0) {
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
