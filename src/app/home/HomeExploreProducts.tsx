"use client";

import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/effect-coverflow";

import type { ProductPreviewItem } from "@/app/lib/medusa-products";

const accessoryProducts = [
  {
    name: "Raw Cones King Size (3 Pack)",
    image:
      "https://bayblaze.net/wp-content/uploads/2026/03/raw-king-cones-3pk-1024x1024.jpg",
    href: "https://bayblaze.net/product/raw-cones-king-size-3-pack/",
    originalPrice: "",
    salePrice: "$3.99",
    position: "left",
    isSale: false,
  },
  {
    name: "RAW Cone Classic 1 1/4 (20 Pack)",
    image:
      "https://bayblaze.net/wp-content/uploads/2026/03/raw-classic-cone-20pk-1-1024x1024.jpg",
    href: "https://bayblaze.net/product/raw-classic-cones-20pack/",
    originalPrice: "",
    salePrice: "$6.99",
    position: "center",
    isSale: false,
  },
];

export default function HomeExploreProducts({
  vapeProducts,
}: {
  vapeProducts: ProductPreviewItem[];
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
    <section className="bayblaze-products-section bayblaze-products-section--bottom-torn border-t-2 border-black bg-white">
      <div className="mx-auto flex w-full max-w-[1140px] flex-col gap-5 px-0 pb-[70px] pt-5">
        <h2 className="bayblaze-section-heading text-center">
          EXPLORE OUR PRODUCTS
        </h2>

        <div className="grid w-full grid-cols-1 grid-rows-[repeat(2,minmax(0,auto))] gap-x-px gap-y-[60px]">
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
    <article className="flex w-full flex-col items-center gap-0 rounded-[20px] bg-[var(--ast-global-color-4)] p-2.5 text-center shadow-[0_10px_24px_rgba(0,0,0,0.25)]">
      <div className="flex w-full flex-col items-center">
        <h3 className="bayblaze-product-preview-title">{title}</h3>
        <p className="bayblaze-product-preview-description pb-[30px]">
          {description}
        </p>

        <ProductCarouselMock products={products} />

        <a
          href={href}
          className="bayblaze-hero-button mt-5 rounded-[3px] bg-[var(--ast-global-color-0)] px-5 py-2.5 text-center text-white transition-colors hover:bg-black"
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
    <div className="bayblaze-product-carousel mx-auto w-full max-w-[1110px] overflow-hidden px-6 pb-5 pt-4">
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
          rotate: 50,
          stretch: 10,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        }}
        className={`h-[590px] w-full transition-opacity duration-200 ${
          isCarouselReady ? "opacity-100" : "opacity-0"
        }`}
      >
        {loopedProducts.map((product, index) => (
          <SwiperSlide
            key={`${product.name}-${index}`}
            className="!w-[360px] max-w-[82vw]"
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
    <article className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[20px] bg-white text-left shadow-sm">
      <div className="relative bg-white">
        {product.isSale !== false && (
          <span className="absolute left-3 top-3 z-10 bg-[var(--ast-global-color-0)] px-2 py-1 text-xs font-medium text-white">
            Sale!
          </span>
        )}
        <a
          href={product.href}
          aria-label={product.name}
          className="block h-[330px] w-full bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("${product.image}")`,
            backgroundSize: "auto 86%",
          }}
        />
      </div>

      <div className="p-[15px] text-center">
        <a href={product.href} className="text-black no-underline">
          <h4 className="text-[18px] font-medium leading-[1.3]">
            {product.name}
          </h4>
        </a>
        <p className="mt-2 text-[17px] font-normal leading-none">
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
