// ============================================================
// INPUT SANITIZATION UTILITIES
// Prevents XSS by stripping HTML tags from user-provided strings.
// ============================================================

const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const DANGEROUS_ATTRS_REGEX = /\s*on\w+\s*=\s*["'][^"']*["']/gi;

/**
 * Strips all HTML tags from a user-provided string.
 * Use before rendering any user input in the DOM.
 *
 * @param input - Raw user-provided string
 * @returns Sanitized string with all HTML removed
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(SCRIPT_TAG_REGEX, "")
    .replace(HTML_TAG_REGEX, "")
    .replace(DANGEROUS_ATTRS_REGEX, "")
    .trim();
}

/**
 * Limits string length to prevent excessively long inputs from
 * being stored or rendered.
 *
 * @param input - Input string
 * @param maxLength - Maximum allowed length (default: 500)
 * @returns Truncated string
 */
export function limitLength(input: string, maxLength: number = 500): string {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLength);
}

/**
 * Combined sanitize + limit for form inputs.
 * Apply this to all user-controlled text before storing or rendering.
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  return limitLength(sanitizeHtml(input), maxLength);
}
