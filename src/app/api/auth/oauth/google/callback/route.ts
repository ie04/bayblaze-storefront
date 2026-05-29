import { NextResponse, type NextRequest } from "next/server";

import {
  CUSTOMER_TOKEN_COOKIE,
  completeCustomerOAuth,
} from "@/app/lib/medusa-auth";

const OAUTH_REDIRECT_COOKIE = "bayblaze_oauth_redirect";
const cookieMaxAge = 60 * 60 * 24 * 30;

function getSafeRedirect(value?: string) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return "/account";
}

export async function GET(request: NextRequest) {
  try {
    const token = await completeCustomerOAuth(
      "google",
      request.nextUrl.searchParams,
    );
    const redirectTo = getSafeRedirect(
      request.cookies.get(OAUTH_REDIRECT_COOKIE)?.value,
    );
    const response = NextResponse.redirect(
      new URL(redirectTo, request.nextUrl.origin),
    );

    response.cookies.set(CUSTOMER_TOKEN_COOKIE, token, {
      httpOnly: true,
      maxAge: cookieMaxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    response.cookies.set(OAUTH_REDIRECT_COOKIE, "", {
      httpOnly: true,
      maxAge: 0,
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
    const response = NextResponse.redirect(loginUrl);

    response.cookies.set(OAUTH_REDIRECT_COOKIE, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  }
}

