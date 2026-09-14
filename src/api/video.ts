/** Ice backend (Vite proxies /api and /files → http://localhost:8787). */
export const VIDEO_API = {
  health: '/api/health',
  upload: '/api/upload',
  media: (id: string) => `/api/media/${id}`,
  trim: '/api/video/trim',
  export: '/api/video/export',
} as const

export type MediaInfo = {
  id: string
  url: string
  type?: string
  filename?: string
  duration?: number
}

export type Overlay = {
  text: string
  x: number
  y: number
  size: number
  color: string
}

export async function checkHealth(): Promise<boolean> {
  try {
    const r = await fetch(VIDEO_API.health)
    return r.ok
  } catch {
    return false
  }
}

export async function uploadFile(file: File): Promise<MediaInfo> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(VIDEO_API.upload, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`Upload HTTP ${res.status}`)
  return res.json() as Promise<MediaInfo>
}

export async function trimVideo(
  id: string,
  start: number,
  end: number,
  overlay?: Overlay,
): Promise<MediaInfo> {
  const res = await fetch(VIDEO_API.trim, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, start, end, startSec: start, endSec: end, overlay }),
  })
  if (!res.ok) throw new Error(`Trim HTTP ${res.status}`)
  return res.json() as Promise<MediaInfo>
}

export async function exportVideo(id: string, format: 'mp4' | 'webm' = 'mp4'): Promise<MediaInfo> {
  const res = await fetch(VIDEO_API.export, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, format }),
  })
  if (!res.ok) throw new Error(`Export HTTP ${res.status}`)
  return res.json() as Promise<MediaInfo>
}
