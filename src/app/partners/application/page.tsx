import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/app/components/layout/Header";
import { getBayBlazeAccountFromSession } from "@/app/lib/customer-session";
import PartnerApplicationAction from "./PartnerApplicationAction";

export const metadata: Metadata = { title: "Apply | BayBlaze Partners" };

export default async function PartnerApplicationPage() {
  const account = await getBayBlazeAccountFromSession();
  if (!account) redirect("/login?redirect=/partners/application");

  return (
    <main className="min-h-screen bg-[var(--ast-global-color-4)] text-black">
      <Header surface="solid" />
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <nav aria-label="Breadcrumb" className="text-xs font-black uppercase tracking-widest text-[#585858]"><Link href="/partners">Partners</Link> / Apply</nav>
        <div className="bayblaze-sharp-card mt-5 bg-white p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ast-global-color-1)]">Local partner application</p>
          <h1 className="mt-2 text-3xl font-black uppercase leading-none sm:text-4xl">Let’s see if it fits.</h1>
          <p className="mt-4 text-sm font-medium leading-[1.65] text-[#585858]">Apply with <strong className="text-black">{account.email}</strong>. BayBlaze will review the partnership, choose the discount and commission terms with you, and activate one stable referral code if approved.</p>
          <ul className="my-6 space-y-2 border-y-2 border-black py-5 text-sm font-semibold">
            <li>• No automatic approval or earnings before activation</li>
            <li>• One partner profile and referral code per BayBlaze account</li>
            <li>• Payout setup is handled directly with BayBlaze for now</li>
          </ul>
          <PartnerApplicationAction />
        </div>
      </section>
    </main>
  );
}
