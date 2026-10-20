import Link from "next/link";

export default function HomeFooter() {
  return (
    <footer className="bayblaze-home-footer bg-white">
      <div className="mx-auto grid w-full max-w-[1240px] items-center justify-items-center gap-4 px-5 py-6 xl:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/"
          aria-label="Bayblaze home"
          className="bayblaze-header-logo shrink-0 text-black xl:col-start-2 xl:row-start-1 transition-colors hover:text-[var(--ast-global-color-0)]"
        >
          BAYBLAZE
        </Link>

        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-[13px] font-medium leading-[1.2] text-[#585858] xl:col-start-1 xl:row-start-1 xl:justify-self-start"
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

        <p className="m-0 text-center text-[13px] font-medium leading-[1.2] text-[#585858] xl:col-start-3 xl:row-start-1 xl:text-right">
          Copyright &copy; 2026 BAYBLAZE LLC. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
