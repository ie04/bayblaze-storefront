"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { normalizeCheckoutPromoCode } from "@/app/domain/checkout-promo-codes";
import { isFirstOrderQrOfferCode } from "@/app/domain/referral-offers";

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
  const [promoCode, setStoredPromoCode] = useState(() => readStoredPromoCode());

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
  void code;
  return "/checkout";
}

function readStoredPromoCode() {
  clearStoredPromoCode();
  return "";
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
