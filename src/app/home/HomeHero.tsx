import Link from "next/link";

import HeroSearch, { HeroRibbon } from "@/app/home/HeroSearch";

export default function HomeHero() {
  return (
    <section className="relative min-h-[720px] overflow-hidden border-b border-[#e8e2d8] bg-[var(--ast-global-color-4)] sm:min-h-screen">
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-[url('/images/tampa_skyline_trial7_grain.png')] bg-cover bg-[position:68%_38%] bg-no-repeat sm:bg-[position:100%_36%] md:bg-fixed"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.18)" }}
      />

      <div className="relative z-20 mx-auto flex min-h-[720px] w-full max-w-[1150px] flex-col items-center px-4 text-center sm:min-h-screen sm:px-5">
        <div className="hidden sm:block">
          <HeroRibbon />
        </div>

        <div className="h-[178px] shrink-0 sm:h-[calc(32vh+43px)]" />

        <h1 className="bayblaze-hero-title">
          BAYBLAZE
        </h1>

        <h2 className="bayblaze-hero-subtitle mt-[11px]">
          TAMPA BAY MOBILE SMOKE SHOP
        </h2>

        <HeroSearch />
        <HomeHeroInfoStrip />
        <HomeHeroActions />
      </div>
    </section>
  );
}

function HomeHeroInfoStrip() {
  return (
    <div className="mx-auto mt-3 grid w-full max-w-[330px] grid-cols-3 border-2 border-black bg-white text-center font-[var(--font-jost)] shadow-[4px_4px_0_#000] sm:mt-6 sm:max-w-md sm:shadow-[6px_6px_0_#000]">
      <div className="border-r-2 border-black p-2 sm:p-4">
        <div className="text-base font-black leading-none text-black sm:text-xl">
          30<span className="text-sm">min</span>
        </div>
        <div className="mt-1 text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-[#585858] sm:text-[11px] sm:tracking-widest">
          Avg delivery
        </div>
      </div>

      <div className="border-r-2 border-black p-2 sm:p-4">
        <div className="text-base font-black leading-none text-black sm:text-xl">
          10am–11pm
        </div>
        <div className="mt-1 text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-[#585858] sm:text-[11px] sm:tracking-widest">
          Store hours
        </div>
      </div>

      <div className="p-2 sm:p-4">
        <div className="text-base font-black leading-none text-black sm:text-xl">
          Schedule
        </div>
        <div className="mt-1 text-[9px] font-bold uppercase leading-tight tracking-[0.12em] text-[#585858] sm:text-[11px] sm:tracking-widest">
          Your order
        </div>
      </div>
    </div>
  );
}


function HomeHeroActions() {
  return (
    <div className="mx-auto mt-5 grid w-full max-w-[430px] grid-cols-2 gap-4 font-[var(--font-jost)] sm:mt-7 sm:max-w-[520px] sm:gap-6">
      <Link
        href="/shop"
        className="bayblaze-sharp-button bayblaze-sharp-button--primary flex h-12 items-center justify-center px-3 text-center text-[12px] sm:h-14 sm:text-sm"
      >
        Shop
      </Link>

      <Link
        href="/how-it-works"
        className="bayblaze-sharp-button bayblaze-sharp-button--outline flex h-12 items-center justify-center px-3 text-center text-[12px] sm:h-14 sm:text-sm"
      >
        How It Works
      </Link>
    </div>
  );
}
