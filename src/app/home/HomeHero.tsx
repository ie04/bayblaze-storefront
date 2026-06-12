import HeroSearch from "@/app/home/HeroSearch";
import HomeIntentOrbit from "@/app/home/HomeIntentOrbit";

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden border-b-2 border-black bg-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-[url('/images/tampa_skyline_trial7_grain.png')] bg-cover bg-[position:64%_38%] bg-no-repeat opacity-25 sm:bg-[position:100%_36%] md:bg-fixed"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-white/70"
      />

      <div className="relative z-20 mx-auto flex min-h-[680px] w-full max-w-[1180px] flex-col items-center px-4 pb-9 pt-[102px] text-center sm:min-h-screen sm:px-5 sm:pb-12 sm:pt-[118px]">
        <HeroSearch />
        <HomeIntentOrbit />
      </div>
    </section>
  );
}
