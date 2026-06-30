import { useState, useEffect, useRef } from 'react'
import iconSrc from '/icon.png'
import { Plus, Trash2, ArrowLeft, Pin, PinOff, Shield, SidebarClose, Globe, Layers, ArrowRight, Upload, Loader, Pencil, Check, X, Copy, Minimize2 } from 'lucide-react'
import ScrollIndicator from './components/ScrollIndicator'
import InteractiveBackground from './components/InteractiveBackground'
import UpdateNotifier from './components/UpdateNotifier'
import GhostLogo from './components/GhostLogo'
import WorkspaceSidebar from './components/WorkspaceSidebar'
import SplashScreen from './components/SplashScreen'
import Toast from './components/Toast'
import SearchBar from './components/SearchBar'
import MiniPlayer from './components/MiniPlayer'
import { useWorkspaces } from './hooks/useWorkspaces'
import { useLinks } from './hooks/useLinks'
import { useSync } from './hooks/useSync'
import { useTags } from './hooks/useTags'
import TagInput from './components/TagInput'
import CreateLinkModal from './components/CreateLinkModal'

// FIX-6: Removed Google fallback to prevent hostname leakage to a third-party.
function PageIcon({ url, eager = true }) {
    const [status, setStatus] = useState(eager ? 'ddg' : 'idle')

    const hostname = (() => {
        try { return new URL(url).hostname }
        catch { return '' }
    })()

    if (status === 'idle' || status === 'error' || !hostname) {
        return <Globe size={20} className="text-gray-600" />
    }

    const ddgUrl = `https://icons.duckduckgo.com/ip3/${hostname}.ico`

    return (
        <img
            src={ddgUrl}
            alt=""
            className="w-6 h-6 object-contain"
            onError={() => setStatus('error')}
        />
    )
}

// FIX-5: Validates URL and restricts to http/https only.
const ALLOWED_PROTOCOLS = ['https:', 'http:']
const sanitizeUrl = (raw) => {
    let candidate = raw.trim()
    if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//.test(candidate)) {
        candidate = 'https://' + candidate
    }
    try {
        const parsed = new URL(candidate)
        if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) return null
        return parsed.origin + parsed.pathname + parsed.search + parsed.hash
    } catch {
        return null
    }
}

