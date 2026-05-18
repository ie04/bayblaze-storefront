"use client";

import { ReactNode } from "react";

import { CartProvider } from "@/app/components/cart/CartContext";
import PwaInstallPrompt from "@/app/components/pwa/PwaInstallPrompt";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <PwaInstallPrompt />
    </CartProvider>
  );
}
