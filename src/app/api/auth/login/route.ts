import { NextResponse } from "next/server";

import {
  authenticateCustomer,
  CUSTOMER_TOKEN_COOKIE,
} from "@/app/lib/medusa-auth";

const cookieMaxAge = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = typeof email === "string" ? email.trim() : "";
    const normalizedPassword = typeof password === "string" ? password : "";

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 },
      );
    }

    const token = await authenticateCustomer(normalizedEmail, normalizedPassword);
    const response = NextResponse.json({ success: true });

    response.cookies.set(CUSTOMER_TOKEN_COOKIE, token, {
      httpOnly: true,
      maxAge: cookieMaxAge,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to sign in. Please try again.",
      },
      { status: 401 },
    );
  }
}
