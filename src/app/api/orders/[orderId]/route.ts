import { getCustomerToken } from "@/app/lib/customer-session";
import { retrieveOrderByReference } from "@/app/lib/medusa-auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const token = await getCustomerToken();

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
