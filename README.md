# Media Studio (Frontend)

Vite + React + TypeScript UI. **Flips = frontend** (this repo). **Ice = backend** (`ice/backend-api`, port **8787**).

**Repo:** https://github.com/flips100/media-studio

## Quick start

```bash
npm install
npm run dev
```

Start Ice API on `http://localhost:8787`. Vite proxies `/api` and `/files` there (see `vite.config.ts`).

## Features

### Photo (client-side)
- New canvas / upload, brush, text, crop
- Rotate, resize, brightness/contrast/saturation, filters
- Undo/redo, export PNG/JPEG

### Video (Ice backend)
- Upload → `POST /api/upload` (field `file`)
- Preview + trim UI; apply trim → `POST /api/video/trim`
- Export → `POST /api/video/export` (`mp4` | `webm`)
- Health check → `GET /api/health`
- Static files via `/files/...`

## Ice API (branch `ice/backend-api`)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/health` | Liveness |
| `POST` | `/api/upload` | `multipart` field **`file`** → `{ id, url, type, filename, ... }` |
| `GET` | `/api/media/:id` | Media metadata |
| `POST` | `/api/video/trim` | JSON `{ id, start\|startSec, end\|endSec }` (+ optional overlay) → new media |
| `POST` | `/api/video/export` | JSON `{ id, format?: "mp4"\|"webm" }` → `{ id, url }` |
| `GET` | `/files/...` | Static media |

Constants: `VIDEO_API` in `src/components/VideoEditor.tsx`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server + proxy |
| `npm run build` | Production build |
| `npm run preview` | Preview build |

## License

MIT
