import {
  createAddressValidationToken,
  getGoogleAddressValidationApiKey,
  normalizeAddressValidationCustomer,
  type ValidatedCheckoutAddress,
} from "@/app/domain/address-validation";

type AddressValidationRequestBody = {
  customer?: {
    address?: unknown;
    city?: unknown;
    state?: unknown;
    zip?: unknown;
  };
  place_id?: unknown;
  session_token?: unknown;
};

type GoogleAddressValidationResponse = {
  result?: {
    address?: {
      formattedAddress?: string;
      postalAddress?: {
        addressLines?: string[];
        administrativeArea?: string;
        locality?: string;
        postalCode?: string;
        regionCode?: string;
      };
    };
    geocode?: {
      location?: {
        latitude?: number;
        longitude?: number;
      };
      placeId?: string;
    };
    verdict?: {
      addressComplete?: boolean;
      geocodeGranularity?: string;
      hasUnconfirmedComponents?: boolean;
      validationGranularity?: string;
    };
  };
};

const acceptedGranularities = new Set(["PREMISE", "SUB_PREMISE"]);

export async function POST(request: Request) {
  const apiKey = getGoogleAddressValidationApiKey();

  if (!apiKey) {
    return jsonError("Google Address Validation is not configured.", 503);
  }

  let body: AddressValidationRequestBody;

  try {
    body = (await request.json()) as AddressValidationRequestBody;
  } catch {
    return jsonError("Invalid address validation request.", 400);
  }

  const inputAddress = normalizeAddressValidationCustomer(body.customer);

  if (!inputAddress) {
    return jsonError("Enter a complete delivery address.", 400);
  }

  const response = await fetch(
    `https://addressvalidation.googleapis.com/v1:validateAddress?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        address: {
          addressLines: [inputAddress.address],
          administrativeArea: inputAddress.state,
          locality: inputAddress.city,
          postalCode: inputAddress.zip,
          regionCode: "US",
        },
        enableUspsCass: true,
        sessionToken:
          typeof body.session_token === "string" ? body.session_token : undefined,
      }),
      cache: "no-store",
    },
  );

  const data = (await response.json().catch(() => ({}))) as
    | GoogleAddressValidationResponse
    | { error?: { message?: string } };

  if (!response.ok) {
    return jsonError(
      "Google could not validate this address right now. Please try again.",
      502,
    );
  }

  const result = "result" in data ? data.result : undefined;
  const verdict = result?.verdict;
  const validationGranularity = verdict?.validationGranularity;
  const location = result?.geocode?.location;
  const latitude = location?.latitude;
  const longitude = location?.longitude;

  if (
    !verdict?.addressComplete ||
    !validationGranularity ||
    !acceptedGranularities.has(validationGranularity) ||
    typeof latitude !== "number" ||
    typeof longitude !== "number"
  ) {
    return jsonError(
      getAddressValidationFailureMessage(verdict?.validationGranularity),
      422,
    );
  }

  const postalAddress = result?.address?.postalAddress;
  const validatedAddress: ValidatedCheckoutAddress = {
    address: postalAddress?.addressLines?.[0]?.trim() || inputAddress.address,
    city: postalAddress?.locality?.trim() || inputAddress.city,
    formatted_address: result?.address?.formattedAddress,
    google_place_id:
      result?.geocode?.placeId ||
      (typeof body.place_id === "string" ? body.place_id : undefined),
    latitude,
    longitude,
    state: postalAddress?.administrativeArea?.trim() || inputAddress.state,
    zip: postalAddress?.postalCode?.trim() || inputAddress.zip,
  };

  return Response.json({
    accepted: true,
    address: validatedAddress,
    message: "Delivery address verified.",
    token: createAddressValidationToken(validatedAddress),
    verdict,
  });
}

function getAddressValidationFailureMessage(granularity?: string) {
  if (!granularity || granularity === "OTHER" || granularity === "ROUTE") {
    return "Google could not verify a specific deliverable address. Please enter a full street address.";
  }

  return "Please review the delivery address. Google could not fully verify it as entered.";
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
