"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Swiper as SwiperType } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";

import type { HomeCarouselDefinition } from "@/app/domain/home-carousels";

type HomeCarouselProps<TItem> = {
  definition: HomeCarouselDefinition<TItem>;
  renderItem: (item: TItem) => ReactNode;
};

export default function HomeCarousel<TItem>({
  definition,
  renderItem,
}: HomeCarouselProps<TItem>) {
  const swiperRef = useRef<SwiperType | null>(null);
  const readyFrameRef = useRef<number | null>(null);
  const [isCarouselReady, setIsCarouselReady] = useState(false);
  const hasMultipleItems = definition.items.length > 1;
  const shouldLoop = definition.behavior.loop && hasMultipleItems;

  function handlePreviousClick() {
    const swiper = swiperRef.current;

    if (!swiper || swiper.destroyed) {
      return;
    }

    if (shouldLoop) {
      swiper.slidePrev();
      return;
    }

    if (swiper.activeIndex <= 0) {
      swiper.slideTo(definition.items.length - 1);
      return;
    }

    swiper.slidePrev();
  }

  function handleNextClick() {
    const swiper = swiperRef.current;

    if (!swiper || swiper.destroyed) {
      return;
    }

    if (shouldLoop) {
      swiper.slideNext();
      return;
    }

    if (swiper.activeIndex >= definition.items.length - 1) {
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
    <article
      className="bayblaze-home-carousel"
      aria-labelledby={`${definition.id}-title`}
    >
      <div className="bayblaze-home-carousel-header">
        <h2 id={`${definition.id}-title`} className="bayblaze-home-carousel-title">
          {definition.title}
        </h2>

        <Link
          href={definition.href}
          className="bayblaze-section-shop-link bayblaze-section-shop-link--header"
        >
          <span>{definition.linkLabel}</span>
          <ChevronRightIcon />
        </Link>
      </div>

      <div className="bayblaze-home-carousel-body">
        <div className="bayblaze-product-carousel-window">
          {definition.items.length ? (
            <>
              <Swiper
                grabCursor
                centeredSlides={definition.behavior.centeredSlidesOnMobile}
                loop={shouldLoop}
                loopAdditionalSlides={2}
                observer
                observeParents
                resizeObserver
                slidesPerView="auto"
                slideToClickedSlide={definition.behavior.centeredSlidesOnMobile}
                spaceBetween={definition.behavior.mobileSpaceBetween}
                speed={500}
                watchSlidesProgress
                onSwiper={handleSwiperReady}
                breakpoints={{
                  768: {
                    centeredSlides: false,
                    spaceBetween: definition.behavior.desktopSpaceBetween,
                  },
                }}
                className={`${definition.swiperClassName} bayblaze-home-carousel-swiper w-full transition-opacity duration-200 ${
                  isCarouselReady ? "opacity-100" : "opacity-0"
                }`}
              >
                {definition.items.map((item, index) => (
                  <SwiperSlide
                    key={`${definition.id}-${index}`}
                    className={definition.slideClassName}
                  >
                    {renderItem(item)}
                  </SwiperSlide>
                ))}
              </Swiper>

              {hasMultipleItems ? (
                <button
                  type="button"
                  className="bayblaze-product-carousel-arrow bayblaze-product-carousel-arrow--prev"
                  aria-label={definition.previousLabel}
                  onClick={handlePreviousClick}
                >
                  <ChevronLeftIcon />
                </button>
              ) : null}

              {hasMultipleItems ? (
                <button
                  type="button"
                  className="bayblaze-product-carousel-arrow bayblaze-product-carousel-arrow--next"
                  aria-label={definition.nextLabel}
                  onClick={handleNextClick}
                >
                  <ChevronRightIcon />
                </button>
              ) : null}
            </>
          ) : (
            <div className="flex min-h-[220px] w-full items-center justify-center border border-dashed border-[#aab6a4] bg-white px-5 text-center text-[18px] font-medium leading-[1.45] text-[#585858]">
              {definition.emptyText ?? "Items will appear here soon."}
            </div>
          )}
        </div>
      </div>

      <div className="bayblaze-home-carousel-footer">
        <Link
          href={definition.href}
          className="bayblaze-section-shop-link bayblaze-section-shop-link--footer"
        >
          <span>{definition.linkLabel}</span>
          <ChevronRightIcon />
        </Link>
      </div>
    </article>
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
