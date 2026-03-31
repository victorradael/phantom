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

    const removeLinksForWorkspace = (workspaceId) => {
        setLinks((prev) => prev.filter((l) => l.workspaceId !== workspaceId))
    }

    const getLinksForWorkspace = (workspaceId) => {
        return links.filter((l) => l.workspaceId === workspaceId)
    }

    return { links, addLink, removeLink, removeLinksForWorkspace, getLinksForWorkspace, loaded }
}
