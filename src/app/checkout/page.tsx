import type { Metadata } from "next";

import CheckoutPageClient from "./CheckoutPageClient";

export const metadata: Metadata = {
  title: "Checkout | Bayblaze",
  description: "Complete your Bayblaze local delivery checkout.",
};

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}