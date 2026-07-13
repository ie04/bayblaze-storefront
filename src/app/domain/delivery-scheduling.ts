export type DeliveryTimingMode = "now" | "scheduled";

export type DeliveryTimingInput = {
  mode?: unknown;
  checkout_opened_at?: unknown;
  scheduled_at?: unknown;
};

export type ValidDeliveryTiming =
  | {
      mode: "now";
      scheduledAt?: never;
    }
  | {
      mode: "scheduled";
      scheduledAt: Date;
    };

export type DeliveryTimingValidation =
  | ValidDeliveryTiming
  | {
      error: string;
      mode?: never;
      scheduledAt?: never;
    };

export const STORE_TIME_ZONE = "America/New_York";
export const DELIVERY_SCHEDULING_RULE =
  "BayBlaze Express on-demand delivery is available 24/7. You can also schedule delivery for a time that works for you.";
export const EXPRESS_CHECKOUT_GRACE_MS = 60 * 60 * 1000;

type StoreDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

const storeDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
  minute: "2-digit",
  month: "2-digit",
  second: "2-digit",
  timeZone: STORE_TIME_ZONE,
  year: "numeric",
});

export function getDeliveryScheduleRequirement(now = new Date()) {
  return {
    earliestScheduledAt: roundUpToNextMinute(now),
    isScheduleRequired: false,
  };
}

export function validateDeliveryTiming(
  delivery: DeliveryTimingInput | undefined,
  now = new Date(),
): DeliveryTimingValidation {
  const mode = delivery?.mode;
  const requirement = getDeliveryScheduleRequirement(now);
  const checkoutOpenedAt = parseCheckoutOpenedAt(delivery?.checkout_opened_at);

  if (mode !== "now" && mode !== "scheduled") {
    return {
      error:
        "Choose BayBlaze Express or Schedule Delivery before placing your order.",
    };
  }

  void checkoutOpenedAt;

  if (mode === "now") {
    return { mode };
  }

  const scheduledAt = parseStoreDateTimeInput(delivery?.scheduled_at);

  if (!scheduledAt) {
    return {
      error: "Choose a delivery date and time before scheduling your order.",
    };
  }

  if (!isWithinDeliveryHours(scheduledAt)) {
    return {
      error: "Choose a valid scheduled delivery time.",
    };
  }

  if (scheduledAt.getTime() < requirement.earliestScheduledAt.getTime()) {
    return {
      error: `Schedule delivery for ${formatScheduledDelivery(requirement.earliestScheduledAt)} or later.`,
    };
  }

  return {
    mode,
    scheduledAt,
  };
}

export function isBayBlazeExpressUnavailable(
  now = new Date(),
  checkoutOpenedAt?: Date | null,
) {
  void now;
  void checkoutOpenedAt;
  return false;
}

function parseCheckoutOpenedAt(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isWithinDeliveryHours(date: Date) {
  return !Number.isNaN(date.getTime());
}

export function formatDateTimeLocalInStoreTimeZone(date: Date) {
  const parts = getStoreDateTimeParts(date);

  return [
    `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
    `${pad(parts.hour)}:${pad(parts.minute)}`,
  ].join("T");
}

export function formatScheduledDelivery(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: STORE_TIME_ZONE,
    timeZoneName: "short",
    year: "numeric",
  }).format(date);
}

function parseStoreDateTimeInput(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  const date = getDateFromStoreParts({
    day,
    hour,
    minute,
    month,
    second: 0,
    year,
  });

  return formatDateTimeLocalInStoreTimeZone(date) === value ? date : null;
}

function roundUpToNextMinute(date: Date) {
  const rounded = new Date(date);

  rounded.setSeconds(0, 0);

  if (rounded.getTime() < date.getTime()) {
    rounded.setMinutes(rounded.getMinutes() + 1);
  }

  return rounded;
}

function getStoreDateTimeParts(date: Date): StoreDateTimeParts {
  const parts = Object.fromEntries(
    storeDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    month: Number(parts.month),
    second: Number(parts.second),
    year: Number(parts.year),
  };
}

function getDateFromStoreParts(parts: StoreDateTimeParts) {
  const utcDate = new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ),
  );
  const firstPass = new Date(
    utcDate.getTime() - getStoreTimeZoneOffsetMs(utcDate),
  );

  return new Date(
    utcDate.getTime() - getStoreTimeZoneOffsetMs(firstPass),
  );
}

function getStoreTimeZoneOffsetMs(date: Date) {
  const parts = getStoreDateTimeParts(date);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - date.getTime();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
