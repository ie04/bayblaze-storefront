import type { Metadata } from "next";

import Header from "@/app/components/layout/Header";
import { getShopProducts } from "@/app/lib/medusa-products";
import ShopPageClient from "./ShopPageClient";

export const metadata: Metadata = {
  title: "Shop | Bayblaze",
  description: "Shop Bayblaze vapes, cones, and smoking accessories.",
};

type ShopPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

export default async function Page({ searchParams }: ShopPageProps) {
  const params = searchParams ? await searchParams : {};
  const queryParam = params.q;
  const searchQuery = Array.isArray(queryParam)
    ? queryParam[0]
    : queryParam;
  const products = await getShopProducts();

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <ShopPageClient initialSearchQuery={searchQuery ?? ""} products={products} />
    </main>
  );
}
