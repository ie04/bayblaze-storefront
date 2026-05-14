const infoItems = [
  {
    title: "Tampa Bay Smoke Shop",
    description:
      "Vapes, ZYNs, wraps, cones, lighters, and everyday essentials ready for local delivery.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Blazing Fast Delivery",
    description:
      "Local orders are delivered across Tampa Bay within an hour, 24/7.",
    icon: TruckIcon,
  },
  {
    title: "Order in Minutes",
    description:
      "Browse, check out, and pay when your order arrives. Just have your 21+ ID ready.",
    icon: LightningIcon,
  },
];

export default function HomeInfoStrip() {
  return (
    <section
      id="why-bayblaze"
      className="bayblaze-info-strip"
      aria-label="Why choose Bayblaze"
    >
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-5">
        <div className="bayblaze-info-strip-grid">
          {infoItems.map(({ title, description, icon: Icon }) => (
            <div key={title} className="bayblaze-info-strip-item">
              <div className="bayblaze-info-strip-icon" aria-hidden="true">
                <Icon />
              </div>

              <div className="bayblaze-info-strip-text">
                <strong>{title}</strong>
                <span>{description}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ShieldCheckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      <path d="m13 2-10 12h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