function App() {
    const [currentUrl, setCurrentUrl] = useState('')
    const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false)
    const [isBitwardenOpen, setIsBitwardenOpen] = useState(false)
    const [isWorkspaceSidebarOpen, setIsWorkspaceSidebarOpen] = useState(true)
    const [appVersion, setAppVersion] = useState('')
    const [newUrl, setNewUrl] = useState('')
    const [newAlias, setNewAlias] = useState('')
    const [dashboardContainer, setDashboardContainer] = useState(null)
    const dashboardRef = useRef(null)
    const [migrated, setMigrated] = useState(false)
    const [openMoveDropdownId, setOpenMoveDropdownId] = useState(null)
    const [toastMessage, setToastMessage] = useState(null)
    const [toastType, setToastType] = useState('info')

    const showToast = (message, type = 'info') => {
        setToastMessage(message)
        setToastType(type)
    }
    const [editingLinkId, setEditingLinkId] = useState(null)
    const [editUrl, setEditUrl] = useState('')
    const [editAlias, setEditAlias] = useState('')
    const [editTagNames, setEditTagNames] = useState([])
    const [newTagNames, setNewTagNames] = useState([])
    const [activeTagFilter, setActiveTagFilter] = useState([])
    const [isCreateLinkModalOpen, setIsCreateLinkModalOpen] = useState(false)

    // Splash screen
    const [showSplash, setShowSplash] = useState(true)

    // Ghost Effect State
    const [isGhostHidden, setIsGhostHidden] = useState(false)
    const ghostTimeoutRef = useRef(null)

    // Workspace, Links and Sync hooks
    const {
        workspaces,
        addWorkspace,
        removeWorkspace,
        mergeWorkspaces,
        reconcileWorkspaceUuid,
        selectedWorkspaceId,
        selectWorkspace,
        selectedWorkspace,
        loaded: workspacesLoaded
    } = useWorkspaces()

    const {
        links,
        addLink,
        removeLink,
        editLink,
        moveLinkWorkspace,
        removeLinksForWorkspace,
        getLinksForWorkspace,
        mergeLinks,
        updateLinksWorkspaceId,
        loaded: linksLoaded
    } = useLinks()

    const {
        apiUrl,
        setApiUrl,
        apiToken,
        setApiToken,
        connectionStatus,
        testConnection,
        syncWorkspace,
        syncSingleLink,
        pullSync,
        lastSynced,
        syncStatus,
        syncError,
        syncAnalysis,
        runAnalysis,
        removeAnalysisEntries
    } = useSync()

    const { tags, getOrCreateTag, mergeTags } = useTags()

    const [syncingLinkUuid, setSyncingLinkUuid] = useState(null)
    const [syncingWorkspaceUuid, setSyncingWorkspaceUuid] = useState(null)

    // Links for the currently selected workspace
    const workspaceLinks = selectedWorkspaceId ? getLinksForWorkspace(selectedWorkspaceId) : []

    // Unique tags used by links in the current workspace (for filter bar)
    const workspaceTags = (() => {
        const usedUuids = new Set(workspaceLinks.flatMap((l) => l.tagUuids || []))
        return tags.filter((t) => usedUuids.has(t.uuid))
    })()

    // AND filter: only show links that have ALL active filter tags
    const filteredLinks = activeTagFilter.length === 0
        ? workspaceLinks
        : workspaceLinks.filter((l) =>
            activeTagFilter.every((uuid) => (l.tagUuids || []).includes(uuid))
          )

    // Migration: on first load, migrate old URLs and ensure at least one workspace exists
    useEffect(() => {
        if (!workspacesLoaded || !linksLoaded || migrated) return

        const doMigrate = async () => {
            const existingWorkspaces = await window.api.getWorkspaces()
            if (existingWorkspaces && existingWorkspaces.length > 0) {
                setMigrated(true)
                return
            }

            // No workspaces yet — create Default workspace
            const defaultWorkspace = {
                id: Date.now(),
                uuid: crypto.randomUUID(),
                name: 'Default',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }

            // Migrate legacy URLs if any
            const oldUrls = await window.api.getUrls()
            const existingLinks = await window.api.getLinks()
            const migratedLinks = (oldUrls || []).map((u) => ({
                id: u.id,
                uuid: crypto.randomUUID(),
                url: u.url,
                name: u.alias || '',
                description: '',
                workspaceId: defaultWorkspace.uuid,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }))

            await window.api.saveWorkspaces([defaultWorkspace])
            await window.api.saveLinks([...(existingLinks || []), ...migratedLinks])
            setMigrated(true)
        }

        doMigrate()
    }, [workspacesLoaded, linksLoaded, migrated])

    useEffect(() => {
        window.api?.getAlwaysOnTop().then(setIsAlwaysOnTop)
        window.api?.getAppVersion().then(setAppVersion)
    }, [])

    const handleGhostTrigger = () => {
        setIsGhostHidden(true)
        if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current)
        ghostTimeoutRef.current = setTimeout(() => setIsGhostHidden(false), 3000)
    }

    const createLink = (urlRaw, aliasVal, tagNames) => {
        if (!urlRaw || !selectedWorkspaceId) return
        const urlToAdd = sanitizeUrl(urlRaw)
        if (!urlToAdd) {
            showToast('URL inválida ou protocolo não suportado. Use http:// ou https://', 'error')
            return
        }
        const resolvedTags = tagNames.map((name) => getOrCreateTag(name)).filter(Boolean)
        const tagUuids = resolvedTags.map((t) => t.uuid)
        const { isDuplicate } = addLink(urlToAdd, aliasVal, '', selectedWorkspaceId, tagUuids)
        if (isDuplicate) {
            showToast('Este link já existe neste workspace.', 'error')
        } else {
            showToast('Link adicionado com sucesso!', 'success')
        }
    }

    const addLinkToWorkspace = () => {
        createLink(newUrl, newAlias, newTagNames)
        setNewUrl('')
        setNewAlias('')
        setNewTagNames([])
    }

    const handleStartEdit = (e, item) => {
        e.stopPropagation()
        setEditingLinkId(item.uuid)
        setEditUrl(item.url)
        setEditAlias(item.name || '')
        setEditTagNames(
            (item.tagUuids || [])
                .map((uuid) => tags.find((t) => t.uuid === uuid)?.name)
                .filter(Boolean)
        )
    }

    const handleCancelEdit = (e) => {
        if (e) e.stopPropagation()
        setEditingLinkId(null)
        setEditUrl('')
        setEditAlias('')
        setEditTagNames([])
    }

    const handleSaveEdit = (e, item) => {
        e.stopPropagation()
        const newUrl = sanitizeUrl(editUrl)
        if (!newUrl) {
            alert('Invalid URL or unsupported protocol. Use http:// or https://')
            return
        }
        const resolvedTags = editTagNames.map((name) => getOrCreateTag(name)).filter(Boolean)
        const tagUuids = resolvedTags.map((t) => t.uuid)
        editLink(item.uuid, newUrl, editAlias, '', tagUuids)

        if (connectionStatus === 'connected' && apiUrl) {
            window.api.updateSyncedLink({
                apiUrl,
                apiToken,
                uuid: item.uuid,
                payload: {
                    url: newUrl,
                    name: editAlias,
                    tags: resolvedTags.map((t) => ({ uuid: t.uuid, name: t.name }))
                }
            })
        }

        setEditingLinkId(null)
        setEditUrl('')
        setEditAlias('')
        setEditTagNames([])
    }

    const handleRemoveLink = (uuid) => {
        removeLink(uuid)
        removeAnalysisEntries({ linkUuids: [uuid] })
        if (connectionStatus === 'connected' && apiUrl) {
            window.api.deleteSyncedLink({ apiUrl, apiToken, uuid })
        }
    }

    const handleMoveLink = (uuid, targetWorkspaceId) => {
        if (!uuid || !targetWorkspaceId || targetWorkspaceId === selectedWorkspaceId) return
        moveLinkWorkspace(uuid, targetWorkspaceId)
        if (connectionStatus === 'connected' && apiUrl) {
            window.api.updateSyncedLink({ apiUrl, apiToken, uuid, payload: { workspace_uuid: targetWorkspaceId } })
        }
    }

    const handleSearchSelect = (link) => {
        selectWorkspace(link.workspaceId)
        const safe = sanitizeUrl(link.url)
        if (safe) setCurrentUrl(safe)
    }

    const handleRemoveWorkspace = (uuid) => {
        const wsLinks = getLinksForWorkspace(uuid)
        removeLinksForWorkspace(uuid)
        removeWorkspace(uuid)
        removeAnalysisEntries({ workspaceUuid: uuid, linkUuids: wsLinks.map((l) => l.uuid) })
        if (connectionStatus === 'connected' && apiUrl) {
            window.api.deleteSyncedWorkspace({ apiUrl, apiToken, uuid })
        }
    }

    const applyPull = async () => {
        const result = await pullSync()
        if (result.ok && result.data) {
            const { uuidReconciliation } = await runAnalysis(workspaces, links, result.data)

            for (const [oldUuid, newUuid] of Object.entries(uuidReconciliation)) {
                reconcileWorkspaceUuid(oldUuid, newUuid)
                updateLinksWorkspaceId(oldUuid, newUuid)
            }

            mergeWorkspaces(result.data.workspaces)
            mergeLinks(result.data.links)

            // Merge tags from remote links into local tag store
            const remoteTags = []
            const seen = new Set()
            for (const link of result.data.links) {
                for (const tag of (link.tags || [])) {
                    if (!seen.has(tag.uuid)) {
                        remoteTags.push(tag)
                        seen.add(tag.uuid)
                    }
                }
            }
            mergeTags(remoteTags)
        }
    }

    const handleTestConnection = async () => {
        const result = await testConnection()
        if (result.ok) applyPull()
        return result
    }

    const handleSyncWorkspace = async () => {
        if (!selectedWorkspace) return
        await syncWorkspace(selectedWorkspace, workspaceLinks, tags)
        applyPull()
    }

    const handleSyncWorkspaceById = async (workspaceUuid) => {
        const ws = workspaces.find((w) => w.uuid === workspaceUuid)
        if (!ws) return
        const wsLinks = getLinksForWorkspace(workspaceUuid)
        setSyncingWorkspaceUuid(workspaceUuid)
        await syncWorkspace(ws, wsLinks, tags)
        applyPull()
        setTimeout(() => setSyncingWorkspaceUuid(null), 3000)
    }

    const handleSyncSingleLink = async (link) => {
        const ws = workspaces.find((w) => w.uuid === link.workspaceId)
        if (!ws) return
        const allWsLinks = getLinksForWorkspace(link.workspaceId)
        setSyncingLinkUuid(link.uuid)
        await syncSingleLink(ws, link, allWsLinks, tags)
        setSyncingLinkUuid(null)
    }

    const cleanUrl = (url) => url.replace(/^https?:\/\//i, '').replace(/\/$/, '')

    const toggleAlwaysOnTop = async () => {
        const newState = await window.api.toggleAlwaysOnTop()
        setIsAlwaysOnTop(newState)
    }

    const [pageTitle, setPageTitle] = useState('')
    const [loadError, setLoadError] = useState(null)
    const webviewRef = useRef(null)
    const [sidebarWidth, setSidebarWidth] = useState(350)
    const [isResizing, setIsResizing] = useState(false)

    // Mini Player mode
    const [isMiniPlayerActive, setIsMiniPlayerActive] = useState(false)
    const [canGoBack, setCanGoBack] = useState(false)
    const [canGoForward, setCanGoForward] = useState(false)

    const handleEnterMiniPlayer = () => {
        setIsMiniPlayerActive(true)
        window.api?.enterMiniPlayer()
    }

    const handleExitMiniPlayer = () => {
        setIsMiniPlayerActive(false)
        window.api?.exitMiniPlayer()
    }

    useEffect(() => {
        const webview = webviewRef.current
        if (!webview) return
        const handleFail = (e) => {
            if (import.meta.env.DEV) console.error('Webview failed to load:', e)
            setLoadError(e.errorDescription || 'Error loading page. Check the URL or your connection.')
        }
        const handleStart = () => setPageTitle('Materializing...')
        const handleTitle = (e) => setPageTitle(e.title)
        const handleNavigate = () => {
            setCanGoBack(webview.canGoBack())
            setCanGoForward(webview.canGoForward())
        }
        webview.addEventListener('did-fail-load', handleFail)
        webview.addEventListener('did-start-loading', handleStart)
        webview.addEventListener('page-title-updated', handleTitle)
        webview.addEventListener('did-navigate', handleNavigate)
        webview.addEventListener('did-navigate-in-page', handleNavigate)
        return () => {
            webview.removeEventListener('did-fail-load', handleFail)
            webview.removeEventListener('did-start-loading', handleStart)
            webview.removeEventListener('page-title-updated', handleTitle)
            webview.removeEventListener('did-navigate', handleNavigate)
            webview.removeEventListener('did-navigate-in-page', handleNavigate)
        }
    }, [currentUrl])

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return
            const newWidth = window.innerWidth - e.clientX
            if (newWidth > 250 && newWidth < 800) setSidebarWidth(newWidth)
        }
        const handleMouseUp = () => setIsResizing(false)
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing])

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'q') window.api.quitApp()
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const renderBrowser = () => (
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
            {isMiniPlayerActive ? (
                <div className="h-full border-b border-purple-900/40 shrink-0">
                    <MiniPlayer
                        title={pageTitle}
                        url={currentUrl}
                        canGoBack={canGoBack}
                        canGoForward={canGoForward}
                        onBack={() => webviewRef.current?.goBack()}
                        onForward={() => webviewRef.current?.goForward()}
                        onReload={() => webviewRef.current?.reload()}
                        onRestore={handleExitMiniPlayer}
                    />
                </div>
            ) : (
                <div className="h-10 bg-[#0d0a14] border-b border-purple-900/40 flex items-center px-4 justify-between draggable shrink-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                            onClick={() => { setCurrentUrl(''); setLoadError(null) }}
                            className="p-1.5 hover:bg-purple-900/30 text-gray-300 no-drag shrink-0"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={16} />
                        </button>
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="scale-75 origin-left w-5 h-5 flex items-center justify-center shrink-0">
                                <PageIcon url={currentUrl} eager={true} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-xs font-medium text-gray-200 truncate leading-tight">
                                    {pageTitle || 'Browser'}
                                </span>
                                <span className="text-[10px] text-gray-500 truncate leading-tight opacity-70">
                                    {currentUrl}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handleEnterMiniPlayer}
                            className="p-1.5 no-drag hover:bg-purple-900/30 text-gray-400"
                            title="Minimize Player"
                        >
                            <Minimize2 size={16} />
                        </button>
                        <button
                            onClick={() => setIsWorkspaceSidebarOpen(!isWorkspaceSidebarOpen)}
                            className={`p-1.5 no-drag ${isWorkspaceSidebarOpen ? 'bg-purple-800/40 text-white' : 'hover:bg-purple-900/30 text-gray-400'}`}
                            title="Toggle Workspace Sidebar"
                        >
                            <Layers size={16} />
                        </button>
                        <button
                            onClick={toggleAlwaysOnTop}
                            className={`p-1.5 no-drag ${isAlwaysOnTop ? 'bg-purple-700/60 text-white' : 'hover:bg-purple-900/30 text-gray-400'}`}
                            title="Toggle Always on Top"
                        >
                            {isAlwaysOnTop ? <Pin size={16} /> : <PinOff size={16} />}
                        </button>
                        <button
                            onClick={() => setIsBitwardenOpen(!isBitwardenOpen)}
                            className={`p-1.5 no-drag ${isBitwardenOpen ? 'bg-purple-800/40 text-white' : 'hover:bg-purple-900/30 text-gray-400'}`}
                            title="Toggle Bitwarden Sidebar"
                        >
                            {isBitwardenOpen ? <SidebarClose size={16} /> : <Shield size={16} />}
                        </button>
                    </div>
                </div>
            )}
            <div className={`flex-1 w-full bg-white relative ${isMiniPlayerActive ? 'hidden' : ''}`}>
                {loadError && (
                    <div className="absolute inset-0 z-10 bg-[#0d0a14] flex flex-col items-center justify-center p-8 text-center">
                        <img src={iconSrc} alt="Phantom" className="w-16 h-16 mb-4 opacity-50" />
                        <h2 className="text-xl font-bold text-gray-100 mb-2">The Phantom cannot reach this realm.</h2>
                        <p className="text-gray-400 max-w-md mb-6">{loadError}</p>
                        <button
                            onClick={() => { const wv = webviewRef.current; if (wv) wv.reload() }}
                            className="px-6 py-2 bg-purple-700 hover:bg-purple-600 text-white transition-colors font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                )}
                <webview
                    ref={webviewRef}
                    src={currentUrl}
                    className="w-full h-full"
                    allowpopups="true"
                    partition="persist:browsing"
                ></webview>
            </div>
        </div>
    )

    const renderDashboard = () => (
        <div className="flex h-full w-full overflow-hidden">
            {/* Left Workspace Sidebar */}
            {isWorkspaceSidebarOpen && (
                <WorkspaceSidebar
                    workspaces={workspaces}
                    selectedWorkspaceId={selectedWorkspaceId}
                    onSelectWorkspace={selectWorkspace}
                    onAddWorkspace={addWorkspace}
                    onRemoveWorkspace={handleRemoveWorkspace}
                    apiUrl={apiUrl}
                    onSetApiUrl={setApiUrl}
                    apiToken={apiToken}
                    onSetApiToken={setApiToken}
                    connectionStatus={connectionStatus}
                    onTestConnection={handleTestConnection}
                    onSyncWorkspace={handleSyncWorkspace}
                    onSyncWorkspaceById={handleSyncWorkspaceById}
                    selectedWorkspace={selectedWorkspace}
                    linksCount={workspaceLinks.length}
                    lastSynced={lastSynced}
                    syncStatus={syncStatus}
                    syncError={syncError}
                    syncAnalysis={syncAnalysis}
                    syncingWorkspaceUuid={syncingWorkspaceUuid}
                    onClose={() => setIsWorkspaceSidebarOpen(false)}
                    onDropLink={handleMoveLink}
                    setToastMessage={setToastMessage}
                />
            )}

            {/* Main Dashboard Area */}
            <div className="flex-1 relative overflow-hidden bg-[#0d0a14] transition-colors duration-500">
                <InteractiveBackground />
                <ScrollIndicator containerRef={dashboardContainer} watch={[workspaceLinks]} />
                <div
                    ref={(el) => {
                        dashboardRef.current = el
                        if (el !== dashboardContainer) setDashboardContainer(el)
                    }}
                    className="h-full w-full p-4 sm:p-8 overflow-y-auto min-w-0 text-gray-100 relative z-10"
                >
                    <div className="max-w-2xl mx-auto">
                        <header className="mb-8 flex items-center justify-between gap-4 flex-wrap draggable">
                            <h1 className="text-2xl font-bold flex items-center gap-2 relative no-drag" onMouseEnter={handleGhostTrigger}>
                                <GhostLogo isHidden={isGhostHidden} />
                                <span
                                    style={{
                                        opacity: isGhostHidden ? 0 : 1,
                                        transform: isGhostHidden ? 'scale(1.15) translateY(-8px)' : 'scale(1) translateY(0)',
                                        filter: isGhostHidden ? 'blur(16px) brightness(1.6)' : 'blur(0) brightness(1)',
                                        transition: 'opacity 1600ms ease-in-out, transform 1600ms ease-in-out, filter 1600ms ease-in-out',
                                        display: 'block',
                                    }}
                                >
                                    Phantom
                                </span>
                                {appVersion && (
                                    <span className="text-[10px] text-gray-600 font-normal tracking-widest uppercase select-none">
                                        v{appVersion}
                                    </span>
                                )}
                            </h1>
                            <SearchBar links={links} workspaces={workspaces} onSelectLink={handleSearchSelect} />
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsWorkspaceSidebarOpen(!isWorkspaceSidebarOpen)}
                                    className={`p-2 text-gray-300 flex items-center gap-2 transition-colors border no-drag ${
                                        isWorkspaceSidebarOpen
                                            ? 'bg-purple-800/40 border-purple-700/40'
                                            : 'bg-[#1a0f2e] hover:bg-purple-900/30 border-purple-900/40'
                                    }`}
                                    title="Toggle Workspace Sidebar"
                                >
                                    <Layers size={16} className="text-zinc-400" />
                                    <span className="text-sm hidden sm:inline">Workspaces</span>
                                </button>
                                <button
                                    onClick={() => setIsBitwardenOpen(!isBitwardenOpen)}
                                    className="p-2 bg-[#1a0f2e] hover:bg-purple-900/30 text-gray-300 flex items-center gap-2 transition-colors border border-purple-900/40 no-drag"
                                >
                                    <Shield size={16} className="text-zinc-400" />
                                    <span className="text-sm hidden sm:inline">Bitwarden</span>
                                </button>
                            </div>
                        </header>

                        {/* Workspace context header */}
                        {selectedWorkspace && (
                            <div className="mb-4 flex items-center gap-2 text-gray-500 text-sm">
                                <Layers size={14} />
                                <span className="font-medium text-gray-300">{selectedWorkspace.name}</span>
                                <span className="text-gray-600">
                                    · {filteredLinks.length}{filteredLinks.length !== workspaceLinks.length ? `/${workspaceLinks.length}` : ''} link{workspaceLinks.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                        )}

                        {!selectedWorkspace && (
                            <div className="bg-[#1a0f2e] border border-purple-900/30 p-6 text-center text-gray-500 mb-8">
                                <Layers size={24} className="mx-auto mb-2 text-gray-600" />
                                <p className="text-sm">No workspace selected. Create one in the sidebar to get started.</p>
                            </div>
                        )}

                        {selectedWorkspace && (
                            <div className="mb-8">
                                <button
                                    onClick={() => setIsCreateLinkModalOpen(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-purple-900/50 text-gray-400 hover:text-gray-200 hover:border-purple-700/60 hover:bg-purple-900/10 transition-all text-sm font-medium no-drag"
                                >
                                    <Plus size={15} className="text-purple-400" />
                                    Add New Link
                                </button>
                            </div>
                        )}

                        <CreateLinkModal
                            isOpen={isCreateLinkModalOpen}
                            onClose={() => setIsCreateLinkModalOpen(false)}
                            onSubmit={({ url, alias, tags }) => createLink(url, alias, tags)}
                        />

                        {selectedWorkspace && workspaceTags.length > 0 && (
                            <div className="mb-4 flex flex-wrap gap-2 items-center">
                                <span className="text-xs text-gray-600 uppercase tracking-wider">Filtrar:</span>
                                {workspaceTags.map((tag) => {
                                    const isActive = activeTagFilter.includes(tag.uuid)
                                    return (
                                        <button
                                            key={tag.uuid}
                                            onClick={() => setActiveTagFilter((prev) =>
                                                isActive
                                                    ? prev.filter((u) => u !== tag.uuid)
                                                    : [...prev, tag.uuid]
                                            )}
                                            className={`text-xs px-2.5 py-1 border transition-colors ${
                                                isActive
                                                    ? 'bg-purple-700/70 border-purple-500 text-white'
                                                    : 'bg-transparent border-purple-900/40 text-gray-400 hover:border-purple-600 hover:text-gray-200'
                                            }`}
                                        >
                                            {tag.name}
                                        </button>
                                    )
                                })}
                                {activeTagFilter.length > 0 && (
                                    <button
                                        onClick={() => setActiveTagFilter([])}
                                        className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                                    >
                                        Limpar filtro
                                    </button>
                                )}
                            </div>
                        )}

                        {selectedWorkspace && (
                            <div className="grid grid-cols-1 gap-4">
                                {filteredLinks.map((item) => (
                                    <div
                                        key={item.uuid}
                                        draggable
                                        onDragStart={(e) => {
                                            e.dataTransfer.setData('text/plain', item.uuid)
                                            e.dataTransfer.effectAllowed = 'move'
                                        }}
                                        className={`bg-[#1a0f2e] p-4 border border-purple-900/30 flex items-center justify-between group transition-colors w-full min-w-0 ${
                                            connectionStatus === 'connected' && syncAnalysis?.lastAnalyzedAt && syncAnalysis?.links?.[item.uuid] !== 'synced'
                                                ? 'border-l-2 border-l-red-500/60 hover:border-l-red-400/80'
                                                : 'hover:border-purple-500/50'
                                        }`}
                                    >
                                        {editingLinkId === item.uuid ? (
                                            <div className="flex-1 flex flex-col gap-2 mr-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={editUrl}
                                                    onChange={(e) => setEditUrl(e.target.value)}
                                                    className="w-full bg-[#0d0a14] border border-purple-900/40 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm text-gray-200"
                                                    placeholder="URL"
                                                    autoFocus
                                                />
                                                <input
                                                    type="text"
                                                    value={editAlias}
                                                    onChange={(e) => setEditAlias(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleSaveEdit(e, item)
                                                        if (e.key === 'Escape') handleCancelEdit(e)
                                                    }}
                                                    className="w-full bg-[#0d0a14] border border-purple-900/40 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm text-gray-200"
                                                    placeholder="Name"
                                                />
                                                <TagInput value={editTagNames} onChange={setEditTagNames} />
                                            </div>
                                        ) : (
                                            <div
                                                className="flex-1 cursor-pointer flex items-center gap-4 min-w-0 mr-4"
                                                onClick={() => {
                                                    const safe = sanitizeUrl(item.url)
                                                    if (safe) setCurrentUrl(safe)
                                                }}
                                            >
                                                <div className="w-10 h-10 bg-[#0d0a14] flex items-center justify-center shrink-0 border border-purple-900/30 overflow-hidden">
                                                    <PageIcon url={item.url} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-gray-100 truncate">
                                                        {item.name || cleanUrl(item.url)}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {item.name ? cleanUrl(item.url) : 'Click to open'}
                                                    </p>
                                                    {(item.tagUuids || []).length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {(item.tagUuids || []).map((uuid) => {
                                                                const tag = tags.find((t) => t.uuid === uuid)
                                                                return tag ? (
                                                                    <span
                                                                        key={uuid}
                                                                        className="text-[10px] px-1.5 py-0.5 bg-purple-900/40 border border-purple-800/40 text-purple-300"
                                                                    >
                                                                        {tag.name}
                                                                    </span>
                                                                ) : null
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1 shrink-0 relative">
                                            {editingLinkId === item.uuid ? (
                                                <>
                                                    <button
                                                        onClick={(e) => handleSaveEdit(e, item)}
                                                        className="p-2 text-green-500 hover:bg-purple-900/20 transition-colors"
                                                        title="Save"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={handleCancelEdit}
                                                        className="p-2 text-red-500 hover:bg-purple-900/20 transition-colors"
                                                        title="Cancel"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {connectionStatus === 'connected' && syncAnalysis?.lastAnalyzedAt && syncAnalysis?.links?.[item.uuid] !== 'synced' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleSyncSingleLink(item)
                                                            }}
                                                            disabled={syncingLinkUuid === item.uuid}
                                                            className={`p-2 text-gray-500 hover:text-purple-400 hover:bg-purple-900/20 transition-colors disabled:opacity-50 ${syncingLinkUuid === item.uuid ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                                            title="Sync this link"
                                                        >
                                                            {syncingLinkUuid === item.uuid
                                                                ? <Loader size={18} className="animate-spin" />
                                                                : <Upload size={18} />}
                                                        </button>
                                                    )}
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setOpenMoveDropdownId(openMoveDropdownId === item.uuid ? null : item.uuid)
                                                            }}
                                                            className="p-2 text-gray-500 hover:text-blue-400 hover:bg-purple-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                                            title="Move to another workspace"
                                                        >
                                                            <ArrowRight size={18} />
                                                        </button>
                                                        {openMoveDropdownId === item.uuid && (
                                                            <div className="absolute right-0 mt-1 w-48 bg-[#1a0f2e] border border-purple-900/40 shadow-xl z-50 py-1">
                                                                <div className="px-3 py-1 text-xs text-gray-500 border-b border-purple-900/30">Move to...</div>
                                                                {workspaces.filter(w => w.uuid !== selectedWorkspaceId).map(w => (
                                                                    <button
                                                                        key={w.uuid}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation()
                                                                            handleMoveLink(item.uuid, w.uuid)
                                                                            setOpenMoveDropdownId(null)
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-purple-800/40 hover:text-white transition-colors truncate"
                                                                    >
                                                                        {w.name}
                                                                    </button>
                                                                ))}
                                                                {workspaces.length <= 1 && (
                                                                    <div className="px-3 py-2 text-sm text-gray-600">No other workspaces</div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            navigator.clipboard.writeText(item.url)
                                                            showToast('Link copiado para a área de transferência', 'info')
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-blue-400 hover:bg-purple-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Copy URL"
                                                    >
                                                        <Copy size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleStartEdit(e, item)}
                                                        className="p-2 text-gray-500 hover:text-green-400 hover:bg-purple-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveLink(item.uuid)}
                                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-purple-900/20 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {workspaceLinks.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        No links yet. Add one above!
                                    </div>
                                )}
                                {workspaceLinks.length > 0 && filteredLinks.length === 0 && (
                                    <div className="text-center py-12 text-gray-600">
                                        Nenhum link com todas as tags selecionadas.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )

    if (showSplash) return <SplashScreen onComplete={() => setShowSplash(false)} />

    return (
        <div className={`flex h-screen w-screen overflow-hidden bg-[#0d0a14] border border-purple-900/30 relative ${isResizing ? 'cursor-col-resize' : 'cursor-default'}`}>
            {/* Global Invisible Drag Handle */}
            <div className="fixed top-0 left-0 right-0 h-1 z-[9999] draggable pointer-events-none"></div>

            {/* Main Content Area (Dashboard or Browser) */}
            {currentUrl ? renderBrowser() : renderDashboard()}

            {/* Bitwarden Sidebar */}
            {isBitwardenOpen && (
                <div
                    className="border-l border-purple-900/40 flex flex-col bg-white shrink-0 shadow-xl z-50 relative"
                    style={{ width: `${sidebarWidth}px` }}
                >
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-purple-700/50 transition-colors z-50"
                        onMouseDown={() => setIsResizing(true)}
                    ></div>
                    <div className="h-10 bg-[#1a0f2e] border-b border-purple-900/40 flex items-center justify-between px-3 shrink-0 draggable">
                        <span className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                            <Shield size={14} className="text-zinc-400" /> Bitwarden Vault
                        </span>
                        <button
                            onClick={() => setIsBitwardenOpen(false)}
                            className="text-gray-400 hover:text-white no-drag"
                        >
                            <SidebarClose size={16} />
                        </button>
                    </div>
                    <div className="flex-1 relative">
                        <webview
                            src="https://vault.bitwarden.com"
                            className="w-full h-full"
                            allowpopups="true"
                            partition="persist:bitwarden"
                        ></webview>
                    </div>
                </div>
            )}

            {/* Watermark Helper */}
            {!isMiniPlayerActive && (
                <div className="fixed bottom-4 right-4 text-[10px] text-gray-600 pointer-events-none select-none uppercase tracking-widest bg-[#0d0a14]/80 px-2 py-1 border border-purple-900/20 z-[100]">
                    Ctrl + Q to close
                </div>
            )}

            <Toast message={toastMessage} type={toastType} onClose={() => { setToastMessage(null); setToastType('info') }} />
            <UpdateNotifier />
        </div>
    )
}

export default App
