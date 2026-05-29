import { NextResponse, type NextRequest } from "next/server";

import { getCustomerOAuthRedirect } from "@/app/lib/medusa-auth";

const OAUTH_REDIRECT_COOKIE = "bayblaze_oauth_redirect";

function getSafeRedirect(value: string | null) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/account";
}

function getOAuthCallbackUrl(request: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const origin =
    process.env.NODE_ENV === "production" && siteUrl
      ? siteUrl
      : request.nextUrl.origin;

  return new URL("/api/auth/oauth/google/callback", origin).toString();
}

export async function GET(request: NextRequest) {
  try {
    const callbackUrl = getOAuthCallbackUrl(request);
    const redirectTo = getSafeRedirect(request.nextUrl.searchParams.get("redirect"));
    const oauthUrl = await getCustomerOAuthRedirect("google", callbackUrl);
    const response = NextResponse.redirect(oauthUrl);

    response.cookies.set(OAUTH_REDIRECT_COOKIE, redirectTo, {
      httpOnly: true,
      maxAge: 60 * 10,
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
        : "Unable to start Google sign in.",
    );

    return NextResponse.redirect(loginUrl);
  }
}
