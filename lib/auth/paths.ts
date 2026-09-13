export function isLoginPath(pathname: string) {
  return pathname === "/login";
}

export function safeNextPath(value: string | null | undefined) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/login")) return "/";
  return value;
}
