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
        const link = {
            id: Date.now(),
            uuid: crypto.randomUUID(),
            url,
            name: name?.trim() || '',
            description: description?.trim() || '',
            workspaceId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        setLinks((prev) => [...prev, link])
        return link
    }

    const removeLink = (uuid) => {
        setLinks((prev) => prev.filter((l) => l.uuid !== uuid))
    }

    const moveLinkWorkspace = (uuid, newWorkspaceId) => {
        setLinks((prev) => prev.map((l) =>
            l.uuid === uuid ? { ...l, workspaceId: newWorkspaceId, updatedAt: new Date().toISOString() } : l
        ))
    }

    const removeLinksForWorkspace = (workspaceId) => {
        setLinks((prev) => prev.filter((l) => l.workspaceId !== workspaceId))
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

    return { links, addLink, removeLink, moveLinkWorkspace, removeLinksForWorkspace, getLinksForWorkspace, mergeLinks, loaded }
}
