import { NextResponse } from "next/server";

import { CUSTOMER_TOKEN_COOKIE } from "@/app/lib/medusa-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(CUSTOMER_TOKEN_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
