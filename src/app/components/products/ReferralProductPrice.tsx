"use client";

import { useReferralOffer } from "@/app/components/referral/ReferralOfferProvider";

export default function ReferralProductPrice({
  currentPrice,
  originalPrice,
}: {
  currentPrice: string;
  originalPrice?: string;
}) {
  const { offer } = useReferralOffer();
  const numericCurrentPrice = parseMoney(currentPrice);

  if (offer && numericCurrentPrice !== null) {
    const discountedPrice = roundMoney(
      numericCurrentPrice * (1 - offer.discountPercent / 100),
    );

    return (
      <>
        <del className="mr-2 text-[#7a7a7a]">{currentPrice}</del>
        <ins
          className="text-[var(--ast-global-color-1)] no-underline"
          title={`${offer.discountPercent}% promotional discount applied`}
        >
          {formatMoney(discountedPrice)}
        </ins>
      </>
    );
  }

  if (originalPrice) {
    return (
      <>
        <del className="mr-2 text-[#7a7a7a]">{originalPrice}</del>
        <ins className="no-underline">{currentPrice}</ins>
      </>
    );
  }

  return <span>{currentPrice}</span>;
}

function parseMoney(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));

  return Number.isFinite(parsed) ? parsed : null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}
