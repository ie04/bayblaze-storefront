import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Header from "@/app/components/layout/Header";
import {
  CUSTOMER_TOKEN_COOKIE,
  retrieveCustomer,
  retrieveCustomerOrders,
  type Customer,
  type CustomerOrder,
} from "@/app/lib/medusa-auth";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = {
  title: "Account | Bayblaze",
  description: "Manage your Bayblaze account.",
};

export default async function Page() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;

  if (!token) {
    redirect("/login?redirect=/account");
  }

  let customer: Customer;
  let orders: CustomerOrder[] = [];

  try {
    [customer, orders] = await Promise.all([
      retrieveCustomer(token),
      retrieveCustomerOrders(token).catch(() => []),
    ]);
  } catch {
    redirect("/login?redirect=/account");
  }

  const displayName =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.email;

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="bayblaze-auth-page bg-white pb-14 pt-[92px] sm:pb-20 sm:pt-[112px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-5">
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
            <span>Account</span>
          </nav>

          <section className="border-y-2 border-black py-7 sm:py-10">
            <div className="mb-7 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.22em] text-[var(--ast-global-color-1)]">
                  Bayblaze Account
                </p>
                <h1 className="bayblaze-auth-title text-black">
                  Hi, {displayName}.
                </h1>
              </div>

              <LogoutButton />
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <article className="border border-[#d0d0d0] bg-[var(--ast-global-color-4)] p-5 shadow-[5px_5px_0_#000] sm:p-6 sm:shadow-[6px_6px_0_#000]">
                <h2 className="mb-4 text-[21px] font-semibold leading-tight text-black sm:mb-5 sm:text-[24px]">
                  Profile
                </h2>
                <dl className="space-y-4 text-[16px] leading-[1.6]">
                  <div>
                    <dt className="font-semibold text-black">Name</dt>
                    <dd className="text-[#585858]">{displayName}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-black">Email</dt>
                    <dd className="break-words text-[#585858]">
                      {customer.email}
                    </dd>
                  </div>
                  {customer.phone && (
                    <div>
                      <dt className="font-semibold text-black">Phone</dt>
                      <dd className="text-[#585858]">{customer.phone}</dd>
                    </div>
                  )}
                </dl>
              </article>

              <article className="border border-[#d0d0d0] bg-[var(--ast-global-color-4)] p-5 sm:p-6">
                <h2 className="mb-4 text-[21px] font-semibold leading-tight text-black sm:mb-5 sm:text-[24px]">
                  Orders
                </h2>
                {orders.length ? (
                  <ul className="space-y-4">
                    {orders.map((order) => (
                      <li
                        key={order.id}
                        className="border border-[#e7e7e7] bg-[var(--ast-global-color-4)] p-4"
                      >
                        <p className="text-[16px] font-semibold leading-snug text-black">
                          Order #{order.display_id ?? order.id}
                        </p>
                        <p className="mt-1 text-[15px] leading-[1.5] text-[#585858]">
                          {formatOrderStatus(order.status)}
                        </p>
                        <p className="mt-1 text-[15px] leading-[1.5] text-[#585858]">
                          {formatOrderDate(order.created_at)}
                        </p>
                        {typeof order.total === "number" &&
                        order.currency_code ? (
                          <p className="mt-2 text-[16px] font-semibold text-black">
                            {formatOrderTotal(
                              order.total,
                              order.currency_code,
                            )}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[16px] leading-[1.7] text-[#585858]">
                    No orders yet.
                  </p>
                )}
              </article>

              <article className="border border-[#d0d0d0] bg-[var(--ast-global-color-4)] p-5 sm:p-6">
                <h2 className="mb-4 text-[21px] font-semibold leading-tight text-black sm:mb-5 sm:text-[24px]">
                  Delivery
                </h2>
                <p className="text-[16px] leading-[1.7] text-[#585858]">
                  No saved delivery details yet.
                </p>
              </article>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function formatOrderStatus(status?: string | null) {
  if (!status) {
    return "Status unavailable";
  }

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatOrderDate(date?: string | null) {
  if (!date) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(date));
}

function formatOrderTotal(total: number, currencyCode: string) {
  return new Intl.NumberFormat("en-US", {
    currency: currencyCode.toUpperCase(),
    style: "currency",
  }).format(total);
}
