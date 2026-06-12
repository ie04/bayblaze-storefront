"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type FormEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

import { useCart } from "@/app/components/cart/CartContext";
import styles from "./Header.module.css";

type HeaderProps = {
  searchAction?: string;
  checkoutHref?: string;
  accountHref?: string;
  surface?: "transparent" | "solid";
};

type DrawerItem = {
  id: string;
  name: string;
  flavor?: string;
  image?: string;
  price?: string;
  quantity: number;
};

export default function Header({
  searchAction = "/shop",
  checkoutHref = "/checkout",
  accountHref = "/account",
  surface = "transparent",
}: HeaderProps) {
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    items,
    cartCount,
    isCartOpen,
    openCart,
    closeCart,
    removeItem,
  } = useCart();

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const query = new FormData(form).get("q")?.toString().trim();

    if (!query) {
      event.preventDefault();
    }
  }

  useEffect(() => {
    if (!isSearchOverlayOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSearchOverlayOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOverlayOpen]);

  return (
    <header className="sticky top-0 z-50 border-b-2 border-black bg-white text-black">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="bayblaze-brand-wordmark shrink-0 !tracking-[0.04em] text-xl text-black no-underline transition-colors hover:text-[var(--ast-global-color-0)] sm:text-2xl"
          aria-label="Bayblaze home"
        >
          BAYBLAZE
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/shop"
            className="text-sm font-semibold uppercase tracking-wider text-black no-underline hover:text-[var(--ast-global-color-0)]"
          >
            Shop
          </Link>
          <Link
            href="/shop?q=Deals"
            className="text-sm font-semibold uppercase tracking-wider text-black no-underline hover:text-[var(--ast-global-color-0)]"
          >
            Deals
          </Link>
          <Link
            href="/how-it-works"
            className="text-sm font-semibold uppercase tracking-wider text-black no-underline hover:text-[var(--ast-global-color-0)]"
          >
            How it works
          </Link>
          <Link
            href="/contact"
            className="text-sm font-semibold uppercase tracking-wider text-black no-underline hover:text-[var(--ast-global-color-0)]"
          >
            Contact
          </Link>
        </nav>

        <div className={styles.actions}>

          <Link
            href="/orders"
            className={styles.fulfillment}
            aria-label="Track your order"
          >
            <TruckIcon className={styles.fulfillmentIcon} />
            <span>Track Order</span>
          </Link>

          <button
            type="button"
            className={styles.searchTrigger}
            aria-label="Search products"
            aria-expanded={isSearchOverlayOpen}
            aria-controls="bayblaze-header-search-overlay"
            onClick={() => setIsSearchOverlayOpen(true)}
          >
            <SearchIcon className={styles.searchIcon} />
          </button>

          <button
            type="button"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-black hover:text-white md:h-[46px] md:w-[46px]"
            aria-expanded={isCartOpen}
            aria-label={`Open shopping cart, ${cartCount} item${
              cartCount === 1 ? "" : "s"
            }`}
            onClick={openCart}
          >
            <CartIcon className="size-[22px]" />

            {cartCount > 0 ? (
              <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full border-2 border-black bg-[var(--ast-global-color-0)] text-[11px] font-bold leading-none text-white">
                {cartCount}
              </span>
            ) : null}
          </button>

          <Link
            href={accountHref}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center text-black transition-colors hover:text-[var(--ast-global-color-0)] md:h-[43px] md:w-[43px]"
            aria-label="Account"
          >
            <AccountIcon className="size-[27px] md:size-[30px]" />
          </Link>
        </div>
      </div>

      {isSearchOverlayOpen ? (
        <HeaderSearchOverlay
          inputRef={searchInputRef}
          searchAction={searchAction}
          onClose={() => setIsSearchOverlayOpen(false)}
          onSubmit={handleSearch}
        />
      ) : null}

      <CartDrawer
        items={items}
        cartCount={cartCount}
        checkoutHref={checkoutHref}
        isOpen={isCartOpen}
        onClose={closeCart}
        onRemoveItem={removeItem}
      />
    </header>
  );
}

