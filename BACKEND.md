# Backend for frontend (Flips)

Ice owns this API. Dev base: `http://localhost:8787` (Vite proxies `/api` and `/files`).

```ts
const form = new FormData()
form.append('file', file)
const media = await fetch('/api/upload', { method: 'POST', body: form }).then((r) => r.json())

if (media.type === 'video') {
  const trimmed = await fetch('/api/video/trim', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: media.id, startSec: 0, endSec: 5 }),
  }).then((r) => r.json())
}
```

Photo canvas filters stay in the browser; optional upload after client export for persistence.
