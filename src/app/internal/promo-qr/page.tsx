import type { Metadata } from "next";

import PromoQrGenerator from "./PromoQrGenerator";

export const metadata: Metadata = {
  title: "Promo QR Generator | Bayblaze",
};

type PromoQrPageSearchParams = {
  token?: string | string[];
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bayblaze.net";
const internalToolsToken = process.env.INTERNAL_PROMO_TOOLS_TOKEN?.trim() ?? "";

export default async function PromoQrPage({
  searchParams,
}: {
  searchParams: Promise<PromoQrPageSearchParams>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const isAuthorized = !internalToolsToken || token === internalToolsToken;

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-[var(--ast-global-color-4)] px-4 py-12 text-black sm:px-6">
        <section className="mx-auto grid w-full max-w-[520px] gap-5 border-2 border-black bg-white p-6 shadow-[8px_8px_0_rgba(0,0,0,0.12)] sm:p-8">
          <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--ast-global-color-1)]">
            Internal
          </p>
          <h1 className="text-[30px] font-semibold leading-tight sm:text-[38px]">
            Promo QR Generator
          </h1>
          <p className="text-[16px] font-medium leading-[1.6] text-[#585858]">
            Add the internal tools token to open this page.
          </p>
        </section>
      </main>
    );
  }

  return <PromoQrGenerator siteUrl={siteUrl} />;
}
