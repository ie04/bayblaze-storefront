"use client";

import Image from "next/image";
import Link from "next/link";

import type { ProductPreviewItem } from "@/app/lib/medusa-products";

export default function HomeExploreProducts({
  fastDeliveryProducts,
}: {
  fastDeliveryProducts: ProductPreviewItem[];
}) {
  return (
    <section className="bayblaze-products-section border-b-2 border-black bg-[var(--ast-global-color-4)]">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-12 sm:px-5 sm:py-16">
        <div className="mb-6 flex flex-col gap-4 border-b-2 border-black pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.16em] text-[var(--ast-global-color-1)]">
              In stock now
            </p>

            <h2 className="bayblaze-section-heading">
              Available for Delivery
            </h2>

            <p className="mt-3 max-w-[620px] text-[16px] font-medium leading-[1.55] text-[#585858] sm:text-[18px]">
              Fresh picks loaded up and ready to head your way!
            </p>
          </div>

          <Link
            href="/shop?availability=fast"
            className="bayblaze-sharp-button bayblaze-sharp-button--outline shrink-0"
          >
            View all
          </Link>
        </div>

        {fastDeliveryProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {fastDeliveryProducts.map((product) => (
              <FastDeliveryProductCard key={product.href} product={product} />
            ))}
          </div>
        ) : (
          <div className="bayblaze-sharp-card bayblaze-sharp-card--cream p-6 text-center sm:p-8">
            <p className="text-[20px] font-bold uppercase leading-tight text-black">
              No fast delivery products are marked on vehicle yet.
            </p>

            <p className="mx-auto mt-2 max-w-[520px] text-[15px] font-medium leading-[1.55] text-[#585858]">
              Once Medusa inventory variants are marked{" "}
              <code className="border border-black bg-white px-1 py-0.5 text-[12px] text-black">
                ON_VEHICLE
              </code>{" "}
              with available quantity, they will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function FastDeliveryProductCard({
  product,
}: {
  product: ProductPreviewItem;
}) {
  return (
    <article className="bayblaze-sharp-card group flex min-h-full flex-col overflow-hidden bg-white">
      <Link
        href={product.href}
        className="relative block aspect-square border-b-2 border-black bg-[var(--ast-global-color-4)]"
        aria-label={product.name}
      >
        {product.isSale ? (
          <span className="bayblaze-sharp-badge bayblaze-sharp-badge--green absolute left-2 top-2 z-10">
            Sale
          </span>
        ) : null}

        <span className="bayblaze-sharp-badge absolute right-2 top-2 z-10 bg-white">
          Fast
        </span>

        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, 280px"
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03] sm:p-5"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-[13px] font-bold uppercase tracking-[0.12em] text-[#777]">
            Image coming soon
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 text-left sm:p-4">
        <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--ast-global-color-1)]">
          On Vehicle
        </div>

        <Link
          href={product.href}
          className="text-black no-underline transition-colors hover:text-[var(--ast-global-color-0)]"
        >
          <h3 className="line-clamp-2 text-[14px] font-bold uppercase leading-tight sm:text-[16px]">
            {product.name}
          </h3>
        </Link>

        <p className="mt-3 text-[15px] font-bold leading-none text-black sm:text-[17px]">
          {product.originalPrice ? (
            <>
              <del className="mr-2 text-[#7a7a7a]">
                {product.originalPrice}
              </del>
              <ins className="no-underline">{product.salePrice}</ins>
            </>
          ) : (
            <span>{product.salePrice}</span>
          )}
        </p>

        <Link
          href={product.href}
          className="bayblaze-sharp-button bayblaze-sharp-button--primary mt-4 w-full !min-h-11 !px-3 !py-3 text-center !text-[12px]"
        >
          Select options
        </Link>
      </div>
    </article>
  );
}
