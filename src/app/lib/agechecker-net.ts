type AgeCheckerValidationResponse = {
  blocked?: boolean;
  code?: number;
  error?: string;
  reason?: string;
  status?: string;
  uuid?: string;
};

const ageCheckerApiBaseUrl =
  process.env.AGECHECKER_API_BASE_URL?.replace(/\/$/, "") ??
  "https://api.agechecker.net/v1";

export function getAgeCheckerApiKey() {
  return (
    process.env.AGECHECKER_API_KEY?.trim() ??
    process.env.NEXT_PUBLIC_AGECHECKER_KEY?.trim() ??
    ""
  );
}

export function isAgeCheckerConfigured() {
  return Boolean(getAgeCheckerApiKey());
}

export async function validateAgeCheckerUuid(uuid: string) {
  const key = getAgeCheckerApiKey();

  if (!key) {
    throw new Error("AgeChecker.Net is not configured.");
  }

  const response = await fetch(`${ageCheckerApiBaseUrl}/validate`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      key,
      uuid,
    }),
    cache: "no-store",
  });
  const data = (await readJson(response)) as AgeCheckerValidationResponse;

  if (!response.ok) {
    throw new Error(
      data.error || "AgeChecker.Net could not validate this verification.",
    );
  }

  return data;
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
