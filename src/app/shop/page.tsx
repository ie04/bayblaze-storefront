import type { Metadata } from "next";

import Header from "@/app/components/layout/Header";
import { getShopProducts, getShopSearchSuggestions } from "@/app/lib/medusa-products";
import ShopPageClient from "./ShopPageClient";

export const metadata: Metadata = {
  title: "Shop · BayBlaze Tampa Delivery",
  description:
    "Browse BayBlaze vapes, nicotine pouches, wraps, and accessories for fast Tampa delivery.",
};

type ShopPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

export default async function Page({ searchParams }: ShopPageProps) {
  const params = searchParams ? await searchParams : {};
  const queryParam = params.q;
  const searchQuery = Array.isArray(queryParam) ? queryParam[0] : queryParam;
  const products = await getShopProducts();

  return (
    <main className="min-h-screen bg-[var(--ast-global-color-4)] font-[var(--font-jost)] text-black">
      <Header searchSuggestions={getShopSearchSuggestions(products)} surface="solid" />
      <ShopPageClient initialSearchQuery={searchQuery ?? ""} products={products} />
    </main>
  );
}
