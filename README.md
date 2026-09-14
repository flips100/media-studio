# Media Studio

Vite + React + TypeScript UI. **Flips = frontend**. **Ice = backend** (`ice/backend-api`, port **8787**). **Flips2.0 = glue / deploy / mobile**.

**Repo:** https://github.com/flips100/media-studio  
**UI preview (GitHub Pages):** https://flips100.github.io/media-studio/  
**API (Render):** deploy Ice’s Express server separately — set repo Actions variable / Pages build env `VITE_API_URL` to the Render origin.

## Quick start

```bash
npm install
npm run dev
```

Start Ice API on `http://localhost:8787` (`npm run server` once Ice’s branch is merged). Vite proxies `/api` and `/files` there (see `vite.config.ts`).

Copy `.env.example` → `.env` if you need a remote API:

```bash
# .env
VITE_API_URL=https://YOUR-SERVICE.onrender.com
```

## Deploy

### Frontend → GitHub Pages

- Workflow: `.github/workflows/pages.yml` builds on push to `main` and deploys `dist/`.
- Vite `base` is `/media-studio/` in CI (`VITE_BASE`).
- Enable **Settings → Pages → Source: GitHub Actions**.
- Live URL: **https://flips100.github.io/media-studio/**

Optional: set repository Actions variable `VITE_API_URL` to your Render API origin so the Pages build talks to Ice in production.

### Backend → Render (Ice)

Do **not** host FFmpeg/Express on Pages. On [Render](https://render.com):

1. New **Web Service** from this repo (or Ice branch after merge).
2. Build: `npm install` · Start: `npm run server` (or `node server/index.js`).
3. Add native **ffmpeg** (apt buildpack / Docker) or set `FFMPEG_PATH`.
4. Set `PORT` (Render provides it) and `CORS_ORIGIN=https://flips100.github.io`.
5. Copy the public URL into `VITE_API_URL` for the Pages workflow.

Ice PR: https://github.com/flips100/media-studio/pull/1

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
| `POST` | `/api/video/trim` | JSON `{ id, start\|startSec, end\|endSec }` → new media |
| `POST` | `/api/video/export` | JSON `{ id, format?: "mp4"\|"webm" }` → `{ id, url }` |
| `GET` | `/files/...` | Static media |

Constants: `VIDEO_API` in `src/components/VideoEditor.tsx`. Helper: `src/utils/apiBase.ts` (`VITE_API_URL`).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server + proxy |
| `npm run server` | Ice API (when `server/` is present) |
| `npm run build` | Production build |
| `npm run preview` | Preview build |

## License

MIT
