import { NextResponse } from "next/server";

import {
  getMaxVerificationAttempts,
  getRegistrationVerificationCookieOptions,
  normalizeVerificationEmail,
  parsePendingRegistration,
  REGISTRATION_VERIFICATION_COOKIE,
  serializePendingRegistration,
  verifyPendingRegistrationCode,
} from "@/app/lib/email-verification";
import {
  getReferralOfferCustomerMetadata,
  getReferralOfferFromCookieHeader,
} from "@/app/domain/referral-offers";
import { CUSTOMER_TOKEN_COOKIE } from "@/app/lib/medusa-auth";
import {
  BAYBLAZE_ACCOUNT_TOKEN_COOKIE,
  createBayBlazeCustomerAccount,
} from "@/app/lib/bayblaze-account";

const cookieMaxAge = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, code } = await request.json();
    const normalizedEmail = normalizeVerificationEmail(email);
    const normalizedPassword = typeof password === "string" ? password : "";
    const normalizedFirstName =
      typeof firstName === "string" ? firstName.trim() : "";
    const normalizedLastName =
      typeof lastName === "string" ? lastName.trim() : "";
    const normalizedCode = typeof code === "string" ? code.trim() : "";

    if (
      !normalizedEmail ||
      !normalizedPassword ||
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedCode
    ) {
      return NextResponse.json(
        { message: "Name, email, password, and verification code are required." },
        { status: 400 },
      );
    }

    const pendingCookie = request.headers
      .get("cookie")
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${REGISTRATION_VERIFICATION_COOKIE}=`))
      ?.split("=")
      .slice(1)
      .join("=");
    const pending = parsePendingRegistration(pendingCookie);

    if (!pending) {
      return NextResponse.json(
        { message: "Request a new verification code before creating account." },
        { status: 400 },
      );
    }

    if (pending.expiresAt < Date.now()) {
      const response = NextResponse.json(
        { message: "Verification code expired. Request a new code." },
        { status: 400 },
      );

      response.cookies.set(REGISTRATION_VERIFICATION_COOKIE, "", {
        ...getRegistrationVerificationCookieOptions(),
        maxAge: 0,
      });

      return response;
    }

    if (
      pending.email !== normalizedEmail ||
      pending.firstName !== normalizedFirstName ||
      pending.lastName !== normalizedLastName
    ) {
      return NextResponse.json(
        { message: "Account details changed. Request a new verification code." },
        { status: 400 },
      );
    }

    if (!verifyPendingRegistrationCode(pending, normalizedCode)) {
      const attempts = pending.attempts + 1;
      const response = NextResponse.json(
        {
          message:
            attempts >= getMaxVerificationAttempts()
              ? "Too many incorrect attempts. Request a new code."
              : "Incorrect verification code.",
        },
        { status: 400 },
      );

      response.cookies.set(
        REGISTRATION_VERIFICATION_COOKIE,
        attempts >= getMaxVerificationAttempts()
          ? ""
          : serializePendingRegistration({ ...pending, attempts }),
        {
          ...getRegistrationVerificationCookieOptions(),
          maxAge:
            attempts >= getMaxVerificationAttempts()
              ? 0
              : Math.max(1, Math.floor((pending.expiresAt - Date.now()) / 1000)),
        },
      );

      return response;
    }

    const accountSession = await createBayBlazeCustomerAccount({
      email: normalizedEmail,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      password: normalizedPassword,
      metadata: getReferralOfferCustomerMetadata(
        getReferralOfferFromCookieHeader(request.headers.get("cookie")),
      ),
    });
    const token = accountSession.commerce?.customerToken;

    if (!token) {
      throw new Error("BayBlaze could not create a storefront customer session.");
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set(BAYBLAZE_ACCOUNT_TOKEN_COOKIE, accountSession.session.token, {
      httpOnly: true,
      maxAge: cookieMaxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.set(CUSTOMER_TOKEN_COOKIE, token, {
      httpOnly: true,
      maxAge: cookieMaxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.set(REGISTRATION_VERIFICATION_COOKIE, "", {
      ...getRegistrationVerificationCookieOptions(),
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create your account. Please try again.",
      },
      { status: 400 },
    );
  }
}
