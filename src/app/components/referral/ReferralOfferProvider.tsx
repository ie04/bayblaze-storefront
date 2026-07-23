"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

import { persistCheckoutPromoCode } from "@/app/components/promo/CheckoutPromoCodeProvider";
import {
  REFERRAL_OFFER_COOKIE,
  REFERRAL_OFFER_STORAGE_KEY,
  createAdminPromoReferralOffer,
  getReferralOfferFromSearchParams,
  isFirstOrderReferralOffer,
  normalizeReferralPromoCode,
  parseReferralOffer,
  serializeReferralOffer,
  type ReferralOffer,
} from "@/app/domain/referral-offers";

type ReferralOfferContextValue = {
  clearOffer: () => void;
  offer: ReferralOffer | null;
};

type PromoPreviewResponse = {
  category?: string;
  code?: string;
  discountPercent?: number;
  eligible?: boolean;
};

const ReferralOfferContext = createContext<ReferralOfferContextValue>({
  clearOffer: () => {},
  offer: null,
});

export function useReferralOffer() {
  return useContext(ReferralOfferContext);
}

export default function ReferralOfferProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [offer, setOffer] = useState<ReferralOffer | null>(null);
  const [toastOffer, setToastOffer] = useState<ReferralOffer | null>(null);

  useEffect(() => {
    let isActive = true;
    const storedOffer = readStoredOffer();

    if (storedOffer && shouldExposeOfferOnPath(storedOffer, window.location.pathname)) {
      window.setTimeout(() => {
        if (isActive) {
          setOffer(storedOffer);
        }
      }, 0);
    }

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;
    const currentPathname = window.location.pathname;

    if (isCheckoutPath(currentPathname)) {
      const timer = window.setTimeout(() => {
        if (!isActive) {
          return;
        }

        setOffer((currentOffer) =>
          currentOffer && isFirstOrderReferralOffer(currentOffer) ? currentOffer : null,
        );
        setToastOffer(null);
      }, 0);

      return () => {
        isActive = false;
        window.clearTimeout(timer);
      };
    }

    const searchParams = new URLSearchParams(window.location.search);
    const claimedOffer = getReferralOfferFromSearchParams(searchParams);

    if (claimedOffer) {
      publishOffer(claimedOffer, {
        setOffer,
        setToastOffer,
      });

      const toastTimer = window.setTimeout(() => setToastOffer(null), 1800);

      return () => {
        isActive = false;
        window.clearTimeout(toastTimer);
      };
    }

    const promoCode = getAdminPromoCodeFromSearchParams(searchParams);

    if (!promoCode) {
      const storedOffer = readStoredOffer();

      if (storedOffer && shouldExposeOfferOnPath(storedOffer, currentPathname)) {
        window.setTimeout(() => {
          if (isActive) {
            setOffer(storedOffer);
          }
        }, 0);
      }

      return () => {
        isActive = false;
      };
    }

    const abortController = new AbortController();

    resolvePartnerPromoOffer(promoCode, currentPathname, abortController.signal)
      .then((partnerOffer) => partnerOffer ?? previewAdminPromoOffer(promoCode, abortController.signal))
      .then((adminOffer) => {
        if (!isActive || !adminOffer) {
          return;
        }

        publishOffer(adminOffer, {
          setOffer,
          setToastOffer,
        });
      })
      .catch(() => {
        // Invalid admin promo codes should simply fall through to checkout handling.
      });

    const toastTimer = window.setTimeout(() => setToastOffer(null), 1800);

    return () => {
      isActive = false;
      abortController.abort();
      window.clearTimeout(toastTimer);
    };
  }, [pathname]);

  const value = useMemo(
    () => ({
      clearOffer: () => {
        clearStoredOffer();
        setOffer(null);
        setToastOffer(null);
      },
      offer,
    }),
    [offer],
  );

  return (
    <ReferralOfferContext.Provider value={value}>
      {children}
      {toastOffer ? <ReferralOfferToast offer={toastOffer} /> : null}
    </ReferralOfferContext.Provider>
  );
}

