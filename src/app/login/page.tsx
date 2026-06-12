import type { Metadata } from "next";
import { Suspense } from "react";

import Header from "@/app/components/layout/Header";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Login | BayBlaze",
  description: "Sign in or create a BayBlaze account.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[var(--ast-global-color-4)] font-[var(--font-jost)] text-black">
      <Header surface="solid" />

      <Suspense
        fallback={
          <div className="px-4 py-10 sm:px-6 sm:py-16">
            <div className="mx-auto h-[520px] w-full max-w-[520px] border-2 border-black bg-white" />
          </div>
        }
      >
        <LoginPageClient />
      </Suspense>
    </main>
  );
}
