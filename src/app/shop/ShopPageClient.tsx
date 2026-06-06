"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { ShopProductItem } from "@/app/lib/medusa-products";

const categories = [
  "All Categories",
  "Vapes",
  "Cones & Wraps",
  "Smoking Accessories",
];

const categoryCopy: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  "All Categories": {
    title: "All Categories",
    description:
      "Browse our full selection of vapes, cones, wraps, and smoking accessories.",
  },
  Vapes: {
    title: "Vapes",
    description:
      "Explore vape options including disposables and flavor-focused products ready for delivery.",
  },
  "Cones & Wraps": {
    title: "Cones & Wraps",
    description:
      "Find cones, wraps, rolling papers, and session-ready rolling essentials.",
  },
  "Smoking Accessories": {
    title: "Smoking Accessories",
    description:
      "Explore useful add-ons and everyday accessories made to keep your setup ready.",
  },
};

const sortOptions = [
  { value: "default", label: "Default sorting" },
  { value: "popularity", label: "Sort by popularity" },
  { value: "latest", label: "Sort by latest" },
  { value: "price-asc", label: "Sort by price: low to high" },
  { value: "price-desc", label: "Sort by price: high to low" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

export default function ShopPageClient({
  initialSearchQuery = "",
  products,
}: {
  initialSearchQuery?: string;
  products: ShopProductItem[];
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [sortBy, setSortBy] = useState<SortValue>("default");
  const [notice, setNotice] = useState("");
  const activeCategoryCopy = categoryCopy[activeCategory];
  const searchQuery = initialSearchQuery.trim();
  const normalizedSearchQuery = searchQuery.toLowerCase();

  const visibleProducts = useMemo(() => {
    const categoryFiltered =
      activeCategory === "All Categories"
        ? products
        : products.filter((product) =>
            product.categories.includes(activeCategory),
          );

    const searchFiltered = normalizedSearchQuery
      ? categoryFiltered.filter((product) => {
          const searchableText = [
            product.name,
            product.description,
            ...product.categories,
          ]
            .join(" ")
            .toLowerCase();

          return searchableText.includes(normalizedSearchQuery);
        })
      : categoryFiltered;

    return [...searchFiltered].sort((a, b) => {
      if (sortBy === "price-asc") {
        return a.sortPrice - b.sortPrice;
      }

      if (sortBy === "price-desc") {
        return b.sortPrice - a.sortPrice;
      }

      if (sortBy === "latest") {
        return products.indexOf(b) - products.indexOf(a);
      }

      return products.indexOf(a) - products.indexOf(b);
    });
  }, [activeCategory, normalizedSearchQuery, products, sortBy]);

  function handleQuickAdd(product: ShopProductItem) {
    setNotice(`${product.name} added.`);
  }

  return (
    <div className="bayblaze-shop-page bg-white pb-14 pt-[92px] sm:pb-20 sm:pt-[112px]">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-5">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-[14px] leading-none text-[#7a7a7a]"
        >
          <Link className="text-black transition-colors hover:text-[var(--ast-global-color-0)]" href="/">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span>Shop</span>
        </nav>

        <header className="mb-6 border-b border-[#eeeeee] pb-6 sm:mb-8 sm:pb-8">
          <h1 className="bayblaze-shop-title text-black">
            {activeCategoryCopy.title}
          </h1>

          <p className="mt-3 max-w-[640px] text-[16px] font-medium leading-[1.65] text-[#585858] sm:text-[18px] sm:font-semibold sm:leading-[1.7]">
            {activeCategoryCopy.description}
          </p>
        </header>

        <section className="mb-6 sm:mb-8">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`shrink-0 border px-4 py-2.5 text-[14px] font-medium leading-none transition-colors ${
                  activeCategory === category
                    ? "border-black bg-black text-white"
                    : "border-[#dedede] bg-white text-black hover:border-[var(--ast-global-color-0)] hover:text-[var(--ast-global-color-0)]"
                }`}
                aria-pressed={activeCategory === category}
                onClick={() => {
                  setActiveCategory(category);
                  setNotice("");
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <div className="mb-6 flex flex-col gap-4 border-y border-[#eeeeee] py-4 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-[#585858]">
            Showing {visibleProducts.length === products.length ? "all " : ""}
            {visibleProducts.length} result
            {visibleProducts.length === 1 ? "" : "s"}
            {searchQuery ? ` for "${searchQuery}"` : ""}
          </p>

          <label className="flex w-full flex-col gap-2 text-[14px] font-semibold text-black sm:w-auto sm:min-w-[270px]">
            <span className="sr-only">Sort products</span>
            <select
              value={sortBy}
              className="h-11 border border-[#d6d6d6] bg-white py-0 pl-3 pr-9 text-[15px] font-normal text-black outline-none transition focus:border-black"
              onChange={(event) => setSortBy(event.target.value as SortValue)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p
          aria-live="polite"
          className="mb-4 min-h-6 text-[14px] font-medium text-[var(--ast-global-color-1)]"
        >
          {notice}
        </p>

        <section
          aria-label="Products"
          className="grid grid-cols-1 gap-x-7 gap-y-6 sm:grid-cols-2 sm:gap-y-10 lg:grid-cols-4"
        >
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.href}
              product={product}
              onQuickAdd={handleQuickAdd}
            />
          ))}
        </section>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onQuickAdd,
}: {
  product: ShopProductItem;
  onQuickAdd: (product: ShopProductItem) => void;
}) {
  const isInternal = product.href.startsWith("/");
  const router = useRouter();

  function handleSelectOptions() {
    if (isInternal) {
      router.push(product.href);
      return;
    }

    window.open(product.href, "_blank", "noopener,noreferrer");
  }

  return (
    <article className="group relative flex min-h-full flex-col border border-[#d0d0d0] bg-[var(--ast-global-color-4)]">
      <Link
        href={product.href}
        className="relative block aspect-[1.08] overflow-hidden bg-[var(--ast-global-color-4)] sm:aspect-square"
        target={isInternal ? undefined : "_blank"}
      >
        {product.isSale && (
          <span className="absolute left-3 top-3 z-10 bg-[var(--ast-global-color-0)] px-2.5 py-1 text-[12px] font-semibold leading-none text-white">
            Sale!
          </span>
        )}
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 260px"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03] sm:p-5"
        />
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-5 pt-4 text-center sm:px-4">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a7a7a]">
          {product.categories[0]}
        </p>

        <Link
          href={product.href}
          className="text-black transition-colors hover:text-[var(--ast-global-color-0)]"
          target={isInternal ? undefined : "_blank"}
        >
          <h2 className="text-[17px] font-semibold leading-[1.3] sm:text-[18px]">
            {product.name}
          </h2>
        </Link>

        <p className="mt-3 text-[16px] leading-none">
          {product.originalPrice ? (
            <>
              <del className="mr-2 text-[#7a7a7a]">
                {product.originalPrice}
              </del>
              <ins className="text-black no-underline">
                {product.salePrice}
              </ins>
            </>
          ) : (
            <span className="text-black">{product.price}</span>
          )}
        </p>

        <p className="mt-4 flex-1 text-[14px] leading-[1.6] text-[#676767]">
          {product.description}
        </p>

        {product.action === "Add to cart" ? (
          <button
            type="button"
            className="mt-5 h-12 bg-[var(--ast-global-color-0)] px-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-black sm:h-11 sm:tracking-[0.12em]"
            onClick={() => onQuickAdd(product)}
          >
            Add to cart
          </button>
        ) : (
          <button
            type="button"
            className="mt-5 h-12 bg-[var(--ast-global-color-0)] px-4 text-[13px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-black sm:h-11 sm:tracking-[0.12em]"
            onClick={handleSelectOptions}
          >
            Select options
          </button>
        )}
      </div>
    </article>
  );
}

