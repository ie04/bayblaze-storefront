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
};

const infiniteCenteredMobileCarousel: HomeCarouselBehavior = {
  loop: true,
  centeredSlidesOnMobile: true,
  minimumLoopItems: 8,
  mobileSpaceBetween: 16,
  desktopSpaceBetween: 24,
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

export function getBestSellersCarousel(
  products: ProductPreviewItem[],
): HomeCarouselDefinition<ProductPreviewItem> {
  return {
    id: "best-sellers",
    title: "Best Sellers",
    href: "/product-category/vapes",
    linkLabel: "Shop All",
    items: products,
    emptyText: "Products will appear here once the catalog is connected.",
    previousLabel: "Previous product",
    nextLabel: "Next product",
    behavior: infiniteCenteredMobileCarousel,
    slideClassName: "!h-auto !w-[220px] max-w-[78vw] sm:!w-[230px] lg:!w-[244px]",
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
  slideClassName: "!h-auto !w-[236px] max-w-[78vw] sm:!w-[258px] lg:!w-[276px]",
  swiperClassName: "bayblaze-category-swiper",
};
