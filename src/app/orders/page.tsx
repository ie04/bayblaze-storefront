import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import Header from "@/app/components/layout/Header";
import {
  CUSTOMER_TOKEN_COOKIE,
  retrieveCustomer,
  retrieveCustomerOrders,
} from "@/app/lib/medusa-auth";
import OrdersDashboard from "./OrdersDashboard";

export const metadata: Metadata = {
  title: "Orders | Bayblaze",
  description: "Track your Bayblaze orders.",
};

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;

  if (!token) {
    redirect("/login?redirect=/orders");
  }

  try {
    await retrieveCustomer(token);
  } catch {
    redirect("/login?redirect=/orders");
  }

  const orders = await retrieveCustomerOrders(token).catch(() => []);

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
            <span>Orders</span>
          </nav>

          <OrdersDashboard initialOrders={orders} />
        </div>
      </div>
    </main>
  );
}
