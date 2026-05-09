"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { useCart } from "@/app/components/cart/CartContext";

type HeaderProps = {
  searchAction?: string;
  checkoutHref?: string;
  accountHref?: string;
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
  searchAction = "/search",
  checkoutHref = "/checkout",
  accountHref = "/account",
}: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  return (
    <header className="absolute inset-x-0 top-0 z-50 bg-transparent text-black">
      <div className="flex h-[68px] items-center justify-between gap-3 pl-[var(--bayblaze-header-x)] pr-[var(--bayblaze-header-x)] md:h-[80px] md:gap-4 md:pr-[29px]">
        <Link
          href="/"
          className="bayblaze-header-logo shrink-0 text-black transition-colors hover:text-[var(--ast-global-color-0)]"
          aria-label="Bayblaze home"
        >
          BAYBLAZE
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-[13px]">
          <button
            type="button"
            className="flex size-[44px] items-center justify-center bg-black text-white shadow-sm transition-colors hover:bg-[var(--ast-global-color-0)] md:hidden"
            aria-label="Open product search"
            aria-expanded={isSearchOpen}
            onClick={() => setIsSearchOpen((isOpen) => !isOpen)}
          >
            <SearchIcon className="size-[24px]" />
          </button>

          <form
            action={searchAction}
            className={`${
              isSearchOpen
                ? "absolute left-[var(--bayblaze-header-x)] right-[var(--bayblaze-header-x)] top-[calc(100%-12px)] flex"
                : "hidden"
            } h-10 items-stretch md:static md:mr-[8.5px] md:flex md:w-[230px]`}
            method="get"
            role="search"
            onSubmit={handleSearch}
          >
            <label className="sr-only" htmlFor="header-product-search">
              Search products
            </label>

            <input
              id="header-product-search"
              name="q"
              type="search"
              placeholder="Search Products..."
              autoComplete="off"
              className="min-w-0 flex-1 border border-[#e7e7e7] bg-white px-[21px] text-[16px] italic text-neutral-900 shadow-sm outline-none placeholder:text-[#9b9b9b] focus:border-black"
            />

            <button
              type="submit"
              className="bayblaze-search-submit flex w-[46px] items-center justify-center bg-black text-white transition-colors hover:bg-[var(--ast-global-color-0)]"
              aria-label="Search"
            >
              <SearchIcon className="size-5" />
            </button>
          </form>

          <button
            type="button"
            className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center text-black transition-colors hover:text-[var(--ast-global-color-0)] md:h-[43px] md:w-[46px]"
            aria-expanded={isCartOpen}
            aria-label={`Open shopping cart, ${cartCount} item${
              cartCount === 1 ? "" : "s"
            }`}
            onClick={openCart}
          >
            <CartIcon className="size-[27px] md:size-[30px]" />

            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[var(--ast-global-color-0)] text-[11px] font-semibold leading-none text-white">
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
                    <img
                      src={item.image}
                      alt={item.name}
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
      fill="currentColor"
      viewBox="0 0 51.539 51.361"
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
    >
      <path d="M51.539,49.356L37.247,35.065c3.273-3.74,5.272-8.623,5.272-13.983c0-11.742-9.518-21.26-21.26-21.26 S0,9.339,0,21.082s9.518,21.26,21.26,21.26c5.361,0,10.244-1.999,13.983-5.272l14.292,14.292L51.539,49.356z M2.835,21.082 c0-10.176,8.249-18.425,18.425-18.425s18.425,8.249,18.425,18.425S31.436,39.507,21.26,39.507S2.835,31.258,2.835,21.082z" />
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
