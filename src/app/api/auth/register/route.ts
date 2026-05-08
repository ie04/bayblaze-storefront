import { NextResponse } from "next/server";

import { CUSTOMER_TOKEN_COOKIE, registerCustomer } from "@/app/lib/medusa-auth";

const cookieMaxAge = 60 * 60 * 24 * 30;

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = await request.json();
    const normalizedEmail = typeof email === "string" ? email.trim() : "";
    const normalizedPassword = typeof password === "string" ? password : "";
    const normalizedFirstName =
      typeof firstName === "string" ? firstName.trim() : "";
    const normalizedLastName =
      typeof lastName === "string" ? lastName.trim() : "";

    if (
      !normalizedEmail ||
      !normalizedPassword ||
      !normalizedFirstName ||
      !normalizedLastName
    ) {
      return NextResponse.json(
        { message: "Name, email, and password are required." },
        { status: 400 },
      );
    }

    const token = await registerCustomer({
      email: normalizedEmail,
      password: normalizedPassword,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
    });
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
            : "Unable to create your account. Please try again.",
      },
      { status: 400 },
    );
  }
}
