# Media Studio

Vite + React + TypeScript UI with an optional local Ice API (FFmpeg trim/export on **:8787**).

**Repo:** https://github.com/flips100/media-studio

## Team roles

| Role | Owns |
|------|------|
| **Flips** | Frontend shell + VideoEditor UI (app chrome, mode switch, Ice wiring in the Video tab) |
| **Ice** | Backend on branch `ice/backend-api` — Express `:8787`, FFmpeg trim/export |
| **Flips2.0** | PhotoEditor, save/export helpers (`download.ts`, `api.ts`), mobile UX, README glue |

Photo editing is **client-side**. Video trim/export prefers Ice when `npm run server` is up; Vite proxies `/api` and `/files` to `:8787`.

## Quick start

```bash
npm install
npm run dev          # FE — http://localhost:5173
```

In another terminal (after Ice’s branch/PR is available, or with `server/` present):

```bash
npm run server       # Ice API — http://localhost:8787 (needs ffmpeg on PATH)
```

Vite already proxies `/api` and `/files` → `http://localhost:8787` (see `vite.config.ts`).

## Features

### Photo (client-side)
- New canvas / upload, brush, text, crop
- Rotate, resize, brightness/contrast/saturation, filters
- Undo/redo, export PNG/JPEG (`downloadBlob` / `canvasToBlob`)

### Video (Flips UI → Ice API)
- Upload → `POST /api/upload` (field `file`)
- Preview + trim UI; apply trim → `POST /api/video/trim`
- Export → `POST /api/video/export` (`mp4` | `webm`)
- Health → `GET /api/health`
- Static files via `/files/...`
- Shared helpers: `src/utils/api.ts` (`uploadMedia`, `trimVideo`, `exportVideo`, `checkHealth`)

## Ice API (branch `ice/backend-api`)

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/health` | Liveness |
| `POST` | `/api/upload` | `multipart` field **`file`** → `{ id, url, type, ... }` |
| `GET` | `/api/media/:id` | Media metadata |
| `POST` | `/api/video/trim` | JSON `{ id, start\|startSec, end\|endSec }` → new media |
| `POST` | `/api/video/export` | JSON `{ id, format?: "mp4"\|"webm" }` → `{ id, url }` |
| `GET` | `/files/...` | Static media |

See also `BACKEND.md` / `server/README.md` on the Ice branch. Requires **ffmpeg** (or `FFMPEG_PATH`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | FE + Vite proxy |
| `npm run server` | Ice Express API (when server package is merged) |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm run lint` | oxlint |

## Limits

- Photo: large images scaled (max edge 1600px) on import.
- Video processing needs Ice + ffmpeg for MP4/WebM; UI works offline for preview/trim scrubbing.
- Mobile: stacked panels, sticky Export actions, ≥44px primary touch targets.

## License

MIT
