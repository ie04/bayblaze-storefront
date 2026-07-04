export type CheckoutPromoCodePreview = {
  category: string;
  code: string;
  discountAmountCents: number;
  discountPercent: number;
  eligible: boolean;
  minimumSpendCents: number;
  ownerUid: string;
  subtotalCents: number;
  usageLimit: number;
  usedCount: number;
};

export function normalizeCheckoutPromoCode(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80).toUpperCase()
    : "";
}

export function moneyToCents(amount: number) {
  return Math.max(0, Math.round(amount * 100));
}

export function centsToMoney(cents: number) {
  return Math.round(Math.max(0, cents)) / 100;
}

export function getCheckoutPromoDiscountAmount(
  subtotal: number,
  promo?: CheckoutPromoCodePreview | null,
) {
  if (!promo?.eligible) {
    return 0;
  }

  return centsToMoney(promo.discountAmountCents);
}

export function getCheckoutPromoMetadata({
  discountAmount,
  promo,
  subtotal,
  totalAfterDiscount,
}: {
  discountAmount: number;
  promo?: CheckoutPromoCodePreview | null;
  subtotal: number;
  totalAfterDiscount: number;
}) {
  if (!promo?.eligible || discountAmount <= 0) {
    return {};
  }

  return {
    checkout_promo_category: promo.category,
    checkout_promo_code: promo.code,
    checkout_promo_discount_amount: discountAmount,
    checkout_promo_discount_percent: promo.discountPercent,
    checkout_promo_minimum_spend_cents: promo.minimumSpendCents,
    checkout_promo_status: "applied",
    checkout_promo_subtotal: subtotal,
    checkout_promo_total_after_discount: totalAfterDiscount,
  };
}

export function getOrderCheckoutPromoTotal(order: {
  metadata?: Record<string, unknown> | null;
  total?: number | null;
}) {
  const metadataTotal = order.metadata?.checkout_promo_total_after_discount;

  if (typeof metadataTotal === "number" && Number.isFinite(metadataTotal)) {
    return metadataTotal;
  }

  return null;
}
