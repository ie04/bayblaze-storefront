"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Header from "@/app/components/layout/Header";
import { useCart, type CartItem } from "@/app/components/cart/CartContext";
import {
  DELIVERY_SCHEDULING_RULE,
  formatDateTimeLocalInStoreTimeZone,
  formatScheduledDelivery,
  getDeliveryScheduleRequirement,
  type DeliveryTimingMode,
} from "@/app/domain/delivery-scheduling";
import {
  RECENT_ORDER_STORAGE_KEY,
  getOrderReference,
  getOrderTrackingHref,
} from "@/app/domain/orders";
import type { Customer, CustomerOrder } from "@/app/lib/medusa-auth";

export default function CheckoutPageClient({
  customer,
}: {
  customer?: Customer;
}) {
  const router = useRouter();
  const { items, cartCount, clearCart, removeItem } = useCart();
  const [checkoutError, setCheckoutError] = useState("");
  const [orderMessage, setOrderMessage] = useState("");
  const [orderTrackingHref, setOrderTrackingHref] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [deliveryMode, setDeliveryMode] =
    useState<DeliveryTimingMode>("now");
  const [scheduledAt, setScheduledAt] = useState("");

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return total + parsePrice(item.price) * item.quantity;
    }, 0);
  }, [items]);
  const scheduleRequirement = useMemo(() => {
    return currentTime ? getDeliveryScheduleRequirement(currentTime) : null;
  }, [currentTime]);
  const isScheduleRequired =
    scheduleRequirement?.isScheduleRequired ?? false;
  const scheduledMinimumInput = scheduleRequirement
    ? formatDateTimeLocalInStoreTimeZone(
        scheduleRequirement.earliestScheduledAt,
      )
    : "";
  const scheduledMinimumLabel = scheduleRequirement
    ? formatScheduledDelivery(scheduleRequirement.earliestScheduledAt)
    : "";
  const activeDeliveryMode: DeliveryTimingMode = isScheduleRequired
    ? "scheduled"
    : deliveryMode;
  const needsScheduledTime = activeDeliveryMode === "scheduled";
  const scheduledInputValue =
    needsScheduledTime && scheduledMinimumInput
      ? getUsableScheduledAt(scheduledAt, scheduledMinimumInput)
      : scheduledAt;

  const hasItems = items.length > 0;
  const canPlaceOrder =
    hasItems &&
    !isPlacingOrder &&
    (!isScheduleRequired || activeDeliveryMode === "scheduled") &&
    (!needsScheduledTime || Boolean(scheduledInputValue));

  useEffect(() => {
    function refreshCurrentTime() {
      setCurrentTime(new Date());
    }

    const hydrationTimer = window.setTimeout(refreshCurrentTime, 0);
    const timer = window.setInterval(refreshCurrentTime, 60_000);

    return () => {
      window.clearTimeout(hydrationTimer);
      window.clearInterval(timer);
    };
  }, []);

  async function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasItems || isPlacingOrder) {
      return;
    }

    setCheckoutError("");
    setOrderMessage("");
    setOrderTrackingHref("");
    setIsPlacingOrder(true);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/checkout/order", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            first_name: formData.get("first_name"),
            last_name: formData.get("last_name"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            address: formData.get("address"),
            city: formData.get("city"),
            state: formData.get("state"),
            zip: formData.get("zip"),
            notes: formData.get("notes"),
          },
          delivery: {
            mode: activeDeliveryMode,
            scheduled_at:
              activeDeliveryMode === "scheduled"
                ? scheduledInputValue
                : undefined,
          },
          items,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        order?: CustomerOrder;
      };

      if (!response.ok) {
        setCheckoutError(
          data.error ??
            "Unable to place your order right now. Please try again.",
        );
        return;
      }

      const recentOrder = data.order?.id
        ? getRecentOrderSnapshot(data.order, subtotal, items)
        : null;

      clearCart();

      if (customer && recentOrder) {
        saveRecentOrder(recentOrder);
        router.push(`/account?order=${encodeURIComponent(recentOrder.id)}#orders`);
        return;
      }

      setOrderMessage(
        getOrderReference(data.order)
          ? `Order #${getOrderReference(data.order)} was placed.`
          : "Your order was placed.",
      );
      setOrderTrackingHref(
        recentOrder ? getOrderTrackingHref(recentOrder) : "",
      );
    } catch {
      setCheckoutError("Unable to reach checkout right now. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  }

  return (
    <main className="bayblaze-checkout-page min-h-screen bg-white text-[#585858]">
      <Header />

      <section className="border-b-2 border-black bg-[var(--ast-global-color-4)] pb-8 pt-[96px] sm:pb-12 sm:pt-[128px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-5">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-[14px] leading-tight text-[#7a7a7a] sm:mb-6 sm:text-[15px]"
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
            <h1 className="text-[34px] font-semibold uppercase leading-none tracking-[0.08em] text-black sm:text-[48px]">
              Your vape run, delivered
            </h1>
            <p className="mt-4 max-w-[620px] text-[17px] font-medium leading-[1.55] text-[var(--ast-global-color-3)] sm:text-[21px]">
              Place your order online. Pay the driver when it arrives.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1180px] gap-7 px-4 py-8 sm:px-5 sm:py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form className="grid gap-8" onSubmit={handlePlaceOrder}>
          <CheckoutPanel title="Contact Information">
            {customer ? (
              <p className="mb-5 border border-[#d9d9d9] bg-[var(--ast-global-color-4)] px-4 py-3 text-[16px] font-medium leading-[1.5] text-black">
                Signed in as {customer.email}.
              </p>
            ) : (
              <p className="mb-5 border border-[#d9d9d9] bg-[var(--ast-global-color-4)] px-4 py-3 text-[16px] font-medium leading-[1.5] text-black">
                Have an account?{" "}
                <Link
                  href="/login?redirect=/checkout"
                  className="font-semibold text-[var(--ast-global-color-1)] underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to fill this faster.
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <CheckoutField
                label="First name"
                name="first_name"
                defaultValue={customer?.first_name ?? undefined}
                required
              />
              <CheckoutField
                label="Last name"
                name="last_name"
                defaultValue={customer?.last_name ?? undefined}
                required
              />
              <CheckoutField
                label="Email"
                name="email"
                type="email"
                defaultValue={customer?.email}
                required
              />
              <CheckoutField
                label="Phone"
                name="phone"
                type="tel"
                defaultValue={customer?.phone ?? undefined}
                required
              />
            </div>
          </CheckoutPanel>

          <CheckoutPanel title="Delivery Address">
            <div className="grid gap-5">
              <CheckoutField label="Street address" name="address" required />

              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_110px_110px]">
                <CheckoutField
                  label="City"
                  name="city"
                  defaultValue="Tampa"
                  required
                />
                <CheckoutField
                  label="State"
                  name="state"
                  defaultValue="FL"
                  required
                />
                <CheckoutField
                  label="ZIP"
                  name="zip"
                  inputMode="numeric"
                  required
                />
              </div>

              <label className="grid gap-2 text-[15px] font-semibold text-black sm:text-[16px]">
                Delivery notes
                <textarea
                  className="min-h-[120px] resize-y border border-[#d6d6d6] bg-white px-4 py-3 text-[16px] font-normal text-black outline-none transition focus:border-black sm:min-h-[128px] sm:text-[17px]"
                  name="notes"
                  placeholder="Gate code, drop-off notes, or product preferences"
                />
              </label>
            </div>
          </CheckoutPanel>

          <CheckoutPanel title="Delivery Timing">
            <div className="grid gap-5">
              <p className="text-[16px] font-medium leading-[1.55] text-black sm:text-[17px]">
                {DELIVERY_SCHEDULING_RULE}
              </p>

              <div
                className="grid gap-3 sm:grid-cols-2"
                role="radiogroup"
                aria-label="Delivery timing"
              >
                <label
                  className={[
                    "grid cursor-pointer gap-2 border bg-white p-4 text-black transition",
                    activeDeliveryMode === "now"
                      ? "border-black"
                      : "border-[#d6d6d6]",
                    isScheduleRequired
                      ? "cursor-not-allowed opacity-60"
                      : "hover:border-black",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-3 text-[17px] font-semibold">
                    <input
                      checked={activeDeliveryMode === "now"}
                      disabled={isScheduleRequired}
                      name="delivery_mode"
                      onChange={() => setDeliveryMode("now")}
                      type="radio"
                      value="now"
                    />
                    Under 1 Hour
                  </span>
                  <span className="text-[15px] font-medium leading-[1.45] text-[#585858]">
                    Available from 10 AM until 11 PM.
                  </span>
                </label>

                <label
                  className={[
                    "grid cursor-pointer gap-2 border bg-white p-4 text-black transition hover:border-black",
                    activeDeliveryMode === "scheduled"
                      ? "border-black"
                      : "border-[#d6d6d6]",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-3 text-[17px] font-semibold">
                    <input
                      checked={activeDeliveryMode === "scheduled"}
                      name="delivery_mode"
                      onChange={() => setDeliveryMode("scheduled")}
                      type="radio"
                      value="scheduled"
                    />
                    Schedule Delivery
                  </span>
                  <span className="text-[15px] font-medium leading-[1.45] text-[#585858]">
                    Choose a delivery time that works for you.
                  </span>
                </label>
              </div>

              {isScheduleRequired ? (
                <p className="border border-[#d7d1c6] bg-white px-4 py-3 text-[15px] font-semibold leading-[1.5] text-black">
                  Ordering is in scheduling mode right now. Choose any delivery
                  time from {scheduledMinimumLabel} onward during delivery
                  hours.
                </p>
              ) : null}

              {needsScheduledTime ? (
                <label className="grid gap-2 text-[15px] font-semibold text-black sm:text-[16px]">
                  Scheduled delivery time
                  <input
                    className="h-[50px] w-full min-w-0 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black sm:h-[52px] sm:text-[17px]"
                    min={scheduledMinimumInput}
                    name="scheduled_at"
                    onChange={(event) => setScheduledAt(event.target.value)}
                    required
                    type="datetime-local"
                    value={scheduledInputValue}
                  />
                  {scheduledMinimumLabel ? (
                    <span className="text-[14px] font-medium leading-[1.45] text-[#585858]">
                      Earliest available: {scheduledMinimumLabel}. Scheduled
                      delivery hours are 10 AM to 11 PM.
                    </span>
                  ) : null}
                </label>
              ) : null}
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

          {checkoutError ? (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-[16px] font-medium leading-[1.5] text-red-700">
              {checkoutError}
            </p>
          ) : null}

          {orderMessage ? (
            <p className="border border-[#c8d8bd] bg-[#f5faf0] px-4 py-3 text-[16px] font-semibold leading-[1.5] text-[var(--ast-global-color-0)]">
              {orderMessage}
              {orderTrackingHref ? (
                <>
                  {" "}
                  <Link
                    className="underline underline-offset-4"
                    href={orderTrackingHref}
                  >
                    Track it here.
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canPlaceOrder}
            className="bayblaze-hero-button h-12 w-full rounded-[3px] bg-[var(--ast-global-color-0)] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#b9c8af] sm:w-[260px]"
          >
            {isPlacingOrder ? "PLACING ORDER..." : "PLACE ORDER"}
          </button>
        </form>

        <aside className="h-fit border-2 border-black bg-white">
          <div className="border-b-2 border-black px-5 py-4">
            <h2 className="text-[21px] font-medium leading-tight text-black sm:text-[24px]">
              Order Summary
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
    <section className="border border-[#d0d0d0] bg-[var(--ast-global-color-4)] p-4 sm:p-6">
      <h2 className="mb-4 text-[21px] font-medium leading-tight text-black sm:mb-5 sm:text-[24px]">
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
  required = false,
  type = "text",
}: {
  defaultValue?: string;
  inputMode?: "numeric";
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-[15px] font-semibold text-black sm:text-[16px]">
      <span>
        {label}
        {required ? (
          <>
            <span className="text-red-700" aria-hidden="true">
              {" "}
              *
            </span>
            <span className="sr-only"> required</span>
          </>
        ) : null}
      </span>
      <input
        className="h-[50px] w-full min-w-0 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black sm:h-[52px] sm:text-[17px]"
        defaultValue={defaultValue}
        inputMode={inputMode}
        name={name}
        required={required}
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

function getUsableScheduledAt(scheduledAt: string, minimumScheduledAt: string) {
  if (!scheduledAt || scheduledAt < minimumScheduledAt) {
    return minimumScheduledAt;
  }

  return scheduledAt;
}

function getRecentOrderSnapshot(
  order: CustomerOrder,
  subtotal: number,
  items: CartItem[],
): CustomerOrder {
  return {
    ...order,
    created_at: order.created_at ?? new Date().toISOString(),
    currency_code: order.currency_code ?? "usd",
    status: order.status ?? "pending",
    total: typeof order.total === "number" ? order.total : subtotal,
    items: order.items?.length
      ? order.items
      : items.map((item) => {
          const unitPrice = parsePrice(item.price);

          return {
            id: item.id,
            product_title: item.name,
            quantity: item.quantity,
            thumbnail: item.image,
            total: unitPrice * item.quantity,
            unit_price: unitPrice,
            variant_title: item.flavor,
          };
        }),
  };
}

function saveRecentOrder(order: CustomerOrder) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      RECENT_ORDER_STORAGE_KEY,
      JSON.stringify(order),
    );
  } catch {
    // The account page can still refresh orders directly from Medusa.
  }
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(amount);
}
