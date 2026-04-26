import { app, shell, BrowserWindow, ipcMain, Menu, safeStorage } from 'electron'
import { join } from 'path'
import Store from 'electron-store'
import fs from 'fs'
import { autoUpdater } from 'electron-updater'

const isDev = process.env.NODE_ENV === 'development'
const store = new Store()

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

// Suppress some noisy Electron/Chromium logs on Linux
app.commandLine.appendSwitch('log-level', '3')
app.commandLine.appendSwitch('disable-gpu-process-crash-log')

// MIGRATION: Check if upgrading from Mini Browser
// If so, move user data to new Phantom directory
const phantomPath = app.getPath('userData') // Default: ~/.config/Phantom
const miniBrowserPath = join(app.getPath('appData'), 'Mini Browser')

const runMigration = () => {
    if (!fs.existsSync(miniBrowserPath)) return
    if (fs.existsSync(phantomPath)) return

    try {
        fs.renameSync(miniBrowserPath, phantomPath)
        if (isDev) console.log('[Migration] Mini Browser -> Phantom: success')
    } catch (renameErr) {
        // Cross-device rename fails with EXDEV; fall back to recursive copy
        if (renameErr.code === 'EXDEV') {
            try {
                fs.cpSync(miniBrowserPath, phantomPath, { recursive: true })
                fs.rmSync(miniBrowserPath, { recursive: true, force: true })
                if (isDev) console.log('[Migration] Mini Browser -> Phantom: cross-device copy success')
            } catch (copyErr) {
                console.error('[Migration] Failed to copy:', copyErr)
            }
        } else {
            console.error('[Migration] Failed to rename:', renameErr)
        }
    }
}

runMigration()

// Set the application name clearly for the window manager (helpful for GNOME)
app.setName('Phantom')

// Linux: Explicitly link to the desktop file for icon association in dev mode
if (isDev && process.platform === 'linux') {
    app.setDesktopName('phantom-dev.desktop')
}

// Lightweight IPC rate limiter
// Allows at most `limit` calls per `windowMs` milliseconds per channel per sender.
const ipcCallCounts = new Map()
function rateLimitedHandle(channel, limit, windowMs, handler) {
    ipcMain.handle(channel, (event, ...args) => {
        const now = Date.now()
        const key = `${channel}:${event.sender.id}`
        const entry = ipcCallCounts.get(key) || { count: 0, resetAt: now + windowMs }
        if (now > entry.resetAt) {
            entry.count = 0
            entry.resetAt = now + windowMs
        }
        entry.count++
        ipcCallCounts.set(key, entry)
        if (entry.count > limit) {
            if (isDev) console.warn(`[IPC] Rate limit exceeded for channel: ${channel}`)
            return null
        }
        return handler(event, ...args)
    })
}

