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

const loginWirePaths = [
  {
    accent: "light",
    d: "M 560 236 H 392 V 204 H 344 V 176 H 282 V 144 H 210 V 112 H 126 V 86 H 0",
  },
  {
    accent: "main",
    d: "M 560 282 H 382 V 316 H 316 V 348 H 252 V 382 H 174 V 414 H 84 V 448 H 0",
  },
  {
    accent: "dark",
    d: "M 560 330 H 404 V 366 H 350 V 404 H 292 V 442 H 224 V 486 H 140 V 526 H 0",
  },
  {
    accent: "light",
    d: "M 560 190 H 410 V 158 H 368 V 126 H 304 V 92 H 232 V 58 H 144 V 28 H 0",
  },
  {
    accent: "main",
    d: "M 560 390 H 392 V 424 H 338 V 462 H 276 V 500 H 198 V 548 H 0",
  },
  {
    accent: "light",
    d: "M 880 238 H 1052 V 206 H 1100 V 178 H 1162 V 146 H 1230 V 112 H 1314 V 84 H 1440",
  },
  {
    accent: "main",
    d: "M 880 286 H 1060 V 320 H 1126 V 354 H 1190 V 388 H 1266 V 420 H 1354 V 456 H 1440",
  },
  {
    accent: "dark",
    d: "M 880 334 H 1038 V 370 H 1090 V 408 H 1152 V 446 H 1220 V 490 H 1302 V 532 H 1440",
  },
  {
    accent: "light",
    d: "M 880 192 H 1030 V 160 H 1074 V 128 H 1138 V 94 H 1210 V 60 H 1298 V 28 H 1440",
  },
  {
    accent: "main",
    d: "M 880 394 H 1048 V 428 H 1104 V 466 H 1166 V 506 H 1246 V 552 H 1440",
  },
];

const loginWireNodes = [
  [386, 198],
  [338, 170],
  [376, 310],
  [310, 342],
  [398, 360],
  [1046, 200],
  [1094, 172],
  [1054, 314],
  [1120, 348],
  [1032, 364],
];

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

        <section
          aria-labelledby="bayblaze-auth-heading"
          className="relative isolate mx-auto flex min-h-[560px] w-full items-center justify-center overflow-visible py-4 sm:py-8"
        >
          <h1 id="bayblaze-auth-heading" className="sr-only">
            Bayblaze Account
          </h1>

          <LoginWireBackdrop />

          <div className="bayblaze-login-card relative z-10 w-full max-w-[560px] p-5 sm:p-8">
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

function LoginWireBackdrop() {
  return (
    <div className="bayblaze-login-wire-field" aria-hidden="true">
      <svg
        className="bayblaze-login-wires"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        viewBox="0 0 1440 620"
      >
        <g className="bayblaze-login-wire-bundle bayblaze-login-wire-outline">
          {loginWirePaths.map((wire) => (
            <path key={`outline-${wire.d}`} d={wire.d} />
          ))}
        </g>

        <g className="bayblaze-login-wire-bundle bayblaze-login-wire-core">
          {loginWirePaths.map((wire) => (
            <path
              className={`bayblaze-login-wire-${wire.accent}`}
              d={wire.d}
              key={`core-${wire.d}`}
            />
          ))}
        </g>

        <g className="bayblaze-login-wire-node-outlines">
          {loginWireNodes.map(([x, y]) => (
            <rect
              height="18"
              key={`node-outline-${x}-${y}`}
              width="18"
              x={x - 3}
              y={y - 3}
            />
          ))}
        </g>

        <g className="bayblaze-login-wire-nodes">
          {loginWireNodes.map(([x, y]) => (
            <rect height="12" key={`node-${x}-${y}`} width="12" x={x} y={y} />
          ))}
        </g>
      </svg>
    </div>
  );
}
