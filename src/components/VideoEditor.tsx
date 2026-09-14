import { useEffect, useRef, useState } from 'react'
import {
  checkHealth,
  uploadFile,
  trimVideo,
  exportVideo,
  type MediaInfo,
  type Overlay,
} from '../api/video'

function formatTime(s: number) {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function VideoEditor() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [media, setMedia] = useState<MediaInfo | null>(null)
  const [hasVideo, setHasVideo] = useState(false)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [overlay, setOverlay] = useState<Overlay>({
    text: 'Media Studio', x: 40, y: 40, size: 42, color: '#ffffff',
  })
  const [busy, setBusy] = useState(false)
  const [backendOk, setBackendOk] = useState<boolean | null>(null)
  const [exportUrl, setExportUrl] = useState<string | null>(null)
  const [status, setStatus] = useState('Upload a video. Trim/export use Ice on :8787.')

  useEffect(() => {
    checkHealth().then(setBackendOk)
    return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current) }
  }, [])

  const attachPreview = (url: string, name?: string) => {
    if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null }
    const video = videoRef.current!
    video.src = url
    video.onloadedmetadata = () => {
      const d = video.duration || 0
      setDuration(d); setTrimStart(0); setTrimEnd(d); setCurrent(0); setHasVideo(true)
      setStatus(`Ready${name ? `: ${name}` : ''} (${formatTime(d)}).`)
    }
  }

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const localUrl = URL.createObjectURL(file)
    objectUrlRef.current = localUrl
    attachPreview(localUrl, file.name)
    setBusy(true); setExportUrl(null)
    try {
      const data = await uploadFile(file)
      setMedia(data)
      if (data.url) attachPreview(data.url, data.filename || file.name)
      setStatus(`Uploaded → id ${data.id}`)
      setBackendOk(true)
    } catch (err) {
      setMedia(null)
      setStatus(`Local preview only — upload failed. Is Ice on :8787? (${err instanceof Error ? err.message : 'err'})`)
      setBackendOk(false)
    } finally { setBusy(false) }
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
    if (playing) { video.pause(); setPlaying(false); return }
    if (video.currentTime < trimStart || video.currentTime >= trimEnd) video.currentTime = trimStart
    video.ontimeupdate = () => {
      setCurrent(video.currentTime)
      if (video.currentTime >= trimEnd - 0.05) { video.pause(); setPlaying(false); setStatus('Reached trim end.') }
    }
    await video.play(); setPlaying(true)
  }

  const applyTrim = async () => {
    if (!media?.id) { setStatus('Upload to Ice first before trim.'); return }
    if (trimEnd - trimStart < 0.2) { setStatus('Trim range too short.'); return }
    setBusy(true); setExportUrl(null)
    try {
      const data = await trimVideo(media.id, trimStart, trimEnd, overlay)
      setMedia(data)
      if (data.url) attachPreview(data.url, data.filename)
      setStatus(`Trimmed → id ${data.id}`)
    } catch (err) {
      setStatus(`Trim failed: ${err instanceof Error ? err.message : 'error'}`)
    } finally { setBusy(false) }
  }

  const doExport = async (format: 'mp4' | 'webm') => {
    if (!media?.id) { setStatus('Upload to Ice first before export.'); return }
    setBusy(true)
    try {
      const data = await exportVideo(media.id, format)
      if (data.id) setMedia((m) => ({ ...(m || data), ...data }))
      if (data.url) { setExportUrl(data.url); setStatus(`Export ready: ${data.url}`) }
      else setStatus(`Export ok (id ${data.id})`)
    } catch (err) {
      setStatus(`Export failed: ${err instanceof Error ? err.message : 'error'}`)
    } finally { setBusy(false) }
  }

  const trimLen = Math.max(0, trimEnd - trimStart)

  return (
    <div className="editor-layout">
      <aside className="panel">
        <h2>Video</h2>
        <p className="muted small">
          Backend: {backendOk === null ? 'checking…' : backendOk ? 'online (:8787)' : 'offline — start Ice API'}
        </p>
        <label className="btn primary file-btn">
          Upload video
          <input type="file" accept="video/*" hidden onChange={onUpload} disabled={busy} />
        </label>
        {media?.id && <p className="muted small">Media id: {media.id}</p>}

        <section className="section">
          <h3>Playback</h3>
          <div className="btn-row">
            <button type="button" className="btn primary" onClick={togglePlay} disabled={!hasVideo || busy}>
              {playing ? 'Pause' : 'Play trim'}
            </button>
            <button type="button" className="btn" disabled={!hasVideo} onClick={() => seekTo(trimStart)}>To start</button>
          </div>
          <p className="muted">{formatTime(current)} / {formatTime(duration)} · Trim {formatTime(trimLen)}</p>
        </section>

        <section className="section">
          <h3>Trim</h3>
          <label>
            Start {formatTime(trimStart)}
            <input type="range" min={0} max={duration || 0} step={0.05} value={trimStart} disabled={!hasVideo || busy}
              onChange={(e) => { const v = +e.target.value; setTrimStart(Math.min(v, trimEnd - 0.1)); seekTo(Math.min(v, trimEnd - 0.1)) }} />
          </label>
          <label>
            End {formatTime(trimEnd)}
            <input type="range" min={0} max={duration || 0} step={0.05} value={trimEnd} disabled={!hasVideo || busy}
              onChange={(e) => setTrimEnd(Math.max(+e.target.value, trimStart + 0.1))} />
          </label>
          <div className="timeline">
            <div className="timeline-range" style={{ left: `${duration ? (trimStart / duration) * 100 : 0}%`, width: `${duration ? (trimLen / duration) * 100 : 0}%` }} />
            <div className="timeline-playhead" style={{ left: `${duration ? (current / duration) * 100 : 0}%` }} />
          </div>
          <label>
            Scrub
            <input type="range" min={trimStart} max={trimEnd || 0} step={0.05}
              value={Math.min(Math.max(current, trimStart), trimEnd || 0)} disabled={!hasVideo || busy}
              onChange={(e) => seekTo(+e.target.value)} />
          </label>
          <button type="button" className="btn primary" onClick={applyTrim} disabled={!hasVideo || busy || !media?.id}>
            {busy ? 'Working…' : 'Apply trim (API)'}
          </button>
        </section>

        <section className="section">
          <h3>Text overlay</h3>
          <label>Text<input type="text" value={overlay.text} onChange={(e) => setOverlay({ ...overlay, text: e.target.value })} /></label>
          <label>Size {overlay.size}<input type="range" min={16} max={96} value={overlay.size} onChange={(e) => setOverlay({ ...overlay, size: +e.target.value })} /></label>
          <label>Color<input type="color" value={overlay.color} onChange={(e) => setOverlay({ ...overlay, color: e.target.value })} /></label>
          <label>X {overlay.x}<input type="range" min={0} max={1200} value={overlay.x} onChange={(e) => setOverlay({ ...overlay, x: +e.target.value })} /></label>
          <label>Y {overlay.y}<input type="range" min={0} max={800} value={overlay.y} onChange={(e) => setOverlay({ ...overlay, y: +e.target.value })} /></label>
          <p className="muted small">Sent with trim for Ice to burn in when supported.</p>
        </section>

        <section className="section">
          <h3>Export (Ice)</h3>
          <div className="btn-row export-actions">
            <button type="button" className="btn primary" onClick={() => doExport('mp4')} disabled={!media?.id || busy}>Export MP4</button>
            <button type="button" className="btn" onClick={() => doExport('webm')} disabled={!media?.id || busy}>Export WebM</button>
          </div>
          {exportUrl && <a className="btn" href={exportUrl} download target="_blank" rel="noreferrer">Download export</a>}
        </section>
        <p className="status">{status}</p>
      </aside>

      <main className="canvas-stage">
        {!hasVideo && <div className="empty-state"><p>Upload a video. Proxy: /api and /files → localhost:8787.</p></div>}
        <div className="video-preview-wrap" style={{ display: hasVideo ? 'block' : 'none' }}>
          <video ref={videoRef} className="edit-canvas video-canvas" playsInline controls={false} onClick={togglePlay} />
          {hasVideo && overlay.text.trim() && (
            <div className="overlay-preview" style={{ left: overlay.x, top: overlay.y, fontSize: overlay.size, color: overlay.color }}>
              {overlay.text}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
