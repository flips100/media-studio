/** Ice backend routes (proxied via Vite to :8787). */
export const ICE_API = {
  health: '/api/health',
  upload: '/api/upload',
  media: (id: string) => `/api/media/${id}`,
  trim: '/api/video/trim',
  export: '/api/video/export',
} as const

export type MediaType = 'image' | 'video' | 'other'

export type MediaEntry = {
  id: string
  filename: string
  storedName: string
  mime: string
  type: MediaType
  size: number
  createdAt: string
  url: string
  sourceId?: string
}

export async function checkHealth(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await fetch(ICE_API.health, { signal })
    if (!res.ok) return false
    const body = (await res.json()) as { ok?: boolean }
    return body.ok === true
  } catch {
    return false
  }
}

export async function uploadMedia(file: File): Promise<MediaEntry> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(ICE_API.upload, { method: 'POST', body: form })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `Upload failed (${res.status})`)
  }
  return (await res.json()) as MediaEntry
}

export async function trimVideo(opts: {
  id: string
  startSec: number
  endSec: number
}): Promise<MediaEntry> {
  const res = await fetch(ICE_API.trim, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: opts.id,
      startSec: opts.startSec,
      endSec: opts.endSec,
    }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string }
    throw new Error(body.detail || body.error || `Trim failed (${res.status})`)
  }
  return (await res.json()) as MediaEntry
}

export async function exportVideo(opts: {
  id: string
  format?: 'mp4' | 'webm'
}): Promise<MediaEntry> {
  const res = await fetch(ICE_API.export, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: opts.id, format: opts.format ?? 'mp4' }),
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string }
    throw new Error(body.detail || body.error || `Export failed (${res.status})`)
  }
  return (await res.json()) as MediaEntry
}
