"use client";

import { useEffect, useRef, useState, type MutableRefObject } from "react";

type TrackingPoint = {
  lat: number;
  lng: number;
  address?: string;
};

type DriverLocation = TrackingPoint & {
  accuracy?: number | null;
  ageSeconds?: number | null;
  heading?: number | null;
  isStale?: boolean;
  speed?: number | null;
  updatedAt?: string | null;
  vehicleId?: string;
};

type TrackingRoute = {
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  encodedPolyline?: string | null;
};

type MapPoint = {
  lat: () => number;
  lng: () => number;
};

type MapPosition = TrackingPoint | MapPoint;

type GoogleMap = {
  fitBounds: (bounds: GoogleLatLngBounds, padding?: number) => void;
  setCenter: (center: TrackingPoint) => void;
};

type GoogleMarker = {
  setPosition: (position: TrackingPoint) => void;
};

type GooglePolyline = {
  setPath: (path: MapPosition[]) => void;
};

type GoogleLatLngBounds = {
  extend: (point: MapPosition) => void;
  isEmpty: () => boolean;
};

type GoogleMapsApi = {
  maps: {
    LatLngBounds: new () => GoogleLatLngBounds;
    Map: new (
      container: HTMLDivElement,
      options: Record<string, unknown>,
    ) => GoogleMap;
    Marker: new (options: Record<string, unknown>) => GoogleMarker;
    Polyline: new (options: Record<string, unknown>) => GooglePolyline;
    geometry?: {
      encoding?: {
        decodePath?: (encodedPath: string) => MapPoint[];
      };
    };
  };
};

type OrderTrackingPayload = {
  customerLocation?: TrackingPoint | null;
  driverLocation?: DriverLocation | null;
  message?: string;
  route?: TrackingRoute | null;
  status?: string;
};

declare global {
  interface Window {
    __bayblazeInitTrackingMap?: () => void;
  }
}

const googleMapsBrowserKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY?.trim() ||
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
  "";

let googleMapsPromise: Promise<GoogleMapsApi> | null = null;

