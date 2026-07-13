import { connection } from "next/server";

export type PublicStorefrontSettings = {
  ageVerificationDisabled: boolean;
  priceAdjustmentCents: number;
};

export async function getPublicStorefrontSettings(): Promise<PublicStorefrontSettings> {
  await connection();

  const fallbackPriceAdjustmentCents = normalizePriceAdjustmentCents(
    process.env.NEXT_PUBLIC_BAYBLAZE_PRICE_ADJUSTMENT_CENTS,
  );
  const bayblazeApiUrl =
    process.env.BAYBLAZE_API_URL?.trim().replace(/\/$/, "") ??
    "https://api.bayblaze.net";

  try {
    const response = await fetch(`${bayblazeApiUrl}/v1/storefront/settings`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ageVerificationDisabled: false,
        priceAdjustmentCents: fallbackPriceAdjustmentCents,
      };
    }

    const payload = (await response.json()) as {
      settings?: {
        ageVerificationDisabled?: unknown;
        priceAdjustmentCents?: unknown;
      };
    };

    return {
      ageVerificationDisabled: payload.settings?.ageVerificationDisabled === true,
      priceAdjustmentCents: normalizePriceAdjustmentCents(
        payload.settings?.priceAdjustmentCents,
      ),
    };
  } catch {
    return {
      ageVerificationDisabled: false,
      priceAdjustmentCents: fallbackPriceAdjustmentCents,
    };
  }
}

function normalizePriceAdjustmentCents(value: unknown) {
  const number = typeof value === "number" || typeof value === "string"
    ? Number(value)
    : Number.NaN;

  if (!Number.isInteger(number) || number < 0) {
    return 0;
  }

  return number;
}
