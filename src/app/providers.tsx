"use client";

import { ReactNode } from "react";

import LogoSplashIntro from "@/app/components/brand/LogoSplashIntro";
import { CartProvider } from "@/app/components/cart/CartContext";
import CheckoutPromoCodeProvider from "@/app/components/promo/CheckoutPromoCodeProvider";
import ReferralOfferProvider from "@/app/components/referral/ReferralOfferProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ReferralOfferProvider>
      <CheckoutPromoCodeProvider>
        <CartProvider>
          <LogoSplashIntro />
          {children}
        </CartProvider>
      </CheckoutPromoCodeProvider>
    </ReferralOfferProvider>
  );
}
