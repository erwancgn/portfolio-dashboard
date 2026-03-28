import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS class names with conflict resolution.
 *
 * Combines clsx (conditional classes) and tailwind-merge (deduplication)
 * to produce a clean, conflict-free class string.
 *
 * @param inputs - Class values to merge (strings, arrays, objects)
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
