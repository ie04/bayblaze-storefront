"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useCart } from "@/app/components/cart/CartContext";
import type { StorefrontProduct } from "@/app/lib/medusa-products";

type TabId = "description" | "information" | "reviews";

const tabs: { id: TabId; label: string }[] = [
  { id: "description", label: "Description" },
  { id: "information", label: "Additional information" },
  { id: "reviews", label: "Reviews (0)" },
];

export default function ProductPage({
  product,
}: {
  product: StorefrontProduct;
}) {
  const { addItem, items } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>("description");
  const [flavor, setFlavor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartNotice, setCartNotice] = useState("");

  const currentImage = product.images[activeImage] ?? product.images[0];
  const primaryCategory = product.categories[0];
  const selectedVariantId = useMemo(() => {
    if (!flavor) {
      return product.variantId;
    }

    return (
      product.variants.find((variant) => {
        return variant.optionValues.includes(flavor) || variant.flavor === flavor;
      })?.id ?? product.variantId
    );
  }, [flavor, product.variantId, product.variants]);
  const selectedVariant = useMemo(() => {
    return product.variants.find((variant) => variant.id === selectedVariantId);
  }, [product.variants, selectedVariantId]);

  const hasMultipleVariants = product.variants.length > 1;
  const shouldShowStockStatus = !hasMultipleVariants || Boolean(flavor);
  const selectedAvailableQuantity =
    selectedVariant?.availableQuantity ?? product.availableQuantity;
  const selectedInventoryState =
    selectedVariant?.inventoryState ?? product.inventoryState;
  const selectedCartItemId = [selectedVariantId, flavor || "default"].join("::");
  const existingCartQuantity = useMemo(() => {
    return items.find((item) => item.id === selectedCartItemId)?.quantity ?? 0;
  }, [items, selectedCartItemId]);
  const remainingAvailableQuantity =
    selectedAvailableQuantity === undefined
      ? undefined
      : Math.max(selectedAvailableQuantity - existingCartQuantity, 0);
  const isOutOfStock = selectedAvailableQuantity === 0;
  const hasReachedCartLimit =
    selectedAvailableQuantity !== undefined &&
    selectedAvailableQuantity > 0 &&
    remainingAvailableQuantity === 0;
  const quantityLimit =
    remainingAvailableQuantity === undefined
      ? 12
      : Math.max(1, Math.min(12, remainingAvailableQuantity));
  const canAddSelectedVariant =
    selectedAvailableQuantity !== undefined &&
    Boolean(selectedInventoryState) &&
    selectedAvailableQuantity > 0 &&
    remainingAvailableQuantity !== undefined &&
    remainingAvailableQuantity > 0;

  useEffect(() => {
    if (quantity > quantityLimit) {
      setQuantity(quantityLimit);
    }
  }, [quantity, quantityLimit]);

  const selectedSummary = useMemo(() => {
    if (!flavor) {
      return "";
    }

    return `${quantity} x ${product.name} - ${flavor}`;
  }, [flavor, product.name, quantity]);

  function updateQuantity(nextQuantity: number) {
    setQuantity(Math.min(Math.max(nextQuantity, 1), quantityLimit));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (product.flavors.length > 0 && !flavor) {
      setCartNotice("Please choose a flavor.");
      return;
    }

    if (!selectedVariantId) {
      setCartNotice("This product is not available for checkout yet.");
      return;
    }

    if (selectedAvailableQuantity === undefined) {
      setCartNotice(
        "This product is missing inventory quantity data. Please contact BayBlaze before checkout.",
      );
      return;
    }

    if (!selectedInventoryState) {
      setCartNotice(
        "This product is missing delivery inventory data. Please contact BayBlaze before checkout.",
      );
      return;
    }

    const availableToAdd = remainingAvailableQuantity;

    if (availableToAdd === undefined) {
      setCartNotice(
        "This product is missing inventory quantity data. Please contact BayBlaze before checkout.",
      );
      return;
    }

    if (availableToAdd === 0) {
      setCartNotice(
        isOutOfStock
          ? `${product.name} is out of stock.`
          : `You already have all ${selectedAvailableQuantity} available units in your cart.`,
      );
      return;
    }

    if (quantity > availableToAdd) {
      setCartNotice(
        `${product.name} has only ${availableToAdd} left available.`,
      );
      return;
    }

    addItem({
      id: selectedCartItemId,
      availableQuantity: selectedAvailableQuantity,
      variantId: selectedVariantId,
      productId: product.id,
      productHandle: product.handle,
      inventoryState: selectedInventoryState,
      name: product.name,
      flavor: flavor || undefined,
      image: product.images[0]?.src,
      price: product.salePrice,
      quantity,
    });

    setCartNotice(`${selectedSummary || `${quantity} x ${product.name}`} added.`);
  }

  return (
    <div className="bayblaze-product-page bg-white pb-14 pt-[92px] text-[#585858] sm:pb-20 sm:pt-[112px]">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-5">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-[14px] leading-snug text-[#7a7a7a] sm:mb-8 sm:leading-none"
        >
          <Link
            className="text-black transition-colors hover:text-[var(--ast-global-color-0)]"
            href="/"
          >
            Home
          </Link>

          <span aria-hidden="true">/</span>

          <Link
            className="text-black transition-colors hover:text-[var(--ast-global-color-0)]"
            href={`/shop?q=${encodeURIComponent(primaryCategory?.name ?? "Vapes")}`}
          >
            {primaryCategory?.name ?? "Vapes"}
          </Link>

          <span aria-hidden="true">/</span>
          <span>{product.name}</span>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(390px,0.82fr)] lg:gap-14">
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
              <div className="relative flex aspect-[1.05] items-center justify-center border border-[#d0d0d0] bg-[var(--ast-global-color-4)] sm:aspect-square">
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
                    className="object-contain p-6 sm:p-12"
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

              <ins className="text-black no-underline">
                {product.salePrice}
              </ins>
            </p>

              {shouldShowStockStatus ? (
                <p className={`mt-3 text-[15px] font-semibold leading-[1.5] ${
                  isOutOfStock
                    ? "text-red-700"
                    : selectedAvailableQuantity === undefined
                      ? "text-[#585858]"
                      : "text-[var(--ast-global-color-1)]"
                }`}>
                  {selectedAvailableQuantity === undefined
                    ? "Stock status unavailable"
                    : isOutOfStock
                      ? "Out of stock"
                      : existingCartQuantity > 0
                        ? `${selectedAvailableQuantity} in stock · ${existingCartQuantity} in cart`
                        : `${selectedAvailableQuantity} in stock`}
                </p>
              ) : null}

            {product.details[0] ? (
              <p className="mt-5 text-[16px] leading-[1.7] text-[#585858] sm:mt-6 sm:text-[17px] sm:leading-[1.8]">
                {product.details[0]}
              </p>
            ) : null}

            <dl className="mt-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:mt-7 sm:grid-cols-3">
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
              {product.flavors.length > 0 ? (
                <>
                  <label
                    className="mb-2 block text-[15px] font-semibold text-black"
                    htmlFor="product-flavor"
                  >
                    Flavor
                  </label>

                  <select
                    id="product-flavor"
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
                </>
              ) : null}

              <div className="mt-5 flex flex-col gap-3 min-[420px]:flex-row min-[420px]:flex-wrap">
                <div className="grid h-12 w-full grid-cols-[44px_minmax(56px,1fr)_44px] border border-[#d6d6d6] min-[420px]:w-auto min-[420px]:grid-cols-[44px_56px_44px]">
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
                    max={quantityLimit}
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
                  disabled={(product.flavors.length > 0 && !flavor) || !canAddSelectedVariant}
                  className="h-12 min-w-[180px] flex-1 bg-[var(--ast-global-color-0)] px-7 text-[15px] font-semibold uppercase tracking-[0.1em] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#9ca3af] min-[420px]:flex-none sm:tracking-[0.12em]"
                >
                  {isOutOfStock
                    ? "Out of Stock"
                    : hasReachedCartLimit
                      ? "Max in Cart"
                      : "Add to cart"}
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
                    href={`/brand/${product.brand
                      .toLowerCase()
                      .replaceAll(" ", "-")}`}
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

        <section className="mt-12 border-t border-[#e8e8e8] pt-6 sm:mt-16 sm:pt-8">
          <div className="-mx-4 flex gap-2 overflow-x-auto border-b border-[#e8e8e8] px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`bayblaze-product-tab shrink-0 px-4 py-3 text-left text-[15px] font-semibold transition-colors ${
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
                {product.details.map((paragraph) =>
                  paragraph ? <p key={paragraph}>{paragraph}</p> : null
                )}
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
