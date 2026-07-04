import { NextResponse } from "next/server";

import {
  getBayBlazeAccountToken,
  previewBayBlazeDiscountCode,
  previewPublicBayBlazeDiscountCode,
} from "@/app/lib/bayblaze-account";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      code?: unknown;
      subtotalCents?: unknown;
    };
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const subtotalCents =
      typeof body.subtotalCents === "number" && Number.isInteger(body.subtotalCents)
        ? body.subtotalCents
        : undefined;

    if (!code) {
      return NextResponse.json(
        { message: "Enter a promo code." },
        { status: 400 },
      );
    }

    const token = await getBayBlazeAccountToken();

    return NextResponse.json(
      token
        ? await previewBayBlazeDiscountCode(token, {
            code,
            subtotalCents,
          })
        : await previewPublicBayBlazeDiscountCode({
            code,
            subtotalCents,
          }),
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
