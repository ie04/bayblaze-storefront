"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { normalizeCheckoutPromoCode } from "@/app/domain/checkout-promo-codes";
import { isFirstOrderQrOfferCode } from "@/app/domain/referral-offers";

const checkoutPromoStorageKey = "bayblaze-checkout-promo-code";
const checkoutPromoChangedEvent = "bayblaze:checkout-promo-changed";

type CheckoutPromoCodeContextValue = {
  checkoutHref: string;
  clearPromoCode: () => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
};

const CheckoutPromoCodeContext = createContext<CheckoutPromoCodeContextValue>({
  checkoutHref: "/checkout",
  clearPromoCode: () => {},
  promoCode: "",
  setPromoCode: () => {},
});

export function useCheckoutPromoCode() {
  return useContext(CheckoutPromoCodeContext);
}

export default function CheckoutPromoCodeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [promoCode, setStoredPromoCode] = useState("");

  useEffect(() => {
    function handleStoredPromoChanged(event: Event) {
      const code = event instanceof CustomEvent ? event.detail : "";
      setStoredPromoCode(normalizeCheckoutPromoCode(code));
    }

    window.addEventListener(checkoutPromoChangedEvent, handleStoredPromoChanged);
    const timer = window.setTimeout(() => setStoredPromoCode(readStoredPromoCode()), 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(checkoutPromoChangedEvent, handleStoredPromoChanged);
    };
  }, []);

  const clearPromoCode = useCallback(() => {
    clearStoredPromoCode();
    setStoredPromoCode("");
  }, []);

  const setPromoCode = useCallback((code: string) => {
    const nextCode = normalizeCheckoutPromoCode(code);

    if (isFirstOrderQrOfferCode(code)) {
      clearStoredPromoCode();
      setStoredPromoCode("");
      return;
    }

    if (nextCode) {
      storePromoCode(nextCode);
    } else {
      clearStoredPromoCode();
    }

    setStoredPromoCode(nextCode);
  }, []);

  const value = useMemo(() => {
    const normalizedCode = normalizeCheckoutPromoCode(promoCode);

    return {
      checkoutHref: buildCheckoutHref(normalizedCode),
      clearPromoCode,
      promoCode: normalizedCode,
      setPromoCode,
    };
  }, [clearPromoCode, promoCode, setPromoCode]);

  return (
    <CheckoutPromoCodeContext.Provider value={value}>
      {children}
    </CheckoutPromoCodeContext.Provider>
  );
}

function buildCheckoutHref(code: string) {
  return code ? `/checkout?promo=${encodeURIComponent(code)}` : "/checkout";
}

function readStoredPromoCode() {
  if (typeof window === "undefined") return "";

  try {
    return normalizeCheckoutPromoCode(window.sessionStorage.getItem(checkoutPromoStorageKey));
  } catch {
    return "";
  }
}

export function persistCheckoutPromoCode(code: string) {
  const normalizedCode = normalizeCheckoutPromoCode(code);

  try {
    if (normalizedCode) {
      window.sessionStorage.setItem(checkoutPromoStorageKey, normalizedCode);
    } else {
      window.sessionStorage.removeItem(checkoutPromoStorageKey);
    }
  } catch {
    // The code still remains in component state for this page view.
  }

  window.dispatchEvent(new CustomEvent(checkoutPromoChangedEvent, { detail: normalizedCode }));
}

function storePromoCode(code: string) {
  persistCheckoutPromoCode(code);
}

function clearStoredPromoCode() {
  try {
    window.sessionStorage.removeItem(checkoutPromoStorageKey);
  } catch {
    // Clearing component state is enough for this page view.
  }
}
