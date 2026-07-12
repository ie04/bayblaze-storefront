"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { useCart } from "@/app/components/cart/CartContext";

type StorefrontActivityEventType =
  | "activity"
  | "beforeunload"
  | "cart"
  | "checkout"
  | "page_view"
  | "pagehide"
  | "visibility_hidden";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_BAYBLAZE_API_URL ||
  "https://api.bayblaze.net"
).replace(/\/$/, "");
const visitorStorageKey = "bayblaze_storefront_visitor_id";
const sessionStorageKey = "bayblaze_storefront_session_id";
const activityThrottleMs = 30_000;

export default function StorefrontActivityTracker() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const { items } = useCart();
  const lastActivitySentAt = useRef(0);
  const cart = useMemo(() => ({
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    valueCents: items.reduce((total, item) => total + parsePriceCents(item.price) * item.quantity, 0),
  }), [items]);
  const cartRef = useRef(cart);
  const pathWithQuery = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  const sendEvent = useCallback((eventType: StorefrontActivityEventType, options: { beacon?: boolean } = {}) => {
    if (typeof window === "undefined") {
      return;
    }

    const payload = {
      cart: cartRef.current,
      eventId: createId("evt"),
      eventType,
      occurredAt: new Date().toISOString(),
      page: {
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer,
        title: document.title,
        url: window.location.href,
      },
      sessionId: getSessionId(),
      userAgent: navigator.userAgent,
      visitorId: getVisitorId(),
    };
    const body = JSON.stringify(payload);
    const url = `${apiBaseUrl}/v1/storefront/activity/events`;

    if (options.beacon && "sendBeacon" in navigator) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      return;
    }

    void fetch(url, {
      body,
      headers: {
        "content-type": "application/json",
      },
      keepalive: options.beacon,
      method: "POST",
    }).catch(() => {
      // Tracking must never interrupt shopping.
    });
  }, []);

  useEffect(() => {
    sendEvent(pathname.startsWith("/checkout") ? "checkout" : "page_view");
  }, [pathWithQuery, pathname, sendEvent]);

  useEffect(() => {
    sendEvent("cart");
  }, [cart.itemCount, cart.valueCents, sendEvent]);

  useEffect(() => {
    function handleActivity() {
      const now = Date.now();
      if (now - lastActivitySentAt.current < activityThrottleMs) {
        return;
      }

      lastActivitySentAt.current = now;
      sendEvent("activity");
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        sendEvent("visibility_hidden", { beacon: true });
      }
    }

    function handlePageHide() {
      sendEvent("pagehide", { beacon: true });
    }

    function handleBeforeUnload() {
      sendEvent("beforeunload", { beacon: true });
    }

    window.addEventListener("click", handleActivity, { passive: true });
    window.addEventListener("input", handleActivity, { passive: true });
    window.addEventListener("scroll", handleActivity, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("input", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [sendEvent]);

  return null;
}

function getVisitorId() {
  return getStoredId(window.localStorage, visitorStorageKey, "vis");
}

function getSessionId() {
  return getStoredId(window.sessionStorage, sessionStorageKey, "ses");
}

function getStoredId(storage: Storage, key: string, prefix: string) {
  const existing = storage.getItem(key);

  if (existing) {
    return existing;
  }

  const id = createId(prefix);
  storage.setItem(key, id);
  return id;
}

function createId(prefix: string) {
  const random = "crypto" in window && "randomUUID" in window.crypto
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${random.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function parsePriceCents(price: string | undefined) {
  if (!price) {
    return 0;
  }

  const parsed = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}
