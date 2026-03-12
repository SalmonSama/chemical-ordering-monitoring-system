import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";

/**
 * Merge Tailwind class strings safely with clsx.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format a date string or Date object to a human-readable format.
 * Returns "N/A" for null/undefined/invalid dates.
 */
export function formatDate(
  date: string | Date | null | undefined,
  fmt = "dd MMM yyyy"
): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? parseISO(date) : date;
  return isValid(d) ? format(d, fmt) : "N/A";
}

/**
 * Format a date as relative time (e.g., "3 hours ago").
 */
export function formatRelativeDate(
  date: string | Date | null | undefined
): string {
  if (!date) return "N/A";
  const d = typeof date === "string" ? parseISO(date) : date;
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : "N/A";
}

/**
 * Format a numeric quantity with its unit.
 */
export function formatQuantity(
  quantity: number | null | undefined,
  unit?: string | null
): string {
  if (quantity == null) return "N/A";
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
  }).format(quantity);
  return unit ? `${formatted} ${unit}` : formatted;
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(text: string, maxLength = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert a snake_case string to Title Case.
 */
export function snakeToTitle(str: string): string {
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generate a simple client-side ID (not for database PKs).
 */
export function generateTempId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Check if a lot is expiring within N days.
 */
export function isExpiringSoon(
  expiryDate: string | Date | null | undefined,
  withinDays = 30
): boolean {
  if (!expiryDate) return false;
  const d = typeof expiryDate === "string" ? parseISO(expiryDate) : expiryDate;
  if (!isValid(d)) return false;
  const diffMs = d.getTime() - Date.now();
  return diffMs > 0 && diffMs < withinDays * 24 * 60 * 60 * 1000;
}

/**
 * Check if a date is in the past (expired).
 */
export function isExpired(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? parseISO(date) : date;
  return isValid(d) && d.getTime() < Date.now();
}

/**
 * Calculate the PPM peroxide inspection status based on reading.
 */
export function classifyPpmStatus(
  ppm: number,
  warningThreshold = 30,
  quarantineThreshold = 100
): "normal" | "warning" | "quarantine" {
  if (ppm >= quarantineThreshold) return "quarantine";
  if (ppm >= warningThreshold) return "warning";
  return "normal";
}
