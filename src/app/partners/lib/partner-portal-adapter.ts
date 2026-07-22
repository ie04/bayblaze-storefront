import "server-only";

import { cache } from "react";

import { getBayBlazeAccountFromSession } from "@/app/lib/customer-session";
import type {
  PartnerPortalAdapter,
  PartnerPortalData,
  PartnerPortalResult,
} from "./partner-portal-types";

const storefrontUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bayblaze.net").replace(/\/$/, "");

const mockPartnerAdapter: PartnerPortalAdapter = {
  async getForAccount(account) {
    if (!canUseMockPortal(account)) {
      return { status: "not_enrolled" };
    }

    return {
      data: buildMockData(account),
      status: "available",
    };
  },
};

export const getPartnerPortalSession = cache(async (): Promise<PartnerPortalResult | { status: "signed_out" }> => {
  const account = await getBayBlazeAccountFromSession();

  if (!account || account.disabled) {
    return { status: "signed_out" };
  }

  return mockPartnerAdapter.getForAccount(account);
});

function canUseMockPortal(account: { email: string; uid: string }) {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const allowed = (process.env.BAYBLAZE_PARTNER_PORTAL_MOCK_ACCOUNTS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowed.includes(account.uid.toLowerCase()) || allowed.includes(account.email.toLowerCase());
}

function buildMockData(account: {
  displayName: string;
  email: string;
  uid: string;
}): PartnerPortalData {
  const code = `LOCAL${stableCode(account.uid)}`;

  return {
    accountUid: account.uid,
    activity: [
      {
        amountCents: 2160,
        date: "2026-07-20T18:15:00.000Z",
        detail: "Tampa customer · order delivered",
        id: "activity-1",
        title: "Commission earned",
      },
      {
        date: "2026-07-19T21:42:00.000Z",
        detail: "A new shopper used your link",
        id: "activity-2",
        title: "New referral",
      },
      {
        amountCents: 1485,
        date: "2026-07-17T16:08:00.000Z",
        detail: "St. Petersburg customer · eligibility hold",
        id: "activity-3",
        title: "Commission pending",
      },
    ],
    earnings: {
      availableCents: 8640,
      lifetimeCents: 23785,
      pendingCents: 5125,
    },
    eligibilityCopy:
      "Demo policy: commission stays pending until the order is delivered, then becomes available after a 7-day review window. Cancelled or refunded orders do not earn commission.",
    metrics: {
      clicks: 284,
      completedOrders: 17,
      referredCustomers: 13,
    },
    partner: {
      displayName: account.displayName || account.email.split("@")[0] || "BayBlaze Partner",
      email: account.email,
      joinedAt: "2026-04-12T00:00:00.000Z",
      payoutMethodLabel: "Not connected",
      payoutStatus: "not_set",
      status: "active",
    },
    payouts: [
      {
        amountCents: 8020,
        date: "2026-07-01T14:00:00.000Z",
        id: "payout-1",
        methodLabel: "ACH ···· 1842",
        status: "paid",
      },
      {
        amountCents: 5125,
        date: "2026-06-03T14:00:00.000Z",
        id: "payout-2",
        methodLabel: "ACH ···· 1842",
        status: "paid",
      },
    ],
    program: {
      commissionPercent: 30,
      discountPercent: 20,
      minimumPurchaseCents: 2500,
    },
    referralCode: code,
    referralLink: `${storefrontUrl}/?promo=${encodeURIComponent(code)}`,
    referrals: [
      {
        commissionStatus: "pending",
        customerLabel: "Customer ··7K2",
        date: "2026-07-21T20:14:00.000Z",
        earnedCents: 1485,
        id: "ref-1",
        orderStatus: "processing",
        orderTotalCents: 4950,
      },
      {
        commissionStatus: "available",
        customerLabel: "Customer ··2M8",
        date: "2026-07-20T18:15:00.000Z",
        earnedCents: 2160,
        id: "ref-2",
        orderStatus: "delivered",
        orderTotalCents: 7200,
      },
      {
        commissionStatus: "available",
        customerLabel: "Customer ··9P4",
        date: "2026-07-14T23:06:00.000Z",
        earnedCents: 1770,
        id: "ref-3",
        orderStatus: "completed",
        orderTotalCents: 5900,
      },
      {
        commissionStatus: "reversed",
        customerLabel: "Customer ··4R1",
        date: "2026-07-08T15:31:00.000Z",
        earnedCents: 0,
        id: "ref-4",
        orderStatus: "cancelled",
        orderTotalCents: 3800,
      },
      {
        commissionStatus: "paid",
        customerLabel: "Customer ··6V5",
        date: "2026-07-02T19:22:00.000Z",
        earnedCents: 2430,
        id: "ref-5",
        orderStatus: "delivered",
        orderTotalCents: 8100,
      },
    ],
    source: "mock",
  };
}

function stableCode(value: string) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash.toString(36).toUpperCase().padStart(5, "0").slice(0, 5);
}
