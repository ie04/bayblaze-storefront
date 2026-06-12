import Link from "next/link";

import {
  ClockLineIcon,
  MapPinLineIcon,
  ShieldCheckLineIcon,
  TruckLineIcon,
} from "@/app/components/icons/SharpIcons";

const facts = [
  {
    title: "Local Tampa delivery",
    body: "Built for quick local dispatch, not generic shipping.",
    icon: <MapPinLineIcon className="h-5 w-5" />,
  },
  {
    title: "Fast when in stock",
    body: "Products marked for fast delivery are ready to move from local inventory.",
    icon: <TruckLineIcon className="h-5 w-5" />,
  },
  {
    title: "21+ verified",
    body: "Have a valid government-issued ID ready when your driver arrives.",
    icon: <ShieldCheckLineIcon className="h-5 w-5" />,
  },
];

export default function HomeAbout() {
  return (
    <section
      id="about"
      className="bayblaze-home-about bg-[var(--ast-global-color-4)] font-[var(--font-jost)]"
    >
      <div className="mx-auto max-w-7xl px-0 py-0 sm:px-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(320px,0.58fr)] lg:items-stretch">
          <div className="border-x-0 border-y-0 border-black bg-white p-6 sm:border-l-2 sm:border-r-2 sm:p-8 lg:p-10">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--ast-global-color-1)]">
              About BayBlaze
            </p>

            <h2 className="mt-1 max-w-3xl text-4xl font-black uppercase leading-none text-black sm:text-5xl lg:text-6xl">
              A mobile smoke shop built for Tampa.
            </h2>

            <p className="mt-4 max-w-2xl text-sm font-medium leading-[1.7] text-[#585858] sm:text-base">
              BayBlaze brings smoke-shop essentials to your door with a simple
              online ordering flow, local inventory, and driver-verified 21+
              delivery.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="bayblaze-sharp-button bayblaze-sharp-button--primary"
              >
                Start shopping
              </Link>

              <Link
                href="/how-it-works"
                className="bayblaze-sharp-button bayblaze-sharp-button--outline"
              >
                How it works
              </Link>
            </div>
          </div>

          <aside className="grid border-x-0 border-y-2 border-black bg-white sm:border-r-2 lg:border-l-0">
            <div className="flex items-start gap-3 border-b-2 border-black p-5">
              <ClockLineIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ast-global-color-0)]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-black">
                  Delivery hours
                </p>
                <p className="mt-1 text-sm font-bold leading-[1.5] text-[#585858]">
                  Daily · 10:00am – 11:00pm. Schedule ahead when needed.
                </p>
              </div>
            </div>

            {facts.map((fact, index) => (
              <div
                key={fact.title}
                className={[
                  "flex items-start gap-3 p-5",
                  index < facts.length - 1 ? "border-b-2 border-black" : "",
                ].join(" ")}
              >
                <span className="mt-0.5 shrink-0 text-[var(--ast-global-color-0)]">
                  {fact.icon}
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-black">
                    {fact.title}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-[1.55] text-[#585858]">
                    {fact.body}
                  </p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
