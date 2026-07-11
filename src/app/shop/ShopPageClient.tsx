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
  const router = useRouter();
  const { offer } = useReferralOffer();
  const searchParams = useSearchParams();
  const availabilityFilter = searchParams.get("availability");
  const shouldShowFreebiePicker = searchParams.get("freebie_picker") === "1";
  const winClaimToken = searchParams.get("win_claim") ?? "";

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
  const [freebiePickerOpen, setFreebiePickerOpen] = useState(shouldShowFreebiePicker);
  const [freebieQuery, setFreebieQuery] = useState("");
  const [selectedFreebieHref, setSelectedFreebieHref] = useState(() => {
    return products[0]?.href ?? "";
  });

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
            ...product.variantSearchTerms,
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

  const visibleFreebieProducts = useMemo(() => {
    const normalizedFreebieQuery = freebieQuery.trim().toLowerCase();

    if (!normalizedFreebieQuery) {
      return products;
    }

    return products.filter((product) => {
      const searchableText = [
        product.name,
        product.brand,
        product.description,
        ...product.categories,
        ...product.variantSearchTerms,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedFreebieQuery);
    });
  }, [freebieQuery, products]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  function handleQuickAdd(product: ShopProductItem) {
    setNotice(`${product.name} added.`);
  }

  function handleContinueWithFreebie() {
    const selectedProduct = products.find((product) => product.href === selectedFreebieHref);

    if (!selectedProduct) {
      setNotice("Select a freebie before continuing.");
      return;
    }

    const destination = new URL(selectedProduct.href, window.location.origin);
    destination.searchParams.set("freebie", "1");

    if (winClaimToken) {
      destination.searchParams.set("win_claim", winClaimToken);
    }

    router.push(`${destination.pathname}${destination.search}`);
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
              list="shop-search-suggestions"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setNotice("");
              }}
              placeholder="Search brand, product, category…"
              className="min-w-0 flex-1 bg-white px-3 py-3 text-sm font-medium text-black outline-none placeholder:text-[#7a7a7a]"
            />
            <datalist id="shop-search-suggestions">
              {getShopSearchSuggestions(products).map((term) => (
                <option key={term} value={term} />
              ))}
            </datalist>
          </form>

          <div className="mt-3 flex max-w-3xl gap-2 overflow-x-auto pb-1" aria-label="Variant search suggestions">
            {getShopVariantSearchSuggestions(products).map((term) => (
              <button
                key={term}
                type="button"
                className="shrink-0 border-2 border-black bg-[var(--ast-global-color-4)] px-3 py-2 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-black hover:text-white"
                onClick={() => {
                  setQuery(term);
                  setNotice("");
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="sticky top-14 z-30 border-b-2 border-black bg-[var(--ast-global-color-4)] sm:top-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6">
          <div className="w-full min-w-0 sm:flex-1 sm:overflow-x-auto">
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-max">
              {categories.map((category) => {
                const isActive = selectedCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    className={[
                      "flex min-h-10 min-w-0 items-center justify-center border-2 border-black px-2 py-2 text-center text-[11px] font-bold uppercase leading-tight tracking-wide transition-colors sm:min-h-0 sm:shrink-0 sm:px-3 sm:text-xs sm:tracking-wider",
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
                    <span className="min-w-0 break-words">
                      {category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="relative block w-full shrink-0 sm:w-auto">
            <span className="sr-only">Sort products</span>

            <select
              value={sortBy}
              aria-label="Sort products"
              className="h-10 w-full appearance-none border-2 border-black bg-white py-0 pl-3 pr-9 text-xs font-bold uppercase tracking-wider text-black outline-none sm:h-9 sm:w-auto"
              onChange={(event) =>
                setSortBy(event.target.value as SortValue)
              }
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black"
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

      {freebiePickerOpen ? (
        <FreebieSelectionModal
          products={visibleFreebieProducts}
          query={freebieQuery}
          selectedHref={selectedFreebieHref}
          winClaimToken={winClaimToken}
          onClose={() => setFreebiePickerOpen(false)}
          onContinue={handleContinueWithFreebie}
          onQueryChange={setFreebieQuery}
          onSelect={setSelectedFreebieHref}
        />
      ) : null}
    </div>
  );
}

function getShopSearchSuggestions(products: ShopProductItem[]) {
  return Array.from(
    new Set(
      products
        .flatMap((product) => [
          product.name,
          product.brand,
          ...product.categories,
          ...product.variantSearchTerms,
        ])
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  ).slice(0, 80);
}

function getShopVariantSearchSuggestions(products: ShopProductItem[]) {
  return Array.from(
    new Set(
      products
        .flatMap((product) => product.variantSearchTerms)
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  ).slice(0, 18);
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

function FreebieSelectionModal({
  onClose,
  onContinue,
  onQueryChange,
  onSelect,
  products,
  query,
  selectedHref,
  winClaimToken,
}: {
  onClose: () => void;
  onContinue: () => void;
  onQueryChange: (value: string) => void;
  onSelect: (href: string) => void;
  products: ShopProductItem[];
  query: string;
  selectedHref: string;
  winClaimToken: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bayblaze-freebie-picker-heading"
    >
      <section className="bayblaze-sharp-card max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl overflow-auto bg-[var(--ast-global-color-4)]">
        <div className="sticky top-0 z-10 border-b-2 border-black bg-white p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="text-left">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--ast-global-color-1)]">
                BayBlaze win reward
              </p>
              <h2
                id="bayblaze-freebie-picker-heading"
                className="mt-1 text-3xl font-black uppercase leading-none text-black sm:text-5xl"
              >
                Select your freebie
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-medium leading-[1.6] text-[#585858]">
                Pick the freebie you want. BayBlaze will still verify inventory, coverage, checkout, and 21+ delivery rules before the order is finalized.
              </p>
              {winClaimToken ? (
                <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-[var(--ast-global-color-1)]">
                  Claim token ready
                </p>
              ) : null}
            </div>
            <button
              aria-label="Close freebie picker"
              className="grid size-11 shrink-0 place-items-center border-2 border-black bg-white text-2xl font-black leading-none hover:bg-black hover:text-white"
              type="button"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          <form
            role="search"
            className="mt-5 flex max-w-xl border-2 border-black bg-white"
            onSubmit={(event) => event.preventDefault()}
          >
            <label htmlFor="freebie-search" className="sr-only">
              Search freebies
            </label>
            <div className="grid w-11 place-items-center border-r-2 border-black bg-[var(--ast-global-color-4)]">
              <SearchLineIcon className="h-4 w-4" />
            </div>
            <input
              id="freebie-search"
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search brand, product, category…"
              className="min-w-0 flex-1 bg-white px-3 py-3 text-sm font-medium text-black outline-none placeholder:text-[#7a7a7a]"
            />
          </form>
        </div>

        <div className="p-4 sm:p-6">
          {products.length === 0 ? (
            <div className="bayblaze-sharp-card bg-white p-8 text-center">
              <div className="text-2xl font-black uppercase">No matches</div>
              <p className="mt-1 text-sm font-medium text-[#585858]">
                Try a different search term.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => (
                <FreebieTile
                  key={product.href}
                  product={product}
                  selected={selectedHref === product.href}
                  onSelect={() => onSelect(product.href)}
                />
              ))}
            </div>
          )}

          <div className="sticky bottom-0 mt-6 border-2 border-black bg-white p-3 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <p className="text-sm font-bold leading-[1.5] text-[#585858]">
              Choose a tile, then continue to that product page with your win claim attached.
            </p>
            <button
              className="bayblaze-sharp-button bayblaze-sharp-button--primary mt-3 w-full shrink-0 sm:mt-0 sm:w-auto"
              type="button"
              disabled={!selectedHref}
              onClick={onContinue}
            >
              Continue with selected freebie
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function FreebieTile({
  onSelect,
  product,
  selected,
}: {
  onSelect: () => void;
  product: ShopProductItem;
  selected: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[
        "group flex min-h-full flex-col overflow-hidden border-2 border-black bg-white text-left transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_#000]",
        selected ? "shadow-[5px_5px_0_#000] outline outline-4 outline-[var(--ast-global-color-0)]" : "",
      ].join(" ")}
      onClick={onSelect}
    >
      <span className="relative block aspect-square w-full overflow-hidden border-b-2 border-black bg-[var(--ast-global-color-4)]">
        {selected ? (
          <span className="bayblaze-sharp-badge bayblaze-sharp-badge--green absolute left-2 top-2 z-10">
            Selected
          </span>
        ) : null}
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 280px"
          className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
        />
      </span>
      <span className="flex flex-1 flex-col p-3 sm:p-4">
        <span className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[var(--ast-global-color-1)]">
          {product.brand}
        </span>
        <span className="line-clamp-2 text-[14px] font-bold uppercase leading-tight text-black sm:text-[16px]">
          {product.name}
        </span>
        <span className="mt-3 text-[15px] font-bold leading-none text-black sm:text-[17px]">
          {product.salePrice || product.price}
        </span>
      </span>
    </button>
  );
}
