import Image from "next/image";

export default function HomeAbout() {
  return (
    <section
      id="about"
      className="bayblaze-home-about border-b-2 border-black bg-white font-[var(--font-jost)]"
    >
      <div className="mx-auto w-full max-w-[1180px] px-5 py-16 md:py-[70px]">
        <div className="bayblaze-about-paper">
          <div className="relative z-10 grid gap-8 md:grid-cols-[minmax(0,0.58fr)_minmax(280px,0.42fr)]">
            <div className="flex flex-col justify-center py-5 md:pr-12">
              <h2 className="bayblaze-home-info-title text-black">About us</h2>
              <div className="mt-4 space-y-4 text-[17px] font-medium leading-[1.75] text-[#585858]">
                <p>
                  We are BAYBLAZE, a mobile smoke shop based in Tampa. Blazing
                  fast delivery is the name of our game, so if you&apos;re
                  local we guarantee your order will be delivered within an hour
                  of placing it, 24 hours a day 7 days a week. No more having to
                  hitch rides off friends or waiting until the smoke shops open,
                  we got you covered!
                </p>
                <p>
                  We offer a wide selection of products, including popular vape
                  brands, THC-A, Delta-8, CBD, and more. You&apos;ll only have
                  to pay when your order arrives.
                </p>
                <p>
                  Disclaimer: You must be 21 or older to order. Please have your
                  ID with you on delivery for us to complete the order. Thank
                  you!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center border border-[#eeeeee] bg-[var(--ast-global-color-4)] p-6">
              <Image
                src="https://bayblaze.net/wp-content/uploads/2026/03/bayblazelogo_transparent.png"
                alt="Bayblaze flame logo"
                width={1024}
                height={1024}
                sizes="(max-width: 767px) 88vw, 520px"
                className="h-auto w-full max-w-[520px] object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
