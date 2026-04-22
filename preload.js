const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Store persistence
  getStore: () => ipcRenderer.invoke('get-store'),
  setStore: (data) => ipcRenderer.invoke('set-store', data),

  // Window controls
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  quit: () => ipcRenderer.invoke('window-quit'),

  // Always on top
  toggleAlwaysOnTop: (v) => ipcRenderer.invoke('toggle-always-on-top', v),
  getAlwaysOnTop: () => ipcRenderer.invoke('get-always-on-top'),

  // Notifications
  showNotification: (title, body) =>
    ipcRenderer.invoke('show-notification', { title, body }),

  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Auto Updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (cb) => {
    ipcRenderer.on('update-status', cb)
    return () => ipcRenderer.removeListener('update-status', cb)
  },

  // Events from main → renderer
  onQuickAddTask: (cb) => {
    ipcRenderer.on('quick-add-task', cb)
    return () => ipcRenderer.removeListener('quick-add-task', cb)
  },

  platform: process.platform,
})
