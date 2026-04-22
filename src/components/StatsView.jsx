import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import useStore from '../store'
import { computeStats } from '../utils/helpers'

const STATUS_COLORS = {
  complete: '#10b981',
  ongoing:  '#3b82f6',
  pending:  '#f59e0b',
}

export default function StatsView() {
  const { tasks, subjects } = useStore()
  const stats = computeStats(tasks, subjects)

  const pieData = [
    { name: 'Complete', value: stats.complete, color: STATUS_COLORS.complete },
    { name: 'Ongoing',  value: stats.ongoing,  color: STATUS_COLORS.ongoing  },
    { name: 'Pending',  value: stats.pending,  color: STATUS_COLORS.pending  },
  ].filter((d) => d.value > 0)

  const summaryCards = [
    { label: 'Total',    value: stats.total,    color: 'var(--accent)'          },
    { label: 'Pending',  value: stats.pending,  color: 'var(--status-pending)'  },
    { label: 'Ongoing',  value: stats.ongoing,  color: 'var(--status-ongoing)'  },
    { label: 'Complete', value: stats.complete, color: 'var(--status-complete)' },
    { label: 'Overdue',  value: stats.overdue,  color: 'var(--priority-high)'   },
    { label: 'Rate %',   value: stats.rate,     color: 'var(--accent-cyan)'     },
  ]

  return (
    <div className="stats-view">
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
        📊 Overview
      </div>

      {/* Summary cards */}
      <div className="stats-grid">
        {summaryCards.map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-value" style={{ background: color, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {value}{label === 'Rate %' ? '%' : ''}
            </div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Donut chart */}
      {stats.total > 0 && (
        <div className="stats-section">
          <div className="stats-section-title">Completion Breakdown</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text-primary)',
                    fontSize: 11,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pieData.map((d) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{d.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>{d.value}</span>
                </div>
              ))}
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)', marginTop: 4 }}>
                {stats.rate}%
                <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 4 }}>complete</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Per-subject workload */}
      {stats.bySubject.length > 0 && (
        <div className="stats-section">
          <div className="stats-section-title">Workload by Subject / Project</div>
          {stats.bySubject.map((sub) => (
            <div key={sub.id} className="subject-bar-row">
              <div className="subject-bar-label" title={`${sub.code} — ${sub.name}`}>
                {sub.code}
              </div>
              <div className="subject-bar-track">
                <div
                  className="subject-bar-fill"
                  style={{
                    width: `${sub.rate}%`,
                    background: sub.color ?? 'var(--accent)',
                  }}
                />
              </div>
              <div className="subject-bar-count">{sub.done}/{sub.total}</div>
            </div>
          ))}
        </div>
      )}

      {stats.total === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No data yet</div>
          <div className="empty-state-desc">Add some tasks and they'll show up here.</div>
        </div>
      )}
    </div>
  )
}
