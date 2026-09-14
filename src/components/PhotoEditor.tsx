import { useCallback, useEffect, useRef, useState } from 'react'
import { FILTERS, buildCssFilter } from '../utils/filters'
import type { FilterId } from '../utils/filters'
import { canvasToBlob, downloadBlob } from '../utils/download'
import {
  initBlankCanvas,
  drawImageScaled,
  rotateCanvas,
  resizeCanvasContent,
  applyCropRect,
  bakeAdjustments,
  pointerPos,
} from '../utils/photoCanvas'

type Tool = 'select' | 'brush' | 'text' | 'crop'
type Adj = { brightness: number; contrast: number; saturation: number; filter: FilterId }
const DEF: Adj = { brightness: 100, contrast: 100, saturation: 100, filter: 'none' }

export function PhotoEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const historyRef = useRef<ImageData[]>([])
  const histIdx = useRef(-1)
  const [hasImage, setHasImage] = useState(false)
  const [tool, setTool] = useState<Tool>('select')
  const [adj, setAdj] = useState<Adj>(DEF)
  const [brushColor, setBrushColor] = useState('#ff4d6d')
  const [brushSize, setBrushSize] = useState(8)
  const [textValue, setTextValue] = useState('Hello')
  const [textSize, setTextSize] = useState(48)
  const [drawing, setDrawing] = useState(false)
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [status, setStatus] = useState('Create a canvas or upload an image to begin.')

  const ctx = () => canvasRef.current?.getContext('2d') ?? null

  const pushHistory = useCallback(() => {
    const canvas = canvasRef.current
    const c = ctx()
    if (!canvas || !c) return
    const data = c.getImageData(0, 0, canvas.width, canvas.height)
    const next = historyRef.current.slice(0, histIdx.current + 1)
    next.push(data)
    if (next.length > 40) next.shift()
    historyRef.current = next
    histIdx.current = next.length - 1
    setCanUndo(histIdx.current > 0)
    setCanRedo(false)
  }, [])

  const restore = (index: number) => {
    const canvas = canvasRef.current
    const c = ctx()
    const snap = historyRef.current[index]
    if (!canvas || !c || !snap) return
    canvas.width = snap.width
    canvas.height = snap.height
    c.putImageData(snap, 0, 0)
    histIdx.current = index
    setCanUndo(index > 0)
    setCanRedo(index < historyRef.current.length - 1)
    setHasImage(true)
  }

  const boot = (fn: () => void, msg: string) => {
    historyRef.current = []
    histIdx.current = -1
    fn()
    pushHistory()
    setHasImage(true)
    setAdj(DEF)
    setCropRect(null)
    setStatus(msg)
  }

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!hasImage) return
    const canvas = canvasRef.current!
    const p = pointerPos(canvas, e)
    const c = ctx()
    if (!c) return
    if (tool === 'brush') {
      setDrawing(true)
      c.strokeStyle = brushColor
      c.lineWidth = brushSize
      c.lineCap = 'round'
      c.lineJoin = 'round'
      c.beginPath()
      c.moveTo(p.x, p.y)
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } else if (tool === 'text') {
      c.font = `bold ${textSize}px Inter, system-ui, sans-serif`
      c.fillStyle = brushColor
      c.textBaseline = 'top'
      c.fillText(textValue, p.x, p.y)
      pushHistory()
      setStatus('Text added.')
    } else if (tool === 'crop') {
      setCropStart(p)
      setCropRect({ x: p.x, y: p.y, w: 0, h: 0 })
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    }
  }

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!hasImage) return
    const p = pointerPos(canvasRef.current!, e)
    const c = ctx()
    if (!c) return
    if (tool === 'brush' && drawing) {
      c.lineTo(p.x, p.y)
      c.stroke()
    } else if (tool === 'crop' && cropStart) {
      setCropRect({
        x: Math.min(cropStart.x, p.x),
        y: Math.min(cropStart.y, p.y),
        w: Math.abs(p.x - cropStart.x),
        h: Math.abs(p.y - cropStart.y),
      })
    }
  }

  const onUp = () => {
    if (tool === 'brush' && drawing) {
      setDrawing(false)
      pushHistory()
      setStatus('Stroke saved.')
    }
    if (tool === 'crop') setCropStart(null)
  }

  useEffect(() => {
    if (!hasImage || !canvasRef.current) return
    canvasRef.current.style.filter = buildCssFilter(adj.brightness, adj.contrast, adj.saturation, adj.filter)
  }, [adj, hasImage])

  return (
    <div className="editor-layout">
      <aside className="panel">
        <h2>Photo</h2>
        <div className="btn-row">
          <button type="button" className="btn primary" onClick={() => boot(() => initBlankCanvas(canvasRef.current!, 1280, 720), 'Canvas 1280×720 ready.')}>New 1280×720</button>
          <button type="button" className="btn" onClick={() => boot(() => initBlankCanvas(canvasRef.current!, 800, 800), 'Canvas 800×800 ready.')}>New Square</button>
          <label className="btn file-btn">
            Upload
            <input type="file" accept="image/*" hidden onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (!f) return
              const url = URL.createObjectURL(f)
              const img = new Image()
              img.onload = () => {
                const { w, h } = drawImageScaled(canvasRef.current!, img)
                URL.revokeObjectURL(url)
                boot(() => {}, `Loaded ${f.name} (${w}×${h}).`)
              }
              img.src = url
            }} />
          </label>
        </div>

        <section className="section">
          <h3>Tools</h3>
          <div className="chip-row">
            {(['select', 'brush', 'text', 'crop'] as Tool[]).map((t) => (
              <button key={t} type="button" className={`chip ${tool === t ? 'active' : ''}`} onClick={() => setTool(t)} disabled={!hasImage && t !== 'select'}>{t}</button>
            ))}
          </div>
          {(tool === 'brush' || tool === 'text') && (
            <div className="field-grid">
              <label>Color<input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} /></label>
              {tool === 'brush' && <label>Size {brushSize}<input type="range" min={1} max={64} value={brushSize} onChange={(e) => setBrushSize(+e.target.value)} /></label>}
              {tool === 'text' && (
                <>
                  <label>Text<input type="text" value={textValue} onChange={(e) => setTextValue(e.target.value)} /></label>
                  <label>Size {textSize}<input type="range" min={12} max={120} value={textSize} onChange={(e) => setTextSize(+e.target.value)} /></label>
                </>
              )}
            </div>
          )}
          {tool === 'crop' && (
            <button type="button" className="btn primary" disabled={!cropRect} onClick={() => {
              if (!cropRect || cropRect.w < 4 || cropRect.h < 4) { setStatus('Draw a crop region first.'); return }
              applyCropRect(canvasRef.current!, cropRect)
              setCropRect(null)
              pushHistory()
              setTool('select')
              setStatus(`Cropped to ${canvasRef.current!.width}×${canvasRef.current!.height}.`)
            }}>Apply crop</button>
          )}
        </section>

        <section className="section">
          <h3>Transform</h3>
          <div className="btn-row">
            <button type="button" className="btn" disabled={!hasImage} onClick={() => { rotateCanvas(canvasRef.current!, -90); pushHistory(); setStatus('Rotated -90°.') }}>⟲ 90°</button>
            <button type="button" className="btn" disabled={!hasImage} onClick={() => { rotateCanvas(canvasRef.current!, 90); pushHistory(); setStatus('Rotated +90°.') }}>⟳ 90°</button>
            <button type="button" className="btn" disabled={!hasImage} onClick={() => {
              const wStr = prompt('New width (px)', String(canvasRef.current!.width))
              const hStr = prompt('New height (px)', String(canvasRef.current!.height))
              if (!wStr || !hStr) return
              const w = Math.max(1, Math.min(4096, parseInt(wStr, 10) || 0))
              const h = Math.max(1, Math.min(4096, parseInt(hStr, 10) || 0))
              resizeCanvasContent(canvasRef.current!, w, h)
              pushHistory()
              setStatus(`Resized to ${w}×${h}.`)
            }}>Resize</button>
          </div>
        </section>

        <section className="section">
          <h3>Adjust</h3>
          <label>Brightness {adj.brightness}%<input type="range" min={40} max={180} value={adj.brightness} disabled={!hasImage} onChange={(e) => setAdj({ ...adj, brightness: +e.target.value })} /></label>
          <label>Contrast {adj.contrast}%<input type="range" min={40} max={180} value={adj.contrast} disabled={!hasImage} onChange={(e) => setAdj({ ...adj, contrast: +e.target.value })} /></label>
          <label>Saturation {adj.saturation}%<input type="range" min={0} max={200} value={adj.saturation} disabled={!hasImage} onChange={(e) => setAdj({ ...adj, saturation: +e.target.value })} /></label>
          <button type="button" className="btn primary" disabled={!hasImage} onClick={() => {
            const snap = historyRef.current[histIdx.current]
            if (!snap) return
            bakeAdjustments(canvasRef.current!, snap, adj.brightness, adj.contrast, adj.saturation, adj.filter)
            pushHistory()
            setStatus('Adjustments applied.')
          }}>Bake adjustments</button>
        </section>

        <section className="section">
          <h3>Filters</h3>
          <div className="chip-row wrap">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" className={`chip ${adj.filter === f.id ? 'active' : ''}`} disabled={!hasImage} onClick={() => setAdj({ ...adj, filter: f.id })}>{f.label}</button>
            ))}
          </div>
        </section>

        <section className="section">
          <h3>History / Export</h3>
          <div className="btn-row">
            <button type="button" className="btn" disabled={!canUndo} onClick={() => { restore(histIdx.current - 1); setStatus('Undid.') }}>Undo</button>
            <button type="button" className="btn" disabled={!canRedo} onClick={() => { restore(histIdx.current + 1); setStatus('Redid.') }}>Redo</button>
          </div>
          <div className="btn-row">
            <button type="button" className="btn primary" disabled={!hasImage} onClick={async () => {
              try {
                downloadBlob(await canvasToBlob(canvasRef.current!, 'image/png'), 'media-studio.png')
                setStatus('Exported PNG.')
              } catch { setStatus('Export failed.') }
            }}>Export PNG</button>
            <button type="button" className="btn" disabled={!hasImage} onClick={async () => {
              try {
                downloadBlob(await canvasToBlob(canvasRef.current!, 'image/jpeg', 0.92), 'media-studio.jpg')
                setStatus('Exported JPEG.')
              } catch { setStatus('Export failed.') }
            }}>Export JPEG</button>
          </div>
        </section>
        <p className="status">{status}</p>
      </aside>

      <main className="canvas-stage">
        {!hasImage && <div className="empty-state"><p>Start a blank canvas or upload a photo.</p></div>}
        <div className="canvas-wrap" style={{ display: hasImage ? 'inline-block' : 'none' }}>
          <canvas ref={canvasRef} className="edit-canvas" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} />
          {tool === 'crop' && cropRect && cropRect.w > 0 && (
            <div className="crop-overlay" style={{
              left: `${(cropRect.x / (canvasRef.current?.width || 1)) * 100}%`,
              top: `${(cropRect.y / (canvasRef.current?.height || 1)) * 100}%`,
              width: `${(cropRect.w / (canvasRef.current?.width || 1)) * 100}%`,
              height: `${(cropRect.h / (canvasRef.current?.height || 1)) * 100}%`,
            }} />
          )}
        </div>
      </main>
    </div>
  )
}
