export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  // Mobile Safari often ignores click() unless the anchor is in the DOM.
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Delay revoke so Safari can start the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 2500)
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality = 0.92): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Export failed'))),
      type,
      quality,
    )
  })
}

/** Fetch a remote/proxied URL and trigger a local download. */
export async function downloadFromUrl(url: string, filename: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status})`)
  const blob = await res.blob()
  downloadBlob(blob, filename)
}
