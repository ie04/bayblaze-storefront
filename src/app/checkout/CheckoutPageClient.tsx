"use client";

import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import Header from "@/app/components/layout/Header";
import { useCart, type CartItem } from "@/app/components/cart/CartContext";
import { useCheckoutPromoCode } from "@/app/components/promo/CheckoutPromoCodeProvider";
import { useReferralOffer } from "@/app/components/referral/ReferralOfferProvider";
import {
  DELIVERY_SCHEDULING_RULE,
  formatDateTimeLocalInStoreTimeZone,
  formatScheduledDelivery,
  getDeliveryScheduleRequirement,
  isBayBlazeExpressUnavailable,
  type DeliveryTimingMode,
} from "@/app/domain/delivery-scheduling";
import {
  RECENT_ORDER_STORAGE_KEY,
  getOrderReference,
  getOrderTrackingHref,
} from "@/app/domain/orders";
import {
  AGECHECKER_POPUP_SCRIPT_URL,
  AGECHECKER_SUPPORT_EMAIL,
  type AgeVerificationCustomer,
} from "@/app/domain/age-verification";
import {
  getOrderFirstOrderOfferTotal,
  getReferralOfferDiscountAmount,
  getReferralOfferTotal,
} from "@/app/domain/referral-offers";
import {
  getCheckoutPromoDiscountAmount,
  getCheckoutPromoMessage,
  getOrderCheckoutPromoTotal,
  centsToMoney,
  moneyToCents,
  normalizeCheckoutPromoCode,
  type CheckoutPromoPreviewItem,
  type CheckoutPromoCodePreview,
} from "@/app/domain/checkout-promo-codes";
import { isAgeCheckerTestingBypassEnabled } from "@/app/lib/agechecker-testing";
import type { Customer, CustomerOrder } from "@/app/lib/medusa-auth";

declare global {
  interface Window {
    AgeCheckerAPI?: {
      show: () => void;
    };
    AgeCheckerConfig?: AgeCheckerConfig;
  }
}

type AgeCheckerConfig = {
  data: Record<string, string>;
  defer_submit: boolean;
  key: string;
  mode: "manual";
  name: string;
  onclosed?: (done?: () => void) => void;
  onready?: () => void;
  onstatuschanged?: (verification: AgeCheckerVerification) => void;
};

type AgeCheckerVerification = {
  status?: string;
  uuid?: string;
};

type CheckoutCustomerPayload = AgeVerificationCustomer & {
  address_line_2: string;
  notes: string;
};

type CheckoutDeliveryPayload = {
  checkout_opened_at?: string;
  mode: DeliveryTimingMode;
  scheduled_at?: string;
};

type PendingCheckout = {
  addressValidationToken: string;
  checkoutCustomer: CheckoutCustomerPayload;
  delivery: CheckoutDeliveryPayload;
  routingToken: string;
};

type RoutingConfirmationState = {
  estimatedMinutes?: number;
  message: string;
  requirements: string[];
  title: string;
};

type PromoMinimumIssue = {
  amountNeededCents: number;
  code: string;
  minimumSpendCents: number;
  subtotalCents: number;
};

type PreCheckoutRoutingResult =
  | {
      error: string;
      confirmation?: never;
      estimatedMinutes?: never;
      message?: never;
      token?: never;
    }
  | {
      error?: never;
      confirmation: {
        title: string;
        requirements: string[];
      };
      estimatedMinutes?: number;
      message: string;
      token: string;
    };

type AuthMode = "login" | "register";

