import { useState, useRef } from 'react'
import {
    Plus,
    Trash2,
    CheckCircle,
    XCircle,
    Loader,
    RefreshCw,
    Wifi,
    WifiOff,
    FolderOpen,
    ChevronDown,
    ChevronRight,
    Link as LinkIcon,
    Layers,
    SidebarClose,
    Info,
    Eye,
    EyeOff
} from 'lucide-react'

function ConnectionIndicator({ status }) {
    if (status === 'unconfigured') {
        return <span className="w-2 h-2 bg-gray-600 inline-block" title="Not configured" />
    }
    if (status === 'testing') {
        return <Loader size={10} className="animate-spin text-yellow-400 inline-block" />
    }
    if (status === 'connected') {
        return <span className="w-2 h-2 bg-green-500 inline-block" title="Connected" />
    }
    return <span className="w-2 h-2 bg-red-500 inline-block" title="Disconnected" />
}

function SyncStatusBadge({ syncStatus, syncError }) {
    if (syncStatus === 'syncing') {
        return (
            <span className="text-xs text-yellow-400 flex items-center gap-1">
                <Loader size={10} className="animate-spin" /> Syncing...
            </span>
        )
    }
    if (syncStatus === 'success') {
        return (
            <span className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle size={10} /> Synced
            </span>
        )
    }
    if (syncStatus === 'error') {
        return (
            <span className="text-xs text-red-400 flex items-center gap-1" title={syncError}>
                <XCircle size={10} /> Failed
            </span>
        )
    }
    return null
}

function WorkspaceSyncIcon({ wsUuid, syncingWorkspaceUuid, syncStatus }) {
    if (syncingWorkspaceUuid !== wsUuid) return null
    if (syncStatus === 'syncing') return <Loader size={11} className="animate-spin text-yellow-400 shrink-0" />
    if (syncStatus === 'success') return <CheckCircle size={11} className="text-green-400 shrink-0" />
    if (syncStatus === 'error') return <XCircle size={11} className="text-red-400 shrink-0" />
    return null
}

