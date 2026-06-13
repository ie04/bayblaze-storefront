import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import Header from "@/app/components/layout/Header";
import {
  ClockLineIcon,
  MapPinLineIcon,
  SearchLineIcon,
  ShieldCheckLineIcon,
  TruckLineIcon,
} from "@/app/components/icons/SharpIcons";

export const metadata: Metadata = {
  title: "How BayBlaze Delivery Works",
  description:
    "Order online, we confirm availability, and your local Tampa driver verifies ID at delivery.",
};

const steps = [
  {
    n: "01",
    title: "Order online",
    desc: "Browse, pick variants, and place your BayBlaze order from your phone.",
    icon: <SearchLineIcon className="h-5 w-5" />,
  },
  {
    n: "02",
    title: "We confirm availability",
    desc: "BayBlaze confirms local stock before dispatching your driver.",
    icon: <ShieldCheckLineIcon className="h-5 w-5" />,
  },
  {
    n: "03",
    title: "Driver verifies 21+ ID",
    desc: "Your local driver checks your government-issued ID at delivery.",
    icon: <TruckLineIcon className="h-5 w-5" />,
  },
];

export default function HowItWorksPage() {
  return (
    <main className="bayblaze-how-it-works-page min-h-screen bg-[var(--ast-global-color-4)] font-[var(--font-jost)] text-black">
      <Header surface="solid" />

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--ast-global-color-1)]">
          How it works
        </div>

        <h1 className="mt-1 text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">
          Tampa delivery,{" "}
          <span className="text-[var(--ast-global-color-1)]">three steps.</span>
        </h1>

        <p className="mt-3 max-w-2xl text-sm font-medium leading-[1.65] text-[#585858] sm:text-base">
          BayBlaze is a local Tampa smoke shop delivery service. No third-party
          couriers — just our drivers, your essentials, fast.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.n} className="bayblaze-sharp-card p-6">
              <div className="flex items-center justify-between">
                <span className="bayblaze-brand-wordmark text-3xl text-[var(--ast-global-color-1)]">
                  {step.n}
                </span>

                <span className="grid h-10 w-10 place-items-center border-2 border-black bg-[var(--ast-global-color-4)] text-black">
                  {step.icon}
                </span>
              </div>

              <div className="mt-4 text-lg font-bold uppercase">
                {step.title}
              </div>

              <p className="mt-1 text-sm font-medium leading-[1.55] text-[#585858]">
                {step.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-0 border-2 border-black bg-white md:grid-cols-3">
          <Cell
            icon={<MapPinLineIcon className="h-5 w-5 text-[var(--ast-global-color-0)]" />}
            title="Service area"
            body="Tampa local delivery zone."
          />
          <Cell
            icon={<ClockLineIcon className="h-5 w-5 text-[var(--ast-global-color-0)]" />}
            title="Delivery hours"
            body="Daily · 10:00am – 11:00pm. Schedule ahead when needed."
          />
          <Cell
            icon={<ShieldCheckLineIcon className="h-5 w-5 text-[var(--ast-global-color-0)]" />}
            title="ID required"
            body="Must be 21+. Driver checks a valid ID at the door."
            last
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/shop" className="bayblaze-sharp-button bayblaze-sharp-button--primary">
            Start shopping
          </Link>

          <Link href="/" className="bayblaze-sharp-button bayblaze-sharp-button--outline">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

function Cell({
  icon,
  title,
  body,
  last,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  last?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-start gap-3 p-5",
        last ? "" : "border-b-2 border-black md:border-b-0 md:border-r-2",
      ].join(" ")}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>

      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-[#585858]">
          {title}
        </div>
        <div className="mt-1 text-sm font-bold leading-[1.45]">{body}</div>
      </div>
    </div>
  );
}
