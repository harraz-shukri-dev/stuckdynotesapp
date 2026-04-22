import React from 'react'
import {
  LayoutDashboard,
  List,
  CalendarDays,
  BarChart2,
  Settings,
  Plus,
} from 'lucide-react'
import useStore from '../store'

const NAV_ITEMS = [
  { id: 'kanban',   icon: LayoutDashboard, label: 'Kanban Board' },
  { id: 'list',     icon: List,            label: 'List View'    },
  { id: 'calendar', icon: CalendarDays,    label: 'Calendar'     },
  { id: 'stats',    icon: BarChart2,       label: 'Statistics'   },
]

export default function Sidebar({ onAddTask }) {
  const { activeView, setActiveView } = useStore()

  return (
    <aside className="sidebar">
      {/* Quick Add */}
      <button
        className="sidebar-btn"
        onClick={onAddTask}
        title="Quick Add Task (Ctrl+Shift+N)"
        style={{ background: 'rgba(124,58,237,.18)', color: 'var(--accent)', marginBottom: 8 }}
      >
        <Plus size={18} />
        <span className="tooltip">Add Task</span>
      </button>

      {/* Navigation */}
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          className={`sidebar-btn ${activeView === id ? 'active' : ''}`}
          onClick={() => setActiveView(id)}
        >
          <Icon size={16} />
          <span className="tooltip">{label}</span>
        </button>
      ))}

      <div className="sidebar-divider" />

      {/* Settings */}
      <button
        className={`sidebar-btn ${activeView === 'settings' ? 'active' : ''}`}
        onClick={() => setActiveView('settings')}
      >
        <Settings size={16} />
        <span className="tooltip">Settings</span>
      </button>
    </aside>
  )
}
