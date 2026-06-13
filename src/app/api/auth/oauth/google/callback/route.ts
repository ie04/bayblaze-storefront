import { NextResponse, type NextRequest } from "next/server";

import {
  BAYBLAZE_ACCOUNT_TOKEN_COOKIE,
  completeBayBlazeGoogleOAuth,
} from "@/app/lib/bayblaze-account";
import { CUSTOMER_TOKEN_COOKIE } from "@/app/lib/medusa-auth";

const cookieMaxAge = 60 * 60 * 24 * 30;

function getOAuthCallbackUrl(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const origin =
    process.env.NODE_ENV === "production" && siteUrl
      ? siteUrl
      : request.nextUrl.origin;

  return new URL("/api/auth/oauth/google/callback", origin).toString();
}

function getSafeRedirect(value?: string) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/account";
}

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");

    if (!code || !state) {
      throw new Error("Google did not return a complete sign-in response.");
    }

    const accountSession = await completeBayBlazeGoogleOAuth({
      callbackUrl: getOAuthCallbackUrl(request),
      code,
      state,
    });

    if (!accountSession.account.badges.includes("customer")) {
      throw new Error("This BayBlaze account is not enabled for storefront access.");
    }

    if (!accountSession.commerce?.customerToken) {
      throw new Error("BayBlaze could not create a storefront customer session.");
    }

    const response = NextResponse.redirect(
      new URL(getSafeRedirect(accountSession.redirectTo), request.nextUrl.origin),
    );

    response.cookies.set(BAYBLAZE_ACCOUNT_TOKEN_COOKIE, accountSession.session.token, {
      httpOnly: true,
      maxAge: cookieMaxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    response.cookies.set(CUSTOMER_TOKEN_COOKIE, accountSession.commerce.customerToken, {
      httpOnly: true,
      maxAge: cookieMaxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set(
      "oauth_error",
      error instanceof Error
        ? error.message
        : "Unable to complete Google sign in.",
    );

    return NextResponse.redirect(loginUrl);
  }
}
