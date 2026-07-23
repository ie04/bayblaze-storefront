import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/app/components/layout/Header";
import { getPartnerPortalSession } from "@/app/partners/lib/partner-portal-adapter";
import PartnerPortalNav from "./PartnerPortalNav";
import PartnerAccessState from "./PartnerAccessState";

export default async function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const result = await getPartnerPortalSession();

  if (result.status === "signed_out") {
    redirect("/login?redirect=/partners/dashboard");
  }

  const firstName = result.status === "available"
    ? result.data.partner.displayName.split(" ")[0] || "Partner"
    : "Partner";

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
      {result.status === "available" ? <PartnerPortalNav /> : null}
      {result.status === "available" ? children : <PartnerAccessState status={result.status} />}
    </main>
  );
}
