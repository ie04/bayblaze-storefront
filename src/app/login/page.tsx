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
            <div className="mx-auto w-full max-w-5xl">
              <div className="grid min-h-[560px] border-2 border-black bg-white lg:grid-cols-[0.42fr_0.58fr]">
                <div className="hidden border-r-2 border-black bg-[var(--ast-global-color-4)] lg:block" />
                <div className="p-6 sm:p-8">
                  <div className="h-full border-2 border-black bg-[var(--ast-global-color-4)]" />
                </div>
              </div>
            </div>
          </div>
        }
      >
        <LoginPageClient />
      </Suspense>
    </main>
  );
}
