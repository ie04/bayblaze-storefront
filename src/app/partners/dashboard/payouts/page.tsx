import type { Metadata } from "next";
import Link from "next/link";

import { formatPartnerDate, formatPartnerMoney, formatStatus } from "@/app/partners/lib/partner-format";
import { getPartnerPortalSession } from "@/app/partners/lib/partner-portal-adapter";

export const metadata: Metadata = { title: "Payouts | BayBlaze Partners" };

export default async function PartnerPayoutsPage() {
  const result = await getPartnerPortalSession();
  if (result.status !== "available") return null;
  const { data } = result;

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9">
      <header><p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ast-global-color-1)]">Payouts</p><h1 className="mt-1 text-3xl font-black uppercase leading-none sm:text-4xl">Your money, clearly.</h1><p className="mt-2 max-w-2xl text-sm font-medium leading-[1.55] text-[#585858]">See what is ready, what is still being reviewed, and what BayBlaze has paid out.</p></header>

      <section aria-label="Earnings summary" className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Available", data.earnings.availableCents, "Ready for the next payout"],
          ["Pending", data.earnings.pendingCents, "Orders inside the review window"],
          ["Lifetime", data.earnings.lifetimeCents, "All eligible commission earned"],
        ].map(([label, cents, copy], index) => (
          <article className={`bayblaze-sharp-card p-5 ${index === 0 ? "!bg-[var(--ast-global-color-0)] !text-white" : "bg-white"}`} key={String(label)}>
            <p className={`text-xs font-black uppercase tracking-widest ${index === 0 ? "text-white/80" : "text-[#585858]"}`}>{label}</p>
            <p className="mt-2 text-3xl font-black leading-none">{formatPartnerMoney(Number(cents))}</p>
            <p className={`mt-2 text-sm font-medium ${index === 0 ? "text-white/85" : "text-[#585858]"}`}>{copy}</p>
          </article>
        ))}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="bayblaze-sharp-panel" aria-labelledby="payout-history-title">
          <div className="bayblaze-sharp-panel-header"><h2 className="text-sm font-black uppercase tracking-wider" id="payout-history-title">Payout history</h2></div>
          {data.payouts.length ? (
            <ul className="divide-y-2 divide-black">
              {data.payouts.map((payout) => (
                <li className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center sm:p-5" key={payout.id}>
                  <div><time className="font-black" dateTime={payout.date}>{formatPartnerDate(payout.date)}</time><p className="mt-1 text-sm font-medium text-[#585858]">{payout.methodLabel}</p></div>
                  <div><span className={`bayblaze-sharp-badge ${payout.status === "paid" ? "bayblaze-sharp-badge--green" : ""}`}>{formatStatus(payout.status)}</span></div>
                  <p className="text-xl font-black sm:text-right">{formatPartnerMoney(payout.amountCents)}</p>
                </li>
              ))}
            </ul>
          ) : <div className="p-7 text-center"><p className="font-black uppercase">No payouts yet.</p><p className="mt-1 text-sm font-medium text-[#585858]">Completed payouts will appear here.</p></div>}
        </section>

        <aside className="space-y-5">
          <section className="bayblaze-sharp-card bg-white p-5">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--ast-global-color-1)]">Payout setup</p>
            <p className="mt-2 text-lg font-black uppercase">{data.partner.payoutStatus === "ready" ? "Ready to receive" : "Setup needed"}</p>
            <p className="mt-2 text-sm font-medium leading-[1.55] text-[#585858]">{data.partner.payoutMethodLabel}. Live payout setup and requests are not connected to the storefront yet.</p>
            <Link className="bayblaze-sharp-button bayblaze-sharp-button--outline mt-4 w-full" href="/contact">Contact BayBlaze</Link>
          </section>
          <section className="bayblaze-sharp-card bg-[var(--ast-global-color-4)] p-5">
            <p className="text-xs font-black uppercase tracking-widest">Eligibility</p>
            <p className="mt-2 text-sm font-medium leading-[1.55] text-[#585858]">{data.eligibilityCopy}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
