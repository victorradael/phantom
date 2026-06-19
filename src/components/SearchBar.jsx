import { useState, useEffect, useRef, useMemo } from 'react'
import { Search, X, Globe, Layers } from 'lucide-react'

const DEBOUNCE_MS = 200

const cleanUrl = (url) => url.replace(/^https?:\/\//i, '').replace(/\/$/, '')

export default function SearchBar({ links, workspaces, onSelectLink }) {
    const [query, setQuery] = useState('')
    const [debouncedQuery, setDebouncedQuery] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS)
        return () => clearTimeout(timer)
    }, [query])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const groupedResults = useMemo(() => {
        if (!debouncedQuery) return []
        const lowerQuery = debouncedQuery.toLowerCase()
        const matched = links.filter((l) =>
            l.url.toLowerCase().includes(lowerQuery) || (l.name || '').toLowerCase().includes(lowerQuery)
        )

        const groups = new Map()
        for (const link of matched) {
            if (!groups.has(link.workspaceId)) {
                const workspace = workspaces.find((w) => w.uuid === link.workspaceId)
                groups.set(link.workspaceId, {
                    workspaceId: link.workspaceId,
                    workspaceName: workspace?.name || 'Sem Workspace',
                    links: []
                })
            }
            groups.get(link.workspaceId).links.push(link)
        }
        return Array.from(groups.values())
    }, [debouncedQuery, links, workspaces])

    const totalResults = groupedResults.reduce((sum, g) => sum + g.links.length, 0)

    const handleSelect = (link) => {
        onSelectLink(link)
        setQuery('')
        setDebouncedQuery('')
        setIsOpen(false)
    }

    const handleClear = () => {
        setQuery('')
        setDebouncedQuery('')
    }

    return (
        <div ref={containerRef} className="relative w-full max-w-md no-drag">
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                            handleClear()
                            setIsOpen(false)
                        }
                    }}
                    placeholder="Buscar links..."
                    className="w-full bg-[#0d0a14] border border-purple-900/40 pl-9 pr-9 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-600"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        title="Limpar busca"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && debouncedQuery && (
                <div className="absolute left-0 right-0 mt-1 max-h-96 overflow-y-auto bg-[#1a0f2e] border border-purple-900/40 shadow-2xl z-50">
                    {totalResults === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-500 text-center">Nenhum link encontrado.</p>
                    ) : (
                        groupedResults.map((group) => (
                            <div key={group.workspaceId} className="border-b border-purple-900/20 last:border-b-0">
                                <div className="px-3 py-1.5 bg-purple-900/20 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers size={11} />
                                    {group.workspaceName}
                                </div>
                                {group.links.map((link) => (
                                    <button
                                        key={link.uuid}
                                        onClick={() => handleSelect(link)}
                                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-purple-800/30 transition-colors text-left"
                                    >
                                        <Globe size={14} className="text-gray-600 shrink-0" />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-gray-200 truncate">{link.name || cleanUrl(link.url)}</p>
                                            <p className="text-xs text-gray-500 truncate">{cleanUrl(link.url)}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
