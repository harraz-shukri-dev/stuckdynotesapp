import React, { useState, useContext, useRef } from 'react'
import { X } from 'lucide-react'
import Modal from './ui/Modal'
import useStore from '../store'
import { ToastCtx } from '../App'
import { randomColor } from '../utils/helpers'

const COLORS = [
  '#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#f97316','#3b82f6',
  '#84cc16','#a855f7',
]

const STATUSES  = ['pending', 'ongoing', 'complete']
const PRIORITIES = ['high', 'medium', 'low']

export default function TaskForm({ task, onClose }) {
  const { subjects, addTask, updateTask, settings } = useStore()
  const toast = useContext(ToastCtx)
  const isEdit = !!task

  const [form, setForm] = useState({
    title:       task?.title       ?? '',
    description: task?.description ?? '',
    subjectId:   task?.subjectId   ?? (subjects[0]?.id ?? ''),
    status:      task?.status      ?? 'pending',
    priority:    task?.priority    ?? 'medium',
    dueDate:     task?.dueDate     ?? '',
    dueTime:     task?.dueTime     ?? '',
    tags:        task?.tags        ?? [],
    reminder:    task?.reminder    ?? false,
  })

  const [tagInput, setTagInput] = useState('')
  const tagRef = useRef()

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }))

  // ── Tag helpers ──────────────────────────────────────────────
  const addTag = () => {
    const val = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (val && !form.tags.includes(val)) {
      set('tags', [...form.tags, val])
    }
    setTagInput('')
    tagRef.current?.focus()
  }

  const removeTag = (tag) => set('tags', form.tags.filter((t) => t !== tag))

  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
    if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) {
      set('tags', form.tags.slice(0, -1))
    }
  }

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.title.trim()) { toast('Task title is required', 'error'); return }

    const payload = {
      ...form,
      title: form.title.trim(),
      dueDate: form.dueDate || null,
      dueTime: form.dueTime || null,
      subjectId: form.subjectId || null,
    }

    if (isEdit) {
      updateTask(task.id, payload)
      toast('Task updated ✓', 'success')
    } else {
      addTask(payload)
      toast('Task added ✓', 'success')
    }

    // Schedule reminder notification
    if (form.reminder && form.dueDate) {
      const due = new Date(`${form.dueDate}T${form.dueTime || '09:00'}`)
      const reminder = new Date(due.getTime() - 30 * 60 * 1000)
      const now = new Date()
      if (reminder > now) {
        const ms = reminder - now
        setTimeout(() => {
          window.electronAPI?.showNotification(
            `⏰ Reminder: ${form.title}`,
            `Due at ${form.dueTime || '09:00'} today!`
          )
        }, ms)
      }
    }

    onClose()
  }

  // ── Filtered subjects by mode ────────────────────────────────
  const filteredSubjects = subjects.filter((s) => {
    if (settings.mode === 'student')  return s.type === 'subject'
    if (settings.mode === 'employee') return s.type === 'project'
    return true // 'both'
  })

  return (
    <Modal
      title={isEdit ? '✏️ Edit Task' : '➕ New Task'}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Add Task'}
          </button>
        </>
      }
    >
      {/* Title */}
      <div className="form-group">
        <label className="form-label required">Task Title</label>
        <input
          className="form-input"
          placeholder="e.g., Submit Lab Report 3"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          autoFocus
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
      </div>

      {/* Subject / Project */}
      <div className="form-group">
        <label className="form-label">
          {settings.mode === 'employee' ? 'Project' : settings.mode === 'both' ? 'Subject / Project' : 'Subject'}
        </label>
        <select
          className="form-select"
          value={form.subjectId}
          onChange={(e) => set('subjectId', e.target.value)}
        >
          <option value="">— None —</option>
          {filteredSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name} {settings.mode === 'both' ? `(${s.type})` : ''}
            </option>
          ))}
        </select>
        {filteredSubjects.length === 0 && (
          <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
            No subjects/projects yet — add them in Settings ⚙️
          </span>
        )}
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">Notes / Details</label>
        <textarea
          className="form-textarea"
          placeholder="Any additional notes, links, or details…"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      {/* Status & Priority */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Status</label>
          <div className="segment-control">
            {STATUSES.map((s) => (
              <button
                key={s}
                className={`segment-btn ${form.status === s ? `active-${s}` : ''}`}
                onClick={() => set('status', s)}
                type="button"
              >
                {s === 'pending' && '🕐'}
                {s === 'ongoing' && '⚡'}
                {s === 'complete' && '✅'}
                <span style={{ fontSize: 10, textTransform: 'capitalize' }}>{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Priority</label>
          <div className="segment-control">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                className={`segment-btn ${form.priority === p ? `active-${p}` : ''}`}
                onClick={() => set('priority', p)}
                type="button"
              >
                {p === 'high'   && '🔴'}
                {p === 'medium' && '🟡'}
                {p === 'low'    && '⚪'}
                <span style={{ fontSize: 10, textTransform: 'capitalize' }}>{p}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Due Date & Time */}
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input
            type="date"
            className="form-input"
            value={form.dueDate}
            onChange={(e) => set('dueDate', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Due Time</label>
          <input
            type="time"
            className="form-input"
            value={form.dueTime}
            onChange={(e) => set('dueTime', e.target.value)}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="form-group">
        <label className="form-label">Tags</label>
        <div
          className="tags-input-wrap"
          onClick={() => tagRef.current?.focus()}
        >
          {form.tags.map((tag) => (
            <span key={tag} className="tag-item">
              #{tag}
              <span className="tag-remove" onClick={() => removeTag(tag)}>
                <X size={10} />
              </span>
            </span>
          ))}
          <input
            ref={tagRef}
            className="tags-text-input"
            placeholder={form.tags.length === 0 ? 'Add tags (press Enter)…' : ''}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKey}
            onBlur={addTag}
          />
        </div>
      </div>

      {/* Reminder */}
      <div className="toggle-row">
        <div className="toggle-info">
          <div className="toggle-label">🔔 Reminder</div>
          <div className="toggle-desc">Get a notification 30 min before due time</div>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={form.reminder}
            onChange={(e) => set('reminder', e.target.checked)}
          />
          <span className="toggle-slider" />
        </label>
      </div>
    </Modal>
  )
}
