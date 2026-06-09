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
    formatted_address?: unknown;
    google_place_id?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    state?: unknown;
    zip?: unknown;
  };
  place_id?: unknown;
  selected_place?: {
    formatted_address?: unknown;
    latitude?: unknown;
    longitude?: unknown;
  };
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
  const geocodeGranularity = verdict?.geocodeGranularity;
  const location = result?.geocode?.location;
  const googleLatitude = location?.latitude;
  const googleLongitude = location?.longitude;
  const selectedLatitude = getFiniteNumber(
    body.selected_place?.latitude ?? body.customer?.latitude,
  );
  const selectedLongitude = getFiniteNumber(
    body.selected_place?.longitude ?? body.customer?.longitude,
  );
  const latitude =
    typeof googleLatitude === "number" ? googleLatitude : selectedLatitude;
  const longitude =
    typeof googleLongitude === "number" ? googleLongitude : selectedLongitude;
  const placeId =
    result?.geocode?.placeId ||
    getString(body.place_id) ||
    getString(body.customer?.google_place_id);
  const hasAcceptedValidationGranularity =
    typeof validationGranularity === "string" &&
    acceptedGranularities.has(validationGranularity);
  const hasAcceptedGeocodeGranularity =
    typeof geocodeGranularity === "string" &&
    acceptedGranularities.has(geocodeGranularity);
  const hasSelectedPlaceFallback =
    Boolean(placeId) &&
    typeof selectedLatitude === "number" &&
    typeof selectedLongitude === "number";
  const hasUsableLocation =
    typeof latitude === "number" && typeof longitude === "number";

  if (
    !hasUsableLocation ||
    (!hasAcceptedValidationGranularity &&
      !hasAcceptedGeocodeGranularity &&
      !hasSelectedPlaceFallback)
  ) {
    return jsonError(
      getAddressValidationFailureMessage(
        verdict?.validationGranularity,
        verdict?.geocodeGranularity,
        Boolean(placeId),
      ),
      422,
    );
  }

  const postalAddress = result?.address?.postalAddress;
  const validatedAddress: ValidatedCheckoutAddress = {
    address: postalAddress?.addressLines?.[0]?.trim() || inputAddress.address,
    city: postalAddress?.locality?.trim() || inputAddress.city,
    formatted_address:
      result?.address?.formattedAddress ||
      getString(body.selected_place?.formatted_address) ||
      getString(body.customer?.formatted_address),
    google_place_id: placeId || undefined,
    latitude,
    longitude,
    state: postalAddress?.administrativeArea?.trim() || inputAddress.state,
    zip: postalAddress?.postalCode?.trim() || inputAddress.zip,
  };

  return Response.json({
    accepted: true,
    address: validatedAddress,
    message: hasAcceptedValidationGranularity
      ? "Delivery address verified."
      : "Delivery address matched. Please confirm any unit, gate, or building details are correct.",
    token: createAddressValidationToken(validatedAddress),
    verdict,
  });
}

function getAddressValidationFailureMessage(
  validationGranularity?: string,
  geocodeGranularity?: string,
  hasPlaceId = false,
) {
  if (hasPlaceId && geocodeGranularity === "PREMISE") {
    return "Google matched this address, but could not fully confirm every component. Please confirm any unit, gate, or building details.";
  }

  if (
    !validationGranularity ||
    validationGranularity === "OTHER" ||
    validationGranularity === "ROUTE"
  ) {
    return "Google could not verify a specific deliverable address. Please enter a full street address.";
  }

  return "Please review the delivery address. Google could not fully verify it as entered.";
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
