"use client";

import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-coverflow";

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
      title: "VAPES",
      description: "Fast Local Delivery on Top Selling Vape Brands",
      href: "/product-category/vapes",
      products: vapeProducts,
    },
    {
      title: "ACCESSORIES",
      description: "Quality Smoking Accessories for Everyday Needs",
      href: "/shop",
      products: accessoryProducts,
    },
  ];

  return (
    <section className="bayblaze-products-section bg-[var(--ast-global-color-4)]">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 py-10 sm:gap-8 sm:px-5 sm:py-14">
        <h2 className="bayblaze-section-heading text-center">
          EXPLORE OUR PRODUCTS
        </h2>

        <div className="grid w-full grid-cols-1 grid-rows-[repeat(2,minmax(0,auto))] gap-y-7 sm:gap-y-12">
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
    <article className="flex w-full flex-col items-center gap-0 border border-[#d2d8cf] bg-white/85 px-3 py-5 text-center shadow-[0_10px_28px_rgba(0,0,0,0.07)] sm:px-4 sm:py-6">
      <div className="flex w-full flex-col items-center">
        <h3 className="bayblaze-product-preview-title">{title}</h3>
        <p className="bayblaze-product-preview-description pb-4 sm:pb-6">
          {description}
        </p>

        {products.length ? (
          <ProductCarouselMock products={products} />
        ) : (
          <div className="flex min-h-[220px] w-full items-center justify-center border border-dashed border-[#bdbdbd] bg-[var(--ast-global-color-4)] px-5 text-[18px] font-medium leading-[1.45] text-[#585858]">
            Products will appear here once the catalog is connected.
          </div>
        )}

        <a
          href={href}
          className="bayblaze-hero-button mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[3px] border border-black bg-[var(--ast-global-color-0)] px-5 py-2.5 text-center text-white transition-colors hover:bg-black sm:mt-5 sm:w-auto"
        >
          Shop All
        </a>
      </div>
    </article>
  );
}

function ProductCarouselMock({ products }: { products: ProductPreviewItem[] }) {
  const loopedProducts = [...products, ...products, ...products];
  const swiperRef = useRef<SwiperType | null>(null);
  const readyFrameRef = useRef<number | null>(null);
  const [activeState, setActiveState] = useState(0);
  const [isCarouselReady, setIsCarouselReady] = useState(false);

  function getStateIndex(swiper: SwiperType) {
    const index =
      Number.isFinite(swiper.realIndex) ? swiper.realIndex : swiper.activeIndex;
    const safeIndex = Number.isFinite(index) ? index : 0;

    return products.length ? safeIndex % products.length : 0;
  }

  function handleDotClick(index: number) {
    setActiveState(index);
    const swiper = swiperRef.current;

    if (swiper && !swiper.destroyed) {
      swiper.slideToLoop(index);
    }
  }

  function handleSwiperReady(swiper: SwiperType) {
    swiperRef.current = swiper;
    setActiveState(getStateIndex(swiper));

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
    <div className="bayblaze-product-carousel mx-auto w-full max-w-[1110px] overflow-visible px-0 pb-4 pt-2 sm:px-6 sm:pb-5 sm:pt-4">
      <Swiper
        modules={[EffectCoverflow]}
        effect="coverflow"
        grabCursor
        centeredSlides
        loop
        observer
        observeParents
        resizeObserver
        slidesPerView="auto"
        speed={400}
        watchSlidesProgress
        onSwiper={handleSwiperReady}
        onSlideChange={(swiper) => setActiveState(getStateIndex(swiper))}
        coverflowEffect={{
          rotate: 18,
          stretch: 0,
          depth: 80,
          modifier: 1,
          slideShadows: false,
        }}
        breakpoints={{
          768: {
            coverflowEffect: {
              rotate: 50,
              stretch: 10,
              depth: 100,
              modifier: 1,
              slideShadows: false,
            },
          },
        }}
        className={`h-[430px] w-full transition-opacity duration-200 sm:h-[590px] ${
          isCarouselReady ? "opacity-100" : "opacity-0"
        }`}
      >
        {loopedProducts.map((product, index) => (
          <SwiperSlide
            key={`${product.name}-${index}`}
            className="!w-[278px] max-w-[76vw] sm:!w-[360px] sm:max-w-[82vw]"
          >
            <ProductSlide product={product} />
          </SwiperSlide>
        ))}
      </Swiper>

      <div
        className="mt-4 flex justify-center"
        aria-label="Carousel states"
        role="tablist"
      >
        {products.map((product, index) => (
          <button
            key={product.name}
            type="button"
            className={`bayblaze-swiper-bullet ${
              activeState === index ? "bayblaze-swiper-bullet-active" : ""
            }`}
            aria-label={`Go to ${product.name}`}
            aria-selected={activeState === index}
            role="tab"
            onClick={() => handleDotClick(index)}
          />
        ))}
      </div>
    </div>
  );
}

function ProductSlide({ product }: { product: ProductPreviewItem }) {
  return (
    <article className="mx-auto w-full max-w-[360px] overflow-hidden border border-[#c8d0c4] bg-[var(--ast-global-color-4)] text-left shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
      <div className="relative bg-[var(--ast-global-color-4)]">
        {product.isSale !== false && (
          <span className="absolute left-3 top-3 z-10 bg-[var(--ast-global-color-0)] px-2 py-1 text-xs font-medium text-white">
            Sale!
          </span>
        )}
        <a
          href={product.href}
          aria-label={product.name}
          className="block h-[245px] w-full bg-center bg-no-repeat sm:h-[330px]"
          style={{
            backgroundImage: `url("${product.image}")`,
            backgroundSize: "auto 86%",
          }}
        />
      </div>

      <div className="border-t border-[#d9ded6] bg-white/70 p-3 text-center sm:p-[15px]">
        <a href={product.href} className="text-black no-underline">
          <h4 className="text-[16px] font-medium leading-[1.3] sm:text-[18px]">
            {product.name}
          </h4>
        </a>
        <p className="mt-2 text-[16px] font-normal leading-none sm:text-[17px]">
          {product.originalPrice ? (
            <>
              <del className="text-[#7a7a7a]">{product.originalPrice}</del>{" "}
            </>
          ) : null}
          <ins className="text-black no-underline">{product.salePrice}</ins>
        </p>
      </div>
    </article>
  );
}
