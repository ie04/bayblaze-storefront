"use client";

import { useMemo, useState } from "react";

import type { CustomerOrder } from "@/app/lib/medusa-auth";
import OrderTrackingView from "./OrderTrackingView";
import {
  formatOrderDate,
  formatOrderNumber,
  formatOrderStatus,
  formatOrderTotal,
  groupOrdersByLifecycle,
  type OrdersResponse,
} from "@/app/domain/orders";

export default function OrdersDashboard({
  initialOrders,
}: {
  initialOrders: CustomerOrder[];
}) {
  const [orders, setOrders] = useState(() => initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const { completedOrders, pendingOrders } = useMemo(
    () => groupOrdersByLifecycle(orders),
    [orders],
  );

  async function refreshOrders() {
    setIsRefreshing(true);
    setError("");

    try {
      const response = await fetch("/api/orders", {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as OrdersResponse;

      if (!response.ok) {
        throw new Error(data.error || "Unable to refresh orders.");
      }

      setOrders(data.orders ?? []);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh orders.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  function openOrder(order: CustomerOrder) {
    setSelectedOrder(order);
    window.history.pushState(
      null,
      "",
      `/orders/${encodeURIComponent(order.custom_display_id ?? order.id)}`,
    );
  }

  function closeOrder() {
    setSelectedOrder(null);
    window.history.pushState(null, "", "/orders");
  }

  return (
    <>
      <section className="bayblaze-auth-section px-4 py-7 sm:px-7 sm:py-10">
        <div className="mb-7 flex flex-col gap-4 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.22em] text-[var(--ast-global-color-1)]">
              Bayblaze Orders
            </p>
            <h1 className="bayblaze-auth-title text-black">Orders</h1>
          </div>

          <button
            type="button"
            className="bayblaze-soft-button w-full px-5 py-3 text-[15px] font-semibold leading-none disabled:cursor-wait disabled:opacity-60 sm:w-auto"
            disabled={isRefreshing}
            onClick={() => {
              void refreshOrders();
            }}
          >
            {isRefreshing ? "SYNCING" : "REFRESH ORDERS"}
          </button>
        </div>

        {error ? (
          <p className="bayblaze-soft-alert mb-5 px-4 py-3 text-[16px] font-medium leading-[1.5] text-red-700">
            {error}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <OrderGroup
            emptyText="No pending orders."
            orders={pendingOrders}
            onOpenOrder={openOrder}
            title="Pending"
          />
          <OrderGroup
            emptyText="No completed orders."
            orders={completedOrders}
            onOpenOrder={openOrder}
            title="Completed"
          />
        </div>
      </section>

      {selectedOrder ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-[120] overflow-y-auto bg-black/45 px-4 py-6 sm:py-10"
          role="dialog"
        >
          <div className="mx-auto w-full max-w-[1100px]">
            <OrderTrackingView
              mode="modal"
              onClose={closeOrder}
              order={selectedOrder}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

function OrderGroup({
  emptyText,
  onOpenOrder,
  orders,
  title,
}: {
  emptyText: string;
  onOpenOrder: (order: CustomerOrder) => void;
  orders: CustomerOrder[];
  title: string;
}) {
  return (
    <details
      className="bayblaze-soft-card bayblaze-soft-card--tint overflow-hidden"
      open
    >
      <summary className="flex cursor-pointer list-none items-center justify-between border-b border-[#e8e2d8] px-5 py-4 text-[21px] font-semibold leading-tight text-black sm:text-[24px]">
        {title}
        <span className="text-[14px] font-semibold text-[var(--ast-global-color-1)]">
          {orders.length}
        </span>
      </summary>

      {orders.length ? (
        <ul className="grid gap-4 p-5">
          {orders.map((order) => (
            <li key={order.id}>
              <button
                type="button"
                className="w-full rounded-[8px] border border-[#e4ded4] bg-white p-4 text-left transition-colors hover:border-[var(--ast-global-color-1)] hover:bg-[#f7f6f2] hover:shadow-[0_10px_24px_rgba(69,88,58,0.08)]"
                onClick={() => onOpenOrder(order)}
              >
                <span className="flex items-start justify-between gap-4">
                  <span>
                    <span className="block text-[17px] font-semibold leading-snug text-black">
                      {formatOrderNumber(order)}
                    </span>
                    <span className="mt-1 block text-[15px] leading-[1.5] text-[#585858]">
                      {formatOrderDate(order.created_at)}
                    </span>
                  </span>
                  <span className="bayblaze-soft-chip px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.1em]">
                    {formatOrderStatus(order.status)}
                  </span>
                </span>

                <span className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-[16px] font-semibold text-black">
                    {formatOrderTotal(order.total, order.currency_code ?? "usd")}
                  </span>
                  <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#585858]">
                    Track order
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-5 text-[16px] leading-[1.7] text-[#585858]">
          {emptyText}
        </p>
      )}
    </details>
  );
}
