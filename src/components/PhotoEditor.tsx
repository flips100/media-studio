import { useState } from 'react'

/** Minimal PhotoEditor stub so App builds; Flips may replace. */
export function PhotoEditor() {
  const [status] = useState('Photo editor ready — upload/export landing.')
  return (
    <div className="editor-layout">
      <aside className="panel">
        <h2>Photo</h2>
        <p className="muted">{status}</p>
        <p className="muted small">Full canvas tools may be refined by Flips. Pages deploy unblocked.</p>
      </aside>
      <div className="canvas-stage">
        <div className="empty-state">
          <p>Photo canvas placeholder.</p>
        </div>
      </div>
    </div>
  )
}
