"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

const categories = [
  {
    name: "Vapes",
    description: "Disposable devices",
    href: "/shop?q=vapes",
    image: "/images/categories/vapes.svg",
  },
  {
    name: "Nicotine Pouches",
    description: "ZYNs and pouches",
    href: "/shop?q=ZYN",
    image: "/images/categories/nicotine-pouches.svg",
  },
  {
    name: "Wraps & Papers",
    description: "Rolling essentials",
    href: "/shop?q=wraps",
    image: "/images/categories/wraps-papers.svg",
  },
  {
    name: "Pre-Rolled Cones",
    description: "Ready-to-pack cones",
    href: "/shop?q=cones",
    image: "/images/categories/cones.svg",
  },
  {
    name: "Lighters",
    description: "Everyday fire",
    href: "/shop?q=lighters",
    image: "/images/categories/lighters.svg",
  },
  {
    name: "Accessories",
    description: "Tools and add-ons",
    href: "/shop?q=accessories",
    image: "/images/categories/accessories.svg",
  },
];

export default function HomeShopByCategory() {
  const swiperRef = useRef<SwiperType | null>(null);
  const readyFrameRef = useRef<number | null>(null);
  const [isCarouselReady, setIsCarouselReady] = useState(false);

  function handlePreviousClick() {
    const swiper = swiperRef.current;

    if (!swiper || swiper.destroyed) {
      return;
    }

    if (swiper.activeIndex <= 0) {
      swiper.slideTo(categories.length - 1);
      return;
    }

    swiper.slidePrev();
  }

  function handleNextClick() {
    const swiper = swiperRef.current;

    if (!swiper || swiper.destroyed) {
      return;
    }

    if (swiper.activeIndex >= categories.length - 1) {
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
    <section className="bayblaze-category-section" aria-labelledby="shop-by-category-title">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-5">
        <div className="bayblaze-category-section-header">
          <h2 id="shop-by-category-title" className="bayblaze-category-section-title">
            Shop by Category
          </h2>

          <Link href="/shop" className="bayblaze-section-shop-link">
            <span>View All</span>
            <ChevronRightIcon />
          </Link>
        </div>

        <div className="bayblaze-category-carousel">
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
              className={`bayblaze-category-swiper w-full transition-opacity duration-200 ${
                isCarouselReady ? "opacity-100" : "opacity-0"
              }`}
            >
              {categories.map((category) => (
                <SwiperSlide
                  key={category.name}
                  className="!h-auto !w-[236px] max-w-[78vw] sm:!w-[258px] lg:!w-[276px]"
                >
                  <CategoryCard category={category} />
                </SwiperSlide>
              ))}
            </Swiper>

            <button
              type="button"
              className="bayblaze-product-carousel-arrow bayblaze-product-carousel-arrow--prev"
              aria-label="Previous category"
              onClick={handlePreviousClick}
            >
              <ChevronLeftIcon />
            </button>

            <button
              type="button"
              className="bayblaze-product-carousel-arrow bayblaze-product-carousel-arrow--next"
              aria-label="Next category"
              onClick={handleNextClick}
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: (typeof categories)[number] }) {
  return (
    <Link href={category.href} className="bayblaze-category-card">
      <div className="bayblaze-category-card-image">
        <Image
          src={category.image}
          alt=""
          width={600}
          height={600}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>

      <div className="bayblaze-category-card-info">
        <h3 className="bayblaze-category-card-name">{category.name}</h3>
        <span className="bayblaze-category-card-description">
          {category.description}
        </span>
      </div>
    </Link>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
