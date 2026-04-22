import { formatDistanceToNow, isPast, isToday, isTomorrow, format, differenceInDays } from 'date-fns'

/**
 * Get urgency level based on due date.
 * Returns: 'overdue' | 'critical' | 'warning' | 'safe' | null
 */
export function getUrgency(dueDate) {
  if (!dueDate) return null
  const due = new Date(dueDate)
  if (isPast(due) && !isToday(due)) return 'overdue'
  const diff = differenceInDays(due, new Date())
  if (diff < 1) return 'critical'   // today
  if (diff <= 2) return 'warning'   // ≤2 days
  return 'safe'
}

/**
 * Human-readable label for due date.
 */
export function formatDueDate(dueDate) {
  if (!dueDate) return null
  const due = new Date(dueDate)
  if (isToday(due)) return 'Due Today'
  if (isTomorrow(due)) return 'Due Tomorrow'
  if (isPast(due)) return `Overdue · ${format(due, 'MMM d')}`
  return `Due ${format(due, 'MMM d, yyyy')}`
}

/**
 * Relative time label (e.g. "3 days ago")
 */
export function relativeTime(dateStr) {
  if (!dateStr) return ''
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

/**
 * Format a date string to display format.
 */
export function displayDate(dateStr, fmt = 'MMM d, yyyy') {
  if (!dateStr) return ''
  return format(new Date(dateStr), fmt)
}

/**
 * Get days remaining (negative = overdue).
 */
export function daysRemaining(dueDate) {
  if (!dueDate) return null
  return differenceInDays(new Date(dueDate), new Date())
}

/**
 * Get urgency color CSS variable name.
 */
export function urgencyColor(urgency) {
  const map = {
    overdue: 'var(--priority-high)',
    critical: 'var(--priority-high)',
    warning: 'var(--priority-medium)',
    safe: 'var(--status-complete)',
  }
  return map[urgency] ?? 'var(--text-muted)'
}
