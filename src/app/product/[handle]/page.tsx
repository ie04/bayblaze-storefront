import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Header from "@/app/components/layout/Header";
import { getProductByStorefrontHandle } from "@/app/lib/medusa-products";
import ProductPage from "./ProductPageClient";

type ProductPageProps = {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{
    variant?: string | string[];
  }>;
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

export default async function Page({ params, searchParams }: ProductPageProps) {
  const { handle } = await params;
  const query = searchParams ? await searchParams : {};
  const variantParam = query.variant;
  const selectedVariantId = Array.isArray(variantParam) ? variantParam[0] : variantParam;
  const product = await getProductByStorefrontHandle(handle);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--ast-global-color-4)] font-[var(--font-jost)] text-black">
      <Header surface="solid" />
      <ProductPage initialVariantId={selectedVariantId ?? ""} product={product} />
    </main>
  );
}
