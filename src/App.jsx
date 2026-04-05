import { useState, useEffect, useRef } from 'react'
import iconSrc from '/icon.png'
import { Plus, Trash2, ArrowLeft, Pin, PinOff, Shield, SidebarClose, Globe, Layers } from 'lucide-react'
import ScrollIndicator from './components/ScrollIndicator'
import InteractiveBackground from './components/InteractiveBackground'
import UpdateNotifier from './components/UpdateNotifier'
import GhostLogo from './components/GhostLogo'
import WorkspaceSidebar from './components/WorkspaceSidebar'
import { useWorkspaces } from './hooks/useWorkspaces'
import { useLinks } from './hooks/useLinks'
import { useSync } from './hooks/useSync'

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

    // Ghost Effect State
    const [isGhostHidden, setIsGhostHidden] = useState(false)
    const ghostTimeoutRef = useRef(null)

    // Workspace, Links and Sync hooks
    const {
        workspaces,
        addWorkspace,
        removeWorkspace,
        mergeWorkspaces,
        selectedWorkspaceId,
        selectWorkspace,
        selectedWorkspace,
        loaded: workspacesLoaded
    } = useWorkspaces()

    const {
        addLink,
        removeLink,
        removeLinksForWorkspace,
        getLinksForWorkspace,
        mergeLinks,
        loaded: linksLoaded
    } = useLinks()

    const {
        apiUrl,
        setApiUrl,
        connectionStatus,
        testConnection,
        syncWorkspace,
        pullSync,
        lastSynced,
        syncStatus,
        syncError
    } = useSync()

    // Links for the currently selected workspace
    const workspaceLinks = selectedWorkspaceId ? getLinksForWorkspace(selectedWorkspaceId) : []

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

    const addLinkToWorkspace = () => {
        if (!newUrl || !selectedWorkspaceId) return
        const urlToAdd = sanitizeUrl(newUrl)
        if (!urlToAdd) {
            alert('Invalid URL or unsupported protocol. Use http:// or https://')
            return
        }
        addLink(urlToAdd, newAlias, '', selectedWorkspaceId)
        setNewUrl('')
        setNewAlias('')
    }

    const handleRemoveLink = (uuid) => {
        removeLink(uuid)
        if (connectionStatus === 'connected' && apiUrl) {
            window.api.deleteSyncedLink({ apiUrl, uuid })
        }
    }

    const handleRemoveWorkspace = (uuid) => {
        removeLinksForWorkspace(uuid)
        removeWorkspace(uuid)
        if (connectionStatus === 'connected' && apiUrl) {
            window.api.deleteSyncedWorkspace({ apiUrl, uuid })
        }
    }

    const applyPull = async () => {
        const result = await pullSync()
        if (result.ok && result.data) {
            mergeWorkspaces(result.data.workspaces)
            mergeLinks(result.data.links)
        }
    }

    const handleTestConnection = async () => {
        const result = await testConnection()
        if (result.ok) applyPull()
        return result
    }

    const handleSyncWorkspace = async () => {
        if (!selectedWorkspace) return
        await syncWorkspace(selectedWorkspace, workspaceLinks)
        applyPull()
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

    useEffect(() => {
        const webview = webviewRef.current
        if (!webview) return
        const handleFail = (e) => {
            if (import.meta.env.DEV) console.error('Webview failed to load:', e)
            setLoadError(e.errorDescription || 'Error loading page. Check the URL or your connection.')
        }
        const handleStart = () => setPageTitle('Materializing...')
        const handleTitle = (e) => setPageTitle(e.title)
        webview.addEventListener('did-fail-load', handleFail)
        webview.addEventListener('did-start-loading', handleStart)
        webview.addEventListener('page-title-updated', handleTitle)
        return () => {
            webview.removeEventListener('did-fail-load', handleFail)
            webview.removeEventListener('did-start-loading', handleStart)
            webview.removeEventListener('page-title-updated', handleTitle)
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
            <div className="h-10 bg-gray-900 border-b border-gray-700 flex items-center px-4 justify-between draggable shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                        onClick={() => { setCurrentUrl(''); setLoadError(null) }}
                        className="p-1.5 hover:bg-gray-700 rounded text-gray-300 no-drag shrink-0"
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
                        onClick={() => setIsWorkspaceSidebarOpen(!isWorkspaceSidebarOpen)}
                        className={`p-1.5 rounded no-drag ${isWorkspaceSidebarOpen ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                        title="Toggle Workspace Sidebar"
                    >
                        <Layers size={16} />
                    </button>
                    <button
                        onClick={toggleAlwaysOnTop}
                        className={`p-1.5 rounded no-drag ${isAlwaysOnTop ? 'bg-zinc-600 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                        title="Toggle Always on Top"
                    >
                        {isAlwaysOnTop ? <Pin size={16} /> : <PinOff size={16} />}
                    </button>
                    <button
                        onClick={() => setIsBitwardenOpen(!isBitwardenOpen)}
                        className={`p-1.5 rounded no-drag ${isBitwardenOpen ? 'bg-gray-700 text-white' : 'hover:bg-gray-700 text-gray-400'}`}
                        title="Toggle Bitwarden Sidebar"
                    >
                        {isBitwardenOpen ? <SidebarClose size={16} /> : <Shield size={16} />}
                    </button>
                </div>
            </div>
            <div className="flex-1 w-full bg-white relative">
                {loadError && (
                    <div className="absolute inset-0 z-10 bg-gray-900 flex flex-col items-center justify-center p-8 text-center">
                        <img src={iconSrc} alt="Phantom" className="w-16 h-16 mb-4 opacity-50" />
                        <h2 className="text-xl font-bold text-gray-100 mb-2">The Phantom cannot reach this realm.</h2>
                        <p className="text-gray-400 max-w-md mb-6">{loadError}</p>
                        <button
                            onClick={() => { const wv = webviewRef.current; if (wv) wv.reload() }}
                            className="px-6 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg transition-colors font-medium"
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
                    connectionStatus={connectionStatus}
                    onTestConnection={handleTestConnection}
                    onSyncWorkspace={handleSyncWorkspace}
                    selectedWorkspace={selectedWorkspace}
                    linksCount={workspaceLinks.length}
                    lastSynced={lastSynced}
                    syncStatus={syncStatus}
                    syncError={syncError}
                    onClose={() => setIsWorkspaceSidebarOpen(false)}
                />
            )}

            {/* Main Dashboard Area */}
            <div className="flex-1 relative overflow-hidden bg-gray-900 transition-colors duration-500">
                <InteractiveBackground />
                <ScrollIndicator containerRef={dashboardContainer} watch={[workspaceLinks]} />
                <div
                    ref={(el) => {
                        dashboardRef.current = el
                        if (el !== dashboardContainer) setDashboardContainer(el)
                    }}
                    className="h-full w-full p-4 sm:p-8 overflow-y-auto min-w-0 font-sans text-gray-100 relative z-10"
                >
                    <div className="max-w-2xl mx-auto">
                        <header className="mb-8 flex items-center justify-between gap-4 flex-wrap draggable">
                            <h1 className="text-2xl font-bold flex items-center gap-2 relative">
                                <GhostLogo isHidden={isGhostHidden} onTrigger={handleGhostTrigger} />
                                <span
                                    className={`transition-all duration-[1500ms] ease-in-out block ${
                                        isGhostHidden
                                            ? 'blur-[10px] opacity-0 scale-[1.2] -translate-y-[10px]'
                                            : 'blur-0 opacity-100 scale-100 translate-y-0'
                                    }`}
                                >
                                    Phantom
                                </span>
                                {appVersion && (
                                    <span className="text-[10px] text-gray-600 font-normal tracking-widest uppercase select-none">
                                        v{appVersion}
                                    </span>
                                )}
                            </h1>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsWorkspaceSidebarOpen(!isWorkspaceSidebarOpen)}
                                    className={`p-2 rounded-lg text-gray-300 flex items-center gap-2 transition-colors border no-drag ${
                                        isWorkspaceSidebarOpen
                                            ? 'bg-gray-700 border-gray-600'
                                            : 'bg-gray-800 hover:bg-gray-700 border-gray-700'
                                    }`}
                                    title="Toggle Workspace Sidebar"
                                >
                                    <Layers size={16} className="text-zinc-400" />
                                    <span className="text-sm hidden sm:inline">Workspaces</span>
                                </button>
                                <button
                                    onClick={() => setIsBitwardenOpen(!isBitwardenOpen)}
                                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 flex items-center gap-2 transition-colors border border-gray-700 no-drag"
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
                                <span className="text-gray-600">· {workspaceLinks.length} link{workspaceLinks.length !== 1 ? 's' : ''}</span>
                            </div>
                        )}

                        {!selectedWorkspace && (
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 text-center text-gray-500 mb-8">
                                <Layers size={24} className="mx-auto mb-2 text-gray-600" />
                                <p className="text-sm">No workspace selected. Create one in the sidebar to get started.</p>
                            </div>
                        )}

                        {selectedWorkspace && (
                            <div className="bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg border border-gray-700 mb-8">
                                <h2 className="text-lg font-semibold mb-4 text-gray-200">Add New Link</h2>
                                <div className="flex flex-col gap-3">
                                    <input
                                        type="text"
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        placeholder="Enter URL (e.g. google.com)"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200"
                                    />
                                    <input
                                        type="text"
                                        value={newAlias}
                                        onChange={(e) => setNewAlias(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addLinkToWorkspace()}
                                        placeholder="Name (optional)"
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-200"
                                    />
                                    <button
                                        onClick={addLinkToWorkspace}
                                        className="bg-zinc-600 hover:bg-zinc-500 text-white px-6 py-2 rounded-lg font-medium transition-colors w-full flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Add Link
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedWorkspace && (
                            <div className="grid grid-cols-1 gap-4">
                                {workspaceLinks.map((item) => (
                                    <div
                                        key={item.uuid}
                                        className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between group hover:border-purple-500/50 transition-colors w-full min-w-0"
                                    >
                                        <div
                                            className="flex-1 cursor-pointer flex items-center gap-4 min-w-0 mr-4"
                                            onClick={() => {
                                                const safe = sanitizeUrl(item.url)
                                                if (safe) setCurrentUrl(safe)
                                            }}
                                        >
                                            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center shrink-0 border border-gray-700 overflow-hidden">
                                                <PageIcon url={item.url} />
                                            </div>
                                            <div className="min-w-0 truncate">
                                                <h3 className="font-semibold text-gray-100 truncate">
                                                    {item.name || cleanUrl(item.url)}
                                                </h3>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {item.name ? cleanUrl(item.url) : 'Click to open'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveLink(item.uuid)}
                                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-700/50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remove"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}

                                {workspaceLinks.length === 0 && (
                                    <div className="text-center py-12 text-gray-500">
                                        No links yet. Add one above!
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )

    return (
        <div className={`flex h-screen w-screen overflow-hidden bg-gray-900 border border-gray-700 relative ${isResizing ? 'cursor-col-resize' : 'cursor-default'}`}>
            {/* Global Invisible Drag Handle */}
            <div className="fixed top-0 left-0 right-0 h-1 z-[9999] draggable pointer-events-none"></div>

            {/* Main Content Area (Dashboard or Browser) */}
            {currentUrl ? renderBrowser() : renderDashboard()}

            {/* Bitwarden Sidebar */}
            {isBitwardenOpen && (
                <div
                    className="border-l border-gray-700 flex flex-col bg-white shrink-0 shadow-xl z-50 relative"
                    style={{ width: `${sidebarWidth}px` }}
                >
                    <div
                        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-zinc-500 transition-colors z-50"
                        onMouseDown={() => setIsResizing(true)}
                    ></div>
                    <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3 shrink-0 draggable">
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
            <div className="fixed bottom-4 right-4 text-[10px] text-gray-600 pointer-events-none select-none uppercase tracking-widest bg-gray-900/50 px-2 py-1 rounded border border-gray-800/50 z-[100]">
                Ctrl + Q to close
            </div>

            <UpdateNotifier />
        </div>
    )
}

export default App
