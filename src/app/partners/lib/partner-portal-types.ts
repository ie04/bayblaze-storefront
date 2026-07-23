export type PartnerCommissionStatus = "eligible" | "paid" | "pending" | "reversed" | "tracked";
export type PartnerOrderStatus = "cancelled" | "completed" | "delivered" | "historical" | "processing" | "refunded";
export type PartnerPayoutStatus = "canceled" | "failed" | "paid" | "processing";
export type PartnerStatus = "active" | "pending" | "rejected" | "suspended";

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
    status: PartnerStatus;
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
  source: "production";
};

export type PartnerPortalResult =
  | { data: PartnerPortalData; status: "available" }
  | { status: "pending" | "rejected" | "suspended" }
  | { status: "not_enrolled" }
  | { status: "unavailable" };

export interface PartnerPortalAdapter {
  getForAccount(input: {
    displayName: string;
    email: string;
    uid: string;
  }): Promise<PartnerPortalResult>;
}
