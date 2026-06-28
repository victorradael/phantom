import { useState, useEffect } from 'react'

export function useTags() {
    const [tags, setTags] = useState([])
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        window.api.getTags().then((ts) => {
            setTags(ts || [])
            setLoaded(true)
        })
    }, [])

    useEffect(() => {
        if (loaded) window.api.saveTags(tags)
    }, [tags, loaded])

    /**
     * Returns an existing tag matching `name` (case-insensitive) or creates
     * and schedules a new one. Always returns the tag object synchronously.
     */
    const getOrCreateTag = (name) => {
        const trimmed = name.trim().toLowerCase()
        if (!trimmed) return null
        const existing = tags.find((t) => t.name.toLowerCase() === trimmed)
        if (existing) return existing
        const tag = { uuid: crypto.randomUUID(), name: trimmed, updatedAt: new Date().toISOString() }
        setTags((prev) => {
            if (prev.find((t) => t.name.toLowerCase() === trimmed)) return prev
            return [...prev, tag]
        })
        return tag
    }

    /**
     * Merges remote tags into the local store (adds missing ones by uuid).
     */
    const mergeTags = (remoteTags) => {
        if (!remoteTags?.length) return
        setTags((prev) => {
            const existingUuids = new Set(prev.map((t) => t.uuid))
            const incoming = remoteTags
                .filter((t) => !existingUuids.has(t.uuid))
                .map((t) => ({ uuid: t.uuid, name: t.name, updatedAt: new Date().toISOString() }))
            return incoming.length > 0 ? [...prev, ...incoming] : prev
        })
    }

    return { tags, getOrCreateTag, mergeTags }
}
