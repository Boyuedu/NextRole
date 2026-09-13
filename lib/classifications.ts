import { dictionaries } from "@/locales";
import type { OptionGroup } from "@/locales";
import type { Application, Category, CategoryType, FunctionKey } from "@/types";

export const SYSTEM_FUNCTION_ORDER: FunctionKey[] = [
  "rd",
  "algorithm",
  "product",
  "marketing",
  "sales",
  "operations",
  "design",
  "research",
  "business",
  "other",
];

export const SYSTEM_FUNCTIONS: {
  key: FunctionKey;
  id: string;
  name: string;
  legacyNames: string[];
}[] = [
  {
    key: "rd",
    id: "c2222222-2222-4222-8222-222222222101",
    name: "R&D",
    legacyNames: ["r&d", "research & development", "research and development"],
  },
  {
    key: "algorithm",
    id: "c2222222-2222-4222-8222-222222222003",
    name: "Algorithm",
    legacyNames: ["algorithm"],
  },
  {
    key: "product",
    id: "c2222222-2222-4222-8222-222222222002",
    name: "Product",
    legacyNames: ["product", "product manager"],
  },
  {
    key: "marketing",
    id: "c2222222-2222-4222-8222-222222222006",
    name: "Marketing",
    legacyNames: ["marketing"],
  },
  {
    key: "sales",
    id: "c2222222-2222-4222-8222-222222222102",
    name: "Sales",
    legacyNames: ["sales"],
  },
  {
    key: "operations",
    id: "c2222222-2222-4222-8222-222222222103",
    name: "Operations",
    legacyNames: ["operations"],
  },
  {
    key: "design",
    id: "c2222222-2222-4222-8222-222222222104",
    name: "Design",
    legacyNames: ["design"],
  },
  {
    key: "research",
    id: "c2222222-2222-4222-8222-222222222004",
    name: "Research",
    legacyNames: ["research"],
  },
  {
    key: "business",
    id: "c2222222-2222-4222-8222-222222222105",
    name: "Business",
    legacyNames: ["business"],
  },
  {
    key: "other",
    id: "c2222222-2222-4222-8222-222222222106",
    name: "Other",
    legacyNames: ["other"],
  },
];

const LEGACY_SEED_TAG_IDS = new Set([
  "t3333333-3333-4333-8333-333333333001",
  "t3333333-3333-4333-8333-333333333002",
  "t3333333-3333-4333-8333-333333333003",
  "t3333333-3333-4333-8333-333333333004",
  "t3333333-3333-4333-8333-333333333005",
]);

export function isLegacySeedTagId(id: string) {
  return LEGACY_SEED_TAG_IDS.has(id);
}

export function systemFunctionId(key: FunctionKey) {
  const found = SYSTEM_FUNCTIONS.find((item) => item.key === key);
  if (!found) throw new Error(`Unknown system function: ${key}`);
  return found.id;
}

export function parseTranslationKey(value: unknown): FunctionKey | null {
  if (typeof value !== "string") return null;
  const key = value.startsWith("functions.")
    ? value.slice("functions.".length)
    : value;
  return SYSTEM_FUNCTION_ORDER.includes(key as FunctionKey)
    ? (key as FunctionKey)
    : null;
}

export function normalizeCategory(
  raw: Partial<Category> & Pick<Category, "id" | "name" | "type">
): Category {
  const translationKey =
    raw.type === "function" ? parseTranslationKey(raw.translationKey) : null;
  const isSystem = raw.type === "function" && Boolean(raw.isSystem);
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    isSystem,
    translationKey: isSystem ? translationKey : null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date().toISOString(),
  };
}

export function namesMatchSystemFunction(
  name: string,
  item: (typeof SYSTEM_FUNCTIONS)[number]
) {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return false;
  if (item.name.toLowerCase() === normalized) return true;
  return item.legacyNames.includes(normalized);
}

export function isSystemFunction(category: Category) {
  return category.type === "function" && Boolean(category.isSystem);
}

export function assertRenamableCategory(category: Category) {
  if (isSystemFunction(category)) {
    throw new Error("System categories cannot be renamed.");
  }
}

export function functionNameTaken(
  categories: Category[],
  name: string,
  excludeId?: string
) {
  const normalized = name.trim().toLowerCase();
  if (!normalized) return false;
  return categories.some((category) => {
    if (category.type !== "function") return false;
    if (excludeId && category.id === excludeId) return false;
    if (category.name.toLowerCase() === normalized) return true;
    if (category.isSystem && category.translationKey) {
      return functionLabels(category.translationKey).some(
        (label) => label.toLowerCase() === normalized
      );
    }
    return false;
  });
}

export function categoryLabel(
  category: Category,
  option: (group: OptionGroup, value: string | null | undefined) => string
) {
  if (
    category.type === "function" &&
    category.isSystem &&
    category.translationKey
  ) {
    return option("functions", category.translationKey) || category.name;
  }
  return category.name;
}

export function functionLabels(key: FunctionKey) {
  return [
    dictionaries.en.functions[key],
    dictionaries.zh.functions[key],
    SYSTEM_FUNCTIONS.find((item) => item.key === key)?.name ?? "",
  ].filter(Boolean);
}

export function labeledCategoryOptions(
  categories: Category[],
  type: CategoryType,
  option: (group: OptionGroup, value: string | null | undefined) => string
) {
  return sortCategories(categories.filter((category) => category.type === type)).map(
    (category) => ({
      id: category.id,
      name: categoryLabel(category, option),
    })
  );
}

export function findCategoryByTypedName(
  categories: Category[],
  type: CategoryType,
  name: string,
  option: (group: OptionGroup, value: string | null | undefined) => string
) {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return undefined;
  return categories.find((category) => {
    if (category.type !== type) return false;
    if (category.name.toLowerCase() === trimmed) return true;
    return categoryLabel(category, option).toLowerCase() === trimmed;
  });
}

export function applicationFunctionLabel(
  application: Pick<Application, "functionId" | "functionCategory">,
  categories: Category[],
  option: (group: OptionGroup, value: string | null | undefined) => string
) {
  const category = categories.find(
    (item) => item.id === application.functionId
  );
  if (category) return categoryLabel(category, option);
  return application.functionCategory;
}

export function sortCategories(categories: Category[]) {
  const order = new Map(
    SYSTEM_FUNCTION_ORDER.map((key, index) => [key, index])
  );
  return [...categories].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    if (a.type === "function") {
      const aOrder = a.isSystem ? (order.get(a.translationKey as FunctionKey) ?? 50) : 100;
      const bOrder = b.isSystem ? (order.get(b.translationKey as FunctionKey) ?? 50) : 100;
      if (aOrder !== bOrder) return aOrder - bOrder;
    }
    return a.name.localeCompare(b.name);
  });
}

export function systemFunctionTemplate(createdAt: string): Category[] {
  return SYSTEM_FUNCTIONS.map((item) => ({
    id: item.id,
    name: item.name,
    type: "function" as const,
    isSystem: true,
    translationKey: item.key,
    createdAt,
    updatedAt: createdAt,
  }));
}
