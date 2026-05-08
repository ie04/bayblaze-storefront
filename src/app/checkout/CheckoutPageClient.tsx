"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import Link from "next/link";

import Header from "@/app/components/layout/Header";
import { useCart } from "@/app/components/cart/CartContext";

export default function CheckoutPageClient() {
  const { items, cartCount, removeItem } = useCart();

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return total + parsePrice(item.price) * item.quantity;
    }, 0);
  }, [items]);

  const hasItems = items.length > 0;

  return (
    <main className="bayblaze-checkout-page min-h-screen bg-white text-[#585858]">
      <Header />

      <section className="border-b-2 border-black bg-[var(--ast-global-color-4)] pb-12 pt-[128px]">
        <div className="mx-auto w-full max-w-[1180px] px-5">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-2 text-[15px] leading-tight text-[#7a7a7a]"
          >
            <Link
              className="text-black transition-colors hover:text-[var(--ast-global-color-0)]"
              href="/"
            >
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span>Checkout</span>
          </nav>

          <div className="max-w-[760px]">
            <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-[var(--ast-global-color-0)]">
              Bayblaze delivery
            </p>
            <h1 className="bayblaze-checkout-title mt-2 text-black">
              Checkout
            </h1>
            <p className="mt-4 max-w-[620px] text-[20px] font-medium leading-[1.55] text-black sm:text-[21px]">
              Place your order online. Pay the driver when it arrives.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1180px] gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form className="grid gap-8" action="/checkout" method="post">
          <input
            type="hidden"
            name="cart_items"
            value={JSON.stringify(items)}
          />
          <input
            type="hidden"
            name="cart_subtotal"
            value={subtotal.toFixed(2)}
          />

          <CheckoutPanel title="Contact information">
            <div className="grid gap-5 sm:grid-cols-2">
              <CheckoutField label="First name" name="first_name" />
              <CheckoutField label="Last name" name="last_name" />
              <CheckoutField label="Email" name="email" type="email" />
              <CheckoutField label="Phone" name="phone" type="tel" />
            </div>
          </CheckoutPanel>

          <CheckoutPanel title="Delivery address">
            <div className="grid gap-5">
              <CheckoutField label="Street address" name="address" />

              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_110px_110px]">
                <CheckoutField label="City" name="city" defaultValue="Tampa" />
                <CheckoutField label="State" name="state" defaultValue="FL" />
                <CheckoutField label="ZIP" name="zip" inputMode="numeric" />
              </div>

              <label className="grid gap-2 text-[16px] font-semibold text-black">
                Delivery notes
                <textarea
                  className="min-h-[128px] resize-y border border-[#d6d6d6] bg-white px-4 py-3 text-[17px] font-normal text-black outline-none transition focus:border-black"
                  name="notes"
                  placeholder="Gate code, drop-off notes, or product preferences"
                />
              </label>
            </div>
          </CheckoutPanel>

          <CheckoutPanel title="Payment">
            <div className="border border-[#e7e7e7] bg-[var(--ast-global-color-4)] p-5">
              <p className="text-[18px] font-semibold leading-[1.5] text-black">
                Payment due on delivery.
              </p>
              <p className="mt-2 text-[17px] leading-[1.6]">
                Cash, Cash App, or Zelle accepted at delivery. Please have a
                physical ID ready. You need to be 21+ to order.
              </p>
            </div>
          </CheckoutPanel>

          {!hasItems ? (
            <p className="text-[16px] font-medium leading-[1.5] text-red-700">
              Add at least one product to your cart before placing an order.
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!hasItems}
            className="bayblaze-hero-button h-12 w-full rounded-[3px] bg-[var(--ast-global-color-0)] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#b9c8af] sm:w-[260px]"
          >
            PLACE ORDER
          </button>
        </form>

        <aside className="h-fit border-2 border-black bg-white">
          <div className="border-b-2 border-black px-5 py-4">
            <h2 className="text-[24px] font-medium leading-tight text-black">
              Order summary
            </h2>
          </div>

          <div className="px-5 py-6">
            {!hasItems ? (
              <div className="border border-dashed border-[#bdbdbd] bg-[var(--ast-global-color-4)] px-4 py-8 text-center">
                <p className="text-[18px] font-medium leading-[1.45] text-black">
                  Your cart is empty.
                </p>
                <Link
                  href="/shop"
                  className="mt-4 inline-flex text-[16px] font-semibold text-[var(--ast-global-color-1)] underline-offset-4 hover:underline"
                >
                  Return to shop
                </Link>
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

                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold leading-snug text-black">
                        {item.name}
                      </p>

                      {item.flavor ? (
                        <p className="mt-1 text-[15px] leading-snug text-[#585858]">
                          Flavor: {item.flavor}
                        </p>
                      ) : null}

                      <p className="mt-1 text-[15px] text-[#585858]">
                        Qty: {item.quantity}
                      </p>

                      {item.price ? (
                        <p className="mt-1 text-[15px] font-medium text-black">
                          {item.price}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#585858] transition-colors hover:text-black"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <dl className="mt-6 grid gap-3 border-t border-[#e7e7e7] pt-5 text-[16px]">
              <div className="flex justify-between">
                <dt>Items</dt>
                <dd className="text-black">{cartCount}</dd>
              </div>

              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="text-black">{formatMoney(subtotal)}</dd>
              </div>

              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd className="text-black">Calculated after order</dd>
              </div>

              <div className="flex justify-between border-t border-[#e7e7e7] pt-4 text-[19px] font-semibold text-black">
                <dt>Total</dt>
                <dd>{formatMoney(subtotal)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>
    </main>
  );
}

function CheckoutPanel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="border border-[#e7e7e7] bg-white p-5 sm:p-6">
      <h2 className="mb-5 text-[24px] font-medium leading-tight text-black">
        {title}
      </h2>
      {children}
    </section>
  );
}

function CheckoutField({
  defaultValue,
  inputMode,
  label,
  name,
  type = "text",
}: {
  defaultValue?: string;
  inputMode?: "numeric";
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-[16px] font-semibold text-black">
      {label}
      <input
        className="h-[52px] w-full min-w-0 border border-[#d6d6d6] bg-white px-4 text-[17px] font-normal text-black outline-none transition focus:border-black"
        defaultValue={defaultValue}
        inputMode={inputMode}
        name={name}
        type={type}
      />
    </label>
  );
}

function parsePrice(price?: string) {
  if (!price) {
    return 0;
  }

  const number = Number(price.replace(/[^0-9.]/g, ""));

  return Number.isFinite(number) ? number : 0;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(amount);
}