type AuthFormState = {
  code: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

const initialAuthFormState: AuthFormState = {
  code: "",
  email: "",
  firstName: "",
  lastName: "",
  password: "",
};


type CheckoutAddressPayload = {
  address?: unknown;
  city?: unknown;
  formatted_address?: unknown;
  google_place_id?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  state?: unknown;
  zip?: unknown;
};

type ValidatedCheckoutAddress = {
  address: string;
  city: string;
  formatted_address?: string;
  google_place_id?: string;
  latitude?: number;
  longitude?: number;
  state: string;
  zip: string;
};

type CheckoutAddressValidationState = {
  address: ValidatedCheckoutAddress;
  fingerprint: string;
  token: string;
};

const isAgeCheckerTestingBypass = isAgeCheckerTestingBypassEnabled();
const ageCheckerPublicKey = isAgeCheckerTestingBypass
  ? ""
  : process.env.NEXT_PUBLIC_AGECHECKER_KEY?.trim() ?? "";
const googleMapsBrowserKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim() ??
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ??
  "";

export default function CheckoutPageClient({
  accountAgeVerificationDisabled = false,
  accountEmail,
  customer,
}: {
  accountAgeVerificationDisabled?: boolean;
  accountEmail?: string;
  customer?: Customer;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, cartCount, clearCart, removeItem } = useCart();
  const checkoutFormRef = useRef<HTMLFormElement | null>(null);
  const {
    clearPromoCode: clearStoredCheckoutPromoCode,
    promoCode: storedCheckoutPromoCode,
    setPromoCode: storeCheckoutPromoCode,
  } = useCheckoutPromoCode();
  const { clearOffer: clearReferralOffer, offer: referralOffer } =
    useReferralOffer();
  const [checkoutError, setCheckoutError] = useState("");
  const [orderMessage, setOrderMessage] = useState("");
  const [orderTrackingHref, setOrderTrackingHref] = useState("");
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isRoutingEvaluating, setIsRoutingEvaluating] = useState(false);
  const [isAgeVerifying, setIsAgeVerifying] = useState(false);
  const [ageVerificationMessage, setAgeVerificationMessage] = useState("");
  const [routingConfirmation, setRoutingConfirmation] =
    useState<RoutingConfirmationState | null>(null);
  const pendingCheckoutRef = useRef<PendingCheckout | null>(null);
  const addressFieldRef = useRef<HTMLInputElement | null>(null);
  const googleAutocompleteContainerRef = useRef<HTMLDivElement | null>(null);
  const googleAutocompleteRef = useRef<GooglePlaceAutocompleteElement | null>(
    null,
  );
  const [isPlacesAutocompleteReady, setIsPlacesAutocompleteReady] =
    useState(false);
  const [validatedAddress, setValidatedAddress] =
    useState<CheckoutAddressValidationState | null>(null);
  const [isAddressValidating, setIsAddressValidating] = useState(false);
  const [addressValidationMessage, setAddressValidationMessage] = useState("");
  const [checkoutOpenedAt, setCheckoutOpenedAt] = useState<Date | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [deliveryMode, setDeliveryMode] =
    useState<DeliveryTimingMode>("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [promoCode, setPromoCode] = useState(() =>
    normalizeCheckoutPromoCode(searchParams.get("promo")),
  );
  const [appliedPromo, setAppliedPromo] =
    useState<CheckoutPromoCodePreview | null>(null);
  const [promoMessage, setPromoMessage] = useState("");
  const [isPromoApplying, setIsPromoApplying] = useState(false);
  const [isPromoAuthDialogOpen, setIsPromoAuthDialogOpen] = useState(false);
  const [hasCompletedPromoAuth, setHasCompletedPromoAuth] = useState(false);
  const [promoMinimumIssue, setPromoMinimumIssue] =
    useState<PromoMinimumIssue | null>(null);
  const [promoMinimumDialog, setPromoMinimumDialog] =
    useState<PromoMinimumIssue | null>(null);

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      return total + parsePrice(item.price) * item.quantity;
    }, 0);
  }, [items]);
  const firstOrderDiscount = useMemo(() => {
    return getReferralOfferDiscountAmount(subtotal, referralOffer);
  }, [referralOffer, subtotal]);
  const activeAppliedPromo = useMemo(() => {
    if (!appliedPromo || appliedPromo.subtotalCents !== moneyToCents(subtotal)) {
      return null;
    }

    return appliedPromo;
  }, [appliedPromo, subtotal]);
  const checkoutPromoDiscount = useMemo(() => {
    return getCheckoutPromoDiscountAmount(subtotal, activeAppliedPromo);
  }, [activeAppliedPromo, subtotal]);
  const totalDue = useMemo(() => {
    return roundMoney(
      Math.max(
        0,
        getReferralOfferTotal(subtotal, referralOffer) - checkoutPromoDiscount,
      ),
    );
  }, [checkoutPromoDiscount, referralOffer, subtotal]);
  const effectivePromoMessage =
    appliedPromo && !activeAppliedPromo
      ? "Cart changed. Apply the promo code again."
      : promoMessage;
  const pendingUrlPromoCode =
    normalizeCheckoutPromoCode(searchParams.get("promo")) ||
    storedCheckoutPromoCode;
  const scheduleRequirement = useMemo(() => {
    return currentTime ? getDeliveryScheduleRequirement(currentTime) : null;
  }, [currentTime]);
  const isCheckoutClockReady = Boolean(currentTime && checkoutOpenedAt);
  const isExpressUnavailable = currentTime && checkoutOpenedAt
    ? isBayBlazeExpressUnavailable(currentTime, checkoutOpenedAt)
    : true;
  const scheduledMinimumInput = scheduleRequirement
    ? formatDateTimeLocalInStoreTimeZone(
        scheduleRequirement.earliestScheduledAt,
      )
    : "";
  const scheduledMinimumLabel = scheduleRequirement
    ? formatScheduledDelivery(scheduleRequirement.earliestScheduledAt)
    : "";
  const activeDeliveryMode: DeliveryTimingMode = isCheckoutClockReady && isExpressUnavailable
    ? "scheduled"
    : deliveryMode;
  const needsScheduledTime = activeDeliveryMode === "scheduled";
  const scheduledInputValue =
    needsScheduledTime && scheduledMinimumInput
      ? getUsableScheduledAt(scheduledAt, scheduledMinimumInput)
      : scheduledAt;

  const hasItems = items.length > 0;
  const canPlaceOrder =
    hasItems &&
    isCheckoutClockReady &&
    !isPlacingOrder &&
    !isRoutingEvaluating &&
    !isAddressValidating &&
    !isAgeVerifying &&
    (!isExpressUnavailable || activeDeliveryMode === "scheduled") &&
    (!needsScheduledTime || Boolean(scheduledInputValue));
  const isAgeCheckerEnabled = Boolean(ageCheckerPublicKey) && !isAgeCheckerTestingBypass;
  const hasSavedAgeVerification = hasAcceptedAccountAgeVerification(customer);

  useEffect(() => {
    const openedAt = new Date();

    function refreshCurrentTime() {
      setCurrentTime(new Date());
    }

    const hydrationTimer = window.setTimeout(() => {
      setCheckoutOpenedAt(openedAt);
      setCurrentTime(openedAt);
    }, 0);
    const timer = window.setInterval(refreshCurrentTime, 60_000);

    return () => {
      window.clearTimeout(hydrationTimer);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!googleMapsBrowserKey || !googleAutocompleteContainerRef.current) {
      return;
    }

    let isCancelled = false;
    let autocompleteElement: GooglePlaceAutocompleteElement | null = null;
    let handlePlaceSelect: ((event: Event) => void) | null = null;

    loadGoogleMapsPlaces(googleMapsBrowserKey)
      .then(({ PlaceAutocompleteElement }) => {
        const container = googleAutocompleteContainerRef.current;

        if (isCancelled || !container) {
          return;
        }

        const placeAutocomplete = new PlaceAutocompleteElement();
        placeAutocomplete.className = "bayblaze-google-place-autocomplete";
        placeAutocomplete.placeholder = "Start typing your delivery address";
        placeAutocomplete.includedRegionCodes = ["us"];
        placeAutocomplete.locationBias = {
          center: { lat: 27.9506, lng: -82.4572 },
          radius: 45_000,
        };
        placeAutocomplete.style.display = "block";
        placeAutocomplete.style.minHeight = "52px";
        placeAutocomplete.style.width = "100%";

        handlePlaceSelect = (event: Event) => {
          void handleGooglePlaceSelect(event);
        };

        placeAutocomplete.addEventListener("gmp-select", handlePlaceSelect);
        container.replaceChildren(placeAutocomplete);

        autocompleteElement = placeAutocomplete;
        googleAutocompleteRef.current = placeAutocomplete;
        setIsPlacesAutocompleteReady(true);
        setAddressValidationMessage("");
      })
      .catch((error) => {
        console.error("[BayBlaze] Google Places autocomplete failed to load.", error);
        setIsPlacesAutocompleteReady(false);
        setAddressValidationMessage(
          "Address autocomplete could not load. Check the browser console for the BayBlaze Google Places loader error, or type your address manually.",
        );
      });

    async function handleGooglePlaceSelect(event: Event) {
      const placePrediction = (event as GooglePlacePredictionSelectEvent)
        .placePrediction;
      const place = placePrediction?.toPlace?.();

      if (!place?.fetchFields) {
        setValidatedAddress(null);
        setAddressValidationMessage(
          "Choose a complete street address from the suggestions.",
        );
        return;
      }

      try {
        await place.fetchFields({
          fields: ["id", "formattedAddress", "addressComponents", "location"],
        });
      } catch {
        setValidatedAddress(null);
        setAddressValidationMessage(
          "Address details could not be loaded. Please choose the address again.",
        );
        return;
      }

      const selectedAddress = getAddressFromGooglePlace(place);

      if (!selectedAddress) {
        setValidatedAddress(null);
        setAddressValidationMessage(
          "Choose a complete street address from the suggestions.",
        );
        return;
      }

      setCheckoutAddressInputs(addressFieldRef.current?.form, selectedAddress);
      setValidatedAddress(null);
      setAddressValidationMessage("Validating delivery address...");

      validateCheckoutAddress(selectedAddress, {
        existingValidation: null,
        setAddressValidation: setValidatedAddress,
        setAddressValidationMessage,
        setIsAddressValidating,
      }).catch(() => {
        setAddressValidationMessage(
          "Address validation failed. Please review the address and try again.",
        );
      });
    }

    return () => {
      isCancelled = true;

      if (autocompleteElement && handlePlaceSelect) {
        autocompleteElement.removeEventListener("gmp-select", handlePlaceSelect);
      }

      autocompleteElement?.remove();
      googleAutocompleteRef.current = null;
    };
  }, []);

  const applyPromoCode = useCallback(async function applyPromoCode(
    rawCode: string,
    options: { source?: "manual" | "url" } = {},
  ) {
    const code = normalizeCheckoutPromoCode(rawCode);

    setPromoCode(code);
    setPromoMessage("");
    setAppliedPromo(null);
    setPromoMinimumIssue(null);

    if (!code) {
      setPromoMessage("Enter a promo code.");
      return;
    }

    setIsPromoApplying(true);

    try {
      const response = await fetch("/api/checkout/promo/preview", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          code,
          items: getCheckoutPromoPreviewItems(items),
          subtotalCents: moneyToCents(subtotal),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as
        | CheckoutPromoCodePreview
        | { message?: string };

      if (!response.ok || !("eligible" in data) || !data.eligible) {
        const minimumIssue = getPromoMinimumIssue(data, code);

        if (minimumIssue) {
          setPromoMinimumIssue(minimumIssue);
          setPromoMessage(
            `Add ${formatMoney(centsToMoney(minimumIssue.amountNeededCents))} more to use this code.`,
          );
          return;
        }

        setPromoMessage(
          "message" in data && data.message
            ? data.message
            : "That promo code could not be applied.",
        );
        return;
      }

      setAppliedPromo(data);
      setPromoMessage(getCheckoutPromoMessage(data));
      storeCheckoutPromoCode(data.code);
    } catch {
      if (options.source !== "url") {
        setPromoMessage("Unable to apply that promo code right now.");
      }
    } finally {
      setIsPromoApplying(false);
    }
  }, [items, storeCheckoutPromoCode, subtotal]);

  async function handleApplyPromoCode() {
    await applyPromoCode(promoCode);
  }

  useEffect(() => {
    if (
      !pendingUrlPromoCode ||
      !hasItems ||
      isPromoApplying ||
      activeAppliedPromo?.code === pendingUrlPromoCode
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      void applyPromoCode(pendingUrlPromoCode, { source: "url" });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [
    activeAppliedPromo,
    applyPromoCode,
    hasItems,
    isPromoApplying,
    pendingUrlPromoCode,
  ]);

  function handlePromoCodeChange(value: string) {
    const normalizedCode = normalizeCheckoutPromoCode(value);

    setPromoCode(normalizedCode);

    if (appliedPromo && appliedPromo.code !== normalizedCode) {
      setAppliedPromo(null);
      setPromoMessage("");
    }

    if (storedCheckoutPromoCode && storedCheckoutPromoCode !== normalizedCode) {
      clearStoredCheckoutPromoCode();
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);

      if (normalizeCheckoutPromoCode(url.searchParams.get("promo")) !== normalizedCode) {
        url.searchParams.delete("promo");
        window.history.replaceState(
          window.history.state,
          "",
          `${url.pathname}${url.search}`,
        );
      }
    }

    if (promoMinimumIssue && promoMinimumIssue.code !== normalizedCode) {
      setPromoMinimumIssue(null);
      setPromoMinimumDialog(null);
    }
  }

  function clearAppliedPromoCode() {
    setAppliedPromo(null);
    setPromoMessage("");
    setPromoCode("");
    setPromoMinimumIssue(null);
    setPromoMinimumDialog(null);
    clearStoredCheckoutPromoCode();
  }

  function continueWithoutPromo() {
    clearAppliedPromoCode();
    window.setTimeout(() => {
      checkoutFormRef.current?.requestSubmit();
    }, 0);
  }

  function getPromoCheckoutRedirect() {
    const redirectParams = new URLSearchParams();
    const normalizedCode = normalizeCheckoutPromoCode(promoCode);

    if (normalizedCode) {
      redirectParams.set("promo", normalizedCode);
    }

    return `/checkout${redirectParams.toString() ? `?${redirectParams.toString()}` : ""}`;
  }

  function persistPromoCodeInUrl(code: string) {
    const normalizedCode = normalizeCheckoutPromoCode(code);

    if (!normalizedCode || typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("promo", normalizedCode);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }

  async function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasItems || isPlacingOrder || isRoutingEvaluating) {
      return;
    }

    setCheckoutError("");
    setOrderMessage("");
    setOrderTrackingHref("");
    setIsOrderComplete(false);
    setAgeVerificationMessage("");
    pendingCheckoutRef.current = null;
    setRoutingConfirmation(null);

    const normalizedPromoCode = normalizeCheckoutPromoCode(promoCode);

    if (normalizedPromoCode && !activeAppliedPromo) {
      const minimumIssue =
        getCurrentPromoMinimumIssue(appliedPromo, normalizedPromoCode, subtotal) ??
        getCurrentStoredPromoMinimumIssue(promoMinimumIssue, normalizedPromoCode, subtotal);

      if (minimumIssue) {
        setPromoMinimumIssue(minimumIssue);
        setPromoMinimumDialog(minimumIssue);
        return;
      }

      setCheckoutError("Apply the promo code before placing your order, or clear it.");
      return;
    }

    if (activeAppliedPromo && !customer && !hasCompletedPromoAuth) {
      persistPromoCodeInUrl(activeAppliedPromo.code);
      setIsPromoAuthDialogOpen(true);
      return;
    }

    setIsRoutingEvaluating(true);

    try {
      const formData = new FormData(event.currentTarget);
      const rawCheckoutCustomer = getCheckoutCustomerFromFormData(formData);
      const addressValidation = await validateCheckoutAddress(rawCheckoutCustomer, {
        existingValidation: validatedAddress,
        setAddressValidation: setValidatedAddress,
        setAddressValidationMessage,
        setIsAddressValidating,
      });

      if ("error" in addressValidation) {
        setCheckoutError(addressValidation.error);
        return;
      }

      const checkoutCustomer = {
        ...rawCheckoutCustomer,
        address: addressValidation.address.address,
        city: addressValidation.address.city,
        state: addressValidation.address.state,
        zip: addressValidation.address.zip,
      };
      const delivery: CheckoutDeliveryPayload = {
        checkout_opened_at: checkoutOpenedAt?.toISOString(),
        mode: activeDeliveryMode,
        scheduled_at:
          activeDeliveryMode === "scheduled"
            ? scheduledInputValue
            : undefined,
      };
      const preflight = await requestPreCheckoutRouting({
        customer: checkoutCustomer,
        delivery,
        items,
      });

      if ("error" in preflight) {
        setCheckoutError(
          preflight.error ??
            "Unable to check delivery eligibility right now. Please try again.",
        );
        return;
      }

      pendingCheckoutRef.current = {
        addressValidationToken: addressValidation.token,
        checkoutCustomer,
        delivery,
        routingToken: preflight.token,
      };
      setRoutingConfirmation({
        estimatedMinutes: preflight.estimatedMinutes,
        message: preflight.message,
        requirements: preflight.confirmation.requirements,
        title: preflight.confirmation.title,
      });
    } catch {
      setCheckoutError("Unable to reach checkout right now. Please try again.");
    } finally {
      setIsRoutingEvaluating(false);
    }
  }

  async function handleConfirmDeliveryEligibility() {
    const pendingCheckout = pendingCheckoutRef.current;

    if (!pendingCheckout || isPlacingOrder) {
      return;
    }

    setRoutingConfirmation(null);
    pendingCheckoutRef.current = null;
    await completeCheckout(pendingCheckout);
  }

  function handleCancelDeliveryEligibility() {
    pendingCheckoutRef.current = null;
    setRoutingConfirmation(null);
  }

  function handleAddressInputChange() {
    setValidatedAddress(null);
    setAddressValidationMessage("");
  }

  async function completeCheckout({
    checkoutCustomer,
    delivery,
    addressValidationToken,
    routingToken,
  }: PendingCheckout) {
    setCheckoutError("");
    setOrderMessage("");
    setOrderTrackingHref("");
    setIsPlacingOrder(true);

    try {
      const ageVerification = await verifyAgeIfNeeded({
        accountAgeVerificationDisabled,
        accountCustomer: customer,
        accountEmail,
        customer: checkoutCustomer,
        key: ageCheckerPublicKey,
        setIsAgeVerifying,
        setMessage: setAgeVerificationMessage,
      });

      if (ageVerification.error) {
        setCheckoutError(ageVerification.error);
        return;
      }

      const response = await fetch("/api/checkout/order", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          address_validation: {
            token: addressValidationToken,
          },
          age_verification: ageVerification.token
            ? { token: ageVerification.token }
            : undefined,
          customer: checkoutCustomer,
          delivery,
          items,
          promo: activeAppliedPromo
            ? {
                code: activeAppliedPromo.code,
              }
            : undefined,
          routing: {
            token: routingToken,
          },
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        amountNeededCents?: number;
        code?: string;
        discountCode?: string;
        error?: string;
        minimumSpendCents?: number;
        order?: CustomerOrder;
        subtotalCents?: number;
      };

      if (!response.ok) {
        if (data.code === "PROMO_MINIMUM_NOT_MET") {
          const minimumIssue = getPromoMinimumIssueFromOrderError(data, activeAppliedPromo?.code ?? promoCode);

          if (minimumIssue) {
            setPromoMinimumIssue(minimumIssue);
            setPromoMinimumDialog(minimumIssue);
            setCheckoutError("");
            return;
          }
        }

        if (response.status === 401 && activeAppliedPromo) {
          setIsPromoAuthDialogOpen(true);
        }

        setCheckoutError(
          data.error ??
            "Unable to place your order right now. Please try again.",
        );
        return;
      }

      const recentOrder = data.order?.id
        ? getRecentOrderSnapshot(data.order, subtotal, items)
        : null;

      setIsOrderComplete(true);
      clearCart();
      clearReferralOffer();
      clearAppliedPromoCode();

      if (customer && recentOrder) {
        saveRecentOrder(recentOrder);
        router.push(`/account?order=${encodeURIComponent(recentOrder.id)}#orders`);
        return;
      }

      setOrderMessage(
        getOrderReference(data.order)
          ? `Order #${getOrderReference(data.order)} was placed.`
          : "Your order was placed.",
      );
      setOrderTrackingHref(
        recentOrder ? getOrderTrackingHref(recentOrder) : "",
      );
    } catch {
      setCheckoutError("Unable to reach checkout right now. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  }

  return (
    <main className="bayblaze-checkout-page min-h-screen bg-white text-[#585858]">
      <Header />

      <section className="border-b-2 border-black bg-[var(--ast-global-color-4)] pb-8 pt-[96px] sm:pb-12 sm:pt-[128px]">
        <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-5">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-[14px] leading-tight text-[#7a7a7a] sm:mb-6 sm:text-[15px]"
          >
            <Link
              className="text-black transition-colors hover:text-[var(--ast-global-color-0)]"
              href="/"
            >
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span>Checkout</span>
          </nav>

          <div className="max-w-[760px]">
            <h1 className="text-[34px] font-semibold uppercase leading-none tracking-[0.08em] text-black sm:text-[48px]">
              Your vape run, delivered
            </h1>
            <p className="mt-4 max-w-[620px] text-[17px] font-medium leading-[1.55] text-[var(--ast-global-color-3)] sm:text-[21px]">
              Place your order online. Pay the driver when it arrives.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-[1180px] gap-7 px-4 py-8 sm:px-5 sm:py-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form className="grid gap-8" onSubmit={handlePlaceOrder} ref={checkoutFormRef}>
          <CheckoutPanel title="Contact Information">
            {customer ? (
              <p className="mb-5 border border-[#d9d9d9] bg-[var(--ast-global-color-4)] px-4 py-3 text-[16px] font-medium leading-[1.5] text-black">
                Signed in as {customer.email}.
              </p>
            ) : (
              <p className="mb-5 border border-[#d9d9d9] bg-[var(--ast-global-color-4)] px-4 py-3 text-[16px] font-medium leading-[1.5] text-black">
                Have an account?{" "}
                <Link
                  href="/login?redirect=/checkout"
                  className="font-semibold text-[var(--ast-global-color-1)] underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>{" "}
                to fill this faster.
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <CheckoutField
                label="First name"
                name="first_name"
                defaultValue={customer?.first_name ?? undefined}
                required
              />
              <CheckoutField
                label="Last name"
                name="last_name"
                defaultValue={customer?.last_name ?? undefined}
                required
              />
              <CheckoutField
                label="Email"
                name="email"
                type="email"
                defaultValue={customer?.email}
                required
              />
              <CheckoutField
                label="Phone"
                name="phone"
                type="tel"
                defaultValue={customer?.phone ?? undefined}
                required
              />
            </div>
          </CheckoutPanel>

          <CheckoutPanel title="Delivery Address">
            <div className="grid gap-5">
              <label className="grid gap-2 text-[15px] font-semibold text-black sm:text-[16px]">
                Address
                {googleMapsBrowserKey ? (
                  <div
                    ref={googleAutocompleteContainerRef}
                    className={`bayblaze-google-autocomplete-container min-h-[50px] w-full min-w-0 bg-white sm:min-h-[52px] ${
                      isPlacesAutocompleteReady ? "block" : "hidden"
                    }`}
                  />
                ) : null}
                <input
                  ref={addressFieldRef}
                  autoComplete="street-address"
                  className={
                    isPlacesAutocompleteReady
                      ? "hidden"
                      : "h-[50px] w-full min-w-0 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black sm:h-[52px] sm:text-[17px]"
                  }
                  name="address"
                  onChange={handleAddressInputChange}
                  placeholder="Start typing your delivery address"
                  required={!isPlacesAutocompleteReady}
                  type="text"
                />
              </label>

              <label className="grid gap-2 text-[15px] font-semibold text-black sm:text-[16px]">
                <span>
                  Address Line 2 <span className="font-normal text-[#777]">(optional)</span>
                </span>
                <input
                  autoComplete="address-line2"
                  className="h-[50px] w-full min-w-0 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black sm:h-[52px] sm:text-[17px]"
                  name="address_line_2"
                  placeholder="Apt, suite, building, floor, or unit"
                  type="text"
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_110px_110px]">
                <label className="grid gap-2 text-[15px] font-semibold text-black sm:text-[16px]">
                  City
                  <input
                    autoComplete="address-level2"
                    className="h-[50px] w-full min-w-0 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black sm:h-[52px] sm:text-[17px]"
                    defaultValue="Tampa"
                    name="city"
                    onChange={handleAddressInputChange}
                    required
                    type="text"
                  />
                </label>

                <label className="grid gap-2 text-[15px] font-semibold text-black sm:text-[16px]">
                  State
                  <input
                    autoComplete="address-level1"
                    className="h-[50px] w-full min-w-0 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal uppercase text-black outline-none transition focus:border-black sm:h-[52px] sm:text-[17px]"
                    defaultValue="FL"
                    maxLength={2}
                    name="state"
                    onChange={handleAddressInputChange}
                    required
                    type="text"
                  />
                </label>

                <label className="grid gap-2 text-[15px] font-semibold text-black sm:text-[16px]">
                  ZIP
                  <input
                    autoComplete="postal-code"
                    className="h-[50px] w-full min-w-0 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black sm:h-[52px] sm:text-[17px]"
                    inputMode="numeric"
                    name="zip"
                    onChange={handleAddressInputChange}
                    required
                    type="text"
                  />
                </label>
              </div>

              {addressValidationMessage ? (
                <p className="border border-[#d7d1c6] bg-white px-4 py-3 text-[15px] font-semibold leading-[1.5] text-black">
                  {addressValidationMessage}
                </p>
              ) : googleMapsBrowserKey ? (
                <p className="text-[14px] font-medium leading-[1.5] text-[#585858]">
                  Start typing and choose your address from the Google suggestions.
                </p>
              ) : (
                <p className="text-[14px] font-medium leading-[1.5] text-[#585858]">
                  Address autocomplete is unavailable until Google Maps is configured.
                </p>
              )}

              <label className="grid gap-2 text-[15px] font-semibold text-black sm:text-[16px]">
                Delivery notes
                <textarea
                  className="min-h-[120px] resize-y border border-[#d6d6d6] bg-white px-4 py-3 text-[16px] font-normal text-black outline-none transition focus:border-black sm:min-h-[128px] sm:text-[17px]"
                  name="notes"
                  placeholder="Gate code, drop-off notes, or product preferences"
                />
              </label>
            </div>
          </CheckoutPanel>

          <CheckoutPanel title="Delivery Type">
            <div className="grid gap-5">
              <p className="text-[16px] font-medium leading-[1.55] text-black sm:text-[17px]">
                {DELIVERY_SCHEDULING_RULE}
              </p>

              <div
                className="grid gap-3 sm:grid-cols-2"
                role="radiogroup"
                aria-label="Delivery type"
              >
                <label
                  className={[
                    "grid cursor-pointer gap-2 border bg-white p-4 text-black transition",
                    activeDeliveryMode === "now"
                      ? "border-black"
                      : "border-[#d6d6d6]",
                    isExpressUnavailable
                      ? "cursor-not-allowed opacity-60"
                      : "hover:border-black",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-3 text-[17px] font-semibold">
                    <input
                      checked={activeDeliveryMode === "now"}
                      disabled={isExpressUnavailable}
                      name="delivery_mode"
                      onChange={() => setDeliveryMode("now")}
                      type="radio"
                      value="now"
                    />
                    BayBlaze Express
                  </span>
                  <span className="text-[15px] font-medium leading-[1.45] text-[#585858]">
                    Order will come to you in under an hour. Available from 10
                    AM until 11 PM.
                  </span>
                </label>

                <label
                  className={[
                    "grid cursor-pointer gap-2 border bg-white p-4 text-black transition hover:border-black",
                    activeDeliveryMode === "scheduled"
                      ? "border-black"
                      : "border-[#d6d6d6]",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-3 text-[17px] font-semibold">
                    <input
                      checked={activeDeliveryMode === "scheduled"}
                      name="delivery_mode"
                      onChange={() => setDeliveryMode("scheduled")}
                      type="radio"
                      value="scheduled"
                    />
                    Schedule Delivery
                  </span>
                  <span className="text-[15px] font-medium leading-[1.45] text-[#585858]">
                    Choose a delivery time that works for you.
                  </span>
                </label>
              </div>

              {isCheckoutClockReady && isExpressUnavailable ? (
                <p className="border border-[#d7d1c6] bg-white px-4 py-3 text-[15px] font-semibold leading-[1.5] text-black">
                  Bayblaze Express Delivery is unavailable right now. Schedule
                  your order for 10AM tomorrow or later. We&apos;re working on
                  getting deliveries working 24/7 soon!
                </p>
              ) : null}

              {needsScheduledTime ? (
                <label className="grid gap-2 text-[15px] font-semibold text-black sm:text-[16px]">
                  Scheduled delivery time
                  <input
                    className="h-[50px] w-full min-w-0 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black sm:h-[52px] sm:text-[17px]"
                    min={scheduledMinimumInput}
                    name="scheduled_at"
                    onChange={(event) => setScheduledAt(event.target.value)}
                    required
                    type="datetime-local"
                    value={scheduledInputValue}
                  />
                  {scheduledMinimumLabel ? (
                    <span className="text-[14px] font-medium leading-[1.45] text-[#585858]">
                      Earliest available: {scheduledMinimumLabel}. Scheduled
                      delivery hours are 10 AM to 11 PM.
                    </span>
                  ) : null}
                </label>
              ) : null}
            </div>
          </CheckoutPanel>

          <CheckoutPanel title="Enter Discount Code">
            <div className="grid gap-3">
              <label className="grid gap-2 text-[15px] font-semibold text-black sm:text-[16px]">
                <span className="sr-only">Discount code</span>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_128px]">
                  <input
                    className="h-[50px] w-full min-w-0 border border-[#d6d6d6] bg-white px-4 text-[16px] font-semibold uppercase text-black outline-none transition focus:border-black sm:h-[52px]"
                    onChange={(event) => handlePromoCodeChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleApplyPromoCode();
                      }
                    }}
                    placeholder="BLAZE20"
                    value={promoCode}
                  />
                  <button
                    className="h-[50px] border-2 border-black bg-black px-5 text-[13px] font-semibold uppercase text-white transition-colors hover:bg-[var(--ast-global-color-0)] disabled:cursor-not-allowed disabled:border-[#9d9d9d] disabled:bg-[#9d9d9d] sm:h-[52px]"
                    disabled={isPromoApplying || !hasItems}
                    onClick={() => void handleApplyPromoCode()}
                    type="button"
                  >
                    {isPromoApplying ? "Applying" : "Apply"}
                  </button>
                </div>
              </label>

              {activeAppliedPromo ? (
                <button
                  className="w-fit text-[12px] font-semibold uppercase tracking-[0.12em] text-[#585858] transition-colors hover:text-black"
                  onClick={clearAppliedPromoCode}
                  type="button"
                >
                  Remove coupon
                </button>
              ) : null}

              {effectivePromoMessage ? (
                <p className="border border-[#d7d1c6] bg-white px-4 py-3 text-[15px] font-semibold leading-[1.5] text-black">
                  {effectivePromoMessage}
                </p>
              ) : null}
            </div>
          </CheckoutPanel>

          {isAgeCheckerEnabled ? (
            <CheckoutPanel title="Age Verification">
              <div className="border border-[#e7e7e7] bg-white p-5">
                <p className="text-[17px] font-medium leading-[1.6] text-black">
                  {hasSavedAgeVerification
                    ? "Your successful AgeChecker.Net verification is saved to your BayBlaze account. Future orders on this account can skip the AgeChecker popup."
                    : "BayBlaze verifies that every customer is 21+ with AgeChecker.Net before the order is created. If instant verification needs help, AgeChecker.Net may ask for a photo ID inside its secure popup."}
                </p>
                {ageVerificationMessage ? (
                  <p className="mt-3 text-[15px] font-semibold leading-[1.5] text-[#585858]">
                    {ageVerificationMessage}
                  </p>
                ) : null}
              </div>
            </CheckoutPanel>
          ) : null}

          <CheckoutPanel title="Payment">
            <div className="border border-[#e7e7e7] bg-[var(--ast-global-color-4)] p-5">
              <p className="text-[18px] font-semibold leading-[1.5] text-black">
                Payment due on delivery.
              </p>
              <p className="mt-2 text-[17px] leading-[1.6]">
                Cash, Cash App, or Zelle accepted at delivery. Please have a
                physical ID ready. You need to be 21+ to order.
              </p>
            </div>
          </CheckoutPanel>

          {!hasItems && !isOrderComplete ? (
            <p className="text-[16px] font-medium leading-[1.5] text-red-700">
              Add at least one product to your cart before placing an order.
            </p>
          ) : null}

          {checkoutError ? (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-[16px] font-medium leading-[1.5] text-red-700">
              {checkoutError}
            </p>
          ) : null}

          {orderMessage ? (
            <p className="border border-[#c8d8bd] bg-[#f5faf0] px-4 py-3 text-[16px] font-semibold leading-[1.5] text-[var(--ast-global-color-0)]">
              {orderMessage}
              {orderTrackingHref ? (
                <>
                  {" "}
                  <Link
                    className="underline underline-offset-4"
                    href={orderTrackingHref}
                  >
                    Track it here.
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canPlaceOrder}
            className="bayblaze-hero-button h-12 w-full rounded-[3px] bg-[var(--ast-global-color-0)] text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#b9c8af] sm:w-[260px]"
          >
            {isAddressValidating
              ? "VALIDATING ADDRESS..."
              : isRoutingEvaluating
              ? "CHECKING DELIVERY..."
              : isAgeVerifying
              ? "VERIFYING AGE..."
              : isPlacingOrder
                ? "PLACING ORDER..."
                : "PLACE ORDER"}
          </button>
        </form>

        <aside className="h-fit border-2 border-black bg-white">
          <div className="border-b-2 border-black px-5 py-4">
            <h2 className="text-[21px] font-medium leading-tight text-black sm:text-[24px]">
              Order Summary
            </h2>
          </div>

          <div className="px-5 py-6">
            {!hasItems && !isOrderComplete ? (
              <div className="border border-dashed border-[#bdbdbd] bg-[var(--ast-global-color-4)] px-4 py-8 text-center">
                <p className="text-[18px] font-medium leading-[1.45] text-black">
                  Your cart is empty.
                </p>
                <Link
                  href="/shop"
                  className="mt-4 inline-flex text-[16px] font-semibold text-[var(--ast-global-color-1)] underline-offset-4 hover:underline"
                >
                  Return to shop
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border-b border-[#e7e7e7] pb-4"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="size-20 shrink-0 border border-[#e7e7e7] bg-white object-contain p-2"
                      />
                    ) : (
                      <div className="flex size-20 shrink-0 items-center justify-center border border-[#e7e7e7] bg-white text-[12px] text-[#777]">
                        No image
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-[16px] font-semibold leading-snug text-black">
                        {item.name}
                      </p>

                      {item.flavor ? (
                        <p className="mt-1 text-[15px] leading-snug text-[#585858]">
                          Flavor: {item.flavor}
                        </p>
                      ) : null}

                      <p className="mt-1 text-[15px] text-[#585858]">
                        Qty: {item.quantity}
                      </p>

                      {item.price ? (
                        <p className="mt-1 text-[15px] font-medium text-black">
                          {item.price}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        className="mt-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#585858] transition-colors hover:text-black"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <dl className="mt-6 grid gap-3 border-t border-[#e7e7e7] pt-5 text-[16px]">
              <div className="flex justify-between">
                <dt>Items</dt>
                <dd className="text-black">{cartCount}</dd>
              </div>

              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="text-black">{formatMoney(subtotal)}</dd>
              </div>

              {referralOffer && firstOrderDiscount > 0 ? (
                <div className="flex justify-between text-[var(--ast-global-color-1)]">
                  <dt>{referralOffer.label}</dt>
                  <dd className="font-semibold">
                    -{formatMoney(firstOrderDiscount)}
                  </dd>
                </div>
              ) : null}

              {activeAppliedPromo && checkoutPromoDiscount > 0 ? (
                <div className="flex justify-between text-[var(--ast-global-color-1)]">
                  <dt>Promo {activeAppliedPromo.code}</dt>
                  <dd className="font-semibold">
                    -{formatMoney(checkoutPromoDiscount)}
                  </dd>
                </div>
              ) : null}

              <div className="flex justify-between">
                <dt>Delivery</dt>
                <dd className="text-black">Calculated after order</dd>
              </div>

              <div className="flex justify-between border-t border-[#e7e7e7] pt-4 text-[19px] font-semibold text-black">
                <dt>Total due</dt>
                <dd>{formatMoney(totalDue)}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </section>

      {routingConfirmation ? (
        <RoutingConfirmationDialog
          confirmation={routingConfirmation}
          isSubmitting={isPlacingOrder || isAgeVerifying}
          onCancel={handleCancelDeliveryEligibility}
          onConfirm={handleConfirmDeliveryEligibility}
        />
      ) : null}

      {promoMinimumDialog ? (
        <PromoMinimumDialog
          issue={promoMinimumDialog}
          onClose={() => setPromoMinimumDialog(null)}
          onContinue={continueWithoutPromo}
        />
      ) : null}

      {isPromoAuthDialogOpen ? (
        <PromoAuthDialog
          googleOAuthHref={`/api/auth/oauth/google/start?redirect=${encodeURIComponent(
            getPromoCheckoutRedirect(),
          )}`}
          onAuthComplete={() => {
            setIsPromoAuthDialogOpen(false);
            setHasCompletedPromoAuth(true);
            persistPromoCodeInUrl(activeAppliedPromo?.code ?? promoCode);
            router.refresh();
          }}
          onClose={() => setIsPromoAuthDialogOpen(false)}
        />
      ) : null}
    </main>
  );
}

function hasAcceptedAccountAgeVerification(customer?: Customer) {
  const metadata = customer?.metadata;

  return (
    metadata?.age_verification_provider === "agechecker.net" &&
    metadata.age_verification_status === "accepted" &&
    typeof metadata.age_verification_uuid === "string" &&
    metadata.age_verification_uuid.length === 32 &&
    typeof metadata.age_verified_at === "string"
  );
}

function canUseSavedAgeVerification(
  accountCustomer: Customer | undefined,
  checkoutCustomer: CheckoutCustomerPayload,
) {
  if (!hasAcceptedAccountAgeVerification(accountCustomer)) {
    return false;
  }

  const accountEmail = normalizeEmail(accountCustomer?.email);
  const checkoutEmail = normalizeEmail(checkoutCustomer.email);
  const metadataEmail = normalizeEmail(accountCustomer?.metadata?.age_verified_email);

  if (!accountEmail || !checkoutEmail || accountEmail !== checkoutEmail) {
    return false;
  }

  return !metadataEmail || metadataEmail === accountEmail;
}

function canUseAccountAgeVerificationBypass({
  accountAgeVerificationDisabled,
  accountEmail,
  checkoutCustomer,
}: {
  accountAgeVerificationDisabled: boolean;
  accountEmail?: string;
  checkoutCustomer: CheckoutCustomerPayload;
}) {
  return (
    accountAgeVerificationDisabled &&
    Boolean(normalizeEmail(accountEmail)) &&
    normalizeEmail(accountEmail) === normalizeEmail(checkoutCustomer.email)
  );
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

async function verifyAgeIfNeeded({
  accountAgeVerificationDisabled,
  accountCustomer,
  accountEmail,
  customer,
  key,
  setIsAgeVerifying,
  setMessage,
}: {
  accountAgeVerificationDisabled: boolean;
  accountCustomer?: Customer;
  accountEmail?: string;
  customer: CheckoutCustomerPayload;
  key: string;
  setIsAgeVerifying: (isVerifying: boolean) => void;
  setMessage: (message: string) => void;
}): Promise<{ error?: string; token?: string }> {
  if (!key) {
    return {};
  }

  if (
    canUseAccountAgeVerificationBypass({
      accountAgeVerificationDisabled,
      accountEmail,
      checkoutCustomer: customer,
    })
  ) {
    setMessage("Age verification is disabled for this BayBlaze account.");
    return {};
  }

  if (canUseSavedAgeVerification(accountCustomer, customer)) {
    setMessage("Age verification is saved to your BayBlaze account.");
    return {};
  }

  setIsAgeVerifying(true);
  setMessage("Opening age verification...");

  try {
    const uuid = await runAgeCheckerPopup(customer, key);

    setMessage("Confirming age verification...");

    const response = await fetch("/api/age-verification", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        customer,
        uuid,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
      token?: string;
    };

    if (!response.ok || !data.token) {
      return {
        error:
          data.error ??
          "Age verification could not be confirmed. Please try again.",
      };
    }

    setMessage("Age verified.");

    return { token: data.token };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Age verification could not be completed.",
    };
  } finally {
    setIsAgeVerifying(false);
  }
}

async function requestPreCheckoutRouting({
  customer,
  delivery,
  items,
}: {
  customer: CheckoutCustomerPayload;
  delivery: CheckoutDeliveryPayload;
  items: CartItem[];
}): Promise<PreCheckoutRoutingResult> {
  const response = await fetch("/api/checkout/preflight", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      customer,
      delivery,
      items,
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    accepted?: boolean;
    confirmation?: {
      title?: string;
      requirements?: string[];
    };
    error?: string;
    estimatedMinutes?: number;
    message?: string;
    token?: string;
  };

  if (!response.ok) {
    return {
      error:
        data.error ??
        "Unable to check delivery eligibility right now. Please try again.",
    };
  }

  if (!data.accepted) {
    return {
      error:
        data.message ??
        "Sorry, BayBlaze cannot reasonably fulfill this delivery yet. We are actively working to expand our coverage area.",
    };
  }

  if (!data.token) {
    return {
      error:
        "Delivery eligibility could not be confirmed. Please review your order and try again.",
    };
  }

  return {
    confirmation: {
      title: data.confirmation?.title ?? "Confirm delivery details",
      requirements: data.confirmation?.requirements?.length
        ? data.confirmation.requirements
        : [
            "Confirm the delivery address is correct.",
            "Confirm you will be present at the estimated delivery time.",
            "Confirm you will have your physical ID on hand when the driver arrives.",
          ],
    },
    estimatedMinutes: data.estimatedMinutes,
    message:
      data.message ??
      "BayBlaze can accept this checkout if you confirm the delivery details before age verification.",
    token: data.token,
  };
}

function runAgeCheckerPopup(
  customer: CheckoutCustomerPayload,
  key: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Age verification is unavailable right now."));
      return;
    }

    let acceptedUuid = "";
    let settled = false;

    function finish(error?: Error, uuid?: string) {
      if (settled) {
        return;
      }

      settled = true;

      if (error) {
        reject(error);
        return;
      }

      resolve(uuid ?? acceptedUuid);
    }

    document
      .querySelectorAll<HTMLScriptElement>(
        'script[data-bayblaze-agechecker="true"]',
      )
      .forEach((script) => script.remove());

    window.AgeCheckerAPI = undefined;
    window.AgeCheckerConfig = {
      data: {
        address: String(customer.address ?? ""),
        city: String(customer.city ?? ""),
        country: "US",
        first_name: String(customer.first_name ?? ""),
        last_name: String(customer.last_name ?? ""),
        state: String(customer.state ?? ""),
        zip: String(customer.zip ?? ""),
      },
      defer_submit: true,
      key,
      mode: "manual",
      name: "BayBlaze",
      onclosed: (done) => {
        done?.();

        if (!acceptedUuid) {
          finish(
            new Error(
              `Complete age verification before checkout can continue. Contact ${AGECHECKER_SUPPORT_EMAIL} if you need help.`,
            ),
          );
        }
      },
      onready: () => {
        window.AgeCheckerAPI?.show();
      },
      onstatuschanged: (verification) => {
        if (
          verification.status === "accepted" &&
          typeof verification.uuid === "string" &&
          verification.uuid.length === 32
        ) {
          acceptedUuid = verification.uuid;
          finish(undefined, verification.uuid);
        }
      },
    };

    const script = document.createElement("script");
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.bayblazeAgechecker = "true";
    script.onerror = () => {
      finish(
        new Error(
          `Age verification could not load. Contact ${AGECHECKER_SUPPORT_EMAIL} if you need help.`,
        ),
      );
    };
    script.src = AGECHECKER_POPUP_SCRIPT_URL;

    document.head.appendChild(script);
  });
}

function getCheckoutCustomerFromFormData(
  formData: FormData,
): CheckoutCustomerPayload {
  return {
    address: getFormDataString(formData, "address"),
    address_line_2: getFormDataString(formData, "address_line_2"),
    city: getFormDataString(formData, "city"),
    email: getFormDataString(formData, "email"),
    first_name: getFormDataString(formData, "first_name"),
    last_name: getFormDataString(formData, "last_name"),
    notes: getFormDataString(formData, "notes"),
    phone: getFormDataString(formData, "phone"),
    state: getFormDataString(formData, "state"),
    zip: getFormDataString(formData, "zip"),
  };
}

function getFormDataString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

type GoogleMapsPlacesLibrary = {
  PlaceAutocompleteElement: new (
    options?: Record<string, unknown>,
  ) => GooglePlaceAutocompleteElement;
};

type GooglePlaceAutocompleteElement = HTMLElement & {
  includedRegionCodes?: string[];
  locationBias?: {
    center: {
      lat: number;
      lng: number;
    };
    radius: number;
  } | null;
  placeholder?: string;
};

type GooglePlacePredictionSelectEvent = Event & {
  placePrediction?: {
    toPlace?: () => GooglePlace;
  };
};

type GooglePlace = {
  addressComponents?: GoogleAddressComponent[];
  fetchFields?: (request: { fields: string[] }) => Promise<void>;
  formattedAddress?: string;
  id?: string;
  location?: GoogleLatLngValue;
};

type GoogleAddressComponent = {
  longText?: string;
  shortText?: string;
  types: string[];
};

type GoogleLatLngValue = {
  lat?: number | (() => number);
  lng?: number | (() => number);
};

declare global {
  interface Window {
    __bayblazeGoogleMapsPlacesPromise?: Promise<GoogleMapsPlacesLibrary>;
    __bayblazeInitGoogleMaps?: () => void;
    gm_authFailure?: () => void;
    google?: {
      maps?: {
        importLibrary?: (
          libraryName: string,
        ) => Promise<GoogleMapsPlacesLibrary>;
        places?: {
          PlaceAutocompleteElement?: new (
            options?: Record<string, unknown>,
          ) => GooglePlaceAutocompleteElement;
        };
      };
    };
  }
}

function getAddressFromGooglePlace(place: GooglePlace): ValidatedCheckoutAddress | null {
  const components = place.addressComponents ?? [];
  const streetNumber = getGoogleAddressComponent(components, "street_number");
  const route = getGoogleAddressComponent(components, "route");
  const subpremise = getGoogleAddressComponent(components, "subpremise");
  const city =
    getGoogleAddressComponent(components, "locality") ||
    getGoogleAddressComponent(components, "sublocality") ||
    getGoogleAddressComponent(components, "postal_town");
  const state = getGoogleAddressComponent(
    components,
    "administrative_area_level_1",
    true,
  );
  const zip = getGoogleAddressComponent(components, "postal_code");
  const streetAddress = [streetNumber, route].filter(Boolean).join(" ");
  const address = subpremise
    ? `${streetAddress} #${subpremise}`.trim()
    : streetAddress.trim();

  if (!address || !city || !state || !zip) {
    return null;
  }

  const location = getGoogleLatLng(place.location);

  return {
    address,
    city,
    formatted_address: place.formattedAddress,
    google_place_id: place.id,
    latitude: location.latitude,
    longitude: location.longitude,
    state,
    zip,
  };
}

function getGoogleAddressComponent(
  components: GoogleAddressComponent[],
  type: string,
  shortName = false,
) {
  const component = components.find((entry) => entry.types.includes(type));

  return shortName ? component?.shortText ?? "" : component?.longText ?? "";
}

function getGoogleLatLng(location?: GoogleLatLngValue) {
  const rawLat = location?.lat;
  const rawLng = location?.lng;
  const latitude = typeof rawLat === "function" ? rawLat() : rawLat;
  const longitude = typeof rawLng === "function" ? rawLng() : rawLng;

  return {
    latitude: typeof latitude === "number" ? latitude : undefined,
    longitude: typeof longitude === "number" ? longitude : undefined,
  };
}

function setCheckoutAddressInputs(
  form: HTMLFormElement | null | undefined,
  address: ValidatedCheckoutAddress,
) {
  setFormInputValue(form, "address", address.address);
  setFormInputValue(form, "city", address.city);
  setFormInputValue(form, "state", address.state);
  setFormInputValue(form, "zip", address.zip);
}

function setFormInputValue(
  form: HTMLFormElement | null | undefined,
  name: string,
  value: string,
) {
  const field = form?.elements.namedItem(name);

  if (field instanceof HTMLInputElement) {
    field.value = value;
  }
}

function loadGoogleMapsPlaces(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Maps is unavailable."));
  }

  if (window.__bayblazeGoogleMapsPlacesPromise) {
    return window.__bayblazeGoogleMapsPlacesPromise;
  }

  if (window.google?.maps?.places?.PlaceAutocompleteElement) {
    window.__bayblazeGoogleMapsPlacesPromise = getGooglePlacesLibrary();
    return window.__bayblazeGoogleMapsPlacesPromise;
  }

  if (window.google?.maps?.importLibrary) {
    window.__bayblazeGoogleMapsPlacesPromise = getGooglePlacesLibrary();
    return window.__bayblazeGoogleMapsPlacesPromise;
  }

  window.__bayblazeGoogleMapsPlacesPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-bayblaze-google-maps="true"]',
    );
    const previousAuthFailure = window.gm_authFailure;
    const timeoutId = window.setTimeout(() => {
      fail(
        new Error(
          "Google Maps timed out before loading the Places autocomplete widget.",
        ),
      );
    }, 12_000);

    function cleanup() {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      if (window.__bayblazeInitGoogleMaps === resolvePlacesLibrary) {
        delete window.__bayblazeInitGoogleMaps;
      }

      window.gm_authFailure = previousAuthFailure;
    }

    function fail(error: Error) {
      cleanup();
      window.__bayblazeGoogleMapsPlacesPromise = undefined;
      reject(error);
    }

    function resolvePlacesLibrary() {
      getGooglePlacesLibrary()
        .then((library) => {
          cleanup();
          resolve(library);
        })
        .catch((error: unknown) => {
          fail(
            error instanceof Error
              ? error
              : new Error("Google Places library could not initialize."),
          );
        });
    }

    window.__bayblazeInitGoogleMaps = resolvePlacesLibrary;
    window.gm_authFailure = () => {
      previousAuthFailure?.();
      fail(
        new Error(
          "Google Maps rejected the browser key. Check API restrictions, referrer restrictions, and billing.",
        ),
      );
    };

    if (existingScript) {
      if (window.google?.maps) {
        resolvePlacesLibrary();
        return;
      }

      existingScript.addEventListener("load", resolvePlacesLibrary, {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => fail(new Error("Google Maps JavaScript API script failed to load.")),
        { once: true },
      );
      return;
    }

    const params = new URLSearchParams({
      callback: "__bayblazeInitGoogleMaps",
      key: apiKey,
      libraries: "places",
      loading: "async",
      region: "US",
      v: "weekly",
    });

    const script = document.createElement("script");
    script.async = true;
    script.dataset.bayblazeGoogleMaps = "true";
    script.defer = true;
    script.onerror = () => {
      fail(new Error("Google Maps JavaScript API script failed to load."));
    };
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;

    document.head.appendChild(script);
  });

  return window.__bayblazeGoogleMapsPlacesPromise;
}

async function getGooglePlacesLibrary(): Promise<GoogleMapsPlacesLibrary> {
  const importedLibrary = await window.google?.maps?.importLibrary?.("places");
  const PlaceAutocompleteElement =
    importedLibrary?.PlaceAutocompleteElement ??
    window.google?.maps?.places?.PlaceAutocompleteElement;

  if (!PlaceAutocompleteElement) {
    throw new Error(
      "Google Places Autocomplete is unavailable after loading Maps JavaScript. Confirm Places API (New) is enabled and authorized on NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY.",
    );
  }

  return { PlaceAutocompleteElement };
}

async function validateCheckoutAddress(
  customer: CheckoutAddressPayload,
  {
    existingValidation,
    setAddressValidation,
    setAddressValidationMessage,
    setIsAddressValidating,
  }: {
    existingValidation: CheckoutAddressValidationState | null;
    setAddressValidation: (validation: CheckoutAddressValidationState | null) => void;
    setAddressValidationMessage: (message: string) => void;
    setIsAddressValidating: (isValidating: boolean) => void;
  },
): Promise<CheckoutAddressValidationState | { error: string }> {
  const fingerprint = getCheckoutAddressFingerprint(customer);

  if (!fingerprint) {
    return { error: "Enter a complete delivery address." };
  }

  if (existingValidation?.fingerprint === fingerprint) {
    return existingValidation;
  }

  setIsAddressValidating(true);
  setAddressValidationMessage("Validating delivery address...");

  try {
    const response = await fetch("/api/checkout/address/validate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        customer,
        place_id:
          typeof customer.google_place_id === "string"
            ? customer.google_place_id
            : undefined,
        selected_place:
          typeof customer.latitude === "number" &&
          typeof customer.longitude === "number"
            ? {
                formatted_address:
                  typeof customer.formatted_address === "string"
                    ? customer.formatted_address
                    : undefined,
                latitude: customer.latitude,
                longitude: customer.longitude,
              }
            : undefined,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as {
      address?: ValidatedCheckoutAddress;
      error?: string;
      message?: string;
      token?: string;
    };

    if (!response.ok || !data.address || !data.token) {
      setAddressValidation(null);
      setAddressValidationMessage(
        data.error ?? "Delivery address could not be verified.",
      );

      return {
        error: data.error ?? "Delivery address could not be verified.",
      };
    }

    const normalizedFingerprint = getCheckoutAddressFingerprint(data.address);
    const validation = {
      address: data.address,
      fingerprint: normalizedFingerprint || fingerprint,
      token: data.token,
    };

    setAddressValidation(validation);
    setAddressValidationMessage(data.message ?? "Delivery address verified.");

    return validation;
  } catch {
    setAddressValidation(null);
    setAddressValidationMessage(
      "Address validation is unavailable right now. Please try again.",
    );

    return {
      error: "Address validation is unavailable right now. Please try again.",
    };
  } finally {
    setIsAddressValidating(false);
  }
}

function getCheckoutAddressFingerprint(customer: CheckoutAddressPayload) {
  const address = normalizeCheckoutAddressValue(customer.address);
  const city = normalizeCheckoutAddressValue(customer.city);
  const state = normalizeCheckoutAddressValue(customer.state).toUpperCase();
  const zip = normalizeCheckoutAddressValue(customer.zip).replace(/\D/g, "");

  return address && city && state && zip
    ? [address.toLowerCase(), city.toLowerCase(), state, zip].join("|")
    : "";
}

function normalizeCheckoutAddressValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function CheckoutPanel({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="bayblaze-sharp-card bg-white p-4 sm:p-6">
      <h2 className="mb-4 text-2xl font-black uppercase leading-none text-black sm:mb-5 sm:text-3xl">
        {title}
      </h2>
      {children}
    </section>
  );
}

function CheckoutField({
  defaultValue,
  inputMode,
  label,
  name,
  required = false,
  type = "text",
}: {
  defaultValue?: string;
  inputMode?: "numeric";
  label: string;
  name: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="grid gap-2 text-xs font-bold uppercase tracking-widest text-black">
      <span>
        {label}
        {required ? (
          <>
            <span className="text-red-700" aria-hidden="true">
              {" "}
              *
            </span>
            <span className="sr-only"> required</span>
          </>
        ) : null}
      </span>
      <input
        className="h-12 w-full min-w-0 border-2 border-black bg-white px-4 text-base font-semibold text-black outline-none transition focus:shadow-[inset_0_0_0_2px_var(--ast-global-color-0)]"
        defaultValue={defaultValue}
        inputMode={inputMode}
        name={name}
        required={required}
        type={type}
      />
    </label>
  );
}

function RoutingConfirmationDialog({
  confirmation,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  confirmation: RoutingConfirmationState;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      aria-labelledby="routing-confirmation-title"
      aria-modal="true"
      className="fixed inset-0 z-[80] grid place-items-center bg-black/55 px-4 py-6"
      role="dialog"
    >
      <div className="w-full max-w-[560px] border-2 border-black bg-white p-5 shadow-2xl sm:p-6">
        <h2
          className="text-[26px] font-semibold leading-tight text-black sm:text-[32px]"
          id="routing-confirmation-title"
        >
          {confirmation.title}
        </h2>
        <p className="mt-4 text-[16px] font-medium leading-[1.55] text-[#585858] sm:text-[18px]">
          {confirmation.message}
        </p>

        {confirmation.estimatedMinutes ? (
          <p className="mt-3 border border-[#d7d1c6] bg-[var(--ast-global-color-4)] px-4 py-3 text-[15px] font-semibold leading-[1.5] text-black">
            Estimated delivery time: about {confirmation.estimatedMinutes}{" "}
            minutes.
          </p>
        ) : null}

        <ul className="mt-5 grid gap-3 text-[15px] font-medium leading-[1.5] text-black sm:text-[16px]">
          {confirmation.requirements.map((requirement) => (
            <li key={requirement} className="flex gap-3">
              <span aria-hidden="true" className="mt-1 size-2 bg-black" />
              <span>{requirement}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            className="h-12 border border-black bg-white px-6 text-[14px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-[var(--ast-global-color-4)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={onCancel}
            type="button"
          >
            Go Back
          </button>
          <button
            className="h-12 bg-[var(--ast-global-color-0)] px-6 text-[14px] font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#b9c8af]"
            disabled={isSubmitting}
            onClick={onConfirm}
            type="button"
          >
            I Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function PromoMinimumDialog({
  issue,
  onClose,
  onContinue,
}: {
  issue: PromoMinimumIssue;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <div
      aria-labelledby="promo-minimum-title"
      aria-modal="true"
      className="fixed inset-0 z-[80] grid place-items-center bg-black/55 px-4 py-6"
      role="dialog"
    >
      <section className="w-full max-w-[520px] border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-6">
        <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[var(--ast-global-color-1)]">
          Discount code
        </p>
        <h2
          className="mt-2 text-[28px] font-black uppercase leading-none text-black sm:text-[36px]"
          id="promo-minimum-title"
        >
          Add {formatMoney(centsToMoney(issue.amountNeededCents))} more
        </h2>
        <p className="mt-4 text-[16px] font-medium leading-[1.55] text-[#585858] sm:text-[18px]">
          This code needs a {formatMoney(centsToMoney(issue.minimumSpendCents))} basket before tax.
          Add {formatMoney(centsToMoney(issue.amountNeededCents))} more, or continue without the discount.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            className="bayblaze-sharp-button bayblaze-sharp-button--primary flex h-12 items-center justify-center text-center"
            href="/shop"
            onClick={onClose}
          >
            Add products
          </Link>
          <button
            className="h-12 border border-black bg-white px-6 text-[14px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-[var(--ast-global-color-4)]"
            onClick={onContinue}
            type="button"
          >
            Continue without discount
          </button>
        </div>
      </section>
    </div>
  );
}

function PromoAuthDialog({
  googleOAuthHref,
  onAuthComplete,
  onClose,
}: {
  googleOAuthHref: string;
  onAuthComplete: () => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<AuthFormState>(initialAuthFormState);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const isVerifyingRegistration = mode === "register" && Boolean(verificationEmail);

  function updateField(field: keyof AuthFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetMessages() {
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    const endpoint =
      mode === "login"
        ? "/api/auth/login"
        : isVerifyingRegistration
          ? "/api/auth/register"
          : "/api/auth/register/start";
    const payload =
      mode === "login"
        ? {
            email: form.email,
            password: form.password,
          }
        : {
            email: form.email,
            firstName: form.firstName,
            lastName: form.lastName,
            password: form.password,
            ...(isVerifyingRegistration ? { code: form.code } : {}),
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message || "We could not complete that request. Please try again.",
        );
      }

      if (mode === "register" && !isVerifyingRegistration) {
        setVerificationEmail(form.email.trim().toLowerCase());
        setNotice("We sent a 6-digit code to your email.");
        return;
      }

      onAuthComplete();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not complete that request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="promo-auth-title"
    >
      <div className="mx-auto flex min-h-full w-full max-w-[520px] items-center py-4">
        <section
          aria-labelledby="promo-auth-title"
          className="w-full border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-8"
        >
          <div className="mb-6 border-2 border-black bg-[var(--ast-global-color-4)] p-4">
            <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[var(--ast-global-color-1)]">
              Discount code
            </p>
            <h2
              id="promo-auth-title"
              className="mt-2 text-3xl font-black uppercase leading-none text-black sm:text-4xl"
            >
              Sign in to lock in your discount
            </h2>
            <p className="mt-3 text-[15px] font-medium leading-[1.6] text-[#585858]">
              You can preview the savings now, but BayBlaze needs a customer
              account before placing the order with this discount.
            </p>
          </div>

          {!isVerifyingRegistration ? (
            <div className="mb-6 grid grid-cols-2 border-2 border-black bg-white">
              <button
                type="button"
                aria-pressed={mode === "login"}
                className={`h-12 border-r-2 border-black text-[14px] font-extrabold uppercase tracking-widest transition-colors ${
                  mode === "login"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-[var(--ast-global-color-4)]"
                }`}
                onClick={() => {
                  setMode("login");
                  resetMessages();
                  setVerificationEmail("");
                }}
              >
                Login
              </button>

              <button
                type="button"
                aria-pressed={mode === "register"}
                className={`h-12 text-[14px] font-extrabold uppercase tracking-widest transition-colors ${
                  mode === "register"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-[var(--ast-global-color-4)]"
                }`}
                onClick={() => {
                  setMode("register");
                  resetMessages();
                }}
              >
                Register
              </button>
            </div>
          ) : null}

          {!isVerifyingRegistration ? (
            <>
              <a
                href={googleOAuthHref}
                className="mb-5 flex h-12 w-full items-center justify-center gap-3 border-2 border-black bg-white px-4 text-center text-[14px] font-extrabold uppercase tracking-wider text-black no-underline transition-colors hover:bg-black hover:text-white"
              >
                <AuthGoogleIcon />
                Continue with Google
              </a>

              <div className="mb-5 flex items-center gap-3 text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#585858]">
                <span className="h-0.5 flex-1 bg-black" />
                <span>Email</span>
                <span className="h-0.5 flex-1 bg-black" />
              </div>
            </>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isVerifyingRegistration ? (
              <div className="space-y-5">
                <div className="border-2 border-black bg-[var(--ast-global-color-4)] p-5">
                  <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[var(--ast-global-color-1)]">
                    Verify email
                  </p>
                  <h3 className="mt-2 text-3xl font-black uppercase leading-none text-black">
                    Enter your code
                  </h3>
                  <p className="mt-3 text-[15px] font-medium leading-[1.6] text-[#585858]">
                    We sent a 6-digit code to{" "}
                    <span className="font-bold text-black">{verificationEmail}</span>.
                  </p>
                </div>

                <AuthInput
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  label="Verification code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={form.code}
                  onChange={(value) =>
                    updateField("code", value.replace(/\D/g, "").slice(0, 6))
                  }
                />

                <button
                  type="button"
                  className="text-[13px] font-extrabold uppercase tracking-widest text-[#585858] transition-colors hover:text-black"
                  onClick={() => {
                    setVerificationEmail("");
                    setForm((current) => ({ ...current, code: "" }));
                    resetMessages();
                  }}
                >
                  Change email
                </button>
              </div>
            ) : (
              <>
                {mode === "register" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AuthInput
                      autoComplete="given-name"
                      label="First name"
                      value={form.firstName}
                      onChange={(value) => updateField("firstName", value)}
                    />
                    <AuthInput
                      autoComplete="family-name"
                      label="Last name"
                      value={form.lastName}
                      onChange={(value) => updateField("lastName", value)}
                    />
                  </div>
                ) : null}

                <AuthInput
                  autoComplete="email"
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                />
                <AuthInput
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  label="Password"
                  minLength={mode === "login" ? 6 : 12}
                  type="password"
                  value={form.password}
                  onChange={(value) => updateField("password", value)}
                />
              </>
            )}

            <p
              aria-live="polite"
              className="min-h-6 border-2 border-transparent text-[14px] font-bold text-red-700"
            >
              {error}
            </p>

            {notice ? (
              <p
                aria-live="polite"
                className="-mt-3 border-2 border-black bg-[var(--ast-global-color-4)] px-3 py-2 text-[14px] font-bold text-[var(--ast-global-color-1)]"
              >
                {notice}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bayblaze-sharp-button bayblaze-sharp-button--primary flex h-[52px] w-full items-center justify-center text-center disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? mode === "login"
                  ? "Signing in..."
                  : verificationEmail
                    ? "Verifying..."
                    : "Sending code..."
                : mode === "login"
                  ? "Sign in"
                  : verificationEmail
                    ? "Verify & create account"
                    : "Create account"}
            </button>
          </form>

          <button
            className="mt-4 text-[13px] font-extrabold uppercase tracking-widest text-[#585858] transition-colors hover:text-black"
            onClick={onClose}
            type="button"
          >
            Back to checkout
          </button>
        </section>
      </div>
    </div>
  );
}

function AuthGoogleIcon() {
  return (
    <span
      aria-hidden="true"
      className="grid size-5 place-items-center border-2 border-black bg-white text-[12px] font-black leading-none text-black"
    >
      G
    </span>
  );
}

function AuthInput({
  label,
  type = "text",
  autoComplete,
  inputMode,
  maxLength,
  minLength,
  pattern,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "numeric";
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-[13px] font-extrabold uppercase tracking-widest text-black">
      {label}
      <input
        required
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        minLength={minLength}
        pattern={pattern}
        value={value}
        className="bayblaze-sharp-input mt-2 h-12 text-[16px] font-medium normal-case tracking-normal"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function parsePrice(price?: string) {
  if (!price) {
    return 0;
  }

  const number = Number(price.replace(/[^0-9.]/g, ""));

  return Number.isFinite(number) ? number : 0;
}

function getCheckoutPromoPreviewItems(items: CartItem[]): CheckoutPromoPreviewItem[] {
  return items
    .map((item) => ({
      quantity: item.quantity,
      unitPriceCents: moneyToCents(parsePrice(item.price)),
    }))
    .filter((item) => item.quantity > 0 && item.unitPriceCents > 0);
}

function getPromoMinimumIssue(
  value: unknown,
  fallbackCode: string,
): PromoMinimumIssue | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const preview = value as Partial<CheckoutPromoCodePreview>;

  if (preview.ineligibilityReason !== "minimum_spend") {
    return null;
  }

  const code = normalizeCheckoutPromoCode(preview.code || fallbackCode);
  const minimumSpendCents = readCents(preview.minimumSpendCents);
  const subtotalCents = readCents(preview.subtotalCents);
  const amountNeededCents = readCents(preview.amountNeededCents) || Math.max(0, minimumSpendCents - subtotalCents);

  if (!code || minimumSpendCents <= 0 || amountNeededCents <= 0) {
    return null;
  }

  return {
    amountNeededCents,
    code,
    minimumSpendCents,
    subtotalCents,
  };
}

function getCurrentPromoMinimumIssue(
  promo: CheckoutPromoCodePreview | null,
  code: string,
  subtotal: number,
): PromoMinimumIssue | null {
  if (!promo || normalizeCheckoutPromoCode(promo.code) !== code || promo.minimumSpendCents <= 0) {
    return null;
  }

  const subtotalCents = moneyToCents(subtotal);
  const amountNeededCents = promo.minimumSpendCents - subtotalCents;

  if (amountNeededCents <= 0) {
    return null;
  }

  return {
    amountNeededCents,
    code,
    minimumSpendCents: promo.minimumSpendCents,
    subtotalCents,
  };
}

function getCurrentStoredPromoMinimumIssue(
  issue: PromoMinimumIssue | null,
  code: string,
  subtotal: number,
): PromoMinimumIssue | null {
  if (!issue || issue.code !== code || issue.minimumSpendCents <= 0) {
    return null;
  }

  const subtotalCents = moneyToCents(subtotal);
  const amountNeededCents = issue.minimumSpendCents - subtotalCents;

  if (amountNeededCents <= 0) {
    return null;
  }

  return {
    ...issue,
    amountNeededCents,
    subtotalCents,
  };
}

function getPromoMinimumIssueFromOrderError(
  data: {
    amountNeededCents?: number;
    discountCode?: string;
    minimumSpendCents?: number;
    subtotalCents?: number;
  },
  fallbackCode: string,
): PromoMinimumIssue | null {
  const code = normalizeCheckoutPromoCode(data.discountCode || fallbackCode);
  const minimumSpendCents = readCents(data.minimumSpendCents);
  const subtotalCents = readCents(data.subtotalCents);
  const amountNeededCents = readCents(data.amountNeededCents) || Math.max(0, minimumSpendCents - subtotalCents);

  if (!code || minimumSpendCents <= 0 || amountNeededCents <= 0) {
    return null;
  }

  return {
    amountNeededCents,
    code,
    minimumSpendCents,
    subtotalCents,
  };
}

function readCents(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 0;
}

function getUsableScheduledAt(scheduledAt: string, minimumScheduledAt: string) {
  if (!scheduledAt || scheduledAt < minimumScheduledAt) {
    return minimumScheduledAt;
  }

  return scheduledAt;
}

function getRecentOrderSnapshot(
  order: CustomerOrder,
  subtotal: number,
  items: CartItem[],
): CustomerOrder {
  const orderTotal =
    getOrderCheckoutPromoTotal(order) ?? getOrderFirstOrderOfferTotal(order);

  return {
    ...order,
    created_at: order.created_at ?? new Date().toISOString(),
    currency_code: order.currency_code ?? "usd",
    status: order.status ?? "pending",
    total: typeof orderTotal === "number" ? orderTotal : subtotal,
    items: order.items?.length
      ? order.items
      : items.map((item) => {
          const unitPrice = parsePrice(item.price);

          return {
            id: item.id,
            product_title: item.name,
            quantity: item.quantity,
            thumbnail: item.image,
            total: unitPrice * item.quantity,
            unit_price: unitPrice,
            variant_title: item.flavor,
          };
        }),
  };
}

function saveRecentOrder(order: CustomerOrder) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      RECENT_ORDER_STORAGE_KEY,
      JSON.stringify(order),
    );
  } catch {
    // The account page can still refresh orders directly from Medusa.
  }
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(amount);
}

function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}
