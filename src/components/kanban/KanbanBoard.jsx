import React, { useContext, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core'
import { Search, Plus, SlidersHorizontal } from 'lucide-react'
import useStore from '../../store'
import { filterTasks, groupByStatus } from '../../utils/helpers'
import { ToastCtx, ConfettiCtx } from '../../App'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'

const COLUMNS = [
  { id: 'pending',  label: 'Pending',  color: 'var(--status-pending)'  },
  { id: 'ongoing',  label: 'Ongoing',  color: 'var(--status-ongoing)'  },
  { id: 'complete', label: 'Complete', color: 'var(--status-complete)' },
]

export default function KanbanBoard({ onEdit }) {
  const { tasks, subjects, filters, setFilter, moveTask } = useStore()
  const toast    = useContext(ToastCtx)
  const fireCftti = useContext(ConfettiCtx)

  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const filtered = filterTasks(tasks, filters)
  const grouped  = groupByStatus(filtered)
  const activeTask = tasks.find((t) => t.id === activeId)

  const handleDragStart = ({ active }) => setActiveId(active.id)

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    const newStatus = over.id // column id
    const task = tasks.find((t) => t.id === active.id)
    if (!task || task.status === newStatus) return

    const wasComplete = task.status === 'complete'
    moveTask(active.id, newStatus)

    if (newStatus === 'complete' && !wasComplete) {
      fireCftti()
      toast('🎉 Task completed! Great work!', 'success')
      if (window.electronAPI?.showNotification)
        window.electronAPI.showNotification('Task Complete! 🎉', `"${task.title}" marked as complete.`)
    } else {
      toast(`Moved to ${newStatus}`, 'info')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Header / Filters */}
      <div className="view-header">
        <span className="view-title">Board</span>

        <div className="search-wrap">
          <Search className="search-icon" />
          <input
            className="search-input"
            placeholder="Search tasks…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={filters.subjectId}
          onChange={(e) => setFilter('subjectId', e.target.value)}
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} – {s.name}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filters.priority}
          onChange={(e) => setFilter('priority', e.target.value)}
        >
          <option value="all">All Priority</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">⚪ Low</option>
        </select>

        <button className="btn-add" onClick={() => onEdit(null)}>
          <Plus size={13} /> Add Task
        </button>
      </div>

      {/* Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {COLUMNS.map(({ id, label, color }) => (
            <KanbanColumn
              key={id}
              status={id}
              label={label}
              color={color}
              tasks={grouped[id] ?? []}
              onEdit={onEdit}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
          {activeTask ? (
            <KanbanCard task={activeTask} onEdit={() => {}} isDragOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
