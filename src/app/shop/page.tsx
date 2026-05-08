import type { Metadata } from "next";

import Header from "@/app/components/layout/Header";
import ShopPageClient from "./ShopPageClient";

export const metadata: Metadata = {
  title: "Shop | Bayblaze",
  description: "Shop Bayblaze vapes, cones, and smoking accessories.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <ShopPageClient />
    </main>
  );
}
