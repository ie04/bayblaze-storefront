"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

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
  const [error, setError] = useState(searchParams.get("oauth_error") ?? "");
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

  function resetMessages() {
    setError("");
    setNotice("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetMessages();
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
    <div className="px-4 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-[520px]">
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex flex-wrap items-center gap-2 text-[13px] font-bold uppercase tracking-widest text-[#585858]"
        >
          <Link
            className="text-black no-underline transition-colors hover:text-[var(--ast-global-color-0)]"
            href="/"
          >
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span>{mode === "login" ? "Login" : "Register"}</span>
        </nav>

        <section
          aria-labelledby="bayblaze-auth-heading"
          className="border-2 border-black bg-white p-5 shadow-[6px_6px_0_#000] sm:p-8"
        >
          <h1
            id="bayblaze-auth-heading"
            className="mb-6 text-center text-4xl font-black uppercase leading-none text-black sm:text-5xl"
          >
            Sign In
          </h1>

          {!isVerifyingRegistration ? (
            <div className="mb-6 grid grid-cols-2 border-2 border-black bg-white">
              <button
                type="button"
                aria-pressed={mode === "login"}
                className={`h-12 border-r-2 border-black text-[14px] font-extrabold uppercase tracking-widest transition-colors ${
                  mode === "login"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-[var(--ast-global-color-4)]"
                }`}
                onClick={() => {
                  setMode("login");
                  resetMessages();
                  setVerificationEmail("");
                }}
              >
                Login
              </button>

              <button
                type="button"
                aria-pressed={mode === "register"}
                className={`h-12 text-[14px] font-extrabold uppercase tracking-widest transition-colors ${
                  mode === "register"
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-[var(--ast-global-color-4)]"
                }`}
                onClick={() => {
                  setMode("register");
                  resetMessages();
                }}
              >
                Register
              </button>
            </div>
          ) : null}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {isVerifyingRegistration ? (
              <div className="space-y-5">
                <div className="border-2 border-black bg-[var(--ast-global-color-4)] p-5">
                  <p className="text-[13px] font-extrabold uppercase tracking-[0.16em] text-[var(--ast-global-color-1)]">
                    Verify email
                  </p>
                  <h2 className="mt-2 text-3xl font-black uppercase leading-none text-black">
                    Enter your code
                  </h2>
                  <p className="mt-3 text-[15px] font-medium leading-[1.6] text-[#585858]">
                    We sent a 6-digit code to{" "}
                    <span className="font-bold text-black">{verificationEmail}</span>.
                  </p>
                </div>

                <label className="block text-[13px] font-extrabold uppercase tracking-widest text-black">
                  Verification code
                  <input
                    required
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={form.code}
                    className="bayblaze-sharp-input mt-2 h-12 text-center text-[18px] font-bold tracking-[0.2em]"
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
                  className="text-[13px] font-extrabold uppercase tracking-widest text-[#585858] transition-colors hover:text-black"
                  onClick={() => {
                    setVerificationEmail("");
                    setForm((current) => ({ ...current, code: "" }));
                    resetMessages();
                  }}
                >
                  Change email
                </button>
              </div>
            ) : (
              <>
                {mode === "register" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <AuthInput
                      label="First name"
                      autoComplete="given-name"
                      value={form.firstName}
                      onChange={(value) => updateField("firstName", value)}
                    />

                    <AuthInput
                      label="Last name"
                      autoComplete="family-name"
                      value={form.lastName}
                      onChange={(value) => updateField("lastName", value)}
                    />
                  </div>
                ) : null}

                <AuthInput
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(value) => updateField("email", value)}
                />

                <AuthInput
                  label="Password"
                  type="password"
                  minLength={6}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={form.password}
                  onChange={(value) => updateField("password", value)}
                />
              </>
            )}

            <p
              aria-live="polite"
              className="min-h-6 border-2 border-transparent text-[14px] font-bold text-red-700"
            >
              {error}
            </p>

            {notice ? (
              <p
                aria-live="polite"
                className="-mt-3 border-2 border-black bg-[var(--ast-global-color-4)] px-3 py-2 text-[14px] font-bold text-[var(--ast-global-color-1)]"
              >
                {notice}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bayblaze-sharp-button bayblaze-sharp-button--primary flex h-[52px] w-full items-center justify-center text-center disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting
                ? mode === "login"
                  ? "Signing in..."
                  : verificationEmail
                    ? "Verifying..."
                    : "Sending code..."
                : mode === "login"
                  ? "Sign in"
                  : verificationEmail
                    ? "Verify & create account"
                    : "Create account"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function AuthInput({
  label,
  type = "text",
  autoComplete,
  minLength,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-[13px] font-extrabold uppercase tracking-widest text-black">
      {label}
      <input
        required
        type={type}
        autoComplete={autoComplete}
        minLength={minLength}
        value={value}
        className="bayblaze-sharp-input mt-2 h-12 text-[16px] font-medium normal-case tracking-normal"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
