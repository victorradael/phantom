import { useState, useEffect } from 'react'

export function useLinks() {
    const [links, setLinks] = useState([])
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        window.api.getLinks().then((ls) => {
            setLinks(ls || [])
            setLoaded(true)
        })
    }, [])

    useEffect(() => {
        if (loaded) {
            window.api.saveLinks(links)
        }
    }, [links, loaded])

    const addLink = (url, name, description, workspaceId) => {
        const trimmedName = name?.trim() || ''
        const trimmedDescription = description?.trim() || ''

        // Find existing link with same URL in the same workspace
        const existing = links.find((l) => l.url === url && l.workspaceId === workspaceId)
        if (existing) {
            // Update name and description if new ones are provided
            if (trimmedName || trimmedDescription) {
                setLinks((prev) => prev.map((l) => 
                    l.uuid === existing.uuid 
                        ? { 
                            ...l, 
                            name: trimmedName || l.name, 
                            description: trimmedDescription || l.description,
                            updatedAt: new Date().toISOString()
                          } 
                        : l
                ))
            }
            return { link: existing, isDuplicate: true }
        }

        const link = {
            id: Date.now(),
            uuid: crypto.randomUUID(),
            url,
            name: trimmedName,
            description: trimmedDescription,
            workspaceId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        setLinks((prev) => [...prev, link])
        return { link, isDuplicate: false }
    }

    const removeLink = (uuid) => {
        setLinks((prev) => prev.filter((l) => l.uuid !== uuid))
    }

    const editLink = (uuid, newUrl, newName, newDescription) => {
        setLinks((prev) => prev.map((l) =>
            l.uuid === uuid
                ? {
                    ...l,
                    url: newUrl,
                    name: newName?.trim() || '',
                    description: newDescription?.trim() || '',
                    updatedAt: new Date().toISOString()
                  }
                : l
        ))
    }

    const moveLinkWorkspace = (uuid, newWorkspaceId) => {
        setLinks((prev) => prev.map((l) =>
            l.uuid === uuid ? { ...l, workspaceId: newWorkspaceId, updatedAt: new Date().toISOString() } : l
        ))
    }

    const removeLinksForWorkspace = (workspaceId) => {
        setLinks((prev) => prev.filter((l) => l.workspaceId !== workspaceId))
    }

    const updateLinksWorkspaceId = (oldWorkspaceId, newWorkspaceId) => {
        setLinks((prev) => prev.map((l) =>
            l.workspaceId === oldWorkspaceId ? { ...l, workspaceId: newWorkspaceId } : l
        ))
    }

    const getLinksForWorkspace = (workspaceId) => {
        return links.filter((l) => l.workspaceId === workspaceId)
    }

    // Merge links from backend: adds new ones (by uuid), ignores existing
    const mergeLinks = (remoteLinks) => {
        setLinks((prev) => {
            const existingUuids = new Set(prev.map((l) => l.uuid))
            const incoming = remoteLinks
                .filter((l) => !existingUuids.has(l.uuid))
                .map((l) => ({
                    id: Date.now() + Math.random(),
                    uuid: l.uuid,
                    url: l.url,
                    name: l.name || '',
                    description: l.description || '',
                    workspaceId: l.workspace_uuid,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }))
            return incoming.length > 0 ? [...prev, ...incoming] : prev
        })
    }

    return { links, addLink, removeLink, editLink, moveLinkWorkspace, removeLinksForWorkspace, getLinksForWorkspace, mergeLinks, updateLinksWorkspaceId, loaded }
}
