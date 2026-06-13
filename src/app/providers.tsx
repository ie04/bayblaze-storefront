"use client";

import { ReactNode } from "react";

import { CartProvider } from "@/app/components/cart/CartContext";
import ReferralOfferProvider from "@/app/components/referral/ReferralOfferProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ReferralOfferProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </ReferralOfferProvider>
  );
}
