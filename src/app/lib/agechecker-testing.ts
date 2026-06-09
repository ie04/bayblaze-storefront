export function isAgeCheckerTestingBypassEnabled() {
  return (
    process.env.NEXT_PUBLIC_DISABLE_AGECHECKER_FOR_TESTING === "true" ||
    process.env.DISABLE_AGECHECKER_FOR_TESTING === "true"
  );
}
