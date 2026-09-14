# Media Studio API (backend)

Local Express API for upload/storage stubs and FFmpeg trim/export.

## Prerequisites

- Node 20+
- FFmpeg on PATH, or set `FFMPEG_PATH`

```bash
sudo apt-get install -y ffmpeg
```

## Run

```bash
npm install
npm run server
```

Default: `http://localhost:8787`

## Routes

| Method | Path | Body |
|--------|------|------|
| GET | `/api/health` | — |
| POST | `/api/upload` | multipart field `file` |
| GET | `/api/media/:id` | — |
| POST | `/api/video/trim` | `{ id, startSec, endSec? }` |
| POST | `/api/video/export` | `{ id, format?: "mp4"|"webm" }` |
| GET | `/files/...` | static |

## curl

```bash
curl -s http://localhost:8787/api/health
curl -s -F file=@./clip.mp4 http://localhost:8787/api/upload
curl -s -X POST http://localhost:8787/api/video/trim -H 'content-type: application/json' -d '{"id":"MEDIA_ID","startSec":1.5,"endSec":8}'
curl -s -X POST http://localhost:8787/api/video/export -H 'content-type: application/json' -d '{"id":"MEDIA_ID","format":"mp4"}'
```
