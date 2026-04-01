import { useState, useEffect } from 'react'

export function useWorkspaces() {
    const [workspaces, setWorkspaces] = useState([])
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null)
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        window.api.getWorkspaces().then((ws) => {
            const list = ws || []
            setWorkspaces(list)
            if (list.length > 0) {
                setSelectedWorkspaceId(list[0].uuid)
            }
            setLoaded(true)
        })
    }, [])

    useEffect(() => {
        if (loaded) {
            window.api.saveWorkspaces(workspaces)
        }
    }, [workspaces, loaded])

    const addWorkspace = (name) => {
        const workspace = {
            id: Date.now(),
            uuid: crypto.randomUUID(),
            name: name.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        setWorkspaces((prev) => [...prev, workspace])
        setSelectedWorkspaceId(workspace.uuid)
        return workspace
    }

    const removeWorkspace = (uuid) => {
        setWorkspaces((prev) => {
            const updated = prev.filter((w) => w.uuid !== uuid)
            if (selectedWorkspaceId === uuid) {
                setSelectedWorkspaceId(updated.length > 0 ? updated[0].uuid : null)
            }
            return updated
        })
    }

    const selectedWorkspace = workspaces.find((w) => w.uuid === selectedWorkspaceId) || null

    // Merge workspaces from backend: adds new ones (by uuid), ignores existing
    const mergeWorkspaces = (remoteWorkspaces) => {
        setWorkspaces((prev) => {
            const existingUuids = new Set(prev.map((w) => w.uuid))
            const incoming = remoteWorkspaces
                .filter((w) => !existingUuids.has(w.uuid))
                .map((w) => ({
                    id: Date.now() + Math.random(),
                    uuid: w.uuid,
                    name: w.name,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }))
            return incoming.length > 0 ? [...prev, ...incoming] : prev
        })
    }

    return {
        workspaces,
        addWorkspace,
        removeWorkspace,
        mergeWorkspaces,
        selectedWorkspaceId,
        selectWorkspace: setSelectedWorkspaceId,
        selectedWorkspace,
        loaded
    }
}