function createWindow() {
    // In dev, icons live in public/ (served by Vite); in prod, Vite copies public/ to dist/
    const iconsDir = process.env.VITE_DEV_SERVER_URL
        ? join(__dirname, '../public')
        : join(__dirname, '../dist')
    const iconPath = process.platform === 'win32'
        ? join(iconsDir, 'icon.ico')
        : join(iconsDir, 'icon.png')

    const mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        frame: false,
        alwaysOnTop: true,
        icon: iconPath,
        webPreferences: {
            preload: join(__dirname, 'preload.js'),
            sandbox: true,
            contextIsolation: true,
            webviewTag: true
        }
    })

    // Better Wayland compatibility for visible on all workspaces
    mainWindow.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true
    })

    mainWindow.on('ready-to-show', () => {
        if (isDev) console.log('[Window] ready-to-show')
        mainWindow.show()

        // Wayland sometimes needs a small delay after show to respect alwaysOnTop
        setTimeout(() => { mainWindow.setAlwaysOnTop(true) }, 200)

        // Check for updates after startup (only in packaged app)
        if (app.isPackaged) {
            setTimeout(() => autoUpdater.checkForUpdates(), 3000)
        }
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html'))
    }

    // Auto-updater events — relay to renderer
    autoUpdater.on('update-available', (info) => {
        mainWindow.webContents.send('update-available', info)
    })
    autoUpdater.on('update-not-available', (info) => {
        mainWindow.webContents.send('update-not-available', info)
    })
    autoUpdater.on('download-progress', (progress) => {
        mainWindow.webContents.send('download-progress', progress)
    })
    autoUpdater.on('update-downloaded', (info) => {
        mainWindow.webContents.send('update-downloaded', info)
    })
    autoUpdater.on('error', (err) => {
        mainWindow.webContents.send('update-error', err.message)
    })

    // Auto-updater IPC handlers
    rateLimitedHandle('check-for-updates', 3, 60000, () => {
        if (app.isPackaged) autoUpdater.checkForUpdates()
    })
    rateLimitedHandle('download-update', 1, 300000, () => {
        autoUpdater.downloadUpdate()
    })
    rateLimitedHandle('install-update', 1, 60000, () => {
        autoUpdater.quitAndInstall()
    })

    // Always on top toggle IPC
    rateLimitedHandle('toggle-always-on-top', 20, 1000, () => {
        const isAlwaysOnTop = mainWindow.isAlwaysOnTop()
        const newState = !isAlwaysOnTop
        mainWindow.setAlwaysOnTop(newState)
        return newState
    })

    rateLimitedHandle('get-always-on-top', 60, 1000, () => {
        return mainWindow.isAlwaysOnTop()
    })

    // URL Persistence IPC with safeStorage encryption (FIX-9)
    // Falls back to plain storage when safeStorage is unavailable (headless Linux).
    // On first run with existing unencrypted data, migrates to encrypted format.
    rateLimitedHandle('get-urls', 10, 1000, () => {
        try {
            const encrypted = store.get('urls_v2')
            if (encrypted && safeStorage.isEncryptionAvailable()) {
                const decrypted = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
                return JSON.parse(decrypted)
            }
        } catch { /* fall through to legacy */ }

        const legacy = store.get('urls') || []
        if (legacy.length > 0 && safeStorage.isEncryptionAvailable()) {
            try {
                const enc = safeStorage.encryptString(JSON.stringify(legacy)).toString('base64')
                store.set('urls_v2', enc)
                store.delete('urls')
            } catch { /* keep legacy on migration failure */ }
        }
        return legacy
    })

    rateLimitedHandle('save-urls', 5, 1000, (_, urls) => {
        if (safeStorage.isEncryptionAvailable()) {
            const enc = safeStorage.encryptString(JSON.stringify(urls)).toString('base64')
            store.set('urls_v2', enc)
        } else {
            store.set('urls', urls)
        }
        return true
    })

    // App Version IPC
    rateLimitedHandle('get-app-version', 10, 10000, () => {
        return app.getVersion()
    })

    // App Quit IPC
    rateLimitedHandle('quit-app', 3, 5000, () => {
        app.quit()
    })

    // FIX-3: Open external URL safely — validates protocol before delegating to shell
    rateLimitedHandle('open-external', 10, 5000, async (_, url) => {
        try {
            const parsed = new URL(url)
            if (!['https:', 'http:'].includes(parsed.protocol)) return false
        } catch {
            return false
        }
        await shell.openExternal(url)
        return true
    })

    // FIX-3: Open user's extensions directory (creates it if missing)
    rateLimitedHandle('open-extensions-folder', 5, 5000, async () => {
        const extensionsPath = join(app.getPath('userData'), 'extensions')
        if (!fs.existsSync(extensionsPath)) {
            fs.mkdirSync(extensionsPath, { recursive: true })
        }
        await shell.openPath(extensionsPath)
        return extensionsPath
    })

    // FIX-3: Open the Bitwarden extension page instead of running shell commands
    rateLimitedHandle('install-bitwarden', 3, 5000, async () => {
        await shell.openExternal(
            'https://chromewebstore.google.com/detail/bitwarden/nngceckbapebfimnlniiiahkandclblb'
        )
        return true
    })

    // Workspace persistence
    rateLimitedHandle('get-workspaces', 20, 1000, () => {
        return store.get('workspaces', [])
    })

    rateLimitedHandle('save-workspaces', 10, 1000, (_, workspaces) => {
        store.set('workspaces', workspaces)
        return true
    })

    // Links persistence
    rateLimitedHandle('get-links', 20, 1000, () => {
        return store.get('links', [])
    })

    rateLimitedHandle('save-links', 10, 1000, (_, links) => {
        store.set('links', links)
        return true
    })

    // Sync configuration persistence
    rateLimitedHandle('get-sync-config', 20, 1000, () => {
        return store.get('syncConfig', { apiUrl: '', lastSynced: null })
    })

    rateLimitedHandle('save-sync-config', 10, 1000, (_, config) => {
        store.set('syncConfig', config)
        return true
    })

    // Sync analysis persistence
    rateLimitedHandle('get-sync-analysis', 20, 1000, () => {
        return store.get('syncAnalysis', { workspaces: {}, links: {}, lastAnalyzedAt: null })
    })

    rateLimitedHandle('save-sync-analysis', 10, 1000, (_, analysis) => {
        store.set('syncAnalysis', analysis)
        return true
    })

    // Test API connection — runs from main process to avoid CSP restrictions
    rateLimitedHandle('test-api-connection', 5, 5000, async (_, apiUrl) => {
        try {
            const parsed = new URL(apiUrl)
            if (!['https:', 'http:'].includes(parsed.protocol)) {
                return { ok: false, error: 'Invalid protocol — use http or https' }
            }
            const base = parsed.origin + parsed.pathname.replace(/\/$/, '')
            const res = await fetch(`${base}/health`, {
                signal: AbortSignal.timeout(5000)
            })
            if (res.ok) return { ok: true }
            return { ok: false, error: `HTTP ${res.status}` }
        } catch (err) {
            return { ok: false, error: err.message || 'Connection failed' }
        }
    })

    // Update a single link from backend
    rateLimitedHandle('update-synced-link', 10, 5000, async (_, { apiUrl, uuid, payload }) => {
        try {
            const parsed = new URL(apiUrl)
            if (!['https:', 'http:'].includes(parsed.protocol)) {
                return { ok: false, error: 'Invalid protocol — use http or https' }
            }
            const base = parsed.origin + parsed.pathname.replace(/\/$/, '')
            const res = await fetch(`${base}/sync/link/${encodeURIComponent(uuid)}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(10000)
            })
            return res.ok ? { ok: true } : { ok: false, error: `HTTP ${res.status}` }
        } catch (err) {
            return { ok: false, error: err.message || 'Update failed' }
        }
    })

    // Delete a single link from backend
    rateLimitedHandle('delete-synced-link', 10, 5000, async (_, { apiUrl, uuid }) => {
        try {
            const parsed = new URL(apiUrl)
            if (!['https:', 'http:'].includes(parsed.protocol)) {
                return { ok: false, error: 'Invalid protocol — use http or https' }
            }
            const base = parsed.origin + parsed.pathname.replace(/\/$/, '')
            const res = await fetch(`${base}/sync/link/${encodeURIComponent(uuid)}`, {
                method: 'DELETE',
                signal: AbortSignal.timeout(10000)
            })
            return res.ok || res.status === 404 ? { ok: true } : { ok: false, error: `HTTP ${res.status}` }
        } catch (err) {
            return { ok: false, error: err.message || 'Delete failed' }
        }
    })

    // Delete a workspace (and cascade links) from backend
    rateLimitedHandle('delete-synced-workspace', 5, 5000, async (_, { apiUrl, uuid }) => {
        try {
            const parsed = new URL(apiUrl)
            if (!['https:', 'http:'].includes(parsed.protocol)) {
                return { ok: false, error: 'Invalid protocol — use http or https' }
            }
            const base = parsed.origin + parsed.pathname.replace(/\/$/, '')
            const res = await fetch(`${base}/sync/workspace/${encodeURIComponent(uuid)}`, {
                method: 'DELETE',
                signal: AbortSignal.timeout(10000)
            })
            return res.ok || res.status === 404 ? { ok: true } : { ok: false, error: `HTTP ${res.status}` }
        } catch (err) {
            return { ok: false, error: err.message || 'Delete failed' }
        }
    })

    // Pull all workspaces and links from backend
    rateLimitedHandle('pull-sync', 5, 5000, async (_, apiUrl) => {
        try {
            const parsed = new URL(apiUrl)
            if (!['https:', 'http:'].includes(parsed.protocol)) {
                return { ok: false, error: 'Invalid protocol — use http or https' }
            }
            const base = parsed.origin + parsed.pathname.replace(/\/$/, '')
            const res = await fetch(`${base}/sync`, { signal: AbortSignal.timeout(10000) })
            if (res.ok) {
                const data = await res.json()
                return { ok: true, data }
            }
            const errorText = await res.text().catch(() => '')
            return { ok: false, error: `HTTP ${res.status}${errorText ? ': ' + errorText : ''}` }
        } catch (err) {
            return { ok: false, error: err.message || 'Pull failed' }
        }
    })

    // Sync workspace to backend — runs from main process to avoid CSP restrictions
    rateLimitedHandle('sync-workspace', 60, 60000, async (_, { apiUrl, workspace, links }) => {
        try {
            const parsed = new URL(apiUrl)
            if (!['https:', 'http:'].includes(parsed.protocol)) {
                return { ok: false, error: 'Invalid protocol — use http or https' }
            }
            const base = parsed.origin + parsed.pathname.replace(/\/$/, '')
            const res = await fetch(`${base}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workspace, links }),
                signal: AbortSignal.timeout(15000)
            })
            if (res.ok) {
                const data = await res.json()
                return { ok: true, data }
            }
            const errorText = await res.text().catch(() => '')
            return { ok: false, error: `HTTP ${res.status}${errorText ? ': ' + errorText : ''}` }
        } catch (err) {
            return { ok: false, error: err.message || 'Sync failed' }
        }
    })
}

// Global Context Menu (Keep for general usability)
app.on('web-contents-created', (_, contents) => {
    contents.on('context-menu', (_, params) => {
        const menu = Menu.buildFromTemplate([
            { label: 'Cut', role: 'cut' },
            { label: 'Copy', role: 'copy' },
            { label: 'Paste', role: 'paste' },
            { type: 'separator' },
            { label: 'Inspect Element', click: () => contents.inspectElement(params.x, params.y) }
        ])
        menu.popup()
    })
})

app.whenReady().then(() => {
    app.setAppUserModelId('com.victorradael.phantom')
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    if (isDev) console.log('[App] Ready, createWindow called')
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
