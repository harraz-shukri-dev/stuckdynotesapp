import React from 'react'
import { CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ICONS = {
  success: <CheckCircle size={14} color="var(--status-complete)" />,
  error:   <AlertCircle size={14} color="var(--priority-high)" />,
  info:    <Info        size={14} color="var(--accent)" />,
  warning: <AlertTriangle size={14} color="var(--priority-medium)" />,
}

export default function Toast({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {ICONS[t.type] ?? ICONS.info}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}
