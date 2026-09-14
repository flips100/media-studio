# Media Studio

Vite + React + TypeScript UI with an Express + FFmpeg API. **Flips = frontend**, **Ice = backend**, **Flips2.0 = glue / deploy**.

**Repo:** https://github.com/flips100/media-studio

## Quick start (local)

```bash
npm install
npm run server   # API on :8787
npm run dev      # UI; proxies /api and /files → :8787
```

## Deploy

### UI — GitHub Pages
Preview URL (after Pages is enabled with **Source: GitHub Actions**):
https://flips100.github.io/media-studio/

Workflow: `.github/workflows/deploy-pages.yml` (builds on every push to `main`).

One-time: Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Optional repo variable `VITE_API_URL` = your Render API origin (no trailing slash) so the hosted UI talks to production API.

### API — Render
Blueprint is `render.yaml` (`media-studio-api`, `npm run server`, health `/api/health`).

1. [Render Dashboard](https://dashboard.render.com) → New → Blueprint → connect this repo
2. Deploy `media-studio-api` from `main`
3. Copy the service URL into GitHub Actions variable `VITE_API_URL` and into the FE if it reads that env

## Features

### Photo (client-side)
- New canvas / upload, brush, text, crop
- Rotate, resize, brightness/contrast/saturation, filters
- Undo/redo, export PNG/JPEG

### Video (Ice backend)
- Upload → `POST /api/upload` (field `file`)
- Preview + trim UI; apply trim → `POST /api/video/trim` (`start`/`end` or `startSec`/`endSec`)
- Export → `POST /api/video/export` (`mp4` | `webm`)
- Health → `GET /api/health`
- Static files via `/files/...`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server + proxy |
| `npm run server` | Express API on :8787 |
| `npm run build` | Production UI build |
| `npm run preview` | Preview UI build |

## License

MIT
