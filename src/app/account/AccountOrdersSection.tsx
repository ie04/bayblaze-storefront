"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  CustomerOrder,
  CustomerOrderItem,
} from "@/app/lib/medusa-auth";
import {
  RECENT_ORDER_STORAGE_KEY,
  type OrdersResponse,
  formatOrderDate,
  formatOrderNumber,
  formatOrderStatus,
  formatOrderTotal,
  getOrderItemTitle,
  getOrderItemTotal,
  getVariantLabel,
  isCustomerOrder,
  mergeOrderLists,
} from "@/app/domain/orders";
import { getOrderFirstOrderOfferTotal } from "@/app/domain/referral-offers";

const medusaBackendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ?? "";

export default function AccountOrdersSection({
  initialOrders,
}: {
  initialOrders: CustomerOrder[];
}) {
  const [orders, setOrders] = useState(() => initialOrders);
  const [openOrderId, setOpenOrderId] = useState(initialOrders[0]?.id ?? "");
  const [highlightedOrderId, setHighlightedOrderId] = useState("");
  const [recentOrderId, setRecentOrderId] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");

  const refreshOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setIsRefreshing(true);
    }

    setError("");

    try {
      const response = await fetch("/api/account/orders", {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => ({}))) as OrdersResponse;

      if (!response.ok) {
        throw new Error(data.error || "Unable to refresh orders.");
      }

      const fetchedOrders = data.orders ?? [];

      setOrders((currentOrders) =>
        mergeOrderLists(fetchedOrders, currentOrders),
      );
      clearStoredRecentOrderIfSynced(fetchedOrders);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh orders.",
      );
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      const orderIdFromUrl = readOrderIdFromUrl();
      const recentOrder = readRecentOrder();
      const orderIdToOpen = orderIdFromUrl ?? recentOrder?.id ?? "";

      if (recentOrder) {
        setRecentOrderId(recentOrder.id);
        setOrders((currentOrders) =>
          mergeOrderLists([recentOrder], currentOrders),
        );
      }

      if (orderIdToOpen) {
        setOpenOrderId(orderIdToOpen);
        setHighlightedOrderId(orderIdToOpen);
      }

      void refreshOrders({ silent: true });
    }, 0);

    function handleFocus() {
      void refreshOrders({ silent: true });
    }

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshOrders]);

  return (
    <article
      id="orders"
      className="bayblaze-soft-card bayblaze-soft-card--tint scroll-mt-[112px] p-5 sm:p-6"
    >
      <div className="mb-4 flex items-start justify-between gap-4 sm:mb-5">
        <div>
          <h2 className="text-[21px] font-semibold leading-tight text-black sm:text-[24px]">
            Orders
          </h2>
          {orders.length ? (
            <p className="mt-2 text-[14px] leading-[1.45] text-[#6a6a6a]">
              Select an order to view its items and status.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          className="bayblaze-soft-button shrink-0 px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.1em] disabled:cursor-wait disabled:opacity-60"
          disabled={isRefreshing}
          onClick={() => {
            void refreshOrders();
          }}
        >
          {isRefreshing ? "Syncing" : "Refresh"}
        </button>
      </div>

      {error ? (
        <p className="bayblaze-soft-alert mb-4 px-3 py-2 text-[14px] font-medium leading-[1.45] text-red-700">
          {error}
        </p>
      ) : null}

      {orders.length ? (
        <ul aria-live="polite" className="space-y-4">
          {orders.map((order) => {
            const isOpen = openOrderId === order.id;
            const isHighlighted =
              highlightedOrderId === order.id || recentOrderId === order.id;
            const panelId = `order-panel-${order.id}`;

            return (
              <li
                key={order.id}
                className={[
                  "rounded-[8px] border bg-white transition-colors",
                  isHighlighted
                    ? "border-[var(--ast-global-color-1)]"
                    : "border-[#e7e7e7]",
                ].join(" ")}
              >
                <button
                  type="button"
                  aria-controls={panelId}
                  aria-expanded={isOpen}
                  className="w-full rounded-[8px] px-4 py-4 text-left transition-colors hover:bg-[#f7f6f2]"
                  onClick={() => {
                    setOpenOrderId(isOpen ? "" : order.id);
                  }}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span>
                      <span className="block text-[16px] font-semibold leading-snug text-black">
                        Order {formatOrderNumber(order)}
                      </span>
                      <span className="mt-1 block text-[15px] leading-[1.5] text-[#585858]">
                        {formatOrderDate(order.created_at)}
                      </span>
                    </span>

                    <span className="flex shrink-0 flex-col items-end gap-2">
                      <span className="bayblaze-soft-chip px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.1em]">
                        {formatOrderStatus(order.status)}
                      </span>
                      {isHighlighted ? (
                        <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--ast-global-color-1)]">
                          Just placed
                        </span>
                      ) : null}
                    </span>
                  </span>

                  <span className="mt-3 flex items-center justify-between gap-4">
                    {getOrderFirstOrderOfferTotal(order) !== null &&
                    order.currency_code ? (
                      <span className="text-[16px] font-semibold text-black">
                        {formatOrderTotal(
                          getOrderFirstOrderOfferTotal(order),
                          order.currency_code,
                        )}
                      </span>
                    ) : (
                      <span className="text-[14px] font-medium text-[#6a6a6a]">
                        Total syncing
                      </span>
                    )}

                    <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#585858]">
                      {isOpen ? "Hide details" : "View details"}
                    </span>
                  </span>
                </button>

                {isOpen ? (
                  <div
                    id={panelId}
                    className="border-t border-[#eeeeee] bg-white px-4 py-4"
                  >
                    {order.items?.length ? (
                      <ul className="space-y-3">
                        {order.items.map((item, index) => (
                          <OrderItemRow
                            currencyCode={order.currency_code}
                            item={item}
                            key={item.id ?? `${getOrderItemTitle(item)}-${index}`}
                          />
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[15px] leading-[1.55] text-[#585858]">
                        Order details are syncing from Medusa.
                      </p>
                    )}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[16px] leading-[1.7] text-[#585858]">
          No orders yet.
        </p>
      )}
    </article>
  );
}

function OrderItemRow({
  currencyCode,
  item,
}: {
  currencyCode?: string | null;
  item: CustomerOrderItem;
}) {
  const thumbnail = normalizeOrderThumbnail(item.thumbnail);
  const itemTotal = getOrderItemTotal(item);

  return (
    <li className="flex gap-3 rounded-[8px] border border-[#eeeeee] bg-[#f7f6f2] p-3">
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={getOrderItemTitle(item)}
          className="size-14 shrink-0 rounded-[8px] border border-[#e3ded5] bg-white object-contain p-1"
        />
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-[8px] border border-[#e3ded5] bg-white text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">
          Item
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-snug text-black">
          {getOrderItemTitle(item)}
        </p>

        {getVariantLabel(item) ? (
          <p className="mt-1 text-[14px] leading-snug text-[#585858]">
            {getVariantLabel(item)}
          </p>
        ) : null}

        <p className="mt-1 text-[14px] leading-snug text-[#585858]">
          Qty: {item.quantity ?? 1}
        </p>
      </div>

      {itemTotal !== null && currencyCode ? (
        <p className="shrink-0 text-[14px] font-semibold text-black">
          {formatOrderTotal(itemTotal, currencyCode)}
        </p>
      ) : null}
    </li>
  );
}

function readOrderIdFromUrl() {
  if (typeof window === "undefined") {
    return null;
  }

  return new URLSearchParams(window.location.search).get("order");
}

function readRecentOrder() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedOrder = window.sessionStorage.getItem(RECENT_ORDER_STORAGE_KEY);

    if (!savedOrder) {
      return null;
    }

    const parsedOrder = JSON.parse(savedOrder);

    return isCustomerOrder(parsedOrder) ? parsedOrder : null;
  } catch {
    return null;
  }
}

function clearStoredRecentOrderIfSynced(fetchedOrders: CustomerOrder[]) {
  if (typeof window === "undefined") {
    return;
  }

  const recentOrder = readRecentOrder();

  if (!recentOrder) {
    return;
  }

  if (fetchedOrders.some((order) => order.id === recentOrder.id)) {
    window.sessionStorage.removeItem(RECENT_ORDER_STORAGE_KEY);
  }
}


function normalizeOrderThumbnail(thumbnail?: string | null) {
  if (!thumbnail) {
    return "";
  }

  if (thumbnail.startsWith("/")) {
    return medusaBackendUrl ? `${medusaBackendUrl}${thumbnail}` : thumbnail;
  }

  return medusaBackendUrl
    ? thumbnail.replace(/^https?:\/\/localhost:9000(?=\/)/, medusaBackendUrl)
    : thumbnail;
}
