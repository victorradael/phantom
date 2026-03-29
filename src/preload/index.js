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
    openExternal:    (url) => ipcRenderer.invoke('open-external', url)  // FIX-3/FIX-4
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
