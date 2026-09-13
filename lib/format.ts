import type { Locale } from "@/locales";

const EN_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatShortDate(
  value: string | null | undefined,
  locale: Locale = "en"
) {
  if (!value) return "—";
  const date = parseDate(value);
  if (!date) return "—";
  if (locale === "zh") {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return `${EN_MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatLongDate(
  value: string | null | undefined,
  locale: Locale = "en"
) {
  if (!value) return "—";
  const date = parseDate(value);
  if (!date) return "—";
  if (locale === "zh") {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return `${EN_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function todayInputValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatTime(
  value: string | null | undefined,
  locale: Locale = "en"
) {
  if (!value) return "";
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return value;
  const hours = Number(match[1]);
  const minutes = match[2];
  if (Number.isNaN(hours) || hours < 0 || hours > 23) return value;
  if (locale === "zh") {
    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${suffix}`;
}

export function formatEventDateTime(
  date: string | null | undefined,
  time: string | null | undefined,
  locale: Locale = "en"
) {
  const formattedDate = formatLongDate(date, locale);
  if (formattedDate === "—") return "—";
  const formattedTime = formatTime(time, locale);
  return formattedTime ? `${formattedDate} · ${formattedTime}` : formattedDate;
}

export function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function parseDate(value: string) {
  const dateOnly = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
  return Number.isNaN(date.getTime()) ? null : date;
}
