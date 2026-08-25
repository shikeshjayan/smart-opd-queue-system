import en from "@/locales/en/common.json";
import ml from "@/locales/ml/common.json";

export type Locale = "en" | "ml";

const dictionaries: Record<Locale, unknown> = { en, ml };

type PlainObject = { [key: string]: unknown };

function lookup(dict: unknown, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split(".")) {
    if (!node || typeof node !== "object") return undefined;
    node = (node as PlainObject)[part];
  }
  return typeof node === "string" ? node : undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

export function t(
  locale: Locale | string | undefined,
  key: string,
  params?: Record<string, string | number>
): string {
  const loc = locale === "ml" ? "ml" : "en";
  const translated = lookup(dictionaries[loc], key) ?? lookup(dictionaries.en, key);
  if (translated === undefined) return key;
  return interpolate(translated, params);
}

export function normalizeLocale(value: string | undefined | null): Locale {
  return value === "ml" ? "ml" : "en";
}
