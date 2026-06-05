"use client";

import { ReactNode } from "react";

import { CartProvider } from "@/app/components/cart/CartContext";
import PwaInstallPrompt from "@/app/components/pwa/PwaInstallPrompt";
import ReferralOfferProvider from "@/app/components/referral/ReferralOfferProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ReferralOfferProvider>
      <CartProvider>
        {children}
        <PwaInstallPrompt />
      </CartProvider>
    </ReferralOfferProvider>
  );
}
