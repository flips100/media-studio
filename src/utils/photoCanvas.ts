import type { FilterId } from './filters'
import { buildCssFilter } from './filters'

export function initBlankCanvas(canvas: HTMLCanvasElement, w: number, h: number) {
  canvas.width = w
  canvas.height = h
  const c = canvas.getContext('2d')!
  c.fillStyle = '#ffffff'
  c.fillRect(0, 0, w, h)
}

export function drawImageScaled(canvas: HTMLCanvasElement, img: HTMLImageElement, max = 1600) {
  let w = img.width
  let h = img.height
  if (w > max || h > max) {
    const s = Math.min(max / w, max / h)
    w = Math.round(w * s)
    h = Math.round(h * s)
  }
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return { w, h }
}

export function rotateCanvas(canvas: HTMLCanvasElement, deg: number) {
  const src = document.createElement('canvas')
  src.width = canvas.width
  src.height = canvas.height
  src.getContext('2d')!.drawImage(canvas, 0, 0)
  const rad = (deg * Math.PI) / 180
  const cos = Math.abs(Math.cos(rad))
  const sin = Math.abs(Math.sin(rad))
  const nw = Math.round(src.width * cos + src.height * sin)
  const nh = Math.round(src.width * sin + src.height * cos)
  canvas.width = nw
  canvas.height = nh
  const c = canvas.getContext('2d')!
  c.translate(nw / 2, nh / 2)
  c.rotate(rad)
  c.drawImage(src, -src.width / 2, -src.height / 2)
  c.setTransform(1, 0, 0, 1, 0, 0)
}

export function resizeCanvasContent(canvas: HTMLCanvasElement, w: number, h: number) {
  const tmp = document.createElement('canvas')
  tmp.width = canvas.width
  tmp.height = canvas.height
  tmp.getContext('2d')!.drawImage(canvas, 0, 0)
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(tmp, 0, 0, w, h)
}

export function applyCropRect(
  canvas: HTMLCanvasElement,
  crop: { x: number; y: number; w: number; h: number },
) {
  const c = canvas.getContext('2d')!
  const data = c.getImageData(
    Math.round(crop.x),
    Math.round(crop.y),
    Math.round(crop.w),
    Math.round(crop.h),
  )
  canvas.width = Math.round(crop.w)
  canvas.height = Math.round(crop.h)
  c.putImageData(data, 0, 0)
}

export function bakeAdjustments(
  canvas: HTMLCanvasElement,
  snap: ImageData,
  brightness: number,
  contrast: number,
  saturation: number,
  filter: FilterId,
) {
  const src = document.createElement('canvas')
  src.width = snap.width
  src.height = snap.height
  src.getContext('2d')!.putImageData(snap, 0, 0)
  canvas.width = snap.width
  canvas.height = snap.height
  const c = canvas.getContext('2d')!
  c.filter = buildCssFilter(brightness, contrast, saturation, filter)
  c.drawImage(src, 0, 0)
  c.filter = 'none'
}

export function pointerPos(canvas: HTMLCanvasElement, e: { clientX: number; clientY: number }) {
  const r = canvas.getBoundingClientRect()
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  }
}
