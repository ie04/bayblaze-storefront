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

    const toastTimer = window.setTimeout(() => setToastOffer(null), 2600);

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
      className="pointer-events-none fixed bottom-3 left-1/2 z-[120] flex h-9 max-h-9 max-w-[calc(100vw-32px)] -translate-x-1/2 items-center overflow-hidden rounded-full border border-[#bfd8b5] bg-[#eff8ea]/95 px-3 text-center text-[#244f18] shadow-[0_8px_18px_rgba(36,79,24,0.14)] sm:bottom-5 sm:h-10 sm:max-h-10 sm:px-4"
      role="status"
    >
      <p className="max-w-[calc(100vw-64px)] truncate whitespace-nowrap text-[12px] font-semibold leading-none sm:max-w-[22rem] sm:text-[13px]">
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
