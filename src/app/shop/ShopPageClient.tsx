"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

import { SearchLineIcon } from "@/app/components/icons/SharpIcons";
import { useReferralOffer } from "@/app/components/referral/ReferralOfferProvider";
import ReferralProductPrice from "@/app/components/products/ReferralProductPrice";
import type { ShopProductItem } from "@/app/lib/medusa-products";

const allCategoriesLabel = "All";

const sortOptions = [
  { value: "default", label: "Featured" },
  { value: "price-asc", label: "Price · Low to High" },
  { value: "price-desc", label: "Price · High to Low" },
  { value: "latest", label: "Latest" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

export default function ShopPageClient({
  initialSearchQuery = "",
  products,
}: {
  initialSearchQuery?: string;
  products: ShopProductItem[];
}) {
  const { offer } = useReferralOffer();
  const searchParams = useSearchParams();
  const availabilityFilter = searchParams.get("availability");

  const categories = useMemo(() => {
    const productCategories = Array.from(
      new Set(products.flatMap((product) => product.categories)),
    ).sort((first, second) =>
      first.localeCompare(second, undefined, { sensitivity: "base" }),
    );

    return [allCategoriesLabel, ...productCategories];
  }, [products]);

  const [activeCategory, setActiveCategory] = useState(allCategoriesLabel);
  const [sortBy, setSortBy] = useState<SortValue>("default");
  const [query, setQuery] = useState(initialSearchQuery);
  const [notice, setNotice] = useState("");

  const selectedCategory = categories.includes(activeCategory)
    ? activeCategory
    : allCategoriesLabel;

  const activeCategoryTitle =
    selectedCategory === allCategoriesLabel ? "All Products" : selectedCategory;

  const searchQuery = query.trim();
  const normalizedSearchQuery = searchQuery.toLowerCase();

  const visibleProducts = useMemo(() => {
    const categoryFiltered =
      selectedCategory === allCategoriesLabel
        ? products
        : products.filter((product) =>
            product.categories.includes(selectedCategory),
          );

    const availabilityFiltered: ShopProductItem[] =
      availabilityFilter === "fast"
        ? categoryFiltered.filter((product) => {
            return (
              product.inventoryState === "ON_VEHICLE" &&
              (product.availableQuantity ?? 0) > 0
            );
          })
        : categoryFiltered;

    const searchFiltered = normalizedSearchQuery
      ? availabilityFiltered.filter((product) => {
          const searchableText = [
            product.name,
            product.brand,
            product.description,
            ...product.categories,
          ]
            .join(" ")
            .toLowerCase();

          return searchableText.includes(normalizedSearchQuery);
        })
      : availabilityFiltered;

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
  }, [availabilityFilter, normalizedSearchQuery, products, selectedCategory, sortBy]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function handleQuickAdd(product: ShopProductItem) {
    setNotice(`${product.name} added.`);
  }

  return (
    <div className="bayblaze-shop-page bg-[var(--ast-global-color-4)] font-[var(--font-jost)] text-black">
      <section className="border-b-2 border-black bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#585858]"
          >
            <Link
              className="text-[#585858] no-underline hover:text-black"
              href="/"
            >
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span>Shop</span>
          </nav>

          <div className="text-[11px] font-bold uppercase tracking-widest text-[var(--ast-global-color-1)]">
            Shop
          </div>

          <h1 className="mt-1 text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">
            {activeCategoryTitle}
          </h1>

          <p className="mt-2 max-w-xl text-sm font-medium leading-[1.65] text-[#585858] sm:text-base">
            Order online · driver verifies 21+ ID on delivery in Tampa.
          </p>

          <form
            role="search"
            className="mt-6 flex max-w-xl border-2 border-black bg-white"
            onSubmit={handleSearch}
          >
            <label htmlFor="shop-search" className="sr-only">
              Search products
            </label>

            <div className="grid w-11 place-items-center border-r-2 border-black bg-[var(--ast-global-color-4)]">
              <SearchLineIcon className="h-4 w-4" />
            </div>

            <input
              id="shop-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setNotice("");
              }}
              placeholder="Search brand, product, category…"
              className="min-w-0 flex-1 bg-white px-3 py-3 text-sm font-medium text-black outline-none placeholder:text-[#7a7a7a]"
            />
          </form>
        </div>
      </section>

      <section className="sticky top-14 z-30 border-b-2 border-black bg-[var(--ast-global-color-4)] sm:top-16">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="-mx-4 flex-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <div className="flex w-max gap-2">
              {categories.map((category) => {
                const isActive = selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    className={[
                      "border-2 border-black px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors",
                      isActive
                        ? "bg-black text-white"
                        : "bg-white text-black hover:bg-black hover:text-white",
                    ].join(" ")}
                    aria-pressed={isActive}
                    onClick={() => {
                      setActiveCategory(category);
                      setNotice("");
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="relative shrink-0">
            <span className="sr-only">Sort products</span>
            <select
              value={sortBy}
              aria-label="Sort products"
              className="h-9 appearance-none border-2 border-black bg-white py-0 pl-3 pr-8 text-xs font-bold uppercase tracking-wider text-black outline-none"
              onChange={(event) => setSortBy(event.target.value as SortValue)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs font-black"
            >
              ▾
            </span>
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {visibleProducts.length === 0 ? (
          <div className="bayblaze-sharp-card p-8 text-center">
            <div className="text-2xl font-black uppercase">No matches</div>
            <p className="mt-1 text-sm font-medium text-[#585858]">
              Try a different category or search term.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest text-[#585858]">
              <span>
                {visibleProducts.length}{" "}
                {visibleProducts.length === 1 ? "product" : "products"}
                {availabilityFilter === "fast" ? " · fast delivery" : ""}
              </span>

              {notice ? (
                <span
                  aria-live="polite"
                  className="text-[var(--ast-global-color-1)]"
                >
                  {notice}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.href}
                  product={product}
                  hasActivePromo={Boolean(offer)}
                  onQuickAdd={handleQuickAdd}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function ProductCard({
  product,
  hasActivePromo,
  onQuickAdd,
}: {
  product: ShopProductItem;
  hasActivePromo: boolean;
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
    <article className="bayblaze-sharp-card group relative flex min-h-full flex-col overflow-hidden bg-white">
      <Link
        href={product.href}
        className="relative block aspect-square overflow-hidden border-b-2 border-black bg-[var(--ast-global-color-4)]"
        target={isInternal ? undefined : "_blank"}
        aria-label={product.name}
      >
        {product.isSale || hasActivePromo ? (
          <span className="bayblaze-sharp-badge bayblaze-sharp-badge--green absolute left-2 top-2 z-10">
            Sale
          </span>
        ) : null}

        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 280px"
          className="object-contain scale-[1.18] transition-transform duration-300 group-hover:scale-[1.24]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-3 text-left sm:p-4">
        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--ast-global-color-1)]">
          {product.brand}
        </p>

        <Link
          href={product.href}
          className="text-black no-underline transition-colors hover:text-[var(--ast-global-color-0)]"
          target={isInternal ? undefined : "_blank"}
        >
          <h2 className="line-clamp-2 text-[14px] font-bold uppercase leading-tight sm:text-[16px]">
            {product.name}
          </h2>
        </Link>

        <p className="mt-3 text-[15px] font-bold leading-none text-black sm:text-[17px]">
          <ReferralProductPrice
            currentPrice={product.salePrice || product.price}
            originalPrice={product.originalPrice}
          />
        </p>

        {product.action === "Add to cart" ? (
          <button
            type="button"
            className="bayblaze-sharp-button bayblaze-sharp-button--primary mt-5 flex h-11 items-center justify-center !py-0 text-center text-xs"
            onClick={() => onQuickAdd(product)}
          >
            Add to cart
          </button>
        ) : (
          <button
            type="button"
            className="bayblaze-sharp-button bayblaze-sharp-button--primary mt-5 flex h-11 items-center justify-center !py-0 text-center text-xs"
            onClick={handleSelectOptions}
          >
            Select options
          </button>
        )}
      </div>
    </article>
  );
}
