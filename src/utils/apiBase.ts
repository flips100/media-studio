/**
 * API origin for Ice backend.
 * - Dev: '' (same-origin → Vite proxy to :8787)
 * - Pages/prod: set VITE_API_URL to Render origin, e.g. https://media-studio-api.onrender.com
 */
export function apiBase(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim() ?? ''
  return raw.replace(/\/$/, '')
}

export function apiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${apiBase()}${p}`
}
