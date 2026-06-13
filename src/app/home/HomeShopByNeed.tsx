import Link from "next/link";

const needCards = [
  {
    key: "vapes",
    title: "Vapes",
    icon: "💨",
    href: "/shop?q=Vapes",
  },
  {
    key: "zyns",
    title: "ZYNs",
    icon: "🧊",
    href: "/shop?q=ZYNs",
  },
  {
    key: "wraps",
    title: "Wraps",
    icon: "📜",
    href: "/shop?q=Wraps",
  },
  {
    key: "accessories",
    title: "Accessories",
    icon: "🔥",
    href: "/shop?q=Accessories",
  },
  {
    key: "deals",
    title: "Deals",
    icon: "🏷️",
    href: "/shop?q=Deals",
  },
  {
    key: "check-delivery",
    title: "Check Delivery",
    icon: "⚡",
    href: "/orders",
  },
];

export default function HomeShopByNeed() {
  return (
    <section className="border-b-2 border-black bg-[var(--ast-global-color-4)] font-[var(--font-jost)]">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-12 sm:px-5 sm:py-16">
        <div className="mb-6 border-b-2 border-black pb-5 sm:mb-8">
          <p className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.16em] text-[var(--ast-global-color-1)]">
            Pick a need
          </p>

          <h2 className="bayblaze-section-heading">
            Tell Us What You Need
          </h2>

          <p className="mt-3 max-w-[620px] text-[16px] font-medium leading-[1.55] text-[#585858] sm:text-[18px]">
            Tell us what you&apos;re after — we&apos;ll show what&apos;s ready to go.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {needCards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="group flex min-h-[132px] flex-col items-center justify-center gap-3 border-2 border-black bg-white p-3 text-center font-[var(--font-jost)] text-black no-underline transition-colors hover:bg-black hover:text-white sm:min-h-0 sm:flex-row sm:justify-start sm:gap-4 sm:p-5 sm:text-left"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center border-2 border-black bg-[var(--ast-global-color-4)] text-2xl transition-colors group-hover:bg-[var(--ast-global-color-0)] sm:h-14 sm:w-14">
                {card.icon}
              </div>

              <div className="min-w-0 sm:flex-1">
                <div className="text-center text-sm font-bold uppercase leading-tight tracking-wide sm:text-left sm:text-lg">
                  {card.title}
                </div>

              </div>

              <ArrowRightIcon />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
