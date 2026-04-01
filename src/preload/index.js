import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
    toggleAlwaysOnTop:    () => ipcRenderer.invoke('toggle-always-on-top'),
    getAlwaysOnTop:       () => ipcRenderer.invoke('get-always-on-top'),
    openExtensionsFolder: () => ipcRenderer.invoke('open-extensions-folder'),
    installBitwarden:     () => ipcRenderer.invoke('install-bitwarden'),
    getUrls:              () => ipcRenderer.invoke('get-urls'),
    saveUrls:        (urls) => ipcRenderer.invoke('save-urls', urls),
    getAppVersion:        () => ipcRenderer.invoke('get-app-version'),
    quitApp:              () => ipcRenderer.invoke('quit-app'),          // FIX-2
    openExternal:    (url) => ipcRenderer.invoke('open-external', url), // FIX-3/FIX-4
    // Workspaces
    getWorkspaces:               () => ipcRenderer.invoke('get-workspaces'),
    saveWorkspaces:  (workspaces) => ipcRenderer.invoke('save-workspaces', workspaces),
    // Links
    getLinks:                    () => ipcRenderer.invoke('get-links'),
    saveLinks:           (links) => ipcRenderer.invoke('save-links', links),
    // Sync config
    getSyncConfig:               () => ipcRenderer.invoke('get-sync-config'),
    saveSyncConfig:     (config) => ipcRenderer.invoke('save-sync-config', config),
    // API operations (run in main process, bypasses renderer CSP)
    testApiConnection:    (url) => ipcRenderer.invoke('test-api-connection', url),
    syncWorkspace:     (payload) => ipcRenderer.invoke('sync-workspace', payload),
    pullSync:            (url) => ipcRenderer.invoke('pull-sync', url)
}

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        if (import.meta.env?.DEV) console.error(error)
    }
} else {
    window.electron = electronAPI
    window.api = api
}
