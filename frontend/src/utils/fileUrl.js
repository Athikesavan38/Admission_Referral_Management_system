/**
 * Constructs a full URL for a backend-stored file path.
 *
 * Reads VITE_API_BASE_URL from the environment:
 * - If it is an absolute URL (starts with http:// or https://), extracts the
 *   origin and prepends it to the stored path.
 * - If it is a relative URL (e.g. "/api" — dev proxy scenario), returns the
 *   path unchanged so the Vite proxy can handle it.
 *
 * @param {string|null|undefined} path - Stored file path (e.g. "/uploads/photos/abc.jpg")
 * @returns {string|null} Full URL string, or null if path is null/undefined/empty
 */
export function getFileUrl(path) {
  if (path === null || path === undefined || path === '') {
    return null;
  }

  const base = import.meta.env.VITE_API_BASE_URL;

  if (
    typeof base === 'string' &&
    (base.startsWith('http://') || base.startsWith('https://'))
  ) {
    // Extract origin: everything up to (but not including) the path component.
    // e.g. "https://api.example.com/api" → "https://api.example.com"
    const url = new URL(base);
    const origin = url.origin; // e.g. "https://api.example.com"
    return origin + path;
  }

  // Relative base (e.g. "/api") — dev proxy is active; return path unchanged.
  return path;
}
