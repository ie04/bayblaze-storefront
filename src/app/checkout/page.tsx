import type { Metadata } from "next";

import {
  getBayBlazeAccountFromSession,
  getCustomerToken,
} from "@/app/lib/customer-session";
import { retrieveCustomer } from "@/app/lib/medusa-auth";
import CheckoutPageClient from "./CheckoutPageClient";

export const metadata: Metadata = {
  title: "Checkout | Bayblaze",
  description: "Complete your Bayblaze local delivery checkout.",
};

export default async function CheckoutPage() {
  const token = await getCustomerToken();
  const [account, customer] = await Promise.all([
    getBayBlazeAccountFromSession(),
    token ? retrieveCustomer(token).catch(() => undefined) : undefined,
  ]);

  return (
    <CheckoutPageClient
      accountAgeVerificationDisabled={account?.settings.ageVerificationDisabled === true}
      accountEmail={account?.email}
      customer={customer}
    />
  );
}
