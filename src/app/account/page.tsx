import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import Header from "@/app/components/layout/Header";
import {
  ShieldCheckLineIcon,
  TruckLineIcon,
  UserLineIcon,
} from "@/app/components/icons/SharpIcons";
import { getCustomerToken } from "@/app/lib/customer-session";
import {
  retrieveCustomer,
  retrieveCustomerOrders,
  type Customer,
  type CustomerOrder,
} from "@/app/lib/medusa-auth";
import AccountOrdersSection from "./AccountOrdersSection";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = {
  title: "Account | BayBlaze",
  description: "Manage your BayBlaze account.",
};

export default async function Page() {
  const token = await getCustomerToken();

  if (!token) {
    redirect("/login?redirect=/account");
  }

  let customer: Customer;
  let orders: CustomerOrder[] = [];

  try {
    [customer, orders] = await Promise.all([
      retrieveCustomer(token),
      retrieveCustomerOrders(token).catch(() => []),
    ]);
  } catch {
    redirect("/login?redirect=/account");
  }

  const displayName =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.email;

  const firstName = customer.first_name || displayName.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-[var(--ast-global-color-4)] font-[var(--font-jost)] text-black">
      <Header surface="solid" />

      <div className="bayblaze-account-page pb-14 text-black sm:pb-20">
        <section className="border-b-2 border-black bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
            <nav
              aria-label="Breadcrumb"
              className="mb-5 flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#585858]"
            >
              <Link
                className="text-[#585858] no-underline transition-colors hover:text-black"
                href="/"
              >
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <span>Account</span>
            </nav>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--ast-global-color-1)]">
                  BayBlaze Account
                </p>
                <h1 className="mt-1 text-4xl font-black uppercase leading-none sm:text-5xl lg:text-6xl">
                  Hey,{" "}
                  <span className="text-[var(--ast-global-color-1)]">
                    {firstName}.
                  </span>
                </h1>
                <p className="mt-2 max-w-xl text-sm font-medium leading-[1.65] text-[#585858] sm:text-base">
                  Manage orders, account details, and delivery readiness from one place.
                </p>
              </div>

              <LogoutButton />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-6">
            <aside className="space-y-4">
              <article className="bayblaze-sharp-card bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center border-2 border-black bg-[var(--ast-global-color-4)] text-black">
                    <UserLineIcon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#585858]">
                      Signed in as
                    </p>
                    <h2 className="mt-1 text-xl font-black uppercase leading-tight text-black">
                      {displayName}
                    </h2>
                    <p className="mt-1 break-words text-sm font-medium leading-[1.45] text-[#585858]">
                      {customer.email}
                    </p>
                  </div>
                </div>
              </article>

              <article className="bayblaze-sharp-card bg-white p-5">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--ast-global-color-1)]">
                  Profile
                </h2>

                <dl className="mt-4 space-y-4 text-sm leading-[1.55]">
                  <div className="border-b-2 border-black pb-3">
                    <dt className="font-bold uppercase tracking-wider text-black">
                      Name
                    </dt>
                    <dd className="mt-1 font-medium text-[#585858]">
                      {displayName}
                    </dd>
                  </div>

                  <div className={customer.phone ? "border-b-2 border-black pb-3" : ""}>
                    <dt className="font-bold uppercase tracking-wider text-black">
                      Email
                    </dt>
                    <dd className="mt-1 break-words font-medium text-[#585858]">
                      {customer.email}
                    </dd>
                  </div>

                  {customer.phone ? (
                    <div>
                      <dt className="font-bold uppercase tracking-wider text-black">
                        Phone
                      </dt>
                      <dd className="mt-1 font-medium text-[#585858]">
                        {customer.phone}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </article>

              <article className="bayblaze-sharp-card bg-white p-5">
                <div className="flex items-start gap-3">
                  <TruckLineIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ast-global-color-0)]" />
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-black">
                      Delivery
                    </h2>
                    <p className="mt-1 text-sm font-medium leading-[1.55] text-[#585858]">
                      No saved delivery details yet. Your driver verifies the address
                      and order details at dispatch.
                    </p>
                  </div>
                </div>
              </article>

              <article className="bayblaze-sharp-card bg-[var(--ast-global-color-4)] p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheckLineIcon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--ast-global-color-0)]" />
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-black">
                      21+ required
                    </h2>
                    <p className="mt-1 text-sm font-bold leading-[1.55] text-black">
                      Have a valid government-issued ID ready at delivery.
                    </p>
                  </div>
                </div>
              </article>
            </aside>

            <AccountOrdersSection initialOrders={orders} />
          </div>
        </section>
      </div>
    </main>
  );
}