export default function OrderLiveMap({
  fallbackAddress,
  orderReference,
}: {
  fallbackAddress: string;
  orderReference: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const driverMarkerRef = useRef<GoogleMarker | null>(null);
  const customerMarkerRef = useRef<GoogleMarker | null>(null);
  const routePolylineRef = useRef<GooglePolyline | null>(null);
  const [tracking, setTracking] = useState<OrderTrackingPayload | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function refreshTracking() {
      try {
        const response = await fetch(
          `/api/orders/${encodeURIComponent(orderReference)}/tracking`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as {
          tracking?: OrderTrackingPayload;
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok) {
          setError(payload.error ?? "Live tracking is unavailable.");
          return;
        }

        setTracking(payload.tracking ?? null);
        setError("");
      } catch {
        if (!cancelled) {
          setError("Live tracking could not be loaded.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void refreshTracking();
    const interval = window.setInterval(refreshTracking, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [orderReference]);

  useEffect(() => {
    if (!googleMapsBrowserKey || !containerRef.current || !tracking) {
      return;
    }

    let cancelled = false;

    loadGoogleMaps(googleMapsBrowserKey)
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        renderTrackingMap({
          container: containerRef.current,
          customerMarkerRef,
          driverMarkerRef,
          google,
          mapRef,
          routePolylineRef,
          tracking,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError("Map could not be loaded.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tracking]);

  const statusCopy = getTrackingStatusCopy(tracking, loading);
  const etaCopy = getEtaCopy(tracking?.route?.durationSeconds);
  const distanceCopy = getDistanceCopy(tracking?.route?.distanceMeters);

  return (
    <section className="bayblaze-sharp-card overflow-hidden bg-[#eef2e9]">
      <div className="flex flex-col gap-2 border-b border-[#e8e2d8] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[20px] font-semibold leading-tight text-black">
            Driver map
          </h2>
          <p className="mt-1 text-[14px] font-medium leading-[1.4] text-[#585858]">
            {statusCopy}
          </p>
        </div>
        <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--ast-global-color-1)]">
          {etaCopy || "Live"}
        </span>
      </div>

      <div className="relative min-h-[320px] overflow-hidden bg-[#dfe8d8]">
        {googleMapsBrowserKey ? (
          <div ref={containerRef} className="absolute inset-0" />
        ) : (
          <div className="grid min-h-[320px] place-items-center px-5 text-center">
            <p className="max-w-md text-[15px] font-semibold leading-[1.5] text-black">
              Map display needs NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY.
            </p>
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 rounded-[8px] border border-[#d8d1c6] bg-white/95 px-4 py-3 text-[14px] font-medium leading-[1.45] text-black shadow-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{etaCopy || statusCopy}</span>
            {distanceCopy ? <span>{distanceCopy}</span> : null}
          </div>
          <p className="mt-1 whitespace-pre-line text-[#585858]">
            {tracking?.customerLocation?.address || fallbackAddress}
          </p>
          {error ? <p className="mt-2 text-red-700">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}

function renderTrackingMap({
  container,
  customerMarkerRef,
  driverMarkerRef,
  google,
  mapRef,
  routePolylineRef,
  tracking,
}: {
  container: HTMLDivElement;
  customerMarkerRef: MutableRefObject<GoogleMarker | null>;
  driverMarkerRef: MutableRefObject<GoogleMarker | null>;
  google: GoogleMapsApi;
  mapRef: MutableRefObject<GoogleMap | null>;
  routePolylineRef: MutableRefObject<GooglePolyline | null>;
  tracking: OrderTrackingPayload;
}) {
  const driver = tracking.driverLocation;
  const customer = tracking.customerLocation;
  const center = driver ?? customer ?? { lat: 27.9506, lng: -82.4572 };

  if (!mapRef.current) {
    mapRef.current = new google.maps.Map(container, {
      center,
      clickableIcons: false,
      disableDefaultUI: true,
      fullscreenControl: true,
      gestureHandling: "greedy",
      mapTypeControl: false,
      streetViewControl: false,
      zoom: 13,
      zoomControl: true,
    });
  }

  const map = mapRef.current;
  const bounds = new google.maps.LatLngBounds();

  if (customer) {
    if (!customerMarkerRef.current) {
      customerMarkerRef.current = new google.maps.Marker({
        label: "C",
        map,
        title: "Delivery address",
      });
    }

    customerMarkerRef.current.setPosition(customer);
    bounds.extend(customer);
  }

  if (driver) {
    if (!driverMarkerRef.current) {
      driverMarkerRef.current = new google.maps.Marker({
        label: "D",
        map,
        title: "BayBlaze driver",
      });
    }

    driverMarkerRef.current.setPosition(driver);
    bounds.extend(driver);
  }

  const routePath = getRoutePath(google, tracking);

  if (routePath.length > 1) {
    if (!routePolylineRef.current) {
      routePolylineRef.current = new google.maps.Polyline({
        map,
        strokeColor: "#33684f",
        strokeOpacity: 0.95,
        strokeWeight: 5,
      });
    }

    routePolylineRef.current.setPath(routePath);
    routePath.forEach((point) => bounds.extend(point));
  } else if (driver && customer) {
    if (!routePolylineRef.current) {
      routePolylineRef.current = new google.maps.Polyline({
        map,
        strokeColor: "#33684f",
        strokeOpacity: 0.65,
        strokeWeight: 4,
      });
    }

    routePolylineRef.current.setPath([driver, customer]);
    bounds.extend(driver);
    bounds.extend(customer);
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, 64);
  } else {
    map.setCenter(center);
  }
}

function getRoutePath(google: GoogleMapsApi, tracking: OrderTrackingPayload): MapPoint[] {
  const encodedPolyline = tracking.route?.encodedPolyline;

  if (
    encodedPolyline &&
    google.maps.geometry?.encoding?.decodePath
  ) {
    return google.maps.geometry.encoding.decodePath(encodedPolyline) as MapPoint[];
  }

  return [];
}

function loadGoogleMaps(key: string): Promise<GoogleMapsApi> {
  const currentGoogle = getWindowGoogle();

  if (currentGoogle?.maps) {
    return Promise.resolve(currentGoogle);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("bayblaze-google-maps-tracking");

    window.__bayblazeInitTrackingMap = () => {
      const google = getWindowGoogle();

      if (google) {
        resolve(google);
      } else {
        reject(new Error("Google Maps loaded without a browser API object."));
      }
    };

    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.id = "bayblaze-google-maps-tracking";
    script.async = true;
    script.defer = true;
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}` +
      "&libraries=geometry&v=weekly&callback=__bayblazeInitTrackingMap";
    script.onerror = () => reject(new Error("Google Maps failed to load."));
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}


function getWindowGoogle() {
  return (window as typeof window & { google?: GoogleMapsApi }).google;
}

function getTrackingStatusCopy(
  tracking: OrderTrackingPayload | null,
  loading: boolean,
) {
  if (loading) return "Loading live driver position...";
  if (!tracking) return "Live tracking is waiting for assignment.";

  switch (tracking.status) {
    case "en_route":
      return "Driver is en route.";
    case "driver_location_only":
      return "Driver location is live; route is updating.";
    case "stale_driver_location":
      return "Driver location is temporarily stale.";
    case "awaiting_driver_location":
      return "Waiting for the driver location.";
    case "awaiting_assignment":
      return tracking.message || "Driver assignment pending.";
    case "missing_customer_location":
      return "Delivery pin is missing geocoded coordinates.";
    default:
      return tracking.message || "Live tracking is updating.";
  }
}

function getEtaCopy(durationSeconds?: number | null) {
  if (!Number.isFinite(durationSeconds ?? NaN)) return "";

  const minutes = Math.max(1, Math.round((durationSeconds ?? 0) / 60));
  return `${minutes} min ETA`;
}

function getDistanceCopy(distanceMeters?: number | null) {
  if (!Number.isFinite(distanceMeters ?? NaN)) return "";

  const miles = (distanceMeters ?? 0) / 1609.344;
  return `${miles.toFixed(miles < 10 ? 1 : 0)} mi`;
}
