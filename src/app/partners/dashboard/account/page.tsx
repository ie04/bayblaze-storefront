import type { Metadata } from "next";
import Link from "next/link";

import LogoutButton from "@/app/account/LogoutButton";
import { formatPartnerDate } from "@/app/partners/lib/partner-format";
import { getPartnerPortalSession } from "@/app/partners/lib/partner-portal-adapter";

export const metadata: Metadata = { title: "Partner Account | BayBlaze" };

export default async function PartnerAccountPage() {
  const result = await getPartnerPortalSession();
  if (result.status !== "available") return null;
  const { data } = result;

  return (
    <div className="mx-auto max-w-5xl px-4 py-7 sm:px-6 sm:py-9">
      <header><p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ast-global-color-1)]">Account</p><h1 className="mt-1 text-3xl font-black uppercase leading-none sm:text-4xl">Partner details.</h1><p className="mt-2 max-w-2xl text-sm font-medium leading-[1.55] text-[#585858]">Review the BayBlaze account and payout status connected to your partner profile.</p></header>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <section className="bayblaze-sharp-panel" aria-labelledby="partner-profile-title">
          <div className="bayblaze-sharp-panel-header"><h2 className="text-sm font-black uppercase tracking-wider" id="partner-profile-title">Partner profile</h2><span className="bayblaze-sharp-badge bayblaze-sharp-badge--green ml-auto">{data.partner.status}</span></div>
          <dl className="divide-y-2 divide-black">
            <Detail label="Name" value={data.partner.displayName} />
            <Detail label="Email" value={data.partner.email} />
            <Detail label="Partner since" value={formatPartnerDate(data.partner.joinedAt)} />
            <Detail label="Referral code" value={data.referralCode} />
          </dl>
        </section>

        <section className="bayblaze-sharp-panel" aria-labelledby="payout-details-title">
          <div className="bayblaze-sharp-panel-header"><h2 className="text-sm font-black uppercase tracking-wider" id="payout-details-title">Payout information</h2></div>
          <div className="p-5">
            <p className="text-xs font-black uppercase tracking-widest text-[#585858]">Status</p>
            <p className="mt-1 text-xl font-black uppercase">{data.partner.payoutStatus === "ready" ? "Payouts enabled" : "Not connected"}</p>
            <p className="mt-2 text-sm font-medium leading-[1.55] text-[#585858]">{data.partner.payoutMethodLabel}. Bank and payment details are intentionally never displayed in full.</p>
            <Link className="bayblaze-sharp-button bayblaze-sharp-button--outline mt-5 w-full" href="/contact">Update with BayBlaze</Link>
          </div>
        </section>
      </div>

      <section className="bayblaze-sharp-card mt-5 flex flex-col gap-4 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-black uppercase">Done for now?</h2><p className="mt-1 text-sm font-medium text-[#585858]">Sign out of your BayBlaze account on this device.</p></div>
        <LogoutButton />
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid gap-1 p-5 sm:grid-cols-[150px_1fr] sm:gap-4"><dt className="text-xs font-black uppercase tracking-widest text-[#585858]">{label}</dt><dd className="break-words font-bold">{value}</dd></div>;
}
