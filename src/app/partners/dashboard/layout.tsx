import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/app/components/layout/Header";
import { getPartnerPortalSession } from "@/app/partners/lib/partner-portal-adapter";
import PartnerPortalNav from "./PartnerPortalNav";

export default async function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const result = await getPartnerPortalSession();

  if (result.status === "signed_out") {
    redirect("/login?redirect=/partners/dashboard");
  }

  if (result.status !== "available") {
    redirect("/partners?reason=not-enrolled");
  }

  const firstName = result.data.partner.displayName.split(" ")[0] || "Partner";

  return (
    <main className="min-h-screen bg-[var(--ast-global-color-4)] pb-16 text-black md:pb-0">
      <Header accountHref="/partners/dashboard/account" surface="solid" />
      <div className="border-b-2 border-black bg-[var(--ast-global-color-0)] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/80">BayBlaze Partner Portal</p>
            <p className="text-base font-black uppercase leading-tight">Welcome back, {firstName}.</p>
          </div>
          <Link className="text-xs font-black uppercase tracking-wider text-white underline decoration-2 underline-offset-4" href="/partners">
            Program info
          </Link>
        </div>
      </div>
      <PartnerPortalNav />
      {result.data.source === "mock" ? (
        <div className="border-b-2 border-black bg-[#fff4d8] px-4 py-2 text-center text-xs font-bold leading-[1.45]" role="status">
          Demo partner data — no live earnings or payout information is shown.
        </div>
      ) : null}
      {children}
    </main>
  );
}
