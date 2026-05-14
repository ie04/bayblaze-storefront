import { cookies } from "next/headers";

import {
  CUSTOMER_TOKEN_COOKIE,
  retrieveOrderByReference,
} from "@/app/lib/medusa-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;

  try {
    const order = await retrieveOrderByReference(orderId, token);

    return Response.json({ order });
  } catch {
    return Response.json(
      { error: "Order not found." },
      { status: 404 },
    );
  }
}
