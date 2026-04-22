import React, { useEffect, useState } from 'react'
import useStore from './store'
import TitleBar from './components/TitleBar'
import Sidebar from './components/Sidebar'
import KanbanBoard from './components/kanban/KanbanBoard'
import ListView from './components/ListView'
import CalendarView from './components/CalendarView'
import StatsView from './components/StatsView'
import Settings from './components/Settings'
import TaskForm from './components/TaskForm'
import Toast from './components/ui/Toast'
import Confetti from './components/Confetti'
import { countOverdue } from './utils/helpers'

// ─── Toast Context ─────────────────────────────────────────────
export const ToastCtx = React.createContext(null)
export const ConfettiCtx = React.createContext(null)

export default function App() {
  const { initStore, isLoaded, settings, activeView, tasks } = useStore()

  const [toasts, setToasts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [confettiActive, setConfettiActive] = useState(false)

  // Bootstrap
  useEffect(() => { initStore() }, [])

  // Apply theme
  useEffect(() => {
    const root = document.documentElement
    const { theme } = settings
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
      const handler = (e) => root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [settings.theme])

  // IPC: global shortcut → open task form
  useEffect(() => {
    if (!window.electronAPI?.onQuickAddTask) return
    const cleanup = window.electronAPI.onQuickAddTask(() => {
      setEditTask(null)
      setShowForm(true)
    })
    return cleanup
  }, [])

  // ── Toast helpers ──────────────────────────────────────────
  const toast = (message, type = 'info') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }

  // ── Confetti helper ────────────────────────────────────────
  const fireConfetti = () => {
    setConfettiActive(true)
    setTimeout(() => setConfettiActive(false), 3000)
  }

  if (!isLoaded) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading StuckDyNotes…</span>
      </div>
    )
  }

  const overdueCount = countOverdue(tasks)

  const viewMap = {
    kanban:   <KanbanBoard onEdit={(t) => { setEditTask(t); setShowForm(true) }} />,
    list:     <ListView    onEdit={(t) => { setEditTask(t); setShowForm(true) }} />,
    calendar: <CalendarView onEdit={(t) => { setEditTask(t); setShowForm(true) }} />,
    stats:    <StatsView />,
    settings: <Settings />,
  }

  return (
    <ToastCtx.Provider value={toast}>
      <ConfettiCtx.Provider value={fireConfetti}>
        <div className="app-shell">
          <TitleBar />
          <div className="app-body">
            <Sidebar onAddTask={() => { setEditTask(null); setShowForm(true) }} />
            <div className="main-content">
              {overdueCount > 0 && activeView !== 'settings' && (
                <div className="overdue-banner">
                  <span>⚠</span>
                  {overdueCount} overdue task{overdueCount > 1 ? 's' : ''} — check your list!
                </div>
              )}
              {viewMap[activeView] ?? viewMap.kanban}
            </div>
          </div>

          {showForm && (
            <TaskForm
              task={editTask}
              onClose={() => { setShowForm(false); setEditTask(null) }}
            />
          )}

          <Toast toasts={toasts} />
          {confettiActive && <Confetti />}
        </div>
      </ConfettiCtx.Provider>
    </ToastCtx.Provider>
  )
}
