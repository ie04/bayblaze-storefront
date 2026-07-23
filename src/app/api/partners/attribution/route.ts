import { cookies } from "next/headers";

import { PARTNER_ATTRIBUTION_COOKIE } from "@/app/domain/partner-attribution";
import { BayBlazeApiError, bayblazeApiRequest } from "@/app/lib/bayblaze-account";

type AttributionResponse = {
  attributionToken: string;
  code: string;
  discountPercent: number;
  expiresAt: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { code?: unknown; sourcePath?: unknown };
    const cookieStore = await cookies();
    const attribution = await bayblazeApiRequest<AttributionResponse>("/v1/partners/attributions", {
      body: {
        code: typeof body.code === "string" ? body.code : "",
        existingToken: cookieStore.get(PARTNER_ATTRIBUTION_COOKIE)?.value,
        sourcePath: typeof body.sourcePath === "string" ? body.sourcePath : "/",
      },
      method: "POST",
    });
    const expiresAt = new Date(attribution.expiresAt);
    cookieStore.set(PARTNER_ATTRIBUTION_COOKIE, attribution.attributionToken, {
      expires: expiresAt,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return Response.json({
      attributed: true,
      code: attribution.code,
      discountPercent: attribution.discountPercent,
      expiresAt: attribution.expiresAt,
    });
  } catch (caught) {
    const status = caught instanceof BayBlazeApiError ? caught.status : 502;
    return Response.json(
      { message: status === 404 ? "That partner referral is not active." : "Referral tracking is temporarily unavailable." },
      { status },
    );
  }
}
