import type { Metadata } from "next";
import { Suspense } from "react";

import Header from "@/app/components/layout/Header";
import LoginPageClient from "./LoginPageClient";

export const metadata: Metadata = {
  title: "Login | Bayblaze",
  description: "Sign in or create a Bayblaze account.",
};

export default function Page() {
  return (
    <main className="min-h-screen bg-[#f7f6f2]">
      <Header surface="solid" />
      <Suspense
        fallback={
          <div className="bayblaze-auth-page pb-20 pt-[112px]">
            <div className="mx-auto w-full max-w-[1180px] px-5">
              <div className="bayblaze-sharp-card h-[560px]" />
            </div>
          </div>
        }
      >
        <LoginPageClient />
      </Suspense>
    </main>
  );
}
