"use client";

import { ReactNode } from "react";

import LogoSplashIntro from "@/app/components/brand/LogoSplashIntro";
import { CartProvider } from "@/app/components/cart/CartContext";
import ReferralOfferProvider from "@/app/components/referral/ReferralOfferProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ReferralOfferProvider>
      <CartProvider>
        <LogoSplashIntro />
        {children}
      </CartProvider>
    </ReferralOfferProvider>
  );
}
