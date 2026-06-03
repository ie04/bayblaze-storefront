import Image from "next/image";

import { DELIVERY_SCHEDULING_RULE } from "@/app/domain/delivery-scheduling";

export default function HomeAbout() {
  return (
    <section
      id="about"
      className="bayblaze-home-about font-[var(--font-jost)]"
    >
      <div className="mx-auto w-full max-w-[1180px] px-4 py-10 sm:px-5 sm:py-16 md:py-[70px]">
        <div className="bayblaze-about-paper">
          <div className="relative z-10 grid gap-7 md:grid-cols-[minmax(0,0.58fr)_minmax(280px,0.42fr)] md:gap-8">
            <div className="flex flex-col justify-center py-2 md:py-5 md:pr-12">
              <h2 className="bayblaze-home-info-title text-black">About us</h2>
              <div className="mt-4 space-y-4 text-[16px] font-medium leading-[1.65] text-[#585858] sm:text-[17px] sm:leading-[1.75]">
                <p>
                  We are BAYBLAZE, a mobile smoke shop based in Tampa. Blazing
                  fast delivery is the name of our game, so if you&apos;re
                  local we work to get daytime and evening vape orders to your
                  door fast. No more having to hitch rides off friends or
                  waiting until the smoke shops open, we got you covered!
                </p>
                <p>
                  We focus on popular vape brands, flavor-forward disposables,
                  ZYNs, wraps, cones, lighters, and everyday smoke-shop
                  essentials. You&apos;ll only have to pay when your order
                  arrives.
                </p>
                <p>
                  {DELIVERY_SCHEDULING_RULE} Scheduling is optional before 11
                  PM and required from 11 PM until 10 AM.
                </p>
                <p>
                  Disclaimer: You must be 21 or older to order. Please have your
                  ID with you on delivery for us to complete the order. Thank
                  you!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center border border-[#d0d0d0] bg-[var(--ast-global-color-4)] p-4 sm:p-6">
              <Image
                src="/icons/bayblaze-logo-source.png"
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
