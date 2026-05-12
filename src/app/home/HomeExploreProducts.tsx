"use client";

import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

import type { ProductPreviewItem } from "@/app/lib/medusa-products";

export default function HomeExploreProducts({
  vapeProducts,
  accessoryProducts,
}: {
  vapeProducts: ProductPreviewItem[];
  accessoryProducts: ProductPreviewItem[];
}) {
  const productGroups = [
    {
      title: "Vapes",
      description: "Fast Local Delivery on Top Selling Vape Brands",
      href: "/product-category/vapes",
      products: vapeProducts,
    },
    {
      title: "Accessories",
      description: "Quality Smoking Accessories for Everyday Needs",
      href: "/shop",
      products: accessoryProducts,
    },
  ];

  return (
    <section className="bayblaze-products-section bg-[#dfe8d8]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col px-4 py-12 sm:px-5 sm:py-16">
        <div className="flex flex-col gap-3 border-b-2 border-black pb-5 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="bayblaze-section-heading">EXPLORE PRODUCTS</h2>
          <p className="max-w-[430px] text-[16px] font-medium leading-[1.55] text-[#3f4d39] sm:text-right sm:text-[17px]">
            Local delivery staples, organized for quick browsing.
          </p>
        </div>

        <div className="divide-y divide-[#a5b29d]">
          {productGroups.map((group) => (
            <ProductPreview
              key={group.title}
              title={group.title}
              description={group.description}
              href={group.href}
              products={group.products}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPreview({
  title,
  description,
  href,
  products,
}: {
  title: string;
  description: string;
  href: string;
  products: ProductPreviewItem[];
}) {
  return (
    <article className="bayblaze-product-rail pb-8 pt-6 sm:pb-10 sm:pt-8">
      <div className="bayblaze-product-rail-header">
        <div className="min-w-0">
          <h3 className="bayblaze-product-rail-title">{title}</h3>
          <p className="bayblaze-product-rail-subtitle">{description}</p>
        </div>

        <a href={href} className="bayblaze-section-shop-link">
          <span>Shop All</span>
          <ChevronRightIcon />
        </a>
      </div>

      <div className="bayblaze-product-showcase">
        <div className="bayblaze-product-carousel-layer min-w-0">
          {products.length ? (
            <ProductCarousel products={products} />
          ) : (
            <div className="flex min-h-[220px] w-full items-center justify-center border border-dashed border-[#aab6a4] bg-white px-5 text-center text-[18px] font-medium leading-[1.45] text-[#585858]">
              Products will appear here once the catalog is connected.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function ProductCarousel({ products }: { products: ProductPreviewItem[] }) {
  const swiperRef = useRef<SwiperType | null>(null);
  const readyFrameRef = useRef<number | null>(null);
  const [isCarouselReady, setIsCarouselReady] = useState(false);

  function handlePreviousClick() {
    const swiper = swiperRef.current;

    if (!swiper || swiper.destroyed) {
      return;
    }

    if (swiper.activeIndex <= 0) {
      swiper.slideTo(products.length - 1);
      return;
    }

    swiper.slidePrev();
  }

  function handleNextClick() {
    const swiper = swiperRef.current;

    if (!swiper || swiper.destroyed) {
      return;
    }

    if (swiper.activeIndex >= products.length - 1) {
      swiper.slideTo(0);
      return;
    }

    swiper.slideNext();
  }

  function handleSwiperReady(swiper: SwiperType) {
    swiperRef.current = swiper;

    if (readyFrameRef.current !== null) {
      cancelAnimationFrame(readyFrameRef.current);
    }

    readyFrameRef.current = requestAnimationFrame(() => {
      if (swiper.destroyed || swiperRef.current !== swiper) {
        return;
      }

      setIsCarouselReady(true);
      readyFrameRef.current = null;
    });
  }

  useEffect(() => {
    return () => {
      if (readyFrameRef.current !== null) {
        cancelAnimationFrame(readyFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="bayblaze-product-carousel w-full pb-6 pt-2">
      <div className="bayblaze-product-carousel-window">
        <Swiper
          grabCursor
          observer
          observeParents
          resizeObserver
          slidesPerView="auto"
          spaceBetween={16}
          speed={400}
          watchSlidesProgress
          onSwiper={handleSwiperReady}
          breakpoints={{
            640: {
              spaceBetween: 20,
            },
            1024: {
              spaceBetween: 24,
            },
          }}
          className={`bayblaze-product-swiper w-full transition-opacity duration-200 ${
            isCarouselReady ? "opacity-100" : "opacity-0"
          }`}
        >
          {products.map((product, index) => (
            <SwiperSlide
              key={`${product.href}-${index}`}
              className="!h-auto !w-[220px] max-w-[78vw] sm:!w-[230px] lg:!w-[244px]"
            >
              <ProductSlide product={product} />
            </SwiperSlide>
          ))}
        </Swiper>

        {products.length > 1 ? (
          <button
            type="button"
            className="bayblaze-product-carousel-arrow bayblaze-product-carousel-arrow--prev"
            aria-label="Previous product"
            onClick={handlePreviousClick}
          >
            <ChevronLeftIcon />
          </button>
        ) : null}

        {products.length > 1 ? (
          <button
            type="button"
            className="bayblaze-product-carousel-arrow bayblaze-product-carousel-arrow--next"
            aria-label="Next product"
            onClick={handleNextClick}
          >
            <ChevronRightIcon />
          </button>
        ) : null}
      </div>
    </div>
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

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
