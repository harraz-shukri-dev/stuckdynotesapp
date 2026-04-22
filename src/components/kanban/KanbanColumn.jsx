import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import KanbanCard from './KanbanCard'

export default function KanbanColumn({ status, label, color, tasks, onEdit }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      className={`kanban-column ${isOver ? 'drag-over' : ''}`}
      style={{ '--col-color': color }}
    >
      {/* Header */}
      <div className="kanban-col-header">
        <div className="kanban-col-label">
          <span className="kanban-col-dot" style={{ background: color }} />
          <span style={{ color }}>{label}</span>
        </div>
        <span className="kanban-col-count">{tasks.length}</span>
      </div>

      {/* Cards */}
      <div className="kanban-col-body" ref={setNodeRef}>
        {tasks.length === 0 ? (
          <div className="kanban-empty">
            <span style={{ fontSize: 22, opacity: .5 }}>
              {status === 'pending'  && '📋'}
              {status === 'ongoing'  && '⚡'}
              {status === 'complete' && '✅'}
            </span>
            <span>No {label.toLowerCase()} tasks</span>
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onEdit={onEdit} />
          ))
        )}
      </div>
    </div>
  )
}
