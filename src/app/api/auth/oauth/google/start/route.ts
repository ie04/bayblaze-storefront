import { NextResponse, type NextRequest } from "next/server";

import { startBayBlazeGoogleOAuth } from "@/app/lib/bayblaze-account";

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
    const oauth = await startBayBlazeGoogleOAuth({
      callbackUrl: getOAuthCallbackUrl(request),
      redirectTo: getSafeRedirect(request.nextUrl.searchParams.get("redirect")),
    });

    return NextResponse.redirect(oauth.authorizationUrl);
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
