import type { Application, Company } from "@/types";

export function sortCompanies(companies: Company[]) {
  return [...companies].sort((a, b) => a.name.localeCompare(b.name));
}

export function findCompanyByName(
  companies: Company[],
  name: string | null | undefined
) {
  const trimmed = name?.trim();
  if (!trimmed) return undefined;
  return companies.find(
    (company) => company.name.toLowerCase() === trimmed.toLowerCase()
  );
}

export function companyNameTaken(
  companies: Company[],
  name: string,
  excludeId?: string
) {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return false;
  return companies.some(
    (company) =>
      company.id !== excludeId && company.name.toLowerCase() === trimmed
  );
}

export function ensureCompanyRecord(
  companies: Company[],
  name: string,
  existingId?: string | null
) {
  if (existingId) {
    const byId = companies.find((company) => company.id === existingId);
    if (byId) return byId;
  }
  const existing = findCompanyByName(companies, name);
  if (existing) return existing;
  const trimmed = name.trim();
  if (!trimmed) return null;
  const timestamp = new Date().toISOString();
  const created: Company = {
    id: crypto.randomUUID(),
    name: trimmed,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  companies.push(created);
  return created;
}

export function applicationCompanyName(
  application: Pick<Application, "company" | "companyId">,
  companies: Company[]
) {
  return (
    companies.find((company) => company.id === application.companyId)?.name ??
    application.company
  );
}

export function groupApplicationsByCompany(applications: Application[]) {
  const groups = new Map<
    string,
    { key: string; name: string; applications: Application[] }
  >();

  for (const application of applications) {
    const name = application.company.trim() || application.company;
    const key = application.companyId ?? `name:${name.toLowerCase()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.applications.push(application);
      continue;
    }
    groups.set(key, { key, name, applications: [application] });
  }

  return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
}
