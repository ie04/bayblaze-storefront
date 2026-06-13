import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login", request.nextUrl.origin);
  loginUrl.searchParams.set(
    "oauth_error",
    "Google sign in is disabled while BayBlaze accounts are centralized through the API.",
  );

  return NextResponse.redirect(loginUrl);
}