const headerSearchSuggestions = [
  "Vapes",
  "Cones & Wraps",
  "Smoking Accessories",
  "RAZ",
  "Lost Mary",
  "cones",
  "wraps",
  "rolling papers",
];

function HeaderSearchOverlay({
  inputRef,
  searchAction,
  onClose,
  onSubmit,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  searchAction: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    onSubmit(event);

    if (!event.defaultPrevented) {
      onClose();
    }
  }

  function getSuggestionHref(term: string) {
    return `${searchAction}?q=${encodeURIComponent(term)}`;
  }

  return (
    <div
      id="bayblaze-header-search-overlay"
      className={styles.searchOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Search products"
    >
      <button
        type="button"
        className={styles.searchBackdrop}
        aria-label="Close search"
        onClick={onClose}
      />

      <div className={styles.searchPanel}>
        <form
          action={searchAction}
          className={styles.searchOverlayForm}
          method="get"
          role="search"
          onSubmit={handleSubmit}
        >
          <label className="sr-only" htmlFor="header-overlay-product-search">
            Search products
          </label>

          <SearchIcon className={styles.searchOverlayIcon} />

          <input
            ref={inputRef}
            id="header-overlay-product-search"
            name="q"
            type="search"
            autoComplete="off"
            className={styles.searchOverlayInput}
            placeholder="Search vapes, cones, wraps, accessories..."
          />

          <button
            type="button"
            className={styles.searchOverlayClose}
            aria-label="Close search"
            onClick={onClose}
          >
            ×
          </button>
        </form>

        <div className={styles.searchSuggestions}>
          <p className={styles.searchSuggestionsTitle}>Popular searches</p>
          <div className={styles.searchSuggestionList}>
            {headerSearchSuggestions.map((term) => (
              <Link
                key={term}
                href={getSuggestionHref(term)}
                className={styles.searchSuggestion}
                onClick={onClose}
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  items,
  cartCount,
  checkoutHref,
  isOpen,
  onClose,
  onRemoveItem,
}: {
  items: DrawerItem[];
  cartCount: number;
  checkoutHref: string;
  isOpen: boolean;
  onClose: () => void;
  onRemoveItem: (id: string) => void;
}) {
  const jostFont = "var(--font-jost), Jost, Arial, sans-serif";
  const hasItems = items.length > 0;

  return (
    <div
      className={`fixed inset-0 z-[100] transition ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/45 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        aria-label="Close cart drawer"
        onClick={onClose}
      />

      <aside
        className={`bayblaze-cart-drawer absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col border-l-2 border-black bg-white text-black shadow-[-12px_0_30px_rgba(0,0,0,0.22)] transition-transform duration-300 max-sm:border-l-0 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Shopping cart"
      >
        <div className="grid grid-cols-[40px_1fr_40px] items-center border-b-2 border-black px-4 py-4 sm:px-6 sm:py-5">
          <div aria-hidden="true" />

          <h2 className="text-center text-[23px] font-medium leading-none sm:text-[28px]">
            View Cart
          </h2>

          <button
            type="button"
            className="flex size-10 items-center justify-center border border-black text-[28px] leading-none transition-colors hover:bg-black hover:text-white"
            aria-label="Close cart drawer"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {!hasItems ? (
            <div className="flex flex-1 flex-col justify-center text-center">
              <p
                className="text-[22px] font-medium leading-tight text-black"
                style={{ fontFamily: jostFont }}
              >
                Your cart is empty.
              </p>

              <p
                className="mx-auto mt-3 max-w-[300px] text-[16px] leading-[1.7] text-[#585858]"
                style={{ fontFamily: jostFont }}
              >
                Add products from the shop and come back here when you are ready
                for local delivery checkout.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-[#e7e7e7] pb-4"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="size-20 shrink-0 border border-[#e7e7e7] bg-white object-contain p-2"
                    />
                  ) : (
                    <div className="flex size-20 shrink-0 items-center justify-center border border-[#e7e7e7] bg-white text-[12px] text-[#777]">
                      No image
                    </div>
                  )}

                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[16px] font-semibold leading-snug text-black">
                      {item.name}
                    </p>

                    {item.flavor ? (
                      <p className="mt-1 text-[14px] leading-snug text-[#585858]">
                        Flavor: {item.flavor}
                      </p>
                    ) : null}

                    <p className="mt-1 text-[14px] text-[#585858]">
                      Qty: {item.quantity}
                    </p>

                    {item.price ? (
                      <p className="mt-1 text-[15px] font-medium text-black">
                        {item.price}
                      </p>
                    ) : null}

                    <button
                      type="button"
                      className="mt-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#585858] transition-colors hover:text-black"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#e7e7e7] bg-[var(--ast-global-color-4)] p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between text-[15px]">
            <span className="font-semibold text-black">Items</span>
            <span className="text-[#585858]">{cartCount}</span>
          </div>

          <Link
            href={checkoutHref}
            className={`bayblaze-hero-button flex h-12 w-full items-center justify-center rounded-[3px] text-white transition-colors ${
              hasItems
                ? "bg-[var(--ast-global-color-0)] hover:bg-black"
                : "pointer-events-none bg-[#b9c8af]"
            }`}
            aria-disabled={!hasItems}
            onClick={onClose}
          >
            CHECKOUT
          </Link>
        </div>
      </aside>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function TruckIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="826 837.5 140 121"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M878.77,943.611c0,2.75-1.005,5.131-3.015,7.141c-2.009,2.01-4.389,3.014-7.139,3.014c-2.75,0-5.13-1.004-7.139-3.014 c-2.01-2.01-3.015-4.391-3.015-7.141c0-2.749,1.005-5.129,3.015-7.138c2.009-2.011,4.389-3.016,7.139-3.016 c2.75,0,5.13,1.005,7.139,3.016C877.765,938.482,878.77,940.862,878.77,943.611z M949.846,943.611c0,2.75-1.005,5.131-3.015,7.141 s-4.39,3.014-7.141,3.014c-2.748,0-5.129-1.004-7.138-3.014c-2.01-2.01-3.015-4.391-3.015-7.141c0-2.749,1.005-5.129,3.015-7.138 c2.009-2.011,4.39-3.016,7.138-3.016c2.751,0,5.131,1.005,7.141,3.016C948.841,938.482,949.846,940.862,949.846,943.611z M960,857.306v40.615c0,1.27-0.438,2.393-1.311,3.371s-1.943,1.548-3.212,1.705l-82.815,9.678c0.687,3.174,1.031,5.024,1.031,5.554 c0,0.846-0.635,2.539-1.904,5.076h72.979c1.375,0,2.564,0.503,3.569,1.508c1.006,1.005,1.508,2.194,1.508,3.569 c0,1.376-0.502,2.564-1.508,3.569c-1.005,1.005-2.194,1.507-3.569,1.507H863.54c-1.375,0-2.565-0.502-3.57-1.507 s-1.507-2.193-1.507-3.569c0-0.581,0.212-1.415,0.634-2.498c0.424-1.085,0.847-2.036,1.27-2.855c0.423-0.82,0.992-1.878,1.706-3.174 s1.124-2.076,1.23-2.34l-14.041-65.285h-16.183c-1.375,0-2.564-0.502-3.569-1.507c-1.005-1.005-1.508-2.195-1.508-3.57 c0-1.375,0.502-2.565,1.508-3.57c1.004-1.004,2.194-1.507,3.569-1.507h20.308c0.846,0,1.6,0.172,2.261,0.516 s1.177,0.754,1.547,1.229c0.37,0.476,0.714,1.124,1.032,1.944c0.316,0.819,0.528,1.507,0.634,2.062 c0.106,0.556,0.252,1.336,0.437,2.34c0.185,1.005,0.304,1.692,0.357,2.063h95.271c1.375,0,2.563,0.502,3.57,1.507 C959.497,854.741,960,855.931,960,857.306z" />
    </svg>
  );
}

function AccountIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M84.6,62c-14.1,12.3-35.1,12.3-49.2,0C16.1,71.4,3.8,91,3.8,112.5c0,2.1,1.7,3.8,3.8,3.8h105c2.1,0,3.8-1.7,3.8-3.8 C116.2,91,103.9,71.4,84.6,62z" />
      <circle cx="60" cy="33.8" r="30" />
    </svg>
  );
}
