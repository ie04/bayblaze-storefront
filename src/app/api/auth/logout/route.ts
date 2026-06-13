import { NextResponse } from "next/server";

import { CUSTOMER_TOKEN_COOKIE } from "@/app/lib/medusa-auth";
import { BAYBLAZE_ACCOUNT_TOKEN_COOKIE } from "@/app/lib/bayblaze-account";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(CUSTOMER_TOKEN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(BAYBLAZE_ACCOUNT_TOKEN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
