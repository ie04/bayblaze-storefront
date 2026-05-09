import type { Metadata } from "next";
import { cookies } from "next/headers";

import { CUSTOMER_TOKEN_COOKIE, retrieveCustomer } from "@/app/lib/medusa-auth";
import CheckoutPageClient from "./CheckoutPageClient";

export const metadata: Metadata = {
  title: "Checkout | Bayblaze",
  description: "Complete your Bayblaze local delivery checkout.",
};

export default async function CheckoutPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;
  const customer = token
    ? await retrieveCustomer(token).catch(() => undefined)
    : undefined;

  return <CheckoutPageClient customer={customer} />;
}
