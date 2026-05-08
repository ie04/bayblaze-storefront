import Link from "next/link";

export default function HomeFooter() {
  return (
    <footer className="bayblaze-home-footer bg-white">
      <div className="relative flex w-full items-center justify-center px-5 py-2">
        <Link
          href="/"
          aria-label="Bayblaze home"
          className="bayblaze-header-logo shrink-0 text-black transition-colors hover:text-[var(--ast-global-color-0)]"
        >
          BAYBLAZE
        </Link>

        <p className="absolute bottom-2 right-5 hidden text-right text-[14px] leading-[1.2] text-[#585858] md:block">
          Copyright &copy; 2026 BAYBLAZE LLC. All rights reserved.
        </p>
      </div>

      <p className="px-5 pb-2 text-center text-[14px] leading-[1.2] text-[#585858] md:hidden">
        Copyright &copy; 2026 BAYBLAZE LLC. All rights reserved.
      </p>
    </footer>
  );
}
