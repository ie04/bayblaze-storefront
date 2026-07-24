import { BayBlazeApiError, bayblazeApiRequest, getBayBlazeAccountToken } from "@/app/lib/bayblaze-account";

export async function POST(request: Request) {
  const token = await getBayBlazeAccountToken();
  if (!token) return Response.json({ message: "Sign in to create a partner account." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { acceptedTerms?: boolean };

  try {
    return Response.json(await bayblazeApiRequest("/v1/partners/me/enrollment", {
      body: { acceptedTerms: body.acceptedTerms },
      method: "POST",
      token,
    }), { status: 201 });
  } catch (caught) {
    const status = caught instanceof BayBlazeApiError ? caught.status : 502;
    return Response.json({
      message: status >= 500
        ? "Partner signup is temporarily unavailable."
        : caught instanceof Error
          ? caught.message
          : "Partner signup could not be completed.",
    }, { status });
  }
}
