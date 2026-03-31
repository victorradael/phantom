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

    return {
        workspaces,
        addWorkspace,
        removeWorkspace,
        selectedWorkspaceId,
        selectWorkspace: setSelectedWorkspaceId,
        selectedWorkspace,
        loaded
    }
}
