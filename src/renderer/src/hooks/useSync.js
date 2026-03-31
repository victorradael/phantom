import { useState, useEffect } from 'react'

export function useSync() {
    const [apiUrl, setApiUrlState] = useState('')
    const [connectionStatus, setConnectionStatus] = useState('unconfigured') // 'unconfigured' | 'testing' | 'connected' | 'disconnected'
    const [lastSynced, setLastSynced] = useState(null)
    const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'success' | 'error'
    const [syncError, setSyncError] = useState(null)

    useEffect(() => {
        window.api.getSyncConfig().then((config) => {
            if (config?.apiUrl) {
                setApiUrlState(config.apiUrl)
                setConnectionStatus('disconnected')
            }
            if (config?.lastSynced) {
                setLastSynced(config.lastSynced)
            }
        })
    }, [])

    const setApiUrl = async (url) => {
        const trimmed = url.trim()
        setApiUrlState(trimmed)
        const config = await window.api.getSyncConfig()
        await window.api.saveSyncConfig({ ...config, apiUrl: trimmed })
        setConnectionStatus(trimmed ? 'disconnected' : 'unconfigured')
    }

    const testConnection = async () => {
        if (!apiUrl) return { ok: false, error: 'No API URL configured' }
        setConnectionStatus('testing')
        const result = await window.api.testApiConnection(apiUrl)
        setConnectionStatus(result.ok ? 'connected' : 'disconnected')
        return result
    }

    const syncWorkspace = async (workspace, links) => {
        if (!apiUrl || connectionStatus !== 'connected') {
            return { ok: false, error: 'Not connected to API' }
        }
        setSyncStatus('syncing')
        setSyncError(null)

        const linkPayload = links.map((l) => ({
            uuid: l.uuid,
            url: l.url,
            name: l.name || null,
            description: l.description || null
        }))

        const result = await window.api.syncWorkspace({
            apiUrl,
            workspace: { uuid: workspace.uuid, name: workspace.name },
            links: linkPayload
        })

        if (result.ok) {
            const now = new Date().toISOString()
            setLastSynced(now)
            const config = await window.api.getSyncConfig()
            await window.api.saveSyncConfig({ ...config, lastSynced: now })
            setSyncStatus('success')
            setTimeout(() => setSyncStatus('idle'), 3000)
        } else {
            setSyncStatus('error')
            setSyncError(result.error)
        }

        return result
    }

    return {
        apiUrl,
        setApiUrl,
        connectionStatus,
        testConnection,
        syncWorkspace,
        lastSynced,
        syncStatus,
        syncError,
        setSyncStatus
    }
}
