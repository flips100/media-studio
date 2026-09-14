/**
 * Media Studio local API - upload/storage + FFmpeg trim/export.
 * Run: npm run server  (default http://localhost:8787)
 */
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { exportVideo, trimVideo } from './ffmpeg.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const UPLOAD_DIR = path.join(ROOT, 'uploads')
const EXPORT_DIR = path.join(UPLOAD_DIR, 'exports')
const PORT = Number(process.env.PORT || 8787)

fs.mkdirSync(EXPORT_DIR, { recursive: true })

const media = new Map()

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ''
    cb(null, `${randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 512 * 1024 * 1024 },
})

function classify(mime = '', name = '') {
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp)$/i.test(name)) return 'image'
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(name)) return 'video'
  return 'other'
}

function publicUrl(req, storedName) {
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`
  return `${base}/files/${encodeURIComponent(storedName).replace(/%2F/gi, '/')}`
}

const app = express()
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
      ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : []),
    ],
  }),
)
app.use(express.json({ limit: '2mb' }))
app.use('/files', express.static(UPLOAD_DIR))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'media-studio-api',
    uptimeSec: Math.round(process.uptime()),
  })
})

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Missing multipart field "file"' })
    return
  }
  const id = randomUUID()
  const entry = {
    id,
    filename: req.file.originalname,
    storedName: req.file.filename,
    mime: req.file.mimetype,
    type: classify(req.file.mimetype, req.file.originalname),
    size: req.file.size,
    createdAt: new Date().toISOString(),
  }
  media.set(id, entry)
  res.status(201).json({
    ...entry,
    url: publicUrl(req, entry.storedName),
  })
})

app.get('/api/media/:id', (req, res) => {
  const entry = media.get(req.params.id)
  if (!entry) {
    res.status(404).json({ error: 'Not found' })
    return
  }
  res.json({ ...entry, url: publicUrl(req, entry.storedName) })
})

app.post('/api/video/trim', async (req, res) => {
  const { id, startSec = 0, endSec } = req.body || {}
  const entry = media.get(id)
  if (!entry) {
    res.status(404).json({ error: 'Media id not found - upload first' })
    return
  }
  if (entry.type !== 'video') {
    res.status(400).json({ error: 'Trim requires a video upload' })
    return
  }
  const start = Number(startSec)
  const end = endSec == null ? null : Number(endSec)
  if (!Number.isFinite(start) || start < 0) {
    res.status(400).json({ error: 'startSec must be a non-negative number' })
    return
  }
  if (end != null && (!Number.isFinite(end) || end <= start)) {
    res.status(400).json({ error: 'endSec must be greater than startSec' })
    return
  }

  const input = path.join(UPLOAD_DIR, entry.storedName)
  const outName = `trim-${id.slice(0, 8)}-${Date.now()}.mp4`
  const output = path.join(EXPORT_DIR, outName)

  try {
    await trimVideo({ input, output, startSec: start, endSec: end })
    const outId = randomUUID()
    const outEntry = {
      id: outId,
      filename: outName,
      storedName: path.join('exports', outName),
      mime: 'video/mp4',
      type: 'video',
      size: fs.statSync(output).size,
      createdAt: new Date().toISOString(),
      sourceId: id,
    }
    media.set(outId, outEntry)
    res.json({
      ...outEntry,
      url: publicUrl(req, outEntry.storedName),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: 'FFmpeg trim failed',
      detail: String(err?.message || err),
      hint: 'Install ffmpeg and ensure it is on PATH (or set FFMPEG_PATH).',
    })
  }
})

app.post('/api/video/export', async (req, res) => {
  const { id, format = 'mp4' } = req.body || {}
  const entry = media.get(id)
  if (!entry) {
    res.status(404).json({ error: 'Media id not found - upload first' })
    return
  }
  if (entry.type !== 'video') {
    res.status(400).json({ error: 'Export requires a video upload' })
    return
  }
  const fmt = String(format).toLowerCase()
  if (!['mp4', 'webm'].includes(fmt)) {
    res.status(400).json({ error: 'format must be mp4 or webm' })
    return
  }

  const input = path.join(UPLOAD_DIR, entry.storedName)
  const outName = `export-${id.slice(0, 8)}-${Date.now()}.${fmt}`
  const output = path.join(EXPORT_DIR, outName)

  try {
    await exportVideo({ input, output, format: fmt })
    const outId = randomUUID()
    const outEntry = {
      id: outId,
      filename: outName,
      storedName: path.join('exports', outName),
      mime: fmt === 'webm' ? 'video/webm' : 'video/mp4',
      type: 'video',
      size: fs.statSync(output).size,
      createdAt: new Date().toISOString(),
      sourceId: id,
    }
    media.set(outId, outEntry)
    res.json({
      ...outEntry,
      url: publicUrl(req, outEntry.storedName),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: 'FFmpeg export failed',
      detail: String(err?.message || err),
      hint: 'Install ffmpeg and ensure it is on PATH (or set FFMPEG_PATH).',
    })
  }
})

app.listen(PORT, () => {
  console.log(`[media-studio-api] http://localhost:${PORT}`)
  console.log('  health  GET  /api/health')
  console.log('  upload  POST /api/upload (field: file)')
  console.log('  media   GET  /api/media/:id')
  console.log('  trim    POST /api/video/trim')
  console.log('  export  POST /api/video/export')
})
