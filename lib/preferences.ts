export const APPLICATIONS_GROUPING_KEY = "nextrole:applications-grouping";
export const APPLICATIONS_GROUPING_EVENT = "nextrole:applications-grouping";

export type ApplicationsGrouping = "company" | "none";

export function parseApplicationsGrouping(
  value: string | null | undefined
): ApplicationsGrouping {
  return value === "company" ? "company" : "none";
}

export function readApplicationsGrouping(): ApplicationsGrouping {
  try {
    return parseApplicationsGrouping(
      window.localStorage.getItem(APPLICATIONS_GROUPING_KEY)
    );
  } catch {
    return "none";
  }
}

export function persistApplicationsGrouping(next: ApplicationsGrouping) {
  try {
    window.localStorage.setItem(APPLICATIONS_GROUPING_KEY, next);
  } catch {
    // Ignore private-mode storage failures.
  }
  window.dispatchEvent(new Event(APPLICATIONS_GROUPING_EVENT));
}
