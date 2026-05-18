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

type WirePoint = [number, number];

type WireSegment = {
  key: string;
  length: number;
  orientation: "horizontal" | "vertical";
  x: number;
  y: number;
};

const loginWireWalks: WirePoint[][] = [
  [
    [560, 168],
    [504, 168],
    [504, 132],
    [438, 132],
    [438, 96],
    [360, 96],
    [360, 58],
    [260, 58],
    [260, 30],
    [138, 30],
    [138, 0],
    [0, 0],
  ],
  [
    [560, 222],
    [488, 222],
    [488, 184],
    [414, 184],
    [414, 146],
    [326, 146],
    [326, 110],
    [232, 110],
    [232, 74],
    [112, 74],
    [112, 38],
    [0, 38],
  ],
  [
    [560, 278],
    [474, 278],
    [474, 316],
    [402, 316],
    [402, 354],
    [316, 354],
    [316, 390],
    [222, 390],
    [222, 428],
    [116, 428],
    [116, 466],
    [0, 466],
  ],
  [
    [560, 338],
    [492, 338],
    [492, 376],
    [424, 376],
    [424, 414],
    [344, 414],
    [344, 452],
    [250, 452],
    [250, 490],
    [142, 490],
    [142, 530],
    [0, 530],
  ],
  [
    [560, 400],
    [514, 400],
    [514, 444],
    [440, 444],
    [440, 486],
    [346, 486],
    [346, 530],
    [234, 530],
    [234, 572],
    [0, 572],
  ],
  [
    [520, 462],
    [458, 462],
    [458, 504],
    [382, 504],
    [382, 548],
    [282, 548],
    [282, 592],
    [164, 592],
    [164, 620],
    [0, 620],
  ],
  [
    [880, 168],
    [936, 168],
    [936, 130],
    [1006, 130],
    [1006, 94],
    [1088, 94],
    [1088, 58],
    [1190, 58],
    [1190, 28],
    [1312, 28],
    [1312, 0],
    [1440, 0],
  ],
  [
    [880, 224],
    [948, 224],
    [948, 186],
    [1022, 186],
    [1022, 148],
    [1110, 148],
    [1110, 112],
    [1204, 112],
    [1204, 76],
    [1326, 76],
    [1326, 38],
    [1440, 38],
  ],
  [
    [880, 280],
    [968, 280],
    [968, 320],
    [1042, 320],
    [1042, 356],
    [1128, 356],
    [1128, 394],
    [1224, 394],
    [1224, 432],
    [1330, 432],
    [1330, 468],
    [1440, 468],
  ],
  [
    [880, 338],
    [950, 338],
    [950, 376],
    [1020, 376],
    [1020, 416],
    [1104, 416],
    [1104, 454],
    [1198, 454],
    [1198, 494],
    [1306, 494],
    [1306, 534],
    [1440, 534],
  ],
  [
    [880, 400],
    [926, 400],
    [926, 444],
    [1004, 444],
    [1004, 486],
    [1098, 486],
    [1098, 530],
    [1210, 530],
    [1210, 572],
    [1440, 572],
  ],
  [
    [920, 462],
    [984, 462],
    [984, 506],
    [1064, 506],
    [1064, 548],
    [1166, 548],
    [1166, 592],
    [1284, 592],
    [1284, 620],
    [1440, 620],
  ],
];

const loginWireSegments = loginWireWalks.flatMap((walk, walkIndex) =>
  walk.slice(1).flatMap((point, pointIndex) => {
    const [startX, startY] = walk[pointIndex];
    const [endX, endY] = point;
    const isVertical = startX === endX;
    const length = Math.abs(isVertical ? endY - startY : endX - startX);

    if (length === 0) {
      return [];
    }

    return [
      {
        key: `${walkIndex}-${pointIndex}`,
        length,
        orientation: isVertical ? "vertical" : "horizontal",
        x: Math.min(startX, endX),
        y: Math.min(startY, endY),
      } satisfies WireSegment,
    ];
  }),
);

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
      <div className="bayblaze-login-wire-map">
        {loginWireSegments.map((segment) => (
          <span
            className={`bayblaze-login-wire-segment ${
              segment.orientation === "vertical"
                ? "bayblaze-login-wire-segment--vertical"
                : ""
            }`}
            key={segment.key}
            style={{
              left: `${segment.x}px`,
              top: `${segment.y}px`,
              width: `${segment.length}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
