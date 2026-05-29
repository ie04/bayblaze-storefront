import Link from "next/link";

export default function HomeFooter() {
  return (
    <footer className="bayblaze-home-footer bg-white">
      <div className="relative flex w-full flex-col items-center justify-center gap-2 px-5 py-3 md:flex-row md:py-2">
        <Link
          href="/"
          aria-label="Bayblaze home"
          className="bayblaze-header-logo shrink-0 text-black transition-colors hover:text-[var(--ast-global-color-0)]"
        >
          BAYBLAZE
        </Link>

        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[13px] font-medium leading-[1.2] text-[#585858] md:absolute md:left-5 md:text-left md:text-[14px]"
        >
          <Link
            href="/privacy-policy"
            className="transition-colors hover:text-[var(--ast-global-color-0)]"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-and-conditions"
            className="transition-colors hover:text-[var(--ast-global-color-0)]"
          >
            Terms &amp; Conditions
          </Link>
        </nav>

        <p className="m-0 text-center text-[13px] font-medium leading-[1.2] text-[#585858] md:absolute md:right-5 md:text-right md:text-[14px]">
          Copyright &copy; 2026 BAYBLAZE LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
