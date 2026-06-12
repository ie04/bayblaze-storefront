"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useMemo, useState } from "react";

import { useCart } from "@/app/components/cart/CartContext";
import {
  ShieldCheckLineIcon,
  TruckLineIcon,
  ZapLineIcon,
} from "@/app/components/icons/SharpIcons";
import type { StorefrontProduct } from "@/app/lib/medusa-products";

export default function ProductPage({
  product,
}: {
  product: StorefrontProduct;
}) {
  const { addItem, items } = useCart();

  const [activeImage, setActiveImage] = useState(0);
  const [flavor, setFlavor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [cartNotice, setCartNotice] = useState("");

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
  const shouldUseVariantGallery = !hasMultipleVariants || Boolean(flavor);
  const galleryImages =
    shouldUseVariantGallery && selectedVariant?.images.length
      ? selectedVariant.images
      : product.images;

  const safeActiveImage =
    galleryImages.length > 0 ? Math.min(activeImage, galleryImages.length - 1) : 0;
  const currentImage = galleryImages[safeActiveImage] ?? galleryImages[0];

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

  const selectedQuantity = Math.min(quantity, quantityLimit);

  const canAddSelectedVariant =
    selectedAvailableQuantity !== undefined &&
    Boolean(selectedInventoryState) &&
    selectedAvailableQuantity > 0 &&
    remainingAvailableQuantity !== undefined &&
    remainingAvailableQuantity > 0;

  const selectedSummary = useMemo(() => {
    if (!flavor) {
      return "";
    }

    return `${selectedQuantity} x ${product.name} - ${flavor}`;
  }, [flavor, product.name, selectedQuantity]);

  function updateQuantity(nextQuantity: number) {
    setQuantity(Math.min(Math.max(nextQuantity, 1), quantityLimit));
  }

  function handleVariantSelect(nextFlavor: string) {
    setFlavor(nextFlavor);
    setActiveImage(0);
    setCartNotice("");
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

    if (selectedQuantity > availableToAdd) {
      setCartNotice(`${product.name} has only ${availableToAdd} left available.`);
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
      image: currentImage?.src ?? galleryImages[0]?.src,
      price: product.salePrice,
      quantity: selectedQuantity,
    });

    setCartNotice(`${selectedSummary || `${selectedQuantity} x ${product.name}`} added.`);
  }

  return (
    <div className="bayblaze-product-page bg-[var(--ast-global-color-4)] pb-14 font-[var(--font-jost)] text-black sm:pb-20">
      <div className="border-b-2 border-black bg-white">
        <div className="mx-auto max-w-7xl px-4 py-3 text-xs font-bold uppercase tracking-widest sm:px-6">
          <Link href="/" className="text-[#585858] no-underline hover:text-black">
            Home
          </Link>
          <span className="mx-2 text-[#585858]">/</span>
          <Link
            href={`/shop?q=${encodeURIComponent(primaryCategory?.name ?? "Vapes")}`}
            className="text-[#585858] no-underline hover:text-black"
          >
            {primaryCategory?.name ?? "Vapes"}
          </Link>
          <span className="mx-2 text-[#585858]">/</span>
          <span>{product.name}</span>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="relative aspect-square overflow-hidden border-2 border-black bg-[var(--ast-global-color-4)]">
              <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
                {product.saleBadge ? (
                  <span className="bayblaze-sharp-badge bayblaze-sharp-badge--green">
                    {product.saleBadge}
                  </span>
                ) : null}

                {selectedInventoryState === "ON_VEHICLE" ? (
                  <span className="bayblaze-sharp-badge bg-white">
                    <ZapLineIcon className="h-3 w-3 text-[var(--ast-global-color-0)]" />
                    Fast delivery
                  </span>
                ) : null}
              </div>

              {currentImage ? (
                <Image
                  src={currentImage.src}
                  alt={currentImage.alt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 92vw, 620px"
                  className="object-contain"
                />
              ) : (
                <div className="grid h-full place-items-center px-6 text-center text-sm font-extrabold uppercase tracking-widest text-[#585858]">
                  Image coming soon
                </div>
              )}
            </div>

            {galleryImages.length > 1 ? (
              <div className="mt-3 grid grid-cols-4 gap-3">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${selectedVariantId}-${image.src}-${index}`}
                    type="button"
                    className={[
                      "relative aspect-square overflow-hidden border-2 bg-white transition-colors",
                      safeActiveImage === index
                        ? "border-black"
                        : "border-black/45 hover:border-black",
                    ].join(" ")}
                    aria-label={`View product image ${index + 1}`}
                    aria-pressed={safeActiveImage === index}
                    onClick={() => setActiveImage(index)}
                  >
                    <Image
                      src={image.src}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-contain scale-[1.12]"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <article>
            {product.brand ? (
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--ast-global-color-1)]">
                {product.brand}
              </p>
            ) : null}

            <h1 className="mt-1 text-3xl font-black uppercase leading-tight text-black sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            <div className="mt-3 flex items-baseline gap-3">
              {product.originalPrice ? (
                <del className="text-base text-[#7a7a7a]">
                  {product.originalPrice}
                </del>
              ) : null}
              <ins className="text-3xl font-black text-black no-underline">
                {product.salePrice}
              </ins>
            </div>

            {product.details[0] ? (
              <p className="mt-4 text-sm font-medium leading-[1.75] text-black sm:text-base">
                {product.details[0]}
              </p>
            ) : null}

            {product.flavors.length > 0 ? (
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-widest text-black">
                    Flavor
                  </span>
                  {flavor ? (
                    <span className="text-xs font-bold uppercase tracking-widest text-[#585858]">
                      Selected: {flavor}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {product.flavors.map((item) => {
                    const isActive = item === flavor;

                    return (
                      <button
                        key={item}
                        type="button"
                        aria-pressed={isActive}
                        className={[
                          "border-2 border-black px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors",
                          isActive
                            ? "bg-black text-white"
                            : "bg-white text-black hover:bg-[var(--ast-global-color-0)] hover:text-white",
                        ].join(" ")}
                        onClick={() => handleVariantSelect(item)}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <form className="mt-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-[auto_1fr] gap-3 sm:grid-cols-[auto_1fr]">
                <div className="inline-flex border-2 border-black bg-white">
                  <button
                    type="button"
                    className="grid h-12 w-12 place-items-center text-xl transition-colors hover:bg-black hover:text-white"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(quantity - 1)}
                  >
                    -
                  </button>

                  <input
                    aria-label="Quantity"
                    className="h-12 w-12 border-x-2 border-black text-center text-base font-bold text-black outline-none"
                    inputMode="numeric"
                    min={1}
                    max={quantityLimit}
                    type="number"
                    value={selectedQuantity}
                    onChange={(event) =>
                      updateQuantity(Number(event.target.value) || 1)
                    }
                  />

                  <button
                    type="button"
                    className="grid h-12 w-12 place-items-center text-xl transition-colors hover:bg-black hover:text-white"
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={(product.flavors.length > 0 && !flavor) || !canAddSelectedVariant}
                  className="bayblaze-sharp-button bayblaze-sharp-button--primary !h-12 !py-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isOutOfStock
                    ? "Out of stock"
                    : hasReachedCartLimit
                      ? "Max in cart"
                      : "Add to cart"}
                </button>
              </div>

              <p
                className="mt-3 min-h-6 text-sm font-bold text-[var(--ast-global-color-1)]"
                aria-live="polite"
              >
                {cartNotice}
              </p>
            </form>

            {shouldShowStockStatus ? (
              <p
                className={[
                  "mt-2 text-sm font-bold leading-[1.5]",
                  isOutOfStock
                    ? "text-red-700"
                    : selectedAvailableQuantity === undefined
                      ? "text-[#585858]"
                      : "text-[var(--ast-global-color-1)]",
                ].join(" ")}
              >
                {selectedAvailableQuantity === undefined
                  ? "Stock status unavailable"
                  : isOutOfStock
                    ? "Out of stock"
                    : existingCartQuantity > 0
                      ? `${selectedAvailableQuantity} in stock · ${existingCartQuantity} in cart`
                      : `${selectedAvailableQuantity} in stock`}
              </p>
            ) : null}

            <div className="mt-6 grid border-2 border-black bg-white sm:grid-cols-2">
              <div className="flex items-start gap-3 border-b-2 border-black p-4 sm:border-b-0 sm:border-r-2">
                <TruckLineIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ast-global-color-0)]" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest">
                    Delivery
                  </div>
                  <div className="mt-1 text-sm font-medium leading-[1.45]">
                    {selectedInventoryState === "ON_VEHICLE"
                      ? "In stock — ready to dispatch in Tampa."
                      : "Available for scheduled Tampa dispatch."}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4">
                <ShieldCheckLineIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ast-global-color-0)]" />
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest">
                    21+ required
                  </div>
                  <div className="mt-1 text-sm font-medium leading-[1.45]">
                    Driver verifies a valid ID at your door.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 border-2 border-black bg-[var(--ast-global-color-4)] p-5">
              <div className="text-xs font-bold uppercase tracking-widest text-[var(--ast-global-color-1)]">
                Product details
              </div>

              <ul className="mt-3 space-y-2 text-sm font-medium leading-[1.6]">
                {product.details.filter(Boolean).map((detail) => (
                  <li key={detail} className="flex items-start gap-2">
                    <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 bg-black" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {product.specs.length > 0 ? (
              <div className="mt-5 border-2 border-black bg-white p-4">
                <div className="text-xs font-bold uppercase tracking-widest text-[var(--ast-global-color-1)]">
                  Specifications
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  {product.specs.map(([label, value]) => (
                    <div key={label} className="border-2 border-black bg-[var(--ast-global-color-4)] p-3">
                      <dt className="text-[0.68rem] font-bold uppercase tracking-widest text-[#585858]">
                        {label}
                      </dt>
                      <dd className="mt-1 font-black text-black">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            <div className="mt-5 border-2 border-black bg-white p-4 text-sm leading-[1.8]">
              <p>
                <span className="font-bold text-black">SKU:</span> {selectedVariant?.sku || product.sku}
              </p>

              <p>
                <span className="font-bold text-black">Categories:</span>{" "}
                {product.categories.map((category, index) => (
                  <span key={category.handle}>
                    <Link
                      className="text-[#585858] no-underline transition-colors hover:text-[var(--ast-global-color-0)]"
                      href={`/shop?q=${encodeURIComponent(category.name)}`}
                    >
                      {category.name}
                    </Link>
                    {index < product.categories.length - 1 ? ", " : ""}
                  </span>
                ))}
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
