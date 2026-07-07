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
import { usePathname } from "next/navigation";

import { normalizeCheckoutPromoCode } from "@/app/domain/checkout-promo-codes";

const checkoutPromoStorageKey = "bayblaze-checkout-promo-code";

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
  const pathname = usePathname();
  const [promoCode, setStoredPromoCode] = useState(() => readStoredPromoCode());

  useEffect(() => {
    const claimedCode = normalizeCheckoutPromoCode(
      new URLSearchParams(window.location.search).get("promo"),
    );

    if (!claimedCode) {
      return;
    }

    const timer = window.setTimeout(() => {
      storePromoCode(claimedCode);
      setStoredPromoCode(claimedCode);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  const clearPromoCode = useCallback(() => {
    clearStoredPromoCode();
    setStoredPromoCode("");
  }, []);

  const setPromoCode = useCallback((code: string) => {
    const nextCode = normalizeCheckoutPromoCode(code);

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
  if (!code) {
    return "/checkout";
  }

  const params = new URLSearchParams({ promo: code });
  return `/checkout?${params.toString()}`;
}

function readStoredPromoCode() {
  try {
    return normalizeCheckoutPromoCode(
      window.sessionStorage.getItem(checkoutPromoStorageKey),
    );
  } catch {
    return "";
  }
}

function storePromoCode(code: string) {
  try {
    window.sessionStorage.setItem(checkoutPromoStorageKey, code);
  } catch {
    // The code still remains in component state for this page view.
  }
}

function clearStoredPromoCode() {
  try {
    window.sessionStorage.removeItem(checkoutPromoStorageKey);
  } catch {
    // Clearing component state is enough for this page view.
  }
}
