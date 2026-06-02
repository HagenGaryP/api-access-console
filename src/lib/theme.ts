export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "api-console-theme" as const;
export const THEME_CHANGE_EVENT = "api-console-theme-change" as const;

/** Narrows an unknown value to Theme. */
export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}
