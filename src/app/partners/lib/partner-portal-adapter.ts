import "server-only";

import { cache } from "react";

import {
  BayBlazeApiError,
  bayblazeApiRequest,
  getBayBlazeAccountToken,
} from "@/app/lib/bayblaze-account";
import { getBayBlazeAccountFromSession } from "@/app/lib/customer-session";
import type {
  PartnerCommissionStatus,
  PartnerPortalAdapter,
  PartnerPortalData,
  PartnerPortalResult,
  PartnerStatus,
} from "./partner-portal-types";

type PartnerProfileResponse = {
  partner: null | {
    approvedAt: string;
    createdAt: string;
    displayName: string;
    email: string;
    referralCode: string;
    status: PartnerStatus;
    uid: string;
  };
};

type PartnerOverviewResponse = {
  earnings: PartnerPortalData["earnings"];
  eligibilityDays: number;
  metrics: PartnerPortalData["metrics"];
  program: PartnerPortalData["program"];
  referralCode: string;
  referralLink: string;
};

type PartnerReferralsResponse = {
  items: PartnerPortalData["referrals"];
  nextCursor: string | null;
  total: number;
};

type PartnerPayoutsResponse = {
  items: Array<{
    amountCents: number;
    createdAt: string;
    id: string;
    methodLabel: string;
    status: "canceled" | "failed" | "paid" | "processing";
  }>;
  nextCursor: string | null;
  total: number;
};

type PartnerAccountResponse = {
  account: PartnerPortalData["partner"];
};

const productionPartnerAdapter: PartnerPortalAdapter = {
  async getForAccount(account) {
    const token = await getBayBlazeAccountToken();
    if (!token) return { status: "unavailable" };

    const profile = await partnerRequest<PartnerProfileResponse>("/v1/partners/me", token);
    if (!profile.partner) return { status: "not_enrolled" };
    if (profile.partner.status !== "active") return { status: profile.partner.status };

    const [overview, referrals, payouts, partnerAccount] = await Promise.all([
      partnerRequest<PartnerOverviewResponse>("/v1/partners/me/overview", token),
      partnerRequest<PartnerReferralsResponse>("/v1/partners/me/referrals?limit=50", token),
      partnerRequest<PartnerPayoutsResponse>("/v1/partners/me/payouts?limit=50", token),
      partnerRequest<PartnerAccountResponse>("/v1/partners/me/account", token),
    ]);
    const eligibilityDays = overview.eligibilityDays;
    const data: PartnerPortalData = {
      accountUid: account.uid,
      activity: referrals.items.slice(0, 5).map((referral) => ({
        amountCents: referral.earnedCents || undefined,
        date: referral.date,
        detail: `${referral.customerLabel} · ${formatActivityStatus(referral.commissionStatus)}`,
        id: referral.id,
        title: getActivityTitle(referral.commissionStatus),
      })),
      earnings: overview.earnings,
      eligibilityCopy: `Commission becomes available ${eligibilityDays} day${eligibilityDays === 1 ? "" : "s"} after a qualifying completed and paid order. Cancellations, failed payments, chargebacks, and refunds reduce or reverse commission.`,
      metrics: overview.metrics,
      partner: partnerAccount.account,
      payouts: payouts.items.map((payout) => ({
        amountCents: payout.amountCents,
        date: payout.createdAt,
        id: payout.id,
        methodLabel: payout.methodLabel,
        status: payout.status,
      })),
      program: overview.program,
      referralCode: overview.referralCode,
      referralLink: overview.referralLink,
      referrals: referrals.items,
      source: "production",
    };
    return { data, status: "available" };
  },
};

export const getPartnerPortalSession = cache(async (): Promise<PartnerPortalResult | { status: "signed_out" }> => {
  const account = await getBayBlazeAccountFromSession();
  if (!account || account.disabled) return { status: "signed_out" };

  try {
    return await productionPartnerAdapter.getForAccount(account);
  } catch (caught) {
    if (caught instanceof BayBlazeApiError && caught.status === 404) return { status: "not_enrolled" };
    return { status: "unavailable" };
  }
});

async function partnerRequest<T>(path: string, token: string) {
  return bayblazeApiRequest<T>(path, { token });
}

function getActivityTitle(status: PartnerCommissionStatus) {
  if (status === "paid") return "Commission paid";
  if (status === "eligible") return "Commission available";
  if (status === "reversed") return "Commission reversed";
  if (status === "pending") return "Commission pending";
  return "Referral tracked";
}

function formatActivityStatus(status: PartnerCommissionStatus) {
  return status === "eligible" ? "available for payout" : status;
}
