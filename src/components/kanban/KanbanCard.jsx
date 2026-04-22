import React, { useContext } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2, CheckCheck, Clock } from 'lucide-react'
import useStore from '../../store'
import { getUrgency, formatDueDate } from '../../utils/dateUtils'
import { getSubject } from '../../utils/helpers'
import { ToastCtx, ConfettiCtx } from '../../App'

const PRIORITY_LABELS = { high: '🔴 High', medium: '🟡 Med', low: '⚪ Low' }

export default function KanbanCard({ task, onEdit, isDragOverlay = false }) {
  const { subjects, deleteTask, moveTask } = useStore()
  const toast     = useContext(ToastCtx)
  const fireCftti = useContext(ConfettiCtx)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: isDragOverlay,
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined

  const subject  = getSubject(subjects, task.subjectId)
  const urgency  = getUrgency(task.dueDate)
  const dueLbl   = formatDueDate(task.dueDate)
  const isComplete = task.status === 'complete'

  const handleDelete = (e) => {
    e.stopPropagation()
    deleteTask(task.id)
    toast('Task deleted', 'info')
  }

  const handleComplete = (e) => {
    e.stopPropagation()
    if (!isComplete) {
      moveTask(task.id, 'complete')
      fireCftti()
      toast('🎉 Task completed!', 'success')
      window.electronAPI?.showNotification('Task Complete! 🎉', `"${task.title}" done!`)
    } else {
      moveTask(task.id, 'pending')
      toast('Task moved back to pending', 'info')
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`kanban-card urgency-${urgency} ${isDragging ? 'dragging' : ''}`}
      onClick={() => onEdit(task)}
    >
      {/* Top row */}
      <div className="card-top">
        {subject ? (
          <span
            className="card-subject-badge"
            style={{ background: `${subject.color}22`, color: subject.color }}
          >
            {subject.code}
          </span>
        ) : (
          <span className="card-subject-badge" style={{ opacity: 0.4 }}>
            No subject
          </span>
        )}

        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="card-action-btn complete-btn" onClick={handleComplete} title={isComplete ? 'Reopen' : 'Mark complete'}>
            <CheckCheck size={13} />
          </button>
          <button className="card-action-btn" onClick={(e) => { e.stopPropagation(); onEdit(task) }} title="Edit">
            <Pencil size={12} />
          </button>
          <button className="card-action-btn delete" onClick={handleDelete} title="Delete">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className={`card-title ${isComplete ? 'completed' : ''}`}>{task.title || 'Untitled'}</div>

      {/* Description */}
      {task.description && (
        <div className="card-desc">{task.description}</div>
      )}

      {/* Meta row */}
      <div className="card-meta">
        {dueLbl && (
          <span className={`card-due ${urgency ?? ''}`}>
            <Clock size={10} />
            {dueLbl}
          </span>
        )}
        <span className={`priority-chip ${task.priority}`}>
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="card-tags">
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag-chip">#{tag}</span>
          ))}
          {task.tags.length > 3 && (
            <span className="tag-chip">+{task.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}
