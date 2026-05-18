import { getCustomerToken } from "@/app/lib/customer-session";
import { retrieveCustomerOrders } from "@/app/lib/medusa-auth";

export async function GET() {
  const token = await getCustomerToken();

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