function ReferralOfferToast({ offer }: { offer: ReferralOffer }) {
  return (
    <div
      aria-live="polite"
      className="bayblaze-referral-toast pointer-events-none fixed bottom-5 left-1/2 z-[120] inline-flex h-auto min-h-0 max-h-10 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center border-2 border-black bg-white px-4 py-2 text-center text-black shadow-[3px_3px_0_#000] sm:bottom-6 sm:px-5"
      role="status"
    >
      <p className="truncate whitespace-nowrap text-[11px] font-bold uppercase leading-none tracking-[0.07em] sm:text-[12px]">
        {offer.label} active
      </p>
    </div>
  );
}

function readStoredOffer() {
  try {
    return parseReferralOffer(
      window.sessionStorage.getItem(REFERRAL_OFFER_STORAGE_KEY),
    );
  } catch {
    return null;
  }
}

function publishOffer(
  offer: ReferralOffer,
  setters: {
    setOffer: (offer: ReferralOffer | null) => void;
    setToastOffer: (offer: ReferralOffer | null) => void;
  },
) {
  storeOffer(offer);
  if (offer.source === "admin_promo") {
    persistCheckoutPromoCode(offer.code);
  }
  window.setTimeout(() => {
    setters.setOffer(offer);
    setters.setToastOffer(offer);
  }, 0);
}

async function resolvePartnerPromoOffer(code: string, sourcePath: string, signal: AbortSignal) {
  const response = await fetch("/api/partners/attribution", {
    body: JSON.stringify({ code, sourcePath }),
    headers: { "content-type": "application/json" },
    method: "POST",
    signal,
  });

  if (!response.ok) return null;
  const attribution = (await response.json().catch(() => ({}))) as PromoPreviewResponse;

  if (!attribution.code || !attribution.discountPercent) return null;
  return createAdminPromoReferralOffer({
    code: attribution.code,
    discountPercent: attribution.discountPercent,
  });
}

function storeOffer(offer: ReferralOffer) {
  const serializedOffer = serializeReferralOffer(offer);

  try {
    window.sessionStorage.setItem(REFERRAL_OFFER_STORAGE_KEY, serializedOffer);
  } catch {
    // The current in-memory offer still drives this page view.
  }

  if (isFirstOrderReferralOffer(offer)) {
    document.cookie = [
      `${REFERRAL_OFFER_COOKIE}=${encodeURIComponent(serializedOffer)}`,
      "path=/",
      "SameSite=Lax",
      window.location.protocol === "https:" ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");
    return;
  }

  clearReferralOfferCookie();
}

function clearStoredOffer() {
  try {
    window.sessionStorage.removeItem(REFERRAL_OFFER_STORAGE_KEY);
  } catch {
    // Clearing component state is enough for this page view.
  }

  clearReferralOfferCookie();
}

function clearReferralOfferCookie() {
  document.cookie = [
    `${REFERRAL_OFFER_COOKIE}=`,
    "path=/",
    "max-age=0",
    "SameSite=Lax",
    window.location.protocol === "https:" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function getAdminPromoCodeFromSearchParams(searchParams: URLSearchParams) {
  return normalizeReferralPromoCode(searchParams.get("promo"));
}

async function previewAdminPromoOffer(code: string, signal: AbortSignal) {
  const response = await fetch("/api/checkout/promo/preview", {
    body: JSON.stringify({
      code,
      subtotalCents: 0,
    }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
    signal,
  });

  if (!response.ok) {
    return null;
  }

  const preview = (await response.json().catch(() => ({}))) as PromoPreviewResponse;

  if (!preview.eligible || !preview.code || !preview.discountPercent) {
    return null;
  }

  return createAdminPromoReferralOffer({
    code: preview.code,
    discountPercent: preview.discountPercent,
  });
}

function shouldExposeOfferOnPath(offer: ReferralOffer, pathname: string) {
  return !isCheckoutPath(pathname) || isFirstOrderReferralOffer(offer);
}

function isCheckoutPath(pathname: string) {
  return pathname === "/checkout" || pathname.startsWith("/checkout/");
}
