/**
 * Filter tasks based on filter state.
 */
export function filterTasks(tasks, filters) {
  return tasks.filter((t) => {
    if (filters.subjectId !== 'all' && t.subjectId !== filters.subjectId) return false
    if (filters.priority !== 'all' && t.priority !== filters.priority) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (
        !t.title.toLowerCase().includes(q) &&
        !t.description?.toLowerCase().includes(q) &&
        !(t.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      ) return false
    }
    return true
  })
}

/**
 * Group tasks by status for Kanban.
 */
export function groupByStatus(tasks) {
  return {
    pending: tasks.filter((t) => t.status === 'pending'),
    ongoing: tasks.filter((t) => t.status === 'ongoing'),
    complete: tasks.filter((t) => t.status === 'complete'),
  }
}

/**
 * Sort tasks by due date (nulls last), then priority.
 */
export function sortTasks(tasks) {
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  return [...tasks].sort((a, b) => {
    if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate)
    if (a.dueDate) return -1
    if (b.dueDate) return 1
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
  })
}

/**
 * Get subject by ID from list.
 */
export function getSubject(subjects, id) {
  return subjects.find((s) => s.id === id) ?? null
}

/**
 * Generate a random pleasant color from a curated palette.
 */
const PALETTE = [
  '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#3b82f6',
]
export function randomColor() {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)]
}

/**
 * Count overdue tasks.
 */
export function countOverdue(tasks) {
  const now = new Date()
  return tasks.filter(
    (t) => t.status !== 'complete' && t.dueDate && new Date(t.dueDate) < now
  ).length
}

/**
 * Compute completion stats for stats view.
 */
export function computeStats(tasks, subjects) {
  const total = tasks.length
  const complete = tasks.filter((t) => t.status === 'complete').length
  const pending = tasks.filter((t) => t.status === 'pending').length
  const ongoing = tasks.filter((t) => t.status === 'ongoing').length
  const overdue = countOverdue(tasks)
  const rate = total > 0 ? Math.round((complete / total) * 100) : 0

  const bySubject = subjects.map((sub) => {
    const subTasks = tasks.filter((t) => t.subjectId === sub.id)
    const done = subTasks.filter((t) => t.status === 'complete').length
    return { ...sub, total: subTasks.length, done, rate: subTasks.length > 0 ? Math.round((done / subTasks.length) * 100) : 0 }
  })

  return { total, complete, pending, ongoing, overdue, rate, bySubject }
}
