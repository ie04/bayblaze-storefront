import type { Metadata } from "next";

import LegalPage from "@/app/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Bayblaze",
  description: "Bayblaze privacy policy.",
};

const privacySections = [
  {
    title: "Information We Collect",
    body: [
      "We collect information you provide when you create an account, place an order, request delivery, or contact Bayblaze, including your name, email address, phone number, delivery address, order details, and customer support messages.",
      "We may also collect basic storefront usage information such as device, browser, and site interaction data to operate, secure, and improve the website.",
    ],
  },
  {
    title: "How We Use Information",
    body: [
      "We use personal information to operate the storefront, process and fulfill orders, coordinate delivery, provide order updates, support customer accounts, respond to requests, prevent misuse, and comply with applicable legal obligations.",
    ],
  },
  {
    title: "Sharing",
    body: [
      "We may share information with service providers that help us run the storefront, communicate with customers, fulfill orders, support delivery operations, host data, detect fraud, or meet legal and compliance obligations.",
      "Bayblaze does not sell customer personal information.",
    ],
  },
  {
    title: "Your Choices",
    body: [
      "You may contact us to request help accessing, correcting, or deleting personal information associated with your Bayblaze account or orders, subject to order records, safety, fraud-prevention, and legal retention requirements.",
    ],
  },
  {
    title: "Contact",
    body: [
      "For privacy questions, contact Bayblaze at contact@bayblaze.net.",
    ],
  },
];

export default function Page() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="This policy explains how Bayblaze handles information collected through the storefront."
      updatedAt="May 27, 2026"
      sections={privacySections}
    />
  );
}
