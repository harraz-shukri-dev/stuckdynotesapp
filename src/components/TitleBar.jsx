import React, { useState, useEffect } from 'react'
import { Minus, Square, X, Pin, PinOff, Moon, Sun } from 'lucide-react'
import useStore from '../store'
import appIconUrl from '/assets/icon.png'

export default function TitleBar() {
  const { settings, updateSettings } = useStore()
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.getAlwaysOnTop().then(setPinned)
  }, [])

  const handlePin = async () => {
    if (!window.electronAPI) return
    const next = !pinned
    await window.electronAPI.toggleAlwaysOnTop(next)
    setPinned(next)
    updateSettings({ alwaysOnTop: next })
  }

  const toggleTheme = () => {
    const next = settings.theme === 'dark' ? 'light' : 'dark'
    updateSettings({ theme: next })
  }

  return (
    <div className="titlebar">
      {/* Logo */}
      <div className="titlebar-logo">
        <div className="titlebar-logo-icon">
          <img
            src={appIconUrl}
            alt="StuckDyNotes"
            style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 3 }}
          />
        </div>
        <span className="titlebar-title">StuckDyNotes</span>
      </div>

      {/* Controls */}
      <div className="titlebar-controls">
        <button
          className={`titlebar-btn ${pinned ? 'pinned' : ''}`}
          onClick={handlePin}
          title={pinned ? 'Unpin from top' : 'Pin on top'}
        >
          {pinned ? <Pin size={13} /> : <PinOff size={13} />}
        </button>

        <button
          className="titlebar-btn"
          onClick={toggleTheme}
          title="Toggle theme"
        >
          {settings.theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>

        <button
          className="titlebar-btn"
          onClick={() => window.electronAPI?.minimize()}
          title="Minimize"
        >
          <Minus size={13} />
        </button>

        <button
          className="titlebar-btn"
          onClick={() => window.electronAPI?.maximize()}
          title="Maximize / Restore"
        >
          <Square size={11} />
        </button>

        <button
          className="titlebar-btn close"
          onClick={() => window.electronAPI?.close()}
          title="Hide to tray"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
