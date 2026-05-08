"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import type { StorefrontProduct } from "@/app/lib/medusa-products";

type TabId = "description" | "information" | "reviews";

const tabs: { id: TabId; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "information", label: "Additional information" },
  { id: "reviews", label: "Reviews (0)" },
];

export default function LostMaryProductPage({
  product,
}: {
  product: StorefrontProduct;
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("description");
  const [flavor, setFlavor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartNotice, setCartNotice] = useState("");

  const currentImage = product.images[activeImage] ?? product.images[0];
  const primaryCategory = product.categories[0];
  const selectedSummary = useMemo(() => {
    if (!flavor) {
      return "";
    }

    return `${quantity} x ${product.name} - ${flavor}`;
  }, [flavor, product.name, quantity]);

  function updateQuantity(nextQuantity: number) {
    setQuantity(Math.min(Math.max(nextQuantity, 1), 12));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (product.flavors.length > 0 && !flavor) {
      return;
    }

    setCartNotice(`${selectedSummary || `${quantity} x ${product.name}`} added.`);
  }

  return (
    <div className="bayblaze-product-page bg-white pb-20 pt-[112px] text-[#585858]">
      <div className="mx-auto w-full max-w-[1180px] px-5">
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 text-[14px] leading-none text-[#7a7a7a]"
        >
          <Link className="text-black transition-colors hover:text-[var(--ast-global-color-0)]" href="/">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            className="text-black transition-colors hover:text-[var(--ast-global-color-0)]"
            href={`/product-category/${primaryCategory?.handle ?? "vapes"}`}
          >
            {primaryCategory?.name ?? "Vapes"}
          </Link>
          <span aria-hidden="true">/</span>
          <span>{product.name}</span>
        </nav>

        <section className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(390px,0.82fr)] lg:gap-14">
          <div className="grid gap-4 sm:grid-cols-[84px_minmax(0,1fr)]">
            <div className="order-2 flex gap-3 sm:order-1 sm:flex-col">
              {product.images.map((image, index) => (
                <button
                  key={image.src}
                  type="button"
                  className={`relative size-20 shrink-0 border bg-white transition ${
                    activeImage === index
                      ? "border-black"
                      : "border-[#e4e4e4] hover:border-[var(--ast-global-color-0)]"
                  }`}
                  aria-label={`View product image ${index + 1}`}
                  aria-pressed={activeImage === index}
                  onClick={() => setActiveImage(index)}
                >
                  <Image
                    src={image.src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain p-2"
                  />
                </button>
              ))}
            </div>

            <div className="order-1 sm:order-2">
              <div className="relative flex aspect-square items-center justify-center border border-[#eeeeee] bg-white">
                {product.saleBadge ? (
                  <span className="absolute left-4 top-4 z-10 bg-[var(--ast-global-color-0)] px-3 py-1.5 text-[13px] font-semibold leading-none text-white">
                    {product.saleBadge}
                  </span>
                ) : null}
                {currentImage ? (
                  <Image
                    src={currentImage.src}
                    alt={currentImage.alt}
                    fill
                    priority
                    sizes="(max-width: 1024px) 90vw, 610px"
                    className="object-contain p-8 sm:p-12"
                  />
                ) : null}
              </div>
            </div>
          </div>

          <article>
            {product.brand ? (
              <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-[var(--ast-global-color-0)]">
                {product.brand}
              </p>
            ) : null}
            <h1 className="bayblaze-product-title text-black">
              {product.name}
            </h1>

            <p className="mt-4 flex items-baseline gap-3 text-[24px] leading-none">
              {product.originalPrice ? (
                <del className="text-[#7a7a7a]">{product.originalPrice}</del>
              ) : null}
              <ins className="text-black no-underline">{product.salePrice}</ins>
            </p>

            {product.details[0] ? (
              <p className="mt-6 text-[17px] leading-[1.8] text-[#585858]">
                {product.details[0]}
              </p>
            ) : null}

            <dl className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {product.specs.slice(0, 3).map(([label, value]) => (
                <div key={label} className="border border-[#ececec] px-4 py-3">
                  <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#7a7a7a]">
                    {label}
                  </dt>
                  <dd className="mt-1 text-[15px] leading-[1.4] text-black">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <form className="mt-8" onSubmit={handleSubmit}>
              <label
                className="mb-2 block text-[15px] font-semibold text-black"
                htmlFor="lost-mary-flavor"
              >
                Flavor
              </label>
              <select
                id="lost-mary-flavor"
                value={flavor}
                className="h-12 w-full border border-[#d6d6d6] bg-white px-4 text-[16px] text-black outline-none transition focus:border-black"
                onChange={(event) => {
                  setFlavor(event.target.value);
                  setCartNotice("");
                }}
              >
                <option value="">Choose an option</option>
                {product.flavors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <div className="mt-5 flex flex-wrap gap-3">
                <div className="grid h-12 grid-cols-[44px_56px_44px] border border-[#d6d6d6]">
                  <button
                    type="button"
                    className="flex items-center justify-center text-[22px] text-black transition-colors hover:bg-[#f4f4f4]"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(quantity - 1)}
                  >
                    -
                  </button>
                  <input
                    aria-label="Quantity"
                    className="min-w-0 border-x border-[#d6d6d6] text-center text-[16px] text-black outline-none"
                    inputMode="numeric"
                    min={1}
                    max={12}
                    type="number"
                    value={quantity}
                    onChange={(event) =>
                      updateQuantity(Number(event.target.value) || 1)
                    }
                  />
                  <button
                    type="button"
                    className="flex items-center justify-center text-[22px] text-black transition-colors hover:bg-[#f4f4f4]"
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={product.flavors.length > 0 && !flavor}
                  className="h-12 min-w-[180px] bg-[var(--ast-global-color-0)] px-7 text-[15px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#b9c8af]"
                >
                  Add to cart
                </button>
              </div>

              <p
                className="mt-3 min-h-6 text-[14px] font-medium text-[var(--ast-global-color-1)]"
                aria-live="polite"
              >
                {cartNotice}
              </p>
            </form>

            <div className="mt-5 border-y border-[#eeeeee] py-4 text-[14px] leading-[1.8]">
              <p>
                <span className="font-semibold text-black">SKU:</span>{" "}
                {product.sku}
              </p>
              <p>
                <span className="font-semibold text-black">Categories:</span>{" "}
                {product.categories.map((category, index) => (
                  <span key={category.handle}>
                    <Link
                      className="text-[#585858] transition-colors hover:text-[var(--ast-global-color-0)]"
                      href={`/product-category/${category.handle}`}
                    >
                      {category.name}
                    </Link>
                    {index < product.categories.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
              {product.brand ? (
                <p>
                  <span className="font-semibold text-black">Brand:</span>{" "}
                  <Link
                    className="text-[#585858] transition-colors hover:text-[var(--ast-global-color-0)]"
                    href={`/brand/${product.brand.toLowerCase().replaceAll(" ", "-")}`}
                  >
                    {product.brand}
                  </Link>
                </p>
              ) : null}
            </div>

            <p className="mt-5 text-[13px] font-medium uppercase tracking-[0.16em] text-[#7a7a7a]">
              21+ only
            </p>
          </article>
        </section>

        <section className="mt-16 border-t border-[#e8e8e8] pt-8">
          <div className="flex flex-wrap gap-2 border-b border-[#e8e8e8]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`bayblaze-product-tab px-4 py-3 text-left text-[15px] font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "border-black text-black"
                    : "border-transparent text-[#7a7a7a] hover:text-black"
                }`}
                aria-pressed={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-w-[920px] py-8">
            {activeTab === "description" && (
              <div className="space-y-5 text-[17px] leading-[1.85] text-[#585858]">
                {product.details.map((paragraph) => (
                  paragraph ? <p key={paragraph}>{paragraph}</p> : null
                ))}
              </div>
            )}

            {activeTab === "information" && (
              <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(260px,0.28fr)]">
                <dl className="divide-y divide-[#eeeeee] border-y border-[#eeeeee]">
                  {product.specs.map(([label, value]) => (
                    <div
                      key={label}
                      className="grid gap-1 py-4 sm:grid-cols-[180px_minmax(0,1fr)]"
                    >
                      <dt className="font-semibold text-black">{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>

                <div>
                  <h2 className="mb-3 text-[18px] font-semibold text-black">
                    Flavor
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {product.flavors.length ? (
                      product.flavors.map((item) => (
                        <span
                          key={item}
                          className="border border-[#e4e4e4] px-3 py-1.5 text-[14px] text-black"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="text-[15px] text-[#585858]">
                        No flavor options configured.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <h2 className="text-[24px] font-semibold text-black">
                  Reviews
                </h2>
                <p className="mt-4 text-[17px] leading-[1.8]">
                  There are no reviews yet.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
