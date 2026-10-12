import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatPrice(cents: number) {
  return cents === 0 ? "Free" : formatMoney(cents);
}

export function formatCompact(n: number) {
  return Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Fill {variable} placeholders in a template. */
export function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (match, key) => values[key] || match);
}

/** Extract unique {variable} names from a template. */
export function extractVariables(template: string) {
  return [...new Set([...template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))];
}
