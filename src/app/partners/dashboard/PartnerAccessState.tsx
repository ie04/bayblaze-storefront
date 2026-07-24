import Link from "next/link";

export default function PartnerAccessState({ status }: { status: "not_enrolled" | "pending" | "rejected" | "suspended" | "unavailable" }) {
  const content = {
    not_enrolled: {
      copy: "This BayBlaze account is not enrolled in the local partner program yet.",
      title: "Create your partner account.",
    },
    pending: {
      copy: "Your partner account is created. BayBlaze still needs to attach your coupon code before referral tracking and dashboard metrics go live.",
      title: "Coupon code setup needed.",
    },
    rejected: {
      copy: "Your partner account is created and waiting for BayBlaze to assign your coupon code. Hang tight; your dashboard will open once the code is active.",
      title: "Coupon code coming soon.",
    },
    suspended: {
      copy: "Partner access and new attribution are paused. Existing financial records remain preserved and can be reviewed with BayBlaze.",
      title: "Partner access paused.",
    },
    unavailable: {
      copy: "Partner information could not be loaded right now. Your account and earnings records were not changed.",
      title: "Portal temporarily unavailable.",
    },
  }[status];

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6">
      <div className="bayblaze-sharp-card bg-white p-7 sm:p-9">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ast-global-color-1)]">BayBlaze Partners</p>
        <h1 className="mt-2 text-3xl font-black uppercase leading-none sm:text-4xl">{content.title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-[1.6] text-[#585858]">{content.copy}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          {status === "not_enrolled" ? <Link className="bayblaze-sharp-button bayblaze-sharp-button--primary" href="/partners/application">Create Partner Account</Link> : null}
          {status === "rejected" || status === "pending" ? null : <Link className="bayblaze-sharp-button bayblaze-sharp-button--outline" href="/contact">Contact BayBlaze</Link>}
        </div>
      </div>
    </section>
  );
}
