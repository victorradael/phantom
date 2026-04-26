import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
    toggleAlwaysOnTop:    () => ipcRenderer.invoke('toggle-always-on-top'),
    getAlwaysOnTop:       () => ipcRenderer.invoke('get-always-on-top'),
    openExtensionsFolder: () => ipcRenderer.invoke('open-extensions-folder'),
    installBitwarden:     () => ipcRenderer.invoke('install-bitwarden'),
    getUrls:              () => ipcRenderer.invoke('get-urls'),
    saveUrls:        (urls) => ipcRenderer.invoke('save-urls', urls),
    getAppVersion:        () => ipcRenderer.invoke('get-app-version'),
    quitApp:              () => ipcRenderer.invoke('quit-app'),
    openExternal:    (url) => ipcRenderer.invoke('open-external', url),
    // Workspaces
    getWorkspaces:               () => ipcRenderer.invoke('get-workspaces'),
    saveWorkspaces:  (workspaces) => ipcRenderer.invoke('save-workspaces', workspaces),
    // Links
    getLinks:                    () => ipcRenderer.invoke('get-links'),
    saveLinks:           (links) => ipcRenderer.invoke('save-links', links),
    // Sync config
    getSyncConfig:               () => ipcRenderer.invoke('get-sync-config'),
    saveSyncConfig:     (config) => ipcRenderer.invoke('save-sync-config', config),
    // Sync analysis
    getSyncAnalysis:             () => ipcRenderer.invoke('get-sync-analysis'),
    saveSyncAnalysis: (analysis) => ipcRenderer.invoke('save-sync-analysis', analysis),
    // Updater
    checkForUpdates:             () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate:              () => ipcRenderer.invoke('download-update'),
    installUpdate:               () => ipcRenderer.invoke('install-update'),
    onUpdateAvailable:    (cb) => ipcRenderer.on('update-available', (_, info) => cb(info)),
    onUpdateNotAvailable: (cb) => ipcRenderer.on('update-not-available', (_, info) => cb(info)),
    onDownloadProgress:   (cb) => ipcRenderer.on('download-progress', (_, progress) => cb(progress)),
    onUpdateDownloaded:   (cb) => ipcRenderer.on('update-downloaded', (_, info) => cb(info)),
    onUpdateError:        (cb) => ipcRenderer.on('update-error', (_, message) => cb(message)),
    // API operations (run in main process, bypasses renderer CSP)
    testApiConnection:    (url) => ipcRenderer.invoke('test-api-connection', url),
    syncWorkspace:     (payload) => ipcRenderer.invoke('sync-workspace', payload),
    pullSync:           (apiUrl) => ipcRenderer.invoke('pull-sync', apiUrl),
    deleteSyncedLink:   (payload) => ipcRenderer.invoke('delete-synced-link', payload),
    updateSyncedLink:   (payload) => ipcRenderer.invoke('update-synced-link', payload),
    deleteSyncedWorkspace: (payload) => ipcRenderer.invoke('delete-synced-workspace', payload)
})
