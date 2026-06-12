import type { ProductPreviewItem } from "@/app/lib/medusa-products";

export type HomeCarouselDefinition<TItem> = {
  id: string;
  title: string;
  href: string;
  linkLabel: string;
  items: TItem[];
  emptyText?: string;
  previousLabel: string;
  nextLabel: string;
  behavior: HomeCarouselBehavior;
  slideClassName: string;
  swiperClassName: string;
};

export type HomeCarouselBehavior = {
  loop: boolean;
  centeredSlidesOnMobile: boolean;
  minimumLoopItems: number;
  mobileSpaceBetween: number;
  desktopSpaceBetween: number;
  tabletSlidesPerView: number;
  desktopSlidesPerView: number;
};

const infiniteCenteredMobileCarousel: HomeCarouselBehavior = {
  loop: true,
  centeredSlidesOnMobile: true,
  minimumLoopItems: 8,
  mobileSpaceBetween: 16,
  desktopSpaceBetween: 24,
  tabletSlidesPerView: 2,
  desktopSlidesPerView: 4,
};

export type HomeCategoryItem = {
  name: string;
  description: string;
  href: string;
  image: string;
};

export const homeCategories: HomeCategoryItem[] = [
  {
    name: "Vapes",
    description: "Disposable devices",
    href: "/shop?q=Vapes",
    image: "/images/categories/vapes.svg",
  },
  {
    name: "Cones & Wraps",
    description: "Rolling essentials",
    href: "/shop?q=Cones%20%26%20Wraps",
    image: "/images/categories/wraps-papers.svg",
  },
  {
    name: "Smoking Accessories",
    description: "Tools and add-ons",
    href: "/shop?q=Smoking%20Accessories",
    image: "/images/categories/accessories.svg",
  },
];

export function getBestSellersCarousel(
  products: ProductPreviewItem[],
): HomeCarouselDefinition<ProductPreviewItem> {
  return {
    id: "best-sellers",
    title: "Available for Fast Delivery",
    href: "/shop?availability=fast",
    linkLabel: "Shop Fast Delivery",
    items: products,
    emptyText: "Products will appear here once the catalog is connected.",
    previousLabel: "Previous product",
    nextLabel: "Next product",
    behavior: infiniteCenteredMobileCarousel,
    slideClassName: "!h-auto w-[220px] max-w-[78vw] sm:w-[230px] md:w-auto",
    swiperClassName: "bayblaze-product-swiper",
  };
}

export const shopByCategoryCarousel: HomeCarouselDefinition<HomeCategoryItem> = {
  id: "shop-by-category",
  title: "Shop by Category",
  href: "/shop",
  linkLabel: "View All",
  items: homeCategories,
  previousLabel: "Previous category",
  nextLabel: "Next category",
  behavior: infiniteCenteredMobileCarousel,
  slideClassName: "!h-auto w-[236px] max-w-[78vw] sm:w-[258px] md:w-auto",
  swiperClassName: "bayblaze-category-swiper",
};
