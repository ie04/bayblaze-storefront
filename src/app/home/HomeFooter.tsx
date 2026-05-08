import Image from "next/image";
import Link from "next/link";

export default function HomeFooter() {
  return (
    <footer className="bayblaze-home-footer bg-white">
      <div className="relative flex w-full items-center justify-center px-5 py-2">
        <Link href="/" aria-label="Bayblaze home" className="shrink-0">
          <Image
            src="https://bayblaze.net/wp-content/uploads/2026/03/bayblaze_nameonly-1.png"
            alt="Bayblaze"
            width={354}
            height={124}
            sizes="96px"
            className="h-auto w-24"
          />
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