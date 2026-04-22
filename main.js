const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  globalShortcut,
  nativeImage,
  Notification,
  shell,
} = require('electron')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const fs = require('fs')

const isDev = process.env.ELECTRON_IS_DEV === '1'

// Set app name shown in Windows notifications & taskbar
app.setAppUserModelId('StuckDyNotes')

let mainWindow
let tray

// ─── Persistent Store (JSON file) ─────────────────────────────────────────────
const storePath = path.join(app.getPath('userData'), 'stuckdynotes-store.json')

function readStore() {
  try {
    if (fs.existsSync(storePath)) {
      return JSON.parse(fs.readFileSync(storePath, 'utf-8'))
    }
  } catch (e) {
    console.error('[Store] Read error:', e)
  }
  return null
}

function writeStore(data) {
  try {
    fs.writeFileSync(storePath, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (e) {
    console.error('[Store] Write error:', e)
    return false
  }
}

// ─── Main Window ───────────────────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 520,
    height: 740,
    minWidth: 400,
    minHeight: 520,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f0f1a',
    resizable: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: isDev,
    },
    show: false,
    skipTaskbar: false,
  })

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, 'dist', 'index.html')}`

  mainWindow.loadURL(startUrl)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' })
  })

}

// ─── System Tray ───────────────────────────────────────────────────────────────
function createTray() {
  // Prefer dedicated small tray icon, fall back to main app icon
  const trayIconPath = path.join(__dirname, 'assets', 'tray-icon.png')
  const appIconPath  = path.join(__dirname, 'assets', 'icon.png')
  let icon

  try {
    const primaryPath = fs.existsSync(trayIconPath) ? trayIconPath : appIconPath
    icon = nativeImage.createFromPath(primaryPath)
    if (icon.isEmpty()) icon = nativeImage.createEmpty()
    // Resize to 16x16 for tray
    if (!icon.isEmpty()) icon = icon.resize({ width: 16, height: 16 })
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('StuckDyNotes')

  const menu = Menu.buildFromTemplate([
    {
      label: 'Open StuckDyNotes',
      click: () => { mainWindow.show(); mainWindow.focus() },
    },
    { type: 'separator' },
    {
      label: 'Quick Add Task',
      accelerator: 'CommandOrControl+Shift+N',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('quick-add-task')
      },
    },
    { type: 'separator' },
    {
      label: 'Quit StuckDyNotes',
      click: () => { tray.destroy(); app.exit(0) },
    },
  ])

  tray.setContextMenu(menu)
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus() })
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow()
  createTray()

  // Check for updates
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify()

    autoUpdater.on('checking-for-update', () => mainWindow?.webContents.send('update-status', { status: 'checking' }))
    autoUpdater.on('update-available', () => mainWindow?.webContents.send('update-status', { status: 'available' }))
    autoUpdater.on('update-not-available', () => mainWindow?.webContents.send('update-status', { status: 'not-available' }))
    autoUpdater.on('update-downloaded', () => mainWindow?.webContents.send('update-status', { status: 'downloaded' }))
    autoUpdater.on('error', (err) => mainWindow?.webContents.send('update-status', { status: 'error', error: err.message }))
  }

  // Global shortcut: Ctrl+Shift+N → quick add
  globalShortcut.register('CommandOrControl+Shift+N', () => {
    if (!mainWindow.isVisible()) mainWindow.show()
    mainWindow.focus()
    mainWindow.webContents.send('quick-add-task')
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => globalShortcut.unregisterAll())

// ─── IPC Handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('get-store', () => readStore())
ipcMain.handle('set-store', (_, data) => writeStore(data))

ipcMain.handle('window-minimize', () => mainWindow.minimize())
ipcMain.handle('window-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
})
ipcMain.handle('window-close', () => app.quit())
ipcMain.handle('window-quit', () => { tray?.destroy(); app.exit(0) })

ipcMain.handle('toggle-always-on-top', (_, value) => {
  mainWindow.setAlwaysOnTop(value, 'floating')
  return mainWindow.isAlwaysOnTop()
})
ipcMain.handle('get-always-on-top', () => mainWindow.isAlwaysOnTop())

ipcMain.handle('show-notification', (_, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, silent: false }).show()
  }
})

ipcMain.handle('open-external', (_, url) => shell.openExternal(url))

ipcMain.handle('check-for-updates', () => {
  if (!isDev) autoUpdater.checkForUpdates()
})

ipcMain.handle('install-update', () => {
  if (!isDev) autoUpdater.quitAndInstall()
})
