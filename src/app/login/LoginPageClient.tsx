"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type AuthMode = "login" | "register";

type FormState = {
  code: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

const initialFormState: FormState = {
  code: "",
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
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const isVerifyingRegistration = mode === "register" && Boolean(verificationEmail);

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
    setNotice("");
    setIsSubmitting(true);

    const endpoint =
      mode === "login"
        ? "/api/auth/login"
        : isVerifyingRegistration
          ? "/api/auth/register"
          : "/api/auth/register/start";
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
            ...(isVerifyingRegistration ? { code: form.code } : {}),
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

      if (mode === "register" && !isVerifyingRegistration) {
        setVerificationEmail(form.email.trim().toLowerCase());
        setNotice("We sent a 6-digit code to your email.");
        return;
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
    <div className="bayblaze-auth-page pb-14 pt-[92px] sm:pb-20 sm:pt-[112px]">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-5">
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

        <section className="bayblaze-auth-section grid gap-7 px-4 py-7 sm:gap-10 sm:px-7 sm:py-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(420px,0.64fr)] lg:items-center">
          <div>
            <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.22em] text-[var(--ast-global-color-1)]">
              Bayblaze Account
            </p>
            <h1 className="bayblaze-auth-title text-black">
              {mode === "login"
                ? "Welcome back."
                : isVerifyingRegistration
                  ? "Check your email."
                  : "Create your account."}
            </h1>
            <p className="mt-4 max-w-[560px] text-[16px] leading-[1.65] text-[#585858] sm:mt-5 sm:text-[18px] sm:leading-[1.75]">
              {mode === "login"
                ? "Sign in to manage your Bayblaze details and keep checkout moving."
                : isVerifyingRegistration
                  ? "Enter the 6-digit code we sent before creating your account."
                  : "Register once, then use your account for future Bayblaze orders."}
            </p>
          </div>

          <div className="bayblaze-soft-card bayblaze-soft-card--tint p-4 sm:p-7">
            {!isVerifyingRegistration ? (
              <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-[#d8e2d2] bg-white p-1 sm:mb-7">
                <button
                  type="button"
                  aria-pressed={mode === "login"}
                  className={`h-12 rounded-full text-[15px] font-semibold transition-colors ${
                    mode === "login"
                      ? "bg-[var(--ast-global-color-1)] text-white shadow-[0_8px_18px_rgba(44,84,29,0.16)]"
                      : "text-black hover:bg-[#f6f8f5]"
                  }`}
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setNotice("");
                    setVerificationEmail("");
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  aria-pressed={mode === "register"}
                  className={`h-12 rounded-full text-[15px] font-semibold transition-colors ${
                    mode === "register"
                      ? "bg-[var(--ast-global-color-1)] text-white shadow-[0_8px_18px_rgba(44,84,29,0.16)]"
                      : "text-black hover:bg-[#f6f8f5]"
                  }`}
                  onClick={() => {
                    setMode("register");
                    setError("");
                    setNotice("");
                  }}
                >
                  Register
                </button>
              </div>
            ) : null}

            <form className="space-y-5" onSubmit={handleSubmit}>
              {isVerifyingRegistration ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[var(--ast-global-color-1)]">
                      Verify email
                    </p>
                    <h2 className="mt-2 text-[24px] font-semibold leading-tight text-black sm:text-[28px]">
                      Enter your code
                    </h2>
                    <p className="mt-3 text-[15px] leading-[1.6] text-[#585858] sm:text-[16px]">
                      We sent a 6-digit code to{" "}
                      <span className="font-semibold text-black">
                        {verificationEmail}
                      </span>
                      .
                    </p>
                  </div>

                  <label className="block text-[14px] font-semibold text-black">
                    Verification code
                    <input
                      required
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={form.code}
                      className="bayblaze-soft-input mt-2 h-12 w-full px-4 text-center text-[18px] font-semibold tracking-[0.2em] text-black outline-none"
                      onChange={(event) =>
                        updateField(
                          "code",
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#585858] transition-colors hover:text-black"
                    onClick={() => {
                      setVerificationEmail("");
                      setForm((current) => ({ ...current, code: "" }));
                      setError("");
                      setNotice("");
                    }}
                  >
                    Change email
                  </button>
                </div>
              ) : (
                <>
                  {mode === "register" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-[14px] font-semibold text-black">
                        First name
                        <input
                          required
                          autoComplete="given-name"
                          value={form.firstName}
                          className="bayblaze-soft-input mt-2 h-12 w-full px-4 text-[16px] font-normal text-black outline-none"
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
                          className="bayblaze-soft-input mt-2 h-12 w-full px-4 text-[16px] font-normal text-black outline-none"
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
                      className="bayblaze-soft-input mt-2 h-12 w-full px-4 text-[16px] font-normal text-black outline-none"
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
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
                      className="bayblaze-soft-input mt-2 h-12 w-full px-4 text-[16px] font-normal text-black outline-none"
                      onChange={(event) =>
                        updateField("password", event.target.value)
                      }
                    />
                  </label>
                </>
              )}

              <p
                aria-live="polite"
                className="min-h-6 text-[14px] font-semibold text-red-700"
              >
                {error}
              </p>
              {notice ? (
                <p
                  aria-live="polite"
                  className="-mt-3 text-[14px] font-semibold text-[var(--ast-global-color-1)]"
                >
                  {notice}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="bayblaze-hero-button bayblaze-soft-button bayblaze-soft-button--primary flex h-[50px] w-full items-center justify-center px-5 text-center disabled:cursor-not-allowed disabled:opacity-70 sm:h-[52px] sm:px-7"
              >
                {isSubmitting
                  ? mode === "login"
                    ? "Signing in..."
                    : verificationEmail
                      ? "Verifying..."
                      : "Sending code..."
                  : mode === "login"
                    ? "SIGN IN"
                    : verificationEmail
                      ? "VERIFY & CREATE ACCOUNT"
                      : "CREATE ACCOUNT"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
