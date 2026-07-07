import { NextResponse } from "next/server";

import {
  getBayBlazeAccountToken,
  previewBayBlazeDiscountCode,
  previewPublicBayBlazeDiscountCode,
  type BayBlazeDiscountCodePreviewItem,
} from "@/app/lib/bayblaze-account";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      code?: unknown;
      items?: unknown;
      subtotalCents?: unknown;
    };
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const subtotalCents =
      typeof body.subtotalCents === "number" && Number.isInteger(body.subtotalCents)
        ? body.subtotalCents
        : undefined;
    const items = normalizePreviewItems(body.items);

    if (!code) {
      return NextResponse.json(
        { message: "Enter a promo code." },
        { status: 400 },
      );
    }

    const token = await getBayBlazeAccountToken();
    const payload = {
      code,
      ...(items.length ? { items } : {}),
      subtotalCents,
    };

    return NextResponse.json(
      token
        ? await previewBayBlazeDiscountCode(token, payload)
        : await previewPublicBayBlazeDiscountCode(payload),
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "That promo code could not be applied.",
      },
      { status: 400 },
    );
  }
}

function normalizePreviewItems(value: unknown): BayBlazeDiscountCodePreviewItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const quantity = Number((item as Partial<BayBlazeDiscountCodePreviewItem>).quantity);
      const unitPriceCents = Number((item as Partial<BayBlazeDiscountCodePreviewItem>).unitPriceCents);

      if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isInteger(unitPriceCents) || unitPriceCents <= 0) {
        return null;
      }

      return { quantity, unitPriceCents };
    })
    .filter((item): item is BayBlazeDiscountCodePreviewItem => item !== null);
}