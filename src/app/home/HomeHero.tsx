export default function HomeHero() {
  return (
    <section className="relative min-h-[720px] overflow-hidden border-b-2 border-black bg-white sm:min-h-screen">
      <div
        aria-hidden="true"
        className="bayblaze-hero-fixed-bg absolute inset-0 z-0 bg-[url('/images/tampa_skyline_trial7_grain.png')] bg-cover bg-[position:68%_38%] bg-no-repeat sm:bg-[position:100%_36%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10"
        style={{ backgroundColor: "rgba(255, 255, 255, 0.18)" }}
      />

      <div className="relative z-20 mx-auto flex min-h-[720px] w-full max-w-[1150px] flex-col items-center px-4 text-center sm:min-h-screen sm:px-5">
        <div className="h-[245px] shrink-0 sm:h-[calc(32vh+43px)]" />

        <h1 className="bayblaze-hero-title">
          BAYBLAZE
        </h1>

        <h2 className="bayblaze-hero-subtitle mt-[11px]">
          TAMPA BAY MOBILE SMOKE SHOP
        </h2>

        <a
          href="/shop"
          className="bayblaze-hero-button mt-[33px] rounded-[3px] border border-black bg-[var(--ast-global-color-0)] px-5 py-2.5 text-center text-white transition-colors hover:bg-black"
        >
          SHOP
        </a>
      </div>
    </section>
  );
}
