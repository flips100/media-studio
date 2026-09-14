# Media Studio (Frontend)

Browser UI for photo editing and video prep. **Flips = frontend** (this repo). **Ice = backend** video processing. **Flips2.0 = remaining product work.**

**Repo:** https://github.com/flips100/media-studio

## Quick start

```bash
npm install
npm run dev
```

Open the Vite URL (usually `http://localhost:5173`).

## What's included (frontend)

### Photo mode (client-side, fully usable)
- New canvas / upload image
- Brush, text, crop
- Rotate ±90°, resize
- Brightness / contrast / saturation + filters
- Undo / redo
- Export PNG / JPEG via canvas

### Video mode (UI + Ice API stubs)
- Upload + HTML5 preview
- Trim start/end + timeline scrub
- Text overlay controls (preview on video)
- **Export** calls Ice backend stubs (see below). Graceful message if API is down.

## Ice backend — expected endpoints

Wire these on the API (same origin or configure a Vite proxy):

| Method | Path | Body / notes |
|--------|------|----------------|
| `POST` | `/api/video/process` | `multipart/form-data`: `file`, `trimStart`, `trimEnd`, `overlay` (JSON string: `{ text, x, y, size, color }`). Returns `{ jobId }`. |
| `GET` | `/api/video/status/:jobId` | Returns `{ status, progress }` (`queued` \| `processing` \| `done` \| `error`). |
| `GET` | `/api/video/download/:jobId` | Returns processed video file (e.g. MP4/WebM). |

Constants live in `src/components/VideoEditor.tsx` as `VIDEO_API`.

Optional Vite proxy example:

```ts
// vite.config.ts
server: { proxy: { '/api': 'http://localhost:3001' } }
```

## Stack

Vite + React + TypeScript. MIT license.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |

## Limits

- Photo: large images scaled (max edge 1600px) on import.
- Video processing is **not** done in-browser in this split; Ice owns encode/trim/export.
- Desktop-first UI.
