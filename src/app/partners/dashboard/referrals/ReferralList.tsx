"use client";

import { useMemo, useState } from "react";

import { formatPartnerDate, formatPartnerMoney, formatStatus } from "@/app/partners/lib/partner-format";
import type { PartnerReferral } from "@/app/partners/lib/partner-portal-types";

export default function ReferralList({ referrals }: { referrals: PartnerReferral[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const visible = useMemo(() => referrals.filter((referral) => {
    const matchesQuery = referral.customerLabel.toLowerCase().includes(query.trim().toLowerCase());
    const matchesStatus = status === "all" || referral.commissionStatus === status;
    return matchesQuery && matchesStatus;
  }), [query, referrals, status]);

  return (
    <section className="bayblaze-sharp-panel mt-6" aria-labelledby="referrals-list-title">
      <div className="bayblaze-sharp-panel-header flex-wrap">
        <h2 className="text-sm font-black uppercase tracking-wider" id="referrals-list-title">Referral orders</h2>
        <span className="ml-auto text-xs font-bold text-[#585858]">{visible.length} shown</span>
      </div>

      <div className="grid gap-3 border-b-2 border-black bg-white p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label>
          <span className="sr-only">Search referrals</span>
          <input className="bayblaze-sharp-input" onChange={(event) => setQuery(event.target.value)} placeholder="Search customer ID" type="search" value={query} />
        </label>
        <label>
          <span className="sr-only">Filter by commission status</span>
          <select className="bayblaze-sharp-input" onChange={(event) => setStatus(event.target.value)} value={status}>
            <option value="all">All commission statuses</option>
            <option value="pending">Pending</option>
            <option value="eligible">Available</option>
            <option value="paid">Paid</option>
            <option value="reversed">Reversed</option>
          </select>
        </label>
      </div>

      {visible.length ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-[var(--ast-global-color-4)] text-[11px] font-black uppercase tracking-widest">
                <tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Order</th><th className="px-4 py-3">Commission</th><th className="px-4 py-3 text-right">Earned</th></tr>
              </thead>
              <tbody className="divide-y-2 divide-black">
                {visible.map((referral) => (
                  <tr key={referral.id}>
                    <td className="px-4 py-4 font-semibold"><time dateTime={referral.date}>{formatPartnerDate(referral.date)}</time></td>
                    <td className="px-4 py-4 font-bold">{referral.customerLabel}</td>
                    <td className="px-4 py-4"><Status value={referral.orderStatus} /></td>
                    <td className="px-4 py-4"><Status value={referral.commissionStatus} /></td>
                    <td className="px-4 py-4 text-right text-base font-black">{formatPartnerMoney(referral.earnedCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y-2 divide-black md:hidden">
            {visible.map((referral) => (
              <li className="p-4" key={referral.id}>
                <div className="flex items-start justify-between gap-3"><div><p className="font-black">{referral.customerLabel}</p><time className="text-xs font-bold text-[#585858]" dateTime={referral.date}>{formatPartnerDate(referral.date)}</time></div><p className="text-lg font-black text-[var(--ast-global-color-1)]">{formatPartnerMoney(referral.earnedCents)}</p></div>
                <div className="mt-3 flex flex-wrap gap-2"><Status value={referral.orderStatus} /><Status value={referral.commissionStatus} /></div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="p-7 text-center"><p className="font-black uppercase">No referrals match.</p><p className="mt-1 text-sm font-medium text-[#585858]">Clear your search or choose a different status.</p></div>
      )}
    </section>
  );
}

function Status({ value }: { value: string }) {
  const green = ["eligible", "completed", "delivered", "paid"].includes(value);
  return <span className={`bayblaze-sharp-badge ${green ? "bayblaze-sharp-badge--green" : ""}`}>{value === "eligible" ? "Available" : formatStatus(value)}</span>;
}
