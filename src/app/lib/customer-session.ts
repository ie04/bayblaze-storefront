import { cookies } from "next/headers";

import { CUSTOMER_TOKEN_COOKIE } from "@/app/lib/medusa-auth";
import {
  BAYBLAZE_ACCOUNT_TOKEN_COOKIE,
  retrieveBayBlazeAccount,
} from "@/app/lib/bayblaze-account";

export async function getCustomerToken() {
  const cookieStore = await cookies();

  return cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;
}

export async function getBayBlazeAccountFromSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(BAYBLAZE_ACCOUNT_TOKEN_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return retrieveBayBlazeAccount(token).catch(() => null);
}
