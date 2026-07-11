export type CheckoutPromoCodeType = "discount" | "bogo";

export type CheckoutPromoCodePreview = {
  amountNeededCents?: number;
  bogoBuyQuantity?: number;
  bogoDiscountedQuantity?: number;
  bogoFreeQuantity?: number;
  category: string;
  code: string;
  codeType?: CheckoutPromoCodeType;
  discountAmountCents: number;
  discountPercent: number;
  eligible: boolean;
  ineligibilityReason?: "minimum_spend";
  message?: string;
  minimumSpendCents: number;
  ownerUid?: string;
  singleUsePerAccount?: boolean;
  subtotalCents: number;
  usageLimit: number;
  usedCount: number;
};

export type CheckoutPromoPreviewItem = {
  quantity: number;
  unitPriceCents: number;
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

export function getCheckoutPromoMessage(promo: CheckoutPromoCodePreview) {
  if ((promo.codeType ?? "discount") === "bogo") {
    return promo.discountAmountCents > 0
      ? `Buy 1 get 1 free applied. ${promo.bogoDiscountedQuantity ?? 0} item${promo.bogoDiscountedQuantity === 1 ? "" : "s"} free.`
      : "Buy 1 get 1 free ready. Add at least 2 eligible items to get one free.";
  }

  return `${promo.discountPercent}% off applied.`;
}

export function getCheckoutPromoLabel(promo: CheckoutPromoCodePreview) {
  return (promo.codeType ?? "discount") === "bogo"
    ? `BOGO ${promo.code}`
    : `Promo ${promo.code}`;
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
    checkout_promo_bogo_buy_quantity: promo.bogoBuyQuantity ?? undefined,
    checkout_promo_bogo_discounted_quantity: promo.bogoDiscountedQuantity ?? undefined,
    checkout_promo_bogo_free_quantity: promo.bogoFreeQuantity ?? undefined,
    checkout_promo_category: promo.category,
    checkout_promo_code: promo.code,
    checkout_promo_code_type: promo.codeType ?? "discount",
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
