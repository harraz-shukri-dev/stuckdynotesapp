import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday, isSameMonth, addMonths, subMonths } from 'date-fns'
import useStore from '../store'
import { getUrgency } from '../utils/dateUtils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PRIORITY_COLORS = { high: '#ef4444', medium: '#f59e0b', low: '#6b7280' }

export default function CalendarView({ onEdit }) {
  const { tasks, subjects }  = useStore()
  const [current, setCurrent] = useState(new Date())
  const [selected, setSelected] = useState(null)

  const monthStart = startOfMonth(current)
  const monthEnd   = endOfMonth(current)
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad   = getDay(monthStart)  // 0=Sun

  // Tasks with due dates
  const tasksWithDue = tasks.filter((t) => t.dueDate)

  const tasksOnDay = (day) =>
    tasksWithDue.filter((t) => isSameDay(new Date(t.dueDate), day))

  const selectedTasks = selected ? tasksOnDay(selected) : []

  return (
    <div className="calendar-view">
      {/* Navigation */}
      <div className="calendar-nav">
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCurrent(subMonths(current, 1))}>
          <ChevronLeft size={16} />
        </button>
        <span className="calendar-month-label">{format(current, 'MMMM yyyy')}</span>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setCurrent(addMonths(current, 1))}>
          <ChevronRight size={16} />
        </button>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => { setCurrent(new Date()); setSelected(new Date()) }}
        >
          Today
        </button>
      </div>

      {/* Weekday labels + Day grid */}
      <div className="calendar-grid">
        {/* Weekday headers */}
        {WEEKDAYS.map((d) => (
          <div key={d} className="calendar-weekday">{d}</div>
        ))}

        {/* Leading blank cells */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="calendar-day other-month" />
        ))}

        {/* Actual days */}
        {days.map((day) => {
          const dayTasks = tasksOnDay(day)
          const isSelected = selected && isSameDay(day, selected)

          return (
            <div
              key={day.toISOString()}
              className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelected(isSameDay(day, selected ?? new Date(0)) ? null : day)}
            >
              <span className="calendar-day-num">{format(day, 'd')}</span>
              {dayTasks.length > 0 && (
                <div className="calendar-dots">
                  {dayTasks.slice(0, 4).map((t) => (
                    <span
                      key={t.id}
                      className="calendar-dot"
                      style={{ background: PRIORITY_COLORS[t.priority] ?? 'var(--accent)' }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Selected day tasks */}
      {selected && (
        <div className="calendar-day-tasks">
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            {format(selected, 'EEEE, MMMM d')} · {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}
          </div>
          {selectedTasks.length === 0 ? (
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
              No tasks due this day 🎉
            </div>
          ) : (
            selectedTasks.map((task) => {
              const subj = subjects.find((s) => s.id === task.subjectId)
              const urgency = getUrgency(task.dueDate)
              return (
                <div
                  key={task.id}
                  className="list-item"
                  style={{ padding: '7px 10px', marginBottom: 4, cursor: 'pointer' }}
                  onClick={() => onEdit(task)}
                >
                  <span
                    className="list-status-dot"
                    style={{ background: PRIORITY_COLORS[task.priority] }}
                  />
                  <div className="list-item-content">
                    <div className={`list-item-title ${task.status === 'complete' ? 'completed' : ''}`}>
                      {task.title}
                    </div>
                    {subj && (
                      <div className="list-item-sub" style={{ color: subj.color }}>{subj.code}</div>
                    )}
                  </div>
                  <span className={`priority-chip ${task.priority}`} style={{ fontSize: 9 }}>
                    {task.priority}
                  </span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
