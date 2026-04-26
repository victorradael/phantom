import { useState, useEffect } from 'react'

export function useSync() {
    const [apiUrl, setApiUrlState] = useState('')
    const [connectionStatus, setConnectionStatus] = useState('unconfigured') // 'unconfigured' | 'testing' | 'connected' | 'disconnected'
    const [lastSynced, setLastSynced] = useState(null)
    const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'success' | 'error'
    const [syncError, setSyncError] = useState(null)
    const [syncAnalysis, setSyncAnalysis] = useState({ workspaces: {}, links: {}, lastAnalyzedAt: null })

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
        window.api.getSyncAnalysis().then((analysis) => {
            if (analysis) setSyncAnalysis(analysis)
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

    /**
     * Compares local workspaces/links against server data to determine sync status.
     * Workspace matching: by name (server UUID is authoritative on conflict).
     * Link matching: by URL first, then by name as fallback.
     *
     * Returns { uuidReconciliation } where uuidReconciliation is a map of
     * localUuid -> serverUuid for workspaces whose UUID needed updating.
     */
    const runAnalysis = async (localWorkspaces, localLinks, serverData) => {
        const { workspaces: serverWorkspaces, links: serverLinks } = serverData

        const newAnalysis = {
            workspaces: {},
            links: {},
            lastAnalyzedAt: new Date().toISOString()
        }

        // Index server workspaces by name (case-insensitive)
        const serverWorkspaceByName = {}
        serverWorkspaces.forEach((sw) => {
            serverWorkspaceByName[sw.name.toLowerCase()] = sw
        })

        // UUID reconciliation: localUuid -> serverUuid
        const uuidReconciliation = {}

        // Step 1: Determine which local workspaces exist on server
        for (const localWs of localWorkspaces) {
            const serverMatch = serverWorkspaceByName[localWs.name.toLowerCase()]
            if (!serverMatch) {
                newAnalysis.workspaces[localWs.uuid] = 'unsynced'
            } else {
                if (serverMatch.uuid !== localWs.uuid) {
                    uuidReconciliation[localWs.uuid] = serverMatch.uuid
                }
                // Workspace exists on server — status determined by links in Step 3
                // Use server UUID as the key going forward
                const effectiveUuid = serverMatch.uuid
                newAnalysis.workspaces[effectiveUuid] = 'checking'
            }
        }

        // Step 2: Build reconciled link list (update workspaceId references)
        const reconciledLinks = localLinks.map((link) => {
            const newWsId = uuidReconciliation[link.workspaceId]
            return newWsId ? { ...link, workspaceId: newWsId } : link
        })

        // Index server links by URL and name for matching
        const serverLinksByUrl = {}
        const serverLinksByName = {}
        serverLinks.forEach((sl) => {
            if (sl.url) serverLinksByUrl[sl.url] = sl
            if (sl.name) serverLinksByName[sl.name] = sl
        })

        // Step 3: Determine sync status for each local link
        for (const link of reconciledLinks) {
            const matchByUrl = serverLinksByUrl[link.url]
            const matchByName = link.name && serverLinksByName[link.name]
            newAnalysis.links[link.uuid] = (matchByUrl || matchByName) ? 'synced' : 'unsynced'
        }

        // Step 4: Determine workspace status based on its links
        // Build effective UUID list (after reconciliation)
        const effectiveWorkspaces = localWorkspaces.map((ws) => ({
            ...ws,
            uuid: uuidReconciliation[ws.uuid] || ws.uuid
        }))

        for (const ws of effectiveWorkspaces) {
            if (newAnalysis.workspaces[ws.uuid] === 'unsynced') continue

            const wsLinks = reconciledLinks.filter((l) => l.workspaceId === ws.uuid)
            const unsyncedCount = wsLinks.filter((l) => newAnalysis.links[l.uuid] === 'unsynced').length

            if (wsLinks.length === 0 || unsyncedCount === 0) {
                newAnalysis.workspaces[ws.uuid] = 'synced'
            } else {
                newAnalysis.workspaces[ws.uuid] = 'partial'
            }
        }

        setSyncAnalysis(newAnalysis)
        await window.api.saveSyncAnalysis(newAnalysis)

        return { uuidReconciliation }
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

    /**
     * Syncs a single link to the server (auto-creates workspace if it doesn't exist there).
     * Updates syncAnalysis for the link and recalculates its workspace status.
     * allWorkspaceLinks: all links belonging to the same workspace (for status recalculation).
     */
    const syncSingleLink = async (workspace, linkToSync, allWorkspaceLinks) => {
        if (!apiUrl || connectionStatus !== 'connected') {
            return { ok: false, error: 'Not connected to API' }
        }

        const result = await window.api.syncWorkspace({
            apiUrl,
            workspace: { uuid: workspace.uuid, name: workspace.name },
            links: [{
                uuid: linkToSync.uuid,
                url: linkToSync.url,
                name: linkToSync.name || null,
                description: linkToSync.description || null
            }]
        })

        if (result.ok) {
            setSyncAnalysis((prev) => {
                const updatedLinks = { ...prev.links, [linkToSync.uuid]: 'synced' }

                const remainingUnsynced = allWorkspaceLinks.filter((l) =>
                    l.uuid !== linkToSync.uuid && updatedLinks[l.uuid] === 'unsynced'
                ).length

                const workspaceStatus = remainingUnsynced === 0 ? 'synced' : 'partial'

                const updated = {
                    ...prev,
                    links: updatedLinks,
                    workspaces: { ...prev.workspaces, [workspace.uuid]: workspaceStatus }
                }
                window.api.saveSyncAnalysis(updated)
                return updated
            })
        }

        return result
    }

    const removeAnalysisEntries = ({ workspaceUuid, linkUuids = [] }) => {
        setSyncAnalysis((prev) => {
            const workspaces = { ...prev.workspaces }
            const links = { ...prev.links }
            if (workspaceUuid) delete workspaces[workspaceUuid]
            linkUuids.forEach((uuid) => delete links[uuid])
            const updated = { ...prev, workspaces, links }
            window.api.saveSyncAnalysis(updated)
            return updated
        })
    }

    const pullSync = async () => {
        if (!apiUrl || connectionStatus !== 'connected') {
            return { ok: false, error: 'Not connected to API' }
        }
        return await window.api.pullSync(apiUrl)
    }

    return {
        apiUrl,
        setApiUrl,
        connectionStatus,
        testConnection,
        syncWorkspace,
        syncSingleLink,
        pullSync,
        lastSynced,
        syncStatus,
        syncError,
        setSyncStatus,
        syncAnalysis,
        runAnalysis,
        removeAnalysisEntries
    }
}
