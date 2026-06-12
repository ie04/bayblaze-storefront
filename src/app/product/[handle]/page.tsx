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
      title: "Product not found | BayBlaze",
    };
  }

  return {
    title: `${product.name} | BayBlaze`,
    description: `Shop ${product.name} from BayBlaze.`,
  };
}

export default async function Page({ params }: ProductPageProps) {
  const { handle } = await params;
  const product = await getProductByStorefrontHandle(handle);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--ast-global-color-4)] font-[var(--font-jost)] text-black">
      <Header surface="solid" />
      <ProductPage product={product} />
    </main>
  );
}
