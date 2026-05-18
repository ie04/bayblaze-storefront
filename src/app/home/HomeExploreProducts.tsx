"use client";

import { getBestSellersCarousel } from "@/app/domain/home-carousels";
import type { ProductPreviewItem } from "@/app/lib/medusa-products";
import HomeCarousel from "./HomeCarousel";

export default function HomeExploreProducts({
  vapeProducts,
}: {
  vapeProducts: ProductPreviewItem[];
}) {
  const carousel = getBestSellersCarousel(vapeProducts);

  return (
    <section className="bayblaze-products-section bg-[#F7F6F2]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col px-4 py-12 sm:px-5 sm:py-16">
        <div className="divide-y divide-[#a5b29d]">
          <HomeCarousel
            definition={carousel}
            renderItem={(product) => <ProductSlide product={product} />}
          />
        </div>
      </div>
    </section>
  );
}

function ProductSlide({ product }: { product: ProductPreviewItem }) {
  return (
    <article className="bayblaze-product-card">
      <div className="bayblaze-product-card-media">
        {product.isSale ? (
          <span className="bayblaze-product-card-sale" aria-label="On sale">
            Sale!
          </span>
        ) : null}

        <button
          type="button"
          className="bayblaze-product-card-heart"
          aria-label={`Save ${product.name}`}
        >
          <HeartIcon />
        </button>

        <a
          href={product.href}
          aria-label={product.name}
          className="bayblaze-product-card-image"
          style={{
            backgroundImage: `url("${product.image}")`,
          }}
        />
      </div>

      <div className="bayblaze-product-card-body">
        <span className="bayblaze-product-card-badge">Local Delivery</span>

        <a href={product.href} className="text-[#2c2c2c] no-underline">
          <h4 className="bayblaze-product-card-title">
            {product.name}
          </h4>
        </a>

        <p className="bayblaze-product-card-price">
          <span className="bayblaze-product-card-price-prefix">From </span>
          {product.originalPrice ? (
            <>
              <del>{product.originalPrice}</del>{" "}
            </>
          ) : null}
          <ins className="no-underline">{product.salePrice}</ins>
        </p>

        <a href={product.href} className="bayblaze-product-card-button">
          Select Options
        </a>
      </div>
    </article>
  );
}

function HeartIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M19.5 12.6 12 20l-7.5-7.4a5 5 0 0 1 7.1-7.1l.4.4.4-.4a5 5 0 0 1 7.1 7.1Z" />
    </svg>
  );
}
