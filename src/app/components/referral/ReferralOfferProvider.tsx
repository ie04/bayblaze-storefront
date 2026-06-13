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

import {
  REFERRAL_OFFER_COOKIE,
  REFERRAL_OFFER_STORAGE_KEY,
  getReferralOfferFromSearchParams,
  parseReferralOffer,
  serializeReferralOffer,
  type ReferralOffer,
} from "@/app/domain/referral-offers";

type ReferralOfferContextValue = {
  clearOffer: () => void;
  offer: ReferralOffer | null;
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

    if (storedOffer) {
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
    const claimedOffer = getReferralOfferFromSearchParams(
      new URLSearchParams(window.location.search),
    );

    if (!claimedOffer) {
      return;
    }

    storeOffer(claimedOffer);
    window.setTimeout(() => {
      if (!isActive) {
        return;
      }

      setOffer(claimedOffer);
      setToastOffer(claimedOffer);
    }, 0);

    const toastTimer = window.setTimeout(() => setToastOffer(null), 1800);

    return () => {
      isActive = false;
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
      className="bayblaze-referral-toast pointer-events-none fixed left-1/2 top-3 z-[120] inline-flex h-auto min-h-0 max-h-8 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center border-2 border-black bg-white px-3 py-1.5 text-center text-black shadow-[2px_2px_0_#000] sm:top-4"
      role="status"
    >
      <p className="truncate whitespace-nowrap text-[10px] font-bold uppercase leading-none tracking-[0.06em] sm:text-[11px]">
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

function storeOffer(offer: ReferralOffer) {
  const serializedOffer = serializeReferralOffer(offer);

  try {
    window.sessionStorage.setItem(REFERRAL_OFFER_STORAGE_KEY, serializedOffer);
  } catch {
    // The cookie still carries the offer into server-side signup and checkout.
  }

  document.cookie = [
    `${REFERRAL_OFFER_COOKIE}=${encodeURIComponent(serializedOffer)}`,
    "path=/",
    "SameSite=Lax",
    window.location.protocol === "https:" ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function clearStoredOffer() {
  try {
    window.sessionStorage.removeItem(REFERRAL_OFFER_STORAGE_KEY);
  } catch {
    // The session cookie cleanup below is still enough for server requests.
  }

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
