import { useEffect, useRef, useState } from 'react'

/** Expected Ice backend endpoints (document for integration). */
export const VIDEO_API = {
  process: '/api/video/process', // POST multipart: file + trimStart + trimEnd + overlay JSON
  status: '/api/video/status/:jobId', // GET job progress
  download: '/api/video/download/:jobId', // GET processed file
} as const

type Overlay = {
  text: string
  x: number
  y: number
  size: number
  color: string
}

function formatTime(s: number) {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function VideoEditor() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const fileRef = useRef<File | null>(null)

  const [hasVideo, setHasVideo] = useState(false)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [overlay, setOverlay] = useState<Overlay>({
    text: 'Media Studio',
    x: 40,
    y: 40,
    size: 42,
    color: '#ffffff',
  })
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(
    'Upload a video. Trim and overlay are ready; export calls Ice backend when available.',
  )

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    fileRef.current = file
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    const video = videoRef.current!
    video.src = url
    video.onloadedmetadata = () => {
      const d = video.duration || 0
      setDuration(d)
      setTrimStart(0)
      setTrimEnd(d)
      setCurrent(0)
      setHasVideo(true)
      setStatus(`Loaded ${file.name} (${formatTime(d)}).`)
    }
  }

  const seekTo = (t: number) => {
    const video = videoRef.current
    if (!video) return
    const clamped = Math.min(Math.max(t, trimStart), Math.max(trimEnd - 0.01, trimStart))
    video.currentTime = clamped
    setCurrent(clamped)
  }

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video || !hasVideo) return
    if (playing) {
      video.pause()
      setPlaying(false)
      return
    }
    if (video.currentTime < trimStart || video.currentTime >= trimEnd) {
      video.currentTime = trimStart
    }
    video.ontimeupdate = () => {
      setCurrent(video.currentTime)
      if (video.currentTime >= trimEnd - 0.05) {
        video.pause()
        setPlaying(false)
        setStatus('Reached trim end.')
      }
    }
    await video.play()
    setPlaying(true)
  }

  /** Stub: POST to Ice backend when running; otherwise show expected payload. */
  const exportViaBackend = async () => {
    if (!fileRef.current || !hasVideo) return
    if (trimEnd - trimStart < 0.2) {
      setStatus('Trim range too short.')
      return
    }
    setBusy(true)
    const payload = {
      trimStart,
      trimEnd,
      overlay,
      endpoint: VIDEO_API.process,
    }
    try {
      const form = new FormData()
      form.append('file', fileRef.current)
      form.append('trimStart', String(trimStart))
      form.append('trimEnd', String(trimEnd))
      form.append('overlay', JSON.stringify(overlay))

      const res = await fetch(VIDEO_API.process, { method: 'POST', body: form })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { jobId?: string }
      setStatus(`Queued job ${data.jobId ?? '(ok)'}. Poll ${VIDEO_API.status}.`)
    } catch {
      setStatus(
        `Backend not reachable (expected ${VIDEO_API.process}). Payload ready: trim ${formatTime(trimStart)}–${formatTime(trimEnd)}, overlay "${overlay.text}". Ice wires this up.`,
      )
      console.info('[Media Studio] video export stub payload', payload)
    } finally {
      setBusy(false)
    }
  }

  const trimLen = Math.max(0, trimEnd - trimStart)

  return (
    <div className="editor-layout">
      <aside className="panel">
        <h2>Video</h2>
        <label className="btn primary file-btn">
          Upload video
          <input type="file" accept="video/*" hidden onChange={onUpload} />
        </label>

        <section className="section">
          <h3>Playback</h3>
          <div className="btn-row">
            <button type="button" className="btn primary" onClick={togglePlay} disabled={!hasVideo || busy}>
              {playing ? 'Pause' : 'Play trim'}
            </button>
            <button type="button" className="btn" disabled={!hasVideo} onClick={() => seekTo(trimStart)}>
              To start
            </button>
          </div>
          <p className="muted">
            {formatTime(current)} / {formatTime(duration)} · Trim {formatTime(trimLen)}
          </p>
        </section>

        <section className="section">
          <h3>Trim</h3>
          <label>
            Start {formatTime(trimStart)}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.05}
              value={trimStart}
              disabled={!hasVideo}
              onChange={(e) => {
                const v = Number(e.target.value)
                setTrimStart(Math.min(v, trimEnd - 0.1))
                seekTo(Math.min(v, trimEnd - 0.1))
              }}
            />
          </label>
          <label>
            End {formatTime(trimEnd)}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.05}
              value={trimEnd}
              disabled={!hasVideo}
              onChange={(e) => {
                const v = Number(e.target.value)
                setTrimEnd(Math.max(v, trimStart + 0.1))
              }}
            />
          </label>
          <div className="timeline">
            <div
              className="timeline-range"
              style={{
                left: `${duration ? (trimStart / duration) * 100 : 0}%`,
                width: `${duration ? (trimLen / duration) * 100 : 0}%`,
              }}
            />
            <div
              className="timeline-playhead"
              style={{ left: `${duration ? (current / duration) * 100 : 0}%` }}
            />
          </div>
          <label>
            Scrub
            <input
              type="range"
              min={trimStart}
              max={trimEnd || 0}
              step={0.05}
              value={Math.min(Math.max(current, trimStart), trimEnd || 0)}
              disabled={!hasVideo}
              onChange={(e) => seekTo(Number(e.target.value))}
            />
          </label>
        </section>

        <section className="section">
          <h3>Text overlay</h3>
          <label>
            Text
            <input
              type="text"
              value={overlay.text}
              onChange={(e) => setOverlay({ ...overlay, text: e.target.value })}
            />
          </label>
          <label>
            Size {overlay.size}
            <input
              type="range"
              min={16}
              max={96}
              value={overlay.size}
              onChange={(e) => setOverlay({ ...overlay, size: Number(e.target.value) })}
            />
          </label>
          <label>
            Color
            <input
              type="color"
              value={overlay.color}
              onChange={(e) => setOverlay({ ...overlay, color: e.target.value })}
            />
          </label>
          <label>
            X {overlay.x}
            <input
              type="range"
              min={0}
              max={1200}
              value={overlay.x}
              onChange={(e) => setOverlay({ ...overlay, x: Number(e.target.value) })}
            />
          </label>
          <label>
            Y {overlay.y}
            <input
              type="range"
              min={0}
              max={800}
              value={overlay.y}
              onChange={(e) => setOverlay({ ...overlay, y: Number(e.target.value) })}
            />
          </label>
        </section>

        <section className="section">
          <h3>Export (Ice backend)</h3>
          <button type="button" className="btn primary" onClick={exportViaBackend} disabled={!hasVideo || busy}>
            {busy ? 'Sending…' : 'Process via API'}
          </button>
          <p className="muted small">
            Frontend stub posts to <code>{VIDEO_API.process}</code>. Ice implements process / status / download.
          </p>
        </section>

        <p className="status">{status}</p>
      </aside>

      <main className="canvas-stage">
        {!hasVideo && (
          <div className="empty-state">
            <p>Upload a video to preview, trim, and queue for backend processing.</p>
          </div>
        )}
        <div className="video-preview-wrap" style={{ display: hasVideo ? 'block' : 'none' }}>
          <video
            ref={videoRef}
            className="edit-canvas video-canvas"
            playsInline
            controls={false}
            onClick={togglePlay}
          />
          {hasVideo && overlay.text.trim() && (
            <div
              className="overlay-preview"
              style={{
                left: overlay.x,
                top: overlay.y,
                fontSize: overlay.size,
                color: overlay.color,
              }}
            >
              {overlay.text}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
