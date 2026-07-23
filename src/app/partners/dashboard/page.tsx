import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";

import { formatPartnerDate, formatPartnerMoney } from "@/app/partners/lib/partner-format";
import { getPartnerPortalSession } from "@/app/partners/lib/partner-portal-adapter";
import PartnerReferralTools from "./PartnerReferralTools";

export const metadata: Metadata = { title: "Partner Dashboard | BayBlaze" };

export default async function PartnerDashboardPage() {
  const result = await getPartnerPortalSession();
  if (result.status !== "available") return null;
  const { data } = result;
  const qrDataUrl = await QRCode.toDataURL(data.referralLink, {
    color: { dark: "#000000", light: "#ffffff" },
    errorCorrectionLevel: "H",
    margin: 2,
    width: 232,
  });

  const cards = [
    { label: "Link clicks", value: data.metrics.clicks.toLocaleString() },
    { label: "Customers", value: data.metrics.referredCustomers.toLocaleString() },
    { label: "Completed orders", value: data.metrics.completedOrders.toLocaleString() },
    { label: "Pending earnings", value: formatPartnerMoney(data.earnings.pendingCents) },
    { label: "Total earnings", value: formatPartnerMoney(data.earnings.lifetimeCents), strong: true },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ast-global-color-1)]">Partner dashboard</p>
        <h1 className="mt-1 text-3xl font-black uppercase leading-none sm:text-4xl">Your local reach.</h1>
        <p className="mt-2 max-w-2xl text-sm font-medium leading-[1.55] text-[#585858]">Share your deal, follow eligible orders, and keep a clear view of what you have earned.</p>
      </header>

      <section aria-label="Partner summary" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {cards.map((card) => (
          <article className={`bayblaze-sharp-card p-4 sm:p-5 ${card.strong ? "!bg-black !text-white" : "bg-white"}`} key={card.label}>
            <p className={`text-[10px] font-black uppercase tracking-widest ${card.strong ? "text-white/70" : "text-[#585858]"}`}>{card.label}</p>
            <p className={`mt-2 text-2xl font-black leading-none sm:text-3xl ${card.strong ? "text-[var(--ast-global-color-0)]" : "text-black"}`}>{card.value}</p>
          </article>
        ))}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
        <PartnerReferralTools code={data.referralCode} link={data.referralLink} qrDataUrl={qrDataUrl} />

        <aside className="bayblaze-sharp-card bg-[var(--ast-global-color-4)] p-5">
          <p className="text-xs font-black uppercase tracking-widest text-[var(--ast-global-color-1)]">Your offer</p>
          <p className="mt-3 text-3xl font-black uppercase leading-none">They save {data.program.discountPercent}%.</p>
          <p className="mt-1 text-3xl font-black uppercase leading-none text-[var(--ast-global-color-0)]">You earn {data.program.commissionPercent}%.</p>
          <p className="mt-4 text-sm font-medium leading-[1.55] text-[#585858]">Applies to eligible orders of {formatPartnerMoney(data.program.minimumPurchaseCents)} or more.</p>
          <div className="bayblaze-sharp-divider my-4" />
          <p className="text-xs font-black uppercase tracking-widest">When you get paid</p>
          <p className="mt-2 text-sm font-medium leading-[1.55] text-[#585858]">{data.eligibilityCopy}</p>
        </aside>
      </div>

      <section className="bayblaze-sharp-panel mt-5" aria-labelledby="recent-activity-title">
        <div className="bayblaze-sharp-panel-header">
          <h2 className="text-sm font-black uppercase tracking-wider" id="recent-activity-title">Recent activity</h2>
          <Link className="ml-auto text-xs font-black uppercase text-[var(--ast-global-color-1)] underline decoration-2 underline-offset-4" href="/partners/dashboard/referrals">See all</Link>
        </div>
        {data.activity.length ? (
          <ul className="divide-y-2 divide-black">
            {data.activity.map((item) => (
              <li className="flex items-start justify-between gap-4 p-4 sm:p-5" key={item.id}>
                <div>
                  <p className="font-black uppercase leading-tight">{item.title}</p>
                  <p className="mt-1 text-sm font-medium text-[#585858]">{item.detail}</p>
                  <time className="mt-1 block text-xs font-bold uppercase tracking-wide text-[#585858]" dateTime={item.date}>{formatPartnerDate(item.date, true)}</time>
                </div>
                {item.amountCents ? <span className="shrink-0 text-lg font-black text-[var(--ast-global-color-1)]">+{formatPartnerMoney(item.amountCents)}</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-6 text-sm font-medium text-[#585858]">Your referral activity will show here after someone visits with your link.</p>
        )}
      </section>
    </div>
  );
}
