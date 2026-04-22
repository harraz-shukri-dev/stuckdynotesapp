import React, { useState, useContext, useEffect } from 'react'
import {
  BookOpen, Briefcase, Palette, BellRing, Download, Upload,
  Plus, Pencil, Trash2, Check, X, Layers, Bell, RefreshCw
} from 'lucide-react'
import useStore from '../store'
import { randomColor } from '../utils/helpers'
import { ToastCtx } from '../App'

const COLORS = [
  '#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#3b82f6',
  '#84cc16','#a855f7','#f43f5e','#0ea5e9','#22d3ee',
]

const MODE_OPTIONS = [
  { id: 'student',  icon: <BookOpen  size={14} />, label: 'Student',       desc: 'Track subjects & academic tasks' },
  { id: 'employee', icon: <Briefcase size={14} />, label: 'Employee',      desc: 'Track projects & work tasks'     },
  { id: 'both',     icon: <Layers    size={14} />, label: 'Both',          desc: 'Mix subjects and projects'       },
]

const THEMES = ['dark', 'light', 'system']

// ─── Inline Subject Editor ─────────────────────────────────────
function SubjectEditor({ subject, onSave, onCancel }) {
  const [code,  setCode]  = useState(subject?.code  ?? '')
  const [name,  setName]  = useState(subject?.name  ?? '')
  const [color, setColor] = useState(subject?.color ?? randomColor())
  const [type,  setType]  = useState(subject?.type  ?? 'subject')

  const handleSave = () => {
    if (!code.trim() || !name.trim()) return
    onSave({ code: code.trim(), name: name.trim(), color, type })
  }

  return (
    <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-focus)', borderRadius: 'var(--r-sm)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          className="form-input"
          style={{ width: '100%', maxWidth: 130, minWidth: 80, flexShrink: 1 }}
          placeholder="Code (e.g. BITP3423)"
          value={code}
          autoFocus
          onChange={(e) => setCode(e.target.value)}
        />
        <input
          className="form-input"
          style={{ flex: 1, minWidth: 120 }}
          placeholder="Name (e.g. Special Topic in SE)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Type */}
        <select
          className="form-select"
          style={{ width: 120, flexShrink: 0 }}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="subject">Subject</option>
          <option value="project">Project</option>
        </select>

        {/* Colors */}
        <div className="color-picker-row" style={{ flex: 1, minWidth: 0 }}>
          {COLORS.map((c) => (
            <span
              key={c}
              className={`color-swatch ${color === c ? 'selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          <Check size={12} /> Save
        </button>
      </div>
    </div>
  )
}

// ─── Main Settings ─────────────────────────────────────────────
export default function Settings() {
  const { subjects, settings, addSubject, updateSubject, deleteSubject, updateSettings, tasks } = useStore()
  const toast = useContext(ToastCtx)

  const [addingSubject, setAddingSubject]   = useState(false)
  const [editingId, setEditingId]           = useState(null)
  const [updateStatus, setUpdateStatus]     = useState('idle')

  useEffect(() => {
    const cleanup = window.electronAPI?.onUpdateStatus?.((_, data) => {
      setUpdateStatus(data.status)
      if (data.status === 'error') {
        toast(`Update error: ${data.error}`, 'error')
      } else if (data.status === 'downloaded') {
        toast('Update ready to install!', 'success')
      }
    })
    return () => cleanup && cleanup()
  }, [toast])

  // ── Mode ──────────────────────────────────────────────────────
  const handleMode = (mode) => {
    updateSettings({ mode })
    toast(`Mode changed to ${mode}`, 'info')
  }

  // ── Subject CRUD ──────────────────────────────────────────────
  const handleAddSubject = (data) => {
    addSubject(data)
    setAddingSubject(false)
    toast(`Added: ${data.code}`, 'success')
  }

  const handleUpdateSubject = (id, data) => {
    updateSubject(id, data)
    setEditingId(null)
    toast('Subject updated ✓', 'success')
  }

  const handleDeleteSubject = (id) => {
    deleteSubject(id)
    toast('Subject removed', 'info')
  }

  // ── Export ────────────────────────────────────────────────────
  const handleExport = () => {
    const data = { tasks, subjects, settings, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `stuckdynotes-backup-${Date.now()}.json`; a.click()
    URL.revokeObjectURL(url)
    toast('Data exported ✓', 'success')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]; if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        // Basic validation
        if (!Array.isArray(data.tasks)) throw new Error('Invalid backup')
        // Apply data via store
        window.electronAPI?.setStore({ tasks: data.tasks, subjects: data.subjects ?? [], settings: data.settings ?? {} })
        toast('Data imported — please restart the app', 'success')
      } catch {
        toast('Invalid backup file', 'error')
      }
    }
    input.click()
  }

  // ── Always on top ─────────────────────────────────────────────
  const handleAlwaysOnTop = async (enabled) => {
    updateSettings({ alwaysOnTop: enabled })
    await window.electronAPI?.toggleAlwaysOnTop(enabled)
  }

  // ── Test Notification ────────────────────────────────────────
  const handleTestNotification = () => {
    if (!settings.notifications) {
      toast('Enable Notifications first!', 'warning')
      return
    }
    window.electronAPI?.showNotification(
      '🔔 StuckDyNotes',
      'Notifications are working! You will be reminded before due tasks.'
    )
    toast('Test notification sent!', 'success')
  }

  const filteredByMode = (type) => {
    if (settings.mode === 'student')  return type === 'subject'
    if (settings.mode === 'employee') return type === 'project'
    return true
  }

  return (
    <div className="settings-view">

      {/* ── Mode ── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <Layers size={14} /> Usage Mode
        </div>
        <div className="settings-section-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MODE_OPTIONS.map(({ id, icon, label, desc }) => (
              <button
                key={id}
                onClick={() => handleMode(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px',
                  background: settings.mode === id ? 'rgba(124,58,237,.15)' : 'var(--bg-input)',
                  border: `1px solid ${settings.mode === id ? 'rgba(124,58,237,.4)' : 'var(--border)'}`,
                  borderRadius: 'var(--r-sm)', cursor: 'pointer', transition: 'var(--t-base)',
                  color: 'var(--text-primary)', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <span style={{ color: settings.mode === id ? 'var(--accent)' : 'var(--text-muted)' }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{desc}</div>
                </div>
                {settings.mode === id && <Check size={14} style={{ marginLeft: 'auto', color: 'var(--accent)' }} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Subjects / Projects ── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <BookOpen size={14} />
          {settings.mode === 'employee' ? 'Projects' : settings.mode === 'both' ? 'Subjects & Projects' : 'Subjects'}
        </div>
        <div className="settings-section-body">
          <div className="subject-list">
            {subjects.filter((s) => filteredByMode(s.type)).map((sub) => (
              editingId === sub.id ? (
                <SubjectEditor
                  key={sub.id}
                  subject={sub}
                  onSave={(data) => handleUpdateSubject(sub.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <div key={sub.id} className="subject-item">
                  <span className="subject-color-dot" style={{ background: sub.color }} />
                  <div className="subject-item-content">
                    <div className="subject-item-code">{sub.code}</div>
                    <div className="subject-item-name">{sub.name}</div>
                  </div>
                  <span className="subject-type-badge">{sub.type}</span>
                  <button className="card-action-btn" onClick={() => setEditingId(sub.id)} title="Edit">
                    <Pencil size={11} />
                  </button>
                  <button className="card-action-btn delete" onClick={() => handleDeleteSubject(sub.id)} title="Delete">
                    <Trash2 size={11} />
                  </button>
                </div>
              )
            ))}

            {subjects.filter((s) => filteredByMode(s.type)).length === 0 && !addingSubject && (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0' }}>
                No {settings.mode === 'employee' ? 'projects' : 'subjects'} yet. Add one below! 👇
              </div>
            )}

            {addingSubject && (
              <SubjectEditor
                onSave={handleAddSubject}
                onCancel={() => setAddingSubject(false)}
              />
            )}
          </div>

          {!addingSubject && (
            <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start', marginTop: 4 }} onClick={() => setAddingSubject(true)}>
              <Plus size={12} />
              Add {settings.mode === 'employee' ? 'Project' : 'Subject'}
            </button>
          )}
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <Palette size={14} /> Appearance
        </div>
        <div className="settings-section-body">
          <div className="form-group">
            <label className="form-label">Theme</label>
            <div className="segment-control">
              {THEMES.map((t) => (
                <button
                  key={t}
                  className={`segment-btn ${settings.theme === t ? 'active' : ''}`}
                  onClick={() => updateSettings({ theme: t })}
                  type="button"
                >
                  {t === 'dark' && '🌙 Dark'}
                  {t === 'light' && '☀️ Light'}
                  {t === 'system' && '🖥️ System'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Behavior ── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <BellRing size={14} /> Behavior
        </div>
        <div className="settings-section-body">
          <div className="toggle-row">
            <div className="toggle-info">
              <div className="toggle-label">📌 Always on Top</div>
              <div className="toggle-desc">Keep window above all other windows</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.alwaysOnTop}
                onChange={(e) => handleAlwaysOnTop(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="toggle-row">
            <div className="toggle-info">
              <div className="toggle-label">🔔 Notifications</div>
              <div className="toggle-desc">Show reminder & completion alerts</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSettings({ notifications: e.target.checked })}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {/* Test notification */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div className="toggle-info">
              <div className="toggle-label">🧪 Test Notification</div>
              <div className="toggle-desc">Send a test system notification now</div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleTestNotification}
              style={{ flexShrink: 0 }}
            >
              <Bell size={12} /> Send Test
            </button>
          </div>
        </div>
      </div>

      {/* ── Updates ── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <RefreshCw size={14} /> Software Updates
        </div>
        <div className="settings-section-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div className="toggle-info">
              <div className="toggle-label">App Updates</div>
              <div className="toggle-desc">
                {updateStatus === 'idle' && 'Check for the latest version'}
                {updateStatus === 'checking' && 'Checking for updates...'}
                {updateStatus === 'not-available' && 'You are on the latest version'}
                {updateStatus === 'available' && 'Update available! Downloading in background...'}
                {updateStatus === 'downloaded' && 'Update downloaded and ready to install!'}
                {updateStatus === 'error' && 'Error checking for updates'}
              </div>
            </div>
            {updateStatus === 'downloaded' ? (
              <button className="btn btn-primary btn-sm" onClick={() => window.electronAPI?.installUpdate()} style={{ flexShrink: 0 }}>
                Install & Restart
              </button>
            ) : (
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => { setUpdateStatus('checking'); window.electronAPI?.checkForUpdates() }} 
                disabled={updateStatus === 'checking' || updateStatus === 'available'}
                style={{ flexShrink: 0 }}
              >
                <RefreshCw size={12} /> Check Now
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Data ── */}
      <div className="settings-section">
        <div className="settings-section-header">
          <Download size={14} /> Data Management
        </div>
        <div className="settings-section-body">
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExport}>
              <Download size={12} /> Export Backup
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleImport}>
              <Upload size={12} /> Import Backup
            </button>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {subjects.length} subject{subjects.length !== 1 ? 's' : ''} saved locally
          </div>
        </div>
      </div>

      {/* Footer / Developer credit */}
      <div style={{
        textAlign: 'center',
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: '0.06em',
        color: 'var(--text-muted)',
        paddingBottom: 6,
        userSelect: 'none',
      }}>
        <span
          style={{ cursor: 'pointer', transition: 'var(--t-fast)' }}
          onClick={() => window.electronAPI?.openExternal('https://razdevplus.com')}
          onMouseEnter={(e) => { e.target.style.color = 'var(--accent)' }}
          onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)' }}
          title="Visit razdevplus.com"
        >
          DEVELOPED BY RAZDEVPLUS SOLUTIONS GLOBAL
        </span>
      </div>
    </div>
  )
}
