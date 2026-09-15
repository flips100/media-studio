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
| GET | `/api/youtube/status` | — |
| GET | `/api/youtube/auth` | redirect |
| GET | `/api/youtube/callback` | `?code=` |
| POST | `/api/youtube/upload` | multipart `video` + fields |
| GET | `/files/...` | static |

## curl

```bash
curl -s http://localhost:8787/api/health
curl -s -F file=@./clip.mp4 http://localhost:8787/api/upload
curl -s -X POST http://localhost:8787/api/video/trim -H 'content-type: application/json' -d '{"id":"MEDIA_ID","startSec":1.5,"endSec":8}'
curl -s -X POST http://localhost:8787/api/video/export -H 'content-type: application/json' -d '{"id":"MEDIA_ID","format":"mp4"}'
```

## PayPal

Configure `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, and `PAYPAL_MODE` (`sandbox` or `live`).

- `POST /api/paypal/create-order` — body: `{ amount?, currency?, description? }`
- `POST /api/paypal/capture` — body: `{ orderID }`
- `POST /api/paypal/webhook`

## YouTube

OAuth + resumable upload via YouTube Data API v3 (`googleapis`).

### Env (never commit secrets)

| Variable | Required | Default |
|----------|----------|---------|
| `GOOGLE_CLIENT_ID` | yes | — |
| `GOOGLE_CLIENT_SECRET` | yes | — |
| `YOUTUBE_REDIRECT_URI` | no | `http://localhost:8787/api/youtube/callback` |
| `YOUTUBE_TOKEN_PATH` | no | `./uploads/youtube-tokens.json` |

Register the redirect URI in Google Cloud Console (OAuth client). Tokens are stored under `uploads/` (gitignored).

### Routes

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/youtube/status` | `{ connected, channelTitle? }` |
| GET | `/api/youtube/auth` | Redirects to Google consent (503 if env missing) |
| GET | `/api/youtube/callback` | Exchanges `?code=` and saves refresh token |
| POST | `/api/youtube/upload` | multipart field `video` + `title`, `description`, `privacyStatus` (`public`\|`unlisted`\|`private`, default `unlisted`). Returns `{ id, url }` |

### curl

```bash
# Connect once in a browser:
# open http://localhost:8787/api/youtube/auth

curl -s http://localhost:8787/api/youtube/status
curl -s -F video=@./clip.mp4 -F title='My clip' -F privacyStatus=unlisted \
  http://localhost:8787/api/youtube/upload
```
