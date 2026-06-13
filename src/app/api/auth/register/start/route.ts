import { NextResponse } from "next/server";

import {
  createPendingRegistration,
  createVerificationCode,
  getRegistrationVerificationCookieOptions,
  normalizeVerificationEmail,
  REGISTRATION_VERIFICATION_COOKIE,
  sendRegistrationVerificationEmail,
} from "@/app/lib/email-verification";

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = await request.json();
    const normalizedEmail = normalizeVerificationEmail(email);
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

    if (
      normalizedPassword.length < 12 ||
      !/[a-z]/i.test(normalizedPassword) ||
      !/\d/.test(normalizedPassword) ||
      !/[^a-z0-9]/i.test(normalizedPassword)
    ) {
      return NextResponse.json(
        {
          message:
            "Password must be at least 12 characters and include letters, numbers, and a symbol.",
        },
        { status: 400 },
      );
    }

    const code = createVerificationCode();

    await sendRegistrationVerificationEmail({
      code,
      email: normalizedEmail,
    });

    const response = NextResponse.json({
      email: normalizedEmail,
      verificationRequired: true,
    });

    response.cookies.set(
      REGISTRATION_VERIFICATION_COOKIE,
      createPendingRegistration({
        code,
        email: normalizedEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
      }),
      getRegistrationVerificationCookieOptions(),
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to send verification code. Please try again.",
      },
      { status: 400 },
    );
  }
}
