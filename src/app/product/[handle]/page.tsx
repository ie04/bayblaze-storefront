import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Header from "@/app/components/layout/Header";
import { getProductByStorefrontHandle } from "@/app/lib/medusa-products";
import ProductPage from "./ProductPageClient";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByStorefrontHandle(handle);

  if (!product) {
    return {
      title: "Product not found | Bayblaze",
    };
  }

  return {
    title: `${product.name} | Bayblaze`,
    description: `Shop ${product.name} from Bayblaze.`,
  };
}

export default async function Page({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProductByStorefrontHandle(handle);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <ProductPage product={product} />
    </main>
  );
}