export default function WorkspaceSidebar({
    workspaces,
    selectedWorkspaceId,
    onSelectWorkspace,
    onAddWorkspace,
    onRemoveWorkspace,
    apiUrl,
    onSetApiUrl,
    apiToken,
    onSetApiToken,
    connectionStatus,
    onTestConnection,
    onSyncWorkspace,
    onSyncWorkspaceById,
    selectedWorkspace,
    linksCount,
    lastSynced,
    syncStatus,
    syncError,
    syncAnalysis,
    syncingWorkspaceUuid,
    onClose,
    onDropLink,
    setToastMessage
}) {
    const [newWorkspaceName, setNewWorkspaceName] = useState('')
    const [showNewWorkspaceInput, setShowNewWorkspaceInput] = useState(false)
    const [localApiUrl, setLocalApiUrl] = useState(apiUrl)
    const [localApiToken, setLocalApiToken] = useState(apiToken)
    const [showToken, setShowToken] = useState(false)
    const [apiSectionOpen, setApiSectionOpen] = useState(true)
    const [workspaceSectionOpen, setWorkspaceSectionOpen] = useState(true)
    const [testResult, setTestResult] = useState(null)
    const [dragOverWorkspaceId, setDragOverWorkspaceId] = useState(null)
    const [tooltipPos, setTooltipPos] = useState(null)
    const infoIconRef = useRef(null)

    const handleAddWorkspace = () => {
        if (!newWorkspaceName.trim()) return
        const { isDuplicate } = onAddWorkspace(newWorkspaceName)
        if (isDuplicate) {
            setToastMessage?.('Este workspace já existe.')
        } else {
            setNewWorkspaceName('')
            setShowNewWorkspaceInput(false)
        }
    }

    const handleApiUrlBlur = () => {
        if (localApiUrl !== apiUrl) {
            onSetApiUrl(localApiUrl)
            setTestResult(null)
        }
    }

    const handleApiTokenBlur = () => {
        if (localApiToken !== apiToken) {
            onSetApiToken(localApiToken)
            setTestResult(null)
        }
    }

    const handleTestConnection = async () => {
        setTestResult(null)
        const result = await onTestConnection()
        setTestResult(result)
    }

    const isConnected = connectionStatus === 'connected'
    const hasAnalysis = isConnected && syncAnalysis?.lastAnalyzedAt

    const getWorkspaceSyncBorder = (wsUuid) => {
        if (!hasAnalysis) return ''
        const status = syncAnalysis.workspaces?.[wsUuid]
        if (status === 'synced') return 'border-l-2 border-l-green-500/70'
        if (status === 'partial') return 'border-l-2 border-l-amber-400/80'
        // 'unsynced' or undefined (workspace created after last analysis)
        return 'border-l-2 border-l-red-500/60'
    }

    return (
        <div className="flex flex-col h-full bg-[#0d0a14] border-r border-purple-900/40 w-64 shrink-0 overflow-y-auto">
            {/* Header */}
            <div className="h-10 bg-[#1a0f2e] border-b border-purple-900/40 flex items-center justify-between px-3 shrink-0 draggable">
                <span className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <Layers size={14} className="text-zinc-400" />
                    Workspaces
                    {hasAnalysis && (
                        <div
                            ref={infoIconRef}
                            className="no-drag cursor-help"
                            onMouseEnter={() => {
                                const rect = infoIconRef.current?.getBoundingClientRect()
                                if (rect) setTooltipPos({ top: rect.bottom + 6, left: rect.left })
                            }}
                            onMouseLeave={() => setTooltipPos(null)}
                        >
                            <Info size={12} className="text-gray-500 hover:text-gray-300 transition-colors" />
                        </div>
                    )}
                    {tooltipPos && (
                        <div
                            style={{ position: 'fixed', top: tooltipPos.top, left: tooltipPos.left }}
                            className="z-[9999] w-44 bg-[#0d0a14] border border-purple-900/40 p-2.5 shadow-xl pointer-events-none"
                        >
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Sync Status</p>
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-3 shrink-0 bg-green-500/70" />
                                    <span className="text-[10px] text-gray-400">Synced</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-3 shrink-0 bg-amber-400/80" />
                                    <span className="text-[10px] text-gray-400">Partial (unsynced links)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-3 shrink-0 bg-red-500/60" />
                                    <span className="text-[10px] text-gray-400">Not synced with server</span>
                                </div>
                            </div>
                        </div>
                    )}
                </span>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white no-drag"
                    title="Recolher barra"
                >
                    <SidebarClose size={16} />
                </button>
            </div>

            {/* API Configuration Section */}
            <div className="border-b border-purple-900/30">
                <button
                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-purple-900/20 transition-colors no-drag"
                    onClick={() => setApiSectionOpen(!apiSectionOpen)}
                >
                    <span className="flex items-center gap-2">
                        {isConnected ? <Wifi size={12} className="text-green-400" /> : <WifiOff size={12} className="text-gray-500" />}
                        API Connection
                    </span>
                    {apiSectionOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>

                {apiSectionOpen && (
                    <div className="px-3 pb-3 space-y-2">
                        {(!apiUrl || !apiToken) && (
                            <p className="text-xs text-gray-500 bg-[#1a0f2e] p-2 leading-relaxed">
                                Configure a URL e o token para habilitar a sincronização.
                            </p>
                        )}

                        <div className="space-y-2">
                            <input
                                type="url"
                                value={localApiUrl}
                                onChange={(e) => setLocalApiUrl(e.target.value)}
                                onBlur={handleApiUrlBlur}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleApiUrlBlur()
                                        e.target.blur()
                                    }
                                }}
                                placeholder="http://localhost:8000"
                                className="w-full bg-[#0d0a14] border border-purple-900/40 px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-600 no-drag"
                            />

                            <div className="relative">
                                <input
                                    type={showToken ? 'text' : 'password'}
                                    value={localApiToken}
                                    onChange={(e) => setLocalApiToken(e.target.value)}
                                    onBlur={handleApiTokenBlur}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleApiTokenBlur()
                                            e.target.blur()
                                        }
                                    }}
                                    placeholder="API Token"
                                    className="w-full bg-[#0d0a14] border border-purple-900/40 px-3 py-1.5 pr-8 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-600 no-drag"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowToken((v) => !v)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors no-drag"
                                    tabIndex={-1}
                                >
                                    {showToken ? <EyeOff size={11} /> : <Eye size={11} />}
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleTestConnection}
                                    disabled={!localApiUrl || !localApiToken || connectionStatus === 'testing'}
                                    className="flex-1 text-xs px-3 py-1.5 bg-purple-900/40 hover:bg-purple-800/40 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 transition-colors flex items-center justify-center gap-1 no-drag"
                                >
                                    {connectionStatus === 'testing' ? (
                                        <><Loader size={10} className="animate-spin" /> Testing...</>
                                    ) : (
                                        'Test Connection'
                                    )}
                                </button>
                                <ConnectionIndicator status={connectionStatus} />
                            </div>

                            {testResult && !testResult.ok && (
                                <p className="text-xs text-red-400 bg-red-900/20 px-2 py-1 truncate" title={testResult.error}>
                                    {testResult.error}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Workspace Management Section */}
            <div className="border-b border-gray-700 flex-1">
                <button
                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-purple-900/20 transition-colors no-drag"
                    onClick={() => setWorkspaceSectionOpen(!workspaceSectionOpen)}
                >
                    <span className="flex items-center gap-2">
                        <FolderOpen size={12} />
                        Workspaces
                    </span>
                    {workspaceSectionOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>

                {workspaceSectionOpen && (
                    <div className="px-3 pb-3 space-y-1">
                        {workspaces.length === 0 && (
                            <p className="text-xs text-gray-600 text-center py-2">No workspaces yet</p>
                        )}

                        {workspaces.map((ws) => {
                            const wsSyncStatus = syncAnalysis?.workspaces?.[ws.uuid]
                            const needsSync = isConnected && hasAnalysis && wsSyncStatus !== 'synced'
                            const isSyncing = syncingWorkspaceUuid === ws.uuid && syncStatus === 'syncing'
                            return (
                                <div
                                    key={ws.uuid}
                                    className={`flex items-center justify-between px-2 py-1.5 cursor-pointer group transition-colors no-drag ${
                                        dragOverWorkspaceId === ws.uuid
                                            ? 'bg-purple-700/60 text-white outline outline-1 outline-purple-400'
                                            : selectedWorkspaceId === ws.uuid
                                                ? 'bg-purple-800/50 text-white'
                                                : 'hover:bg-purple-900/30 text-gray-300'
                                    } ${getWorkspaceSyncBorder(ws.uuid)}`}
                                    onClick={() => onSelectWorkspace(ws.uuid)}
                                    onDragOver={(e) => {
                                        e.preventDefault()
                                        if (dragOverWorkspaceId !== ws.uuid) setDragOverWorkspaceId(ws.uuid)
                                    }}
                                    onDragLeave={() => setDragOverWorkspaceId(null)}
                                    onDrop={(e) => {
                                        e.preventDefault()
                                        setDragOverWorkspaceId(null)
                                        const linkUuid = e.dataTransfer.getData('text/plain')
                                        if (linkUuid && onDropLink) {
                                            onDropLink(linkUuid, ws.uuid)
                                        }
                                    }}
                                >
                                    <span className="text-xs truncate flex-1">{ws.name}</span>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                        <WorkspaceSyncIcon
                                            wsUuid={ws.uuid}
                                            syncingWorkspaceUuid={syncingWorkspaceUuid}
                                            syncStatus={syncStatus}
                                        />
                                        {needsSync && onSyncWorkspaceById && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onSyncWorkspaceById(ws.uuid)
                                                }}
                                                disabled={isSyncing}
                                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-purple-300 text-gray-500 transition-colors disabled:opacity-30"
                                                title="Sync workspace"
                                            >
                                                <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                if (confirm(`Delete workspace "${ws.name}"?`)) {
                                                    onRemoveWorkspace(ws.uuid)
                                                }
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-gray-500 transition-colors"
                                            title="Delete workspace"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        {showNewWorkspaceInput ? (
                            <div className="flex gap-1 mt-1">
                                <input
                                    type="text"
                                    value={newWorkspaceName}
                                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddWorkspace()
                                        if (e.key === 'Escape') {
                                            setShowNewWorkspaceInput(false)
                                            setNewWorkspaceName('')
                                        }
                                    }}
                                    placeholder="Workspace name"
                                    className="flex-1 bg-[#0d0a14] border border-purple-900/40 px-2 py-1 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 no-drag"
                                    autoFocus
                                />
                                <button
                                    onClick={handleAddWorkspace}
                                    className="p-1 bg-purple-700 hover:bg-purple-600 text-white no-drag"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowNewWorkspaceInput(true)}
                                className="w-full flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-200 hover:bg-purple-900/20 transition-colors mt-1 no-drag"
                            >
                                <Plus size={12} /> New Workspace
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Sync Status Section */}
            <div className="p-3 space-y-1.5">
                {!isConnected && (
                    <p className="text-xs text-gray-600 text-center leading-relaxed">
                        {!apiUrl
                            ? 'Configure API URL above to enable sync'
                            : 'Test connection to enable sync'}
                    </p>
                )}

                {isConnected && !selectedWorkspace && (
                    <p className="text-xs text-gray-500 text-center">Select a workspace to sync</p>
                )}

                {isConnected && selectedWorkspace && (
                    <>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <LinkIcon size={10} />
                                {linksCount} link{linksCount !== 1 ? 's' : ''}
                            </span>
                            <SyncStatusBadge syncStatus={syncStatus} syncError={syncError} />
                        </div>
                        {lastSynced && (
                            <p className="text-xs text-gray-600 text-center">
                                Last synced: {new Date(lastSynced).toLocaleTimeString()}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
