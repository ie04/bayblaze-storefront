import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import Header from "@/app/components/layout/Header";
import {
  CUSTOMER_TOKEN_COOKIE,
  retrieveOrderByReference,
} from "@/app/lib/medusa-auth";
import OrderTrackingView from "../OrderTrackingView";

export const metadata: Metadata = {
  title: "Order Tracking | Bayblaze",
  description: "Track a Bayblaze order.",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_TOKEN_COOKIE)?.value;
  const order = await retrieveOrderByReference(orderId, token).catch(() => null);

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <Header />
      <div className="bayblaze-auth-page pb-14 pt-[92px] sm:pb-20 sm:pt-[112px]">
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
            <Link
              className="text-black transition-colors hover:text-[var(--ast-global-color-0)]"
              href="/orders"
            >
              Orders
            </Link>
            <span aria-hidden="true">/</span>
            <span>{order.custom_display_id ?? order.id}</span>
          </nav>

          <OrderTrackingView order={order} />
        </div>
      </div>
    </main>
  );
}
