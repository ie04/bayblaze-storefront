export type PartnerCommissionStatus = "available" | "paid" | "pending" | "reversed";
export type PartnerOrderStatus = "cancelled" | "completed" | "delivered" | "processing";
export type PartnerPayoutStatus = "failed" | "paid" | "processing";

export type PartnerReferral = {
  commissionStatus: PartnerCommissionStatus;
  customerLabel: string;
  date: string;
  earnedCents: number;
  id: string;
  orderStatus: PartnerOrderStatus;
  orderTotalCents: number;
};

export type PartnerPayout = {
  amountCents: number;
  date: string;
  id: string;
  methodLabel: string;
  status: PartnerPayoutStatus;
};

export type PartnerPortalData = {
  accountUid: string;
  activity: Array<{
    amountCents?: number;
    date: string;
    detail: string;
    id: string;
    title: string;
  }>;
  earnings: {
    availableCents: number;
    lifetimeCents: number;
    pendingCents: number;
  };
  eligibilityCopy: string;
  metrics: {
    clicks: number;
    completedOrders: number;
    referredCustomers: number;
  };
  partner: {
    displayName: string;
    email: string;
    joinedAt: string;
    payoutMethodLabel: string;
    payoutStatus: "not_set" | "ready";
    status: "active" | "paused";
  };
  payouts: PartnerPayout[];
  program: {
    commissionPercent: number;
    discountPercent: number;
    minimumPurchaseCents: number;
  };
  referralCode: string;
  referralLink: string;
  referrals: PartnerReferral[];
  source: "mock" | "production";
};

export type PartnerPortalResult =
  | { data: PartnerPortalData; status: "available" }
  | { status: "not_enrolled" }
  | { status: "unavailable" };

export interface PartnerPortalAdapter {
  getForAccount(input: {
    displayName: string;
    email: string;
    uid: string;
  }): Promise<PartnerPortalResult>;
}
