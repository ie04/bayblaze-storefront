import { AGECHECKER_SUPPORT_EMAIL } from "@/app/domain/age-verification";
import { validateAgeCheckerUuid } from "@/app/lib/agechecker-net";
import { createAgeVerificationToken } from "@/app/lib/age-verification-token";

type AgeVerificationRequestBody = {
  customer?: {
    first_name?: unknown;
    last_name?: unknown;
    email?: unknown;
    phone?: unknown;
    address?: unknown;
    city?: unknown;
    state?: unknown;
    zip?: unknown;
  };
  uuid?: unknown;
};

export async function POST(request: Request) {
  let body: AgeVerificationRequestBody;

  try {
    body = (await request.json()) as AgeVerificationRequestBody;
  } catch {
    return jsonError("Invalid age verification request.", 400);
  }

  if (typeof body.uuid !== "string" || body.uuid.length !== 32) {
    return jsonError("Complete age verification before checkout.", 400);
  }

  try {
    const verification = await validateAgeCheckerUuid(body.uuid);

    if (verification.status !== "accepted") {
      return jsonError(
        getAgeCheckerStatusMessage(verification.status, verification.reason),
        403,
      );
    }

    return Response.json({
      provider: "agechecker.net",
      status: "accepted",
      token: createAgeVerificationToken({
        customer: body.customer ?? {},
        uuid: body.uuid,
      }),
      uuid: body.uuid,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 502);
  }
}

function getAgeCheckerStatusMessage(status?: string, reason?: string) {
  if (status === "denied") {
    return `Age verification was not approved. Contact ${AGECHECKER_SUPPORT_EMAIL} if you need help.`;
  }

  if (status === "photo_id") {
    return "AgeChecker.Net needs a photo ID before checkout can continue.";
  }

  if (status === "signature") {
    return "AgeChecker.Net needs your signature before checkout can continue.";
  }

  if (status === "not_created" && reason === "location_blocked") {
    return "AgeChecker.Net cannot approve orders from this location.";
  }

  return `Age verification is still pending. Contact ${AGECHECKER_SUPPORT_EMAIL} if you need help.`;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Age verification is unavailable right now.";
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
