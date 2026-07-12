"use client";

import { ReactNode } from "react";

import LogoSplashIntro from "@/app/components/brand/LogoSplashIntro";
import { CartProvider } from "@/app/components/cart/CartContext";
import CheckoutPromoCodeProvider from "@/app/components/promo/CheckoutPromoCodeProvider";
import ReferralOfferProvider from "@/app/components/referral/ReferralOfferProvider";

export default function Providers({
  children,
  priceAdjustmentCents = 0,
}: {
  children: ReactNode;
  priceAdjustmentCents?: number;
}) {
  return (
    <ReferralOfferProvider>
      <CheckoutPromoCodeProvider>
        <CartProvider priceAdjustmentCents={priceAdjustmentCents}>
          <LogoSplashIntro />
          {children}
        </CartProvider>
      </CheckoutPromoCodeProvider>
    </ReferralOfferProvider>
  );
}
