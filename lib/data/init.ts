const CLASSIFICATION_INIT_KEY = "job-tracker:classifications-initialized";
const COMPANIES_INIT_KEY = "job-tracker:companies-initialized";

export function classificationsInitialized() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CLASSIFICATION_INIT_KEY) === "1";
}

export function markClassificationsInitialized() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CLASSIFICATION_INIT_KEY, "1");
}

export function companiesInitialized() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(COMPANIES_INIT_KEY) === "1";
}

export function markCompaniesInitialized() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COMPANIES_INIT_KEY, "1");
}
