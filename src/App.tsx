import { useState } from 'react'
import { PhotoEditor } from './components/PhotoEditor'
import { PayPalCheckout } from './components/PayPalCheckout'
import { VideoEditor } from './components/VideoEditor'

type Mode = 'photo' | 'video'

export default function App() {
  const [mode, setMode] = useState<Mode>('photo')

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden>
            ◈
          </span>
          <div>
            <strong>Media Studio</strong>
            <span className="tagline">Create &amp; edit pictures and videos in the browser</span>
          </div>
        </div>
        <nav className="mode-switch" role="tablist" aria-label="Editor mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'photo'}
            className={mode === 'photo' ? 'active' : ''}
            onClick={() => setMode('photo')}
          >
            Photo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'video'}
            className={mode === 'video' ? 'active' : ''}
            onClick={() => setMode('video')}
          >
            Video
          </button>
        </nav>
      </header>
      <PayPalCheckout />
      {mode === 'photo' ? <PhotoEditor /> : <VideoEditor />}
    </div>
  )
}
