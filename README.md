# Media Studio

Browser-based photo and video editor. Create canvases, edit images, trim videos, add overlays, and export — all client-side. No uploads to a server; media stays in your browser.

**Live repo:** [https://github.com/flips100/media-studio](https://github.com/flips100/media-studio)

## Features

### Photo mode
- New blank canvases (1280×720 or square) or upload images
- Tools: select, brush, text, crop
- Transform: rotate ±90°, resize
- Adjustments: brightness, contrast, saturation (live preview + bake into pixels)
- Filters: grayscale, sepia, invert, warm, cool, vintage, contrast+
- Undo / redo (pixel history)
- Export PNG or JPEG

### Video mode
- Upload video (browser-decodable formats)
- Trim start / end with timeline scrubber
- Play within the trim range
- Text overlay (content, size, color, position)
- Export trimmed clip with overlay via **MediaRecorder** + canvas (`captureStream`) — typically **WebM** in Chrome

## Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- HTML Canvas for photo editing and video compositing
- MediaRecorder for in-browser video export (no ffmpeg.wasm dependency)

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Scripts

| Command           | Description              |
|-------------------|--------------------------|
| `npm run dev`     | Start dev server         |
| `npm run build`   | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run oxlint               |

## Limits & notes

- **Photo:** Large images are scaled down on import (max edge 1600px) for performance. History stores ImageData snapshots (capped). Crop / brush / text operate on the current pixel buffer.
- **Video:** Export relies on `MediaRecorder` and `canvas.captureStream`. **Chrome** is the most reliable target. Output is usually WebM (VP8/VP9), not MP4, unless the browser advertises MP4 recording support. Audio is included when the browser allows capturing audio tracks from the video element.
- **Privacy:** Processing is local to the browser; nothing is sent to a backend by this app.
- Desktop-first UI; usable on smaller screens with a stacked layout.

## License

MIT — see [LICENSE](./LICENSE).
