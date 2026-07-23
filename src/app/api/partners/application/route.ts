import { BayBlazeApiError, bayblazeApiRequest, getBayBlazeAccountToken } from "@/app/lib/bayblaze-account";

export async function POST() {
  const token = await getBayBlazeAccountToken();
  if (!token) return Response.json({ message: "Sign in to apply." }, { status: 401 });

  try {
    return Response.json(await bayblazeApiRequest("/v1/partners/me/application", {
      body: {},
      method: "POST",
      token,
    }), { status: 201 });
  } catch (caught) {
    const status = caught instanceof BayBlazeApiError ? caught.status : 502;
    return Response.json({ message: status >= 500 ? "Application service is temporarily unavailable." : caught instanceof Error ? caught.message : "Application could not be submitted." }, { status });
  }
}
