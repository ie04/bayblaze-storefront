"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Product = {
  name: string;
  image: string;
  href: string;
  categories: string[];
  originalPrice?: number;
  salePrice?: number;
  price: number;
  action: "Add to cart" | "Select options";
  isSale?: boolean;
  description: string;
};

const categories = [
  "All Categories",
  "Cones & Rolling Papers",
  "Smoking Accessories",
  "Pre-Rolled Cones",
  "Vapes",
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
      "Browse our full selection of vapes, rolling papers, cones, and everyday smoke shop essentials.",
  },
  "Cones & Rolling Papers": {
    title: "Cones & Rolling Papers",
    description:
      "Find rolling papers, pre-rolled cones, and simple smoking essentials for a smooth session.",
  },
  "Smoking Accessories": {
    title: "Smoking Accessories",
    description:
      "Explore useful add-ons and everyday accessories made to keep your setup ready.",
  },
  "Pre-Rolled Cones": {
    title: "Pre-Rolled Cones",
    description:
      "Stock up on convenient pre-rolled cones for quick, consistent, and easy packing.",
  },
  Vapes: {
    title: "Vapes",
    description:
      "Explore vape options including disposables and flavor-focused products ready for delivery.",
  },
};

const products: Product[] = [
  {
    name: "Lost Mary MT35000 Turbo",
    image: "https://bayblaze.net/wp-content/uploads/2026/03/LMMTK35K.png",
    href: "/product/lost-mary-mt35k-turbo",
    categories: ["Disposable Vapes", "Vapes"],
    originalPrice: 20,
    salePrice: 17.99,
    price: 17.99,
    action: "Select options",
    isSale: true,
    description: "Long-lasting disposable vape with bold flavor options.",
  },
  {
    name: "RAW Cone Classic 1 1/4 (20 Pack)",
    image:
      "https://bayblaze.net/wp-content/uploads/2026/03/raw-classic-cone-20pk-1.jpg",
    href: "https://bayblaze.net/product/raw-classic-cones-20pack/",
    categories: ["Cones & Rolling Papers", "Smoking Accessories", "Pre-Rolled Cones"],
    price: 6.99,
    action: "Add to cart",
    description: "Classic RAW pre-rolled cones in a convenient 20 pack.",
  },
  {
    name: "Raw Cones King Size (3 Pack)",
    image: "https://bayblaze.net/wp-content/uploads/2026/03/raw-king-cones-3pk.jpg",
    href: "https://bayblaze.net/product/raw-cones-king-size-3-pack/",
    categories: ["Cones & Rolling Papers", "Smoking Accessories", "Pre-Rolled Cones"],
    price: 3.99,
    action: "Add to cart",
    description: "King size RAW cones for simple, consistent sessions.",
  },
  {
    name: "RAZ LTX 25000 (Gush Edition)",
    image:
      "https://bayblaze.net/wp-content/uploads/2026/03/raz-ltx-25000-gush-edition-blue-raz-gush.png",
    href: "https://bayblaze.net/product/raz-ltx-25000-gush-edition/",
    categories: ["Disposable Vapes", "Vapes"],
    originalPrice: 30,
    salePrice: 17.99,
    price: 17.99,
    action: "Select options",
    isSale: true,
    description: "Gush Edition disposable vape with sweet fruit flavor profiles.",
  },
  {
    name: "Wave",
    image: "https://bayblaze.net/wp-content/uploads/2026/03/wave.png",
    href: "https://bayblaze.net/product/wave/",
    categories: ["Disposable Vapes", "Vapes"],
    originalPrice: 25,
    salePrice: 14.99,
    price: 14.99,
    action: "Select options",
    isSale: true,
    description: "Compact disposable vape with smooth, everyday draw.",
  },
];

const sortOptions = [
  { value: "default", label: "Default sorting" },
  { value: "popularity", label: "Sort by popularity" },
  { value: "latest", label: "Sort by latest" },
  { value: "price-asc", label: "Sort by price: low to high" },
  { value: "price-desc", label: "Sort by price: high to low" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

export default function ShopPageClient() {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [sortBy, setSortBy] = useState<SortValue>("default");
  const [notice, setNotice] = useState("");
  const activeCategoryCopy = categoryCopy[activeCategory];

  const visibleProducts = useMemo(() => {
    const filtered =
      activeCategory === "All Categories"
        ? products
        : products.filter((product) =>
            product.categories.includes(activeCategory),
          );

    return [...filtered].sort((a, b) => {
      if (sortBy === "price-asc") {
        return a.price - b.price;
      }

      if (sortBy === "price-desc") {
        return b.price - a.price;
      }

      if (sortBy === "latest") {
        return products.indexOf(b) - products.indexOf(a);
      }

      return products.indexOf(a) - products.indexOf(b);
    });
  }, [activeCategory, sortBy]);

  function handleQuickAdd(product: Product) {
    setNotice(`${product.name} added.`);
  }

  return (
    <div className="bayblaze-shop-page bg-white pb-20 pt-[112px]">
      <div className="mx-auto w-full max-w-[1180px] px-5">
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

        <header className="mb-8 border-b border-[#eeeeee] pb-8">
          <h1 className="bayblaze-shop-title text-black">
            {activeCategoryCopy.title}
          </h1>

          <p className="mt-3 max-w-[640px] text-[18px] leading-[1.7] text-[#585858]">
            {activeCategoryCopy.description}
          </p>
        </header>

        <section className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`border px-4 py-2 text-[14px] font-medium leading-none transition-colors ${
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

        <div className="mb-7 flex flex-col gap-4 border-y border-[#eeeeee] py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] text-[#585858]">
            Showing {visibleProducts.length === products.length ? "all " : ""}
            {visibleProducts.length} result
            {visibleProducts.length === 1 ? "" : "s"}
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
          className="grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.name}
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
  product: Product;
  onQuickAdd: (product: Product) => void;
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
    <article className="group relative flex min-h-full flex-col border border-[#eeeeee] bg-white">
      <Link
        href={product.href}
        className="relative block aspect-square overflow-hidden bg-white"
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
          className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-5 pt-4 text-center">
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a7a7a]">
          {product.categories[0]}
        </p>

        <Link
          href={product.href}
          className="text-black transition-colors hover:text-[var(--ast-global-color-0)]"
          target={isInternal ? undefined : "_blank"}
        >
          <h2 className="text-[18px] font-semibold leading-[1.3]">
            {product.name}
          </h2>
        </Link>

        <p className="mt-3 text-[16px] leading-none">
          {product.originalPrice ? (
            <>
              <del className="mr-2 text-[#7a7a7a]">
                {formatPrice(product.originalPrice)}
              </del>
              <ins className="text-black no-underline">
                {formatPrice(product.salePrice ?? product.price)}
              </ins>
            </>
          ) : (
            <span className="text-black">{formatPrice(product.price)}</span>
          )}
        </p>

        <p className="mt-4 flex-1 text-[14px] leading-[1.6] text-[#676767]">
          {product.description}
        </p>

        {product.action === "Add to cart" ? (
          <button
            type="button"
            className="mt-5 h-11 bg-[var(--ast-global-color-0)] px-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-black"
            onClick={() => onQuickAdd(product)}
          >
            Add to cart
          </button>
        ) : (
          <button
            type="button"
            className="mt-5 h-11 bg-[var(--ast-global-color-0)] px-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-black"
            onClick={handleSelectOptions}
          >
            Select options
          </button>
        )}
      </div>
    </article>
  );
}

function formatPrice(price: number) {
  return `$ ${price.toFixed(2)}`;
}
