"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/partners/dashboard", label: "Dashboard", shortLabel: "Home" },
  { href: "/partners/dashboard/referrals", label: "Referrals", shortLabel: "Referrals" },
  { href: "/partners/dashboard/payouts", label: "Payouts", shortLabel: "Payouts" },
  { href: "/partners/dashboard/account", label: "Account", shortLabel: "Account" },
];

export default function PartnerPortalNav() {
  const pathname = usePathname();

  return (
    <>
      <nav aria-label="Partner portal" className="hidden border-b-2 border-black bg-white md:block">
        <div className="mx-auto flex max-w-7xl px-6">
          {items.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`border-x border-black px-5 py-3 text-xs font-black uppercase tracking-wider no-underline first:border-l-2 last:border-r-2 ${active ? "bg-black text-white" : "bg-white text-black hover:bg-[var(--ast-global-color-4)]"}`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <nav aria-label="Partner portal" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t-2 border-black bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`flex min-h-14 items-center justify-center border-r border-black px-1 text-[11px] font-black uppercase tracking-wide no-underline last:border-r-0 ${active ? "bg-black text-white" : "text-black"}`}
              href={item.href}
              key={item.href}
            >
              {item.shortLabel}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
