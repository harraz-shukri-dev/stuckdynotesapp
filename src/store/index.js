import { create } from 'zustand'

// ─── Helpers ───────────────────────────────────────────────────────────────────
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

const defaultSettings = {
  mode: 'student',         // 'student' | 'employee' | 'both'
  theme: 'dark',           // 'dark' | 'light' | 'system'
  accentColor: '#7c3aed',
  startWithWindows: false,
  alwaysOnTop: false,
  notifications: true,
  defaultView: 'kanban',
  badgeColors: {
    pending: '#f59e0b',
    ongoing: '#3b82f6',
    complete: '#10b981',
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#6b7280',
  },
}

// ─── Zustand Store ─────────────────────────────────────────────────────────────
const useStore = create((set, get) => ({
  tasks: [],
  subjects: [],          // { id, code, name, color, type: 'subject'|'project' }
  settings: defaultSettings,
  isLoaded: false,
  activeView: 'kanban',  // 'kanban' | 'list' | 'calendar' | 'stats' | 'settings'
  filters: {
    subjectId: 'all',
    priority: 'all',
    search: '',
  },

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  initStore: async () => {
    try {
      const data = await window.electronAPI.getStore()
      if (data) {
        set({
          tasks: data.tasks ?? [],
          subjects: data.subjects ?? [],
          settings: { ...defaultSettings, ...(data.settings ?? {}) },
          isLoaded: true,
        })
      } else {
        set({ isLoaded: true })
      }
    } catch {
      set({ isLoaded: true })
    }
  },

  // ── Persist ────────────────────────────────────────────────────────────────
  _persist: async () => {
    const { tasks, subjects, settings } = get()
    try {
      await window.electronAPI.setStore({ tasks, subjects, settings })
    } catch (e) {
      console.error('[Store] Persist failed:', e)
    }
  },

  // ── Navigation ─────────────────────────────────────────────────────────────
  setActiveView: (view) => set({ activeView: view }),
  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),
  resetFilters: () =>
    set({ filters: { subjectId: 'all', priority: 'all', search: '' } }),

  // ── Tasks ──────────────────────────────────────────────────────────────────
  addTask: (task) => {
    const newTask = {
      id: uuidv4(),
      title: '',
      description: '',
      subjectId: null,
      status: 'pending',
      priority: 'medium',
      dueDate: null,
      dueTime: null,
      tags: [],
      reminder: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      ...task,
    }
    set((s) => ({ tasks: [...s.tasks, newTask] }))
    get()._persist()
    return newTask
  },

  updateTask: (id, updates) => {
    set((s) => ({
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t
        const wasComplete = t.status === 'complete'
        const isNowComplete = updates.status === 'complete'
        return {
          ...t,
          ...updates,
          updatedAt: new Date().toISOString(),
          completedAt: isNowComplete && !wasComplete
            ? new Date().toISOString()
            : (!isNowComplete ? null : t.completedAt),
        }
      }),
    }))
    get()._persist()
  },

  deleteTask: (id) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
    get()._persist()
  },

  moveTask: (id, newStatus) => get().updateTask(id, { status: newStatus }),

  // ── Subjects / Projects ────────────────────────────────────────────────────
  addSubject: (subject) => {
    const newSubject = {
      id: uuidv4(),
      code: '',
      name: '',
      color: '#7c3aed',
      type: 'subject',
      ...subject,
    }
    set((s) => ({ subjects: [...s.subjects, newSubject] }))
    get()._persist()
    return newSubject
  },

  updateSubject: (id, updates) => {
    set((s) => ({
      subjects: s.subjects.map((sub) =>
        sub.id === id ? { ...sub, ...updates } : sub
      ),
    }))
    get()._persist()
  },

  deleteSubject: (id) => {
    set((s) => ({
      subjects: s.subjects.filter((sub) => sub.id !== id),
      tasks: s.tasks.map((t) =>
        t.subjectId === id ? { ...t, subjectId: null } : t
      ),
    }))
    get()._persist()
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  updateSettings: (updates) => {
    set((s) => ({ settings: { ...s.settings, ...updates } }))
    get()._persist()
  },
}))

export default useStore
