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
        <HeroRibbon />

        <div className="h-[245px] shrink-0 sm:h-[calc(32vh+43px)]" />

        <h1 className="bayblaze-hero-title">
          BAYBLAZE
        </h1>

        <h2 className="bayblaze-hero-subtitle mt-[11px]">
          TAMPA BAY MOBILE SMOKE SHOP
        </h2>

        <HeroSearch />
        <HomeHeroInfoStrip />
      </div>
    </section>
  );
}

function HomeHeroInfoStrip() {
  return (
    <div className="mx-auto mt-5 grid w-full max-w-md grid-cols-3 border-2 border-black bg-white text-center font-[var(--font-jost)] shadow-[6px_6px_0_#000] sm:mt-6">
      <div className="border-r-2 border-black p-3 sm:p-4">
        <div className="text-lg font-black leading-none text-black sm:text-xl">
          30<span className="text-sm">min</span>
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase leading-tight tracking-widest text-[#585858] sm:text-[11px]">
          Avg delivery
        </div>
      </div>

      <div className="border-r-2 border-black p-3 sm:p-4">
        <div className="text-lg font-black leading-none text-black sm:text-xl">
          10am–11pm
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase leading-tight tracking-widest text-[#585858] sm:text-[11px]">
          Store hours
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="text-lg font-black leading-none text-black sm:text-xl">
          Schedule
        </div>
        <div className="mt-1 text-[10px] font-bold uppercase leading-tight tracking-widest text-[#585858] sm:text-[11px]">
          Your order
        </div>
      </div>
    </div>
  );
}
