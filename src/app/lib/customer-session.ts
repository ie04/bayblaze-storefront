import { cookies } from "next/headers";

import { CUSTOMER_TOKEN_COOKIE } from "@/app/lib/medusa-auth";

export async function getCustomerToken() {
  const cookieStore = await cookies();

  return cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;
}
