import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import Header from "@/app/components/layout/Header";

export const metadata: Metadata = {
  title: "Checkout | Bayblaze",
  description: "Complete your Bayblaze local delivery checkout.",
};

export default function CheckoutPage() {
  return (
    <main className="bayblaze-checkout-page min-h-screen bg-white text-[#585858]">
      <Header />

      <section className="border-b-2 border-black bg-[var(--ast-global-color-4)] pb-12 pt-[128px]">
        <div className="mx-auto w-full max-w-[1180px] px-5">
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex flex-wrap items-center gap-2 text-[14px] leading-none text-[#7a7a7a]"
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
            <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[var(--ast-global-color-0)]">
              Bayblaze delivery
            </p>
            <h1 className="bayblaze-checkout-title mt-2 text-black">
              Checkout
            </h1>
            <p className="mt-4 text-[18px] leading-[1.7]">
              Confirm your contact details and delivery address. Payment is
              collected when your order arrives.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1180px] gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form className="grid gap-8" action="/checkout" method="post">
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
              <div className="grid gap-5 sm:grid-cols-[1fr_130px_130px]">
                <CheckoutField label="City" name="city" defaultValue="Tampa" />
                <CheckoutField label="State" name="state" defaultValue="FL" />
                <CheckoutField label="ZIP" name="zip" inputMode="numeric" />
              </div>
              <label className="grid gap-2 text-[15px] font-semibold text-black">
                Delivery notes
                <textarea
                  className="min-h-[120px] resize-y border border-[#d6d6d6] bg-white px-4 py-3 text-[16px] font-normal text-black outline-none transition focus:border-black"
                  name="notes"
                  placeholder="Gate code, drop-off notes, or product preferences"
                />
              </label>
            </div>
          </CheckoutPanel>

          <CheckoutPanel title="Payment">
            <div className="border border-[#e7e7e7] bg-[var(--ast-global-color-4)] p-5">
              <p className="text-[16px] font-medium leading-[1.7] text-black">
                Payment due on delivery.
              </p>
              <p className="mt-2 text-[15px] leading-[1.7]">
                Have your ID ready. Orders are available for customers 21 and
                older only.
              </p>
            </div>
          </CheckoutPanel>

          <button
            type="submit"
            className="bayblaze-hero-button h-12 w-full rounded-[3px] bg-[var(--ast-global-color-0)] text-white transition-colors hover:bg-black sm:w-[260px]"
          >
            PLACE ORDER
          </button>
        </form>

        <aside className="h-fit border-2 border-black bg-white">
          <div className="border-b-2 border-black px-5 py-4">
            <h2 className="text-[24px] font-medium leading-none text-black">
              Order summary
            </h2>
          </div>

          <div className="px-5 py-6">
            <div className="border border-dashed border-[#bdbdbd] bg-[var(--ast-global-color-4)] px-4 py-8 text-center">
              <p className="text-[16px] font-medium text-black">
                Your cart is empty.
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-flex text-[15px] font-semibold text-[var(--ast-global-color-1)] underline-offset-4 hover:underline"
              >
                Return to shop
              </Link>
            </div>

            <dl className="mt-6 grid gap-3 border-t border-[#e7e7e7] pt-5 text-[15px]">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="text-black">$0.00</dd>
              </div>
              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd className="text-black">Calculated after order</dd>
              </div>
              <div className="flex justify-between border-t border-[#e7e7e7] pt-4 text-[18px] font-semibold text-black">
                <dt>Total</dt>
                <dd>$0.00</dd>
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
      <h2 className="mb-5 text-[24px] font-medium leading-none text-black">
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
    <label className="grid gap-2 text-[15px] font-semibold text-black">
      {label}
      <input
        className="h-12 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black"
        defaultValue={defaultValue}
        inputMode={inputMode}
        name={name}
        type={type}
      />
    </label>
  );
}
