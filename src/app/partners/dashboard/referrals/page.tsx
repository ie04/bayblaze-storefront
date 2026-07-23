import type { Metadata } from "next";

import { getPartnerPortalSession } from "@/app/partners/lib/partner-portal-adapter";
import ReferralList from "./ReferralList";

export const metadata: Metadata = { title: "Referrals | BayBlaze Partners" };

export default async function PartnerReferralsPage() {
  const result = await getPartnerPortalSession();
  if (result.status !== "available") return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9">
      <header><p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ast-global-color-1)]">Referrals</p><h1 className="mt-1 text-3xl font-black uppercase leading-none sm:text-4xl">Who your code reached.</h1><p className="mt-2 max-w-2xl text-sm font-medium leading-[1.55] text-[#585858]">Customer identifiers stay private while order and commission progress remain easy to follow.</p></header>
      <ReferralList referrals={result.data.referrals} />
    </div>
  );
}
