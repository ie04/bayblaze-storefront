import type { Metadata } from "next";
import Link from "next/link";

import Header from "@/app/components/layout/Header";

export const metadata: Metadata = {
  description: "Grow with BayBlaze as a local referral partner.",
  title: "Local Partners | BayBlaze",
};

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="min-h-screen bg-[var(--ast-global-color-4)] text-black">
      <Header surface="solid" />

      {reason === "not-enrolled" ? (
        <div className="border-b-2 border-black bg-[#fff4d8] px-4 py-3 text-center text-sm font-bold" role="status">
          This BayBlaze account is not connected to a partner profile yet. Apply below or contact us for help.
        </div>
      ) : null}

      <section className="border-b-2 border-black bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)] lg:items-center lg:py-20">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--ast-global-color-1)]">
              BayBlaze Local Partners
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black uppercase leading-[0.95] sm:text-5xl lg:text-6xl">
              Put your people on. <span className="text-[var(--ast-global-color-0)]">Get paid.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-[1.65] text-[#585858] sm:text-lg">
              Share a personal BayBlaze discount with your Tampa Bay circle. When they shop with your code, you earn a cut of every eligible purchase.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link className="bayblaze-sharp-button bayblaze-sharp-button--primary px-6" href="/login?redirect=/partners/dashboard">
                Partner Sign In
              </Link>
              <Link className="bayblaze-sharp-button bayblaze-sharp-button--outline px-6" href="/contact">
                Apply to Join
              </Link>
            </div>
          </div>

          <aside className="bayblaze-sharp-panel" aria-label="Example partner offer">
            <div className="bayblaze-sharp-panel-header">
              <span className="bayblaze-sharp-badge bayblaze-sharp-badge--green">Example</span>
              <h2 className="text-sm font-black uppercase tracking-wider">Your local deal</h2>
            </div>
            <div className="p-6 sm:p-7">
              <p className="text-5xl font-black leading-none text-[var(--ast-global-color-1)]">20% OFF</p>
              <p className="mt-2 text-lg font-bold">for your referred customers</p>
              <div className="bayblaze-sharp-divider my-5" />
              <p className="text-3xl font-black leading-none">30% earned</p>
              <p className="mt-2 text-sm font-medium leading-[1.55] text-[#585858]">
                on each eligible purchase made with your personal promo code.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--ast-global-color-1)]">How it works</p>
            <h2 className="mt-1 text-3xl font-black uppercase leading-none sm:text-4xl">Simple from share to payout.</h2>
          </div>
          <p className="max-w-md text-sm font-medium leading-[1.55] text-[#585858]">Built for local creators, shops, artists, event hosts, and people who genuinely move Tampa Bay culture.</p>
        </div>

        <ol className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Get your code", "Once approved, your personal promo and share link live in your partner dashboard."],
            ["02", "Share locally", "Drop the link in your bio, group chat, event page, or wherever your people find you."],
            ["03", "Track your cut", "See referrals, eligible orders, pending commission, and payout history in one place."],
          ].map(([number, title, copy]) => (
            <li className="bayblaze-sharp-card bg-white p-5" key={number}>
              <span className="text-xs font-black tracking-widest text-[var(--ast-global-color-0)]">{number}</span>
              <h3 className="mt-2 text-xl font-black uppercase">{title}</h3>
              <p className="mt-2 text-sm font-medium leading-[1.6] text-[#585858]">{copy}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 border-2 border-black bg-black px-5 py-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6 sm:px-7">
          <div>
            <p className="text-xl font-black uppercase">Already part of the crew?</p>
            <p className="mt-1 text-sm font-medium text-white/75">Sign in with the BayBlaze account connected to your referral promo.</p>
          </div>
          <Link className="bayblaze-sharp-button bayblaze-sharp-button--primary mt-4 w-full sm:mt-0 sm:w-auto" href="/login?redirect=/partners/dashboard">
            Open Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
