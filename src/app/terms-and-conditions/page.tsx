import type { Metadata } from "next";

import LegalPage from "@/app/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms & Conditions | Bayblaze",
  description: "Bayblaze terms and conditions.",
};

const termsSections = [
  {
    title: "Acceptance",
    body: [
      "By using the Bayblaze storefront, creating an account, or placing an order, you agree to these terms and to all laws and rules that apply to your use of the storefront.",
    ],
  },
  {
    title: "Age and Eligibility",
    body: [
      "You must be at least 21 years old to order age-restricted products from Bayblaze. We may require a valid physical ID at delivery and may cancel or refuse an order when eligibility cannot be verified.",
    ],
  },
  {
    title: "Orders, Availability, and Pricing",
    body: [
      "Products, prices, delivery availability, and order details may change without notice. Order submission does not guarantee acceptance, availability, or delivery.",
      "Bayblaze may refuse, cancel, or adjust orders when products are unavailable, delivery cannot be completed, information is inaccurate, age cannot be verified, or fraud or misuse is suspected.",
    ],
  },
  {
    title: "Payment and Delivery",
    body: [
      "Unless otherwise stated during checkout, payment is due on delivery using the payment methods presented by Bayblaze. Delivery timing is an estimate and may vary due to availability, location, traffic, weather, demand, or operational constraints.",
    ],
  },
  {
    title: "Storefront Use",
    body: [
      "You agree not to misuse the storefront, interfere with its operation, submit false information, attempt unauthorized access, or use Bayblaze for any unlawful purpose.",
    ],
  },
  {
    title: "Contact",
    body: [
      "For questions about these terms, contact Bayblaze at contact@bayblaze.net.",
    ],
  },
];

export default function Page() {
  return (
    <LegalPage
      title="Terms & Conditions"
      description="These terms govern use of the Bayblaze storefront and online ordering experience."
      updatedAt="May 27, 2026"
      sections={termsSections}
    />
  );
}
