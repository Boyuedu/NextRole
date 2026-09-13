import {
  en,
  enEventTypes,
  enFunctions,
  enJobTypes,
  enStages,
} from "@/locales/en";
import {
  zh,
  zhEventTypes,
  zhFunctions,
  zhJobTypes,
  zhStages,
} from "@/locales/zh";

export type Locale = "en" | "zh";
export type OptionGroup = "stages" | "jobTypes" | "eventTypes" | "functions";

export const dictionaries = {
  en: {
    messages: en,
    stages: enStages,
    jobTypes: enJobTypes,
    eventTypes: enEventTypes,
    functions: enFunctions,
  },
  zh: {
    messages: zh,
    stages: zhStages,
    jobTypes: zhJobTypes,
    eventTypes: zhEventTypes,
    functions: zhFunctions,
  },
} as const;
