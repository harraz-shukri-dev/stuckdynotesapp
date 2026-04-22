import React, { useContext } from 'react'
import { Search, Plus, Pencil, Trash2, CheckCheck, Clock } from 'lucide-react'
import useStore from '../store'
import { filterTasks, sortTasks, getSubject } from '../utils/helpers'
import { getUrgency, formatDueDate } from '../utils/dateUtils'
import { ToastCtx, ConfettiCtx } from '../App'

const STATUS_COLORS = {
  pending:  'var(--status-pending)',
  ongoing:  'var(--status-ongoing)',
  complete: 'var(--status-complete)',
}

const PRIORITY_LABELS = { high: '🔴 High', medium: '🟡 Med', low: '⚪ Low' }

export default function ListView({ onEdit }) {
  const { tasks, subjects, filters, setFilter, deleteTask, moveTask } = useStore()
  const toast     = useContext(ToastCtx)
  const fireCftti = useContext(ConfettiCtx)

  const filtered = sortTasks(filterTasks(tasks, filters))

  const handleComplete = (task) => {
    if (task.status !== 'complete') {
      moveTask(task.id, 'complete')
      fireCftti()
      toast('🎉 Task completed!', 'success')
    } else {
      moveTask(task.id, 'pending')
      toast('Task reopened', 'info')
    }
  }

  const handleDelete = (id) => {
    deleteTask(id)
    toast('Task deleted', 'info')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div className="view-header">
        <span className="view-title">List</span>

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
            <option key={s.id} value={s.id}>{s.code}</option>
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

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No tasks found</div>
          <div className="empty-state-desc">
            {filters.search ? 'Try a different search term' : 'Add your first task using the button above'}
          </div>
        </div>
      ) : (
        <div className="list-view">
          {filtered.map((task) => {
            const subject  = getSubject(subjects, task.subjectId)
            const urgency  = getUrgency(task.dueDate)
            const dueLbl   = formatDueDate(task.dueDate)
            const isComplete = task.status === 'complete'

            return (
              <div
                key={task.id}
                className="list-item"
                onClick={() => onEdit(task)}
              >
                {/* Status dot */}
                <span
                  className="list-status-dot"
                  style={{ background: STATUS_COLORS[task.status] }}
                />

                {/* Content */}
                <div className="list-item-content">
                  <div className={`list-item-title ${isComplete ? 'completed' : ''}`}>
                    {task.title || 'Untitled'}
                  </div>
                  <div className="list-item-sub">
                    {subject && (
                      <span style={{ color: subject.color, fontWeight: 600, marginRight: 6 }}>
                        {subject.code}
                      </span>
                    )}
                    {dueLbl && (
                      <span className={`card-due ${urgency ?? ''}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={9} />{dueLbl}
                      </span>
                    )}
                    {!dueLbl && !subject && (
                      <span>{PRIORITY_LABELS[task.priority]}</span>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <span className={`priority-chip ${task.priority}`} style={{ flexShrink: 0 }}>
                  {PRIORITY_LABELS[task.priority]}
                </span>

                {/* Actions */}
                <div className="list-item-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="card-action-btn complete-btn"
                    onClick={() => handleComplete(task)}
                    title={isComplete ? 'Reopen' : 'Mark complete'}
                  >
                    <CheckCheck size={13} />
                  </button>
                  <button
                    className="card-action-btn"
                    onClick={() => onEdit(task)}
                    title="Edit"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    className="card-action-btn delete"
                    onClick={() => handleDelete(task.id)}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
