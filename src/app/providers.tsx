"use client";

import { ReactNode } from "react";

import LogoSplashIntro from "@/app/components/brand/LogoSplashIntro";
import StorefrontActivityTracker from "@/app/components/analytics/StorefrontActivityTracker";
import { CartProvider } from "@/app/components/cart/CartContext";
import CheckoutPromoCodeProvider from "@/app/components/promo/CheckoutPromoCodeProvider";
import ReferralOfferProvider from "@/app/components/referral/ReferralOfferProvider";

export default function Providers({
  catalogVersion = "",
  children,
  priceAdjustmentCents = 0,
}: {
  catalogVersion?: string;
  children: ReactNode;
  priceAdjustmentCents?: number;
}) {
  return (
    <ReferralOfferProvider>
      <CheckoutPromoCodeProvider>
        <CartProvider catalogVersion={catalogVersion} priceAdjustmentCents={priceAdjustmentCents}>
          <StorefrontActivityTracker />
          <LogoSplashIntro />
          {children}
        </CartProvider>
      </CheckoutPromoCodeProvider>
    </ReferralOfferProvider>
  );
}
