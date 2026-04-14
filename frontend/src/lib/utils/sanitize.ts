/**
 * Simple HTML sanitizer to prevent XSS from AI-generated content.
 * Strips all HTML tags and decodes common entities.
 */

const HTML_TAG_RE = /<[^>]*>/g;
const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
};
const ENTITY_RE = /&(?:amp|lt|gt|quot|#39|#x27|#x2F);/g;

/**
 * Strip HTML tags from a string to prevent XSS injection.
 * Use this before rendering any AI-generated content.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  // Strip HTML tags first
  let sanitized = input.replace(HTML_TAG_RE, '');
  // Decode HTML entities
  sanitized = sanitized.replace(ENTITY_RE, (match) => ENTITY_MAP[match] || match);
  return sanitized;
}

/**
 * Escape special characters for safe rendering in HTML context.
 */
export function escapeHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
