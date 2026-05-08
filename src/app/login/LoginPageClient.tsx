"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type AuthMode = "login" | "register";

type FormState = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

const initialFormState: FormState = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
};

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("login");
  const [form, setForm] = useState<FormState>(initialFormState);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    const requestedRedirect = searchParams.get("redirect");

    if (requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")) {
      return requestedRedirect;
    }

    return "/account";
  }, [searchParams]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login"
        ? {
            email: form.email,
            password: form.password,
          }
        : {
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
          };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(
          data?.message || "We could not complete that request. Please try again.",
        );
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We could not complete that request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bayblaze-auth-page bg-white pb-20 pt-[112px]">
      <div className="mx-auto w-full max-w-[1180px] px-5">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-[14px] leading-none text-[#7a7a7a]"
        >
          <Link
            className="text-black transition-colors hover:text-[var(--ast-global-color-0)]"
            href="/"
          >
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span>{mode === "login" ? "Login" : "Register"}</span>
        </nav>

        <section className="grid gap-10 border-y-2 border-black py-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(420px,0.64fr)] lg:items-center">
          <div>
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.22em] text-[var(--ast-global-color-1)]">
              Bayblaze Account
            </p>
            <h1 className="bayblaze-auth-title text-black">
              {mode === "login" ? "Welcome back." : "Create your account."}
            </h1>
            <p className="mt-5 max-w-[560px] text-[18px] leading-[1.75] text-[#585858]">
              {mode === "login"
                ? "Sign in to manage your Bayblaze details and keep checkout moving."
                : "Register once, then use your account for future Bayblaze orders."}
            </p>
          </div>

          <div className="border border-[#d9d9d9] bg-white p-5 shadow-[8px_8px_0_#000] sm:p-7">
            <div className="mb-7 grid grid-cols-2 border border-black">
              <button
                type="button"
                aria-pressed={mode === "login"}
                className={`h-12 text-[15px] font-semibold transition-colors ${
                  mode === "login"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-[#f6f8f5]"
                }`}
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Login
              </button>
              <button
                type="button"
                aria-pressed={mode === "register"}
                className={`h-12 border-l border-black text-[15px] font-semibold transition-colors ${
                  mode === "register"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-[#f6f8f5]"
                }`}
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Register
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {mode === "register" && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-[14px] font-semibold text-black">
                    First name
                    <input
                      required
                      autoComplete="given-name"
                      value={form.firstName}
                      className="mt-2 h-12 w-full border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black"
                      onChange={(event) =>
                        updateField("firstName", event.target.value)
                      }
                    />
                  </label>

                  <label className="block text-[14px] font-semibold text-black">
                    Last name
                    <input
                      required
                      autoComplete="family-name"
                      value={form.lastName}
                      className="mt-2 h-12 w-full border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black"
                      onChange={(event) =>
                        updateField("lastName", event.target.value)
                      }
                    />
                  </label>
                </div>
              )}

              <label className="block text-[14px] font-semibold text-black">
                Email
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  className="mt-2 h-12 w-full border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black"
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </label>

              <label className="block text-[14px] font-semibold text-black">
                Password
                <input
                  required
                  type="password"
                  minLength={6}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={form.password}
                  className="mt-2 h-12 w-full border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black"
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                />
              </label>

              <p
                aria-live="polite"
                className="min-h-6 text-[14px] font-semibold text-red-700"
              >
                {error}
              </p>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bayblaze-hero-button flex h-[52px] w-full items-center justify-center bg-[var(--ast-global-color-0)] px-7 text-center text-white transition-colors hover:bg-[var(--ast-global-color-1)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? mode === "login"
                    ? "Signing in..."
                    : "Creating account..."
                  : mode === "login"
                    ? "Sign In"
                    : "Create Account"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
