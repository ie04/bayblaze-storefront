import { cookies } from "next/headers";

import {
  CUSTOMER_TOKEN_COOKIE,
  retrieveCustomerOrders,
} from "@/app/lib/medusa-auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;

  if (!token) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const orders = await retrieveCustomerOrders(token);

    return Response.json({ orders });
  } catch {
    return Response.json(
      { error: "Unable to load orders right now." },
      { status: 502 },
    );
  }
}
