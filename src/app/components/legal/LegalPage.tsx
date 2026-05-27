import Link from "next/link";

import Header from "@/app/components/layout/Header";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  title: string;
  description: string;
  updatedAt: string;
  sections: LegalSection[];
};

export default function LegalPage({
  title,
  description,
  updatedAt,
  sections,
}: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#585858]">
      <Header />

      <section className="border-b-2 border-black bg-white pb-8 pt-[96px] sm:pb-12 sm:pt-[128px]">
        <div className="mx-auto w-full max-w-[980px] px-4 sm:px-5">
          <nav
            aria-label="Breadcrumb"
            className="mb-5 flex flex-wrap items-center gap-2 text-[14px] leading-tight text-[#7a7a7a] sm:text-[15px]"
          >
            <Link
              className="text-black transition-colors hover:text-[var(--ast-global-color-0)]"
              href="/"
            >
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <span>{title}</span>
          </nav>

          <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-[var(--ast-global-color-0)]">
            Bayblaze legal
          </p>
          <h1 className="bayblaze-auth-title mt-2 text-black">{title}</h1>
          <p className="mt-4 max-w-[720px] text-[17px] font-medium leading-[1.55] text-black sm:text-[21px]">
            {description}
          </p>
          <p className="mt-4 text-[14px] font-semibold leading-tight text-[#6b6b6b]">
            Last updated: {updatedAt}
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[980px] px-4 py-8 sm:px-5 sm:py-10">
        <div className="grid gap-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className="border border-[#d0d0d0] bg-white p-5 sm:p-6"
            >
              <h2 className="mb-3 text-[21px] font-semibold leading-tight text-black sm:text-[24px]">
                {section.title}
              </h2>
              <div className="grid gap-3 text-[16px] leading-[1.65] sm:text-[17px]">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
