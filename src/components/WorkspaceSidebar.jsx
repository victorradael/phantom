import { useState } from 'react'
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
    SidebarClose
} from 'lucide-react'

function ConnectionIndicator({ status }) {
    if (status === 'unconfigured') {
        return <span className="w-2 h-2 rounded-full bg-gray-600 inline-block" title="Not configured" />
    }
    if (status === 'testing') {
        return <Loader size={10} className="animate-spin text-yellow-400 inline-block" />
    }
    if (status === 'connected') {
        return <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="Connected" />
    }
    return <span className="w-2 h-2 rounded-full bg-red-500 inline-block" title="Disconnected" />
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

export default function WorkspaceSidebar({
    workspaces,
    selectedWorkspaceId,
    onSelectWorkspace,
    onAddWorkspace,
    onRemoveWorkspace,
    apiUrl,
    onSetApiUrl,
    connectionStatus,
    onTestConnection,
    onSyncWorkspace,
    selectedWorkspace,
    linksCount,
    lastSynced,
    syncStatus,
    syncError,
    onClose
}) {
    const [newWorkspaceName, setNewWorkspaceName] = useState('')
    const [showNewWorkspaceInput, setShowNewWorkspaceInput] = useState(false)
    const [localApiUrl, setLocalApiUrl] = useState(apiUrl)
    const [apiSectionOpen, setApiSectionOpen] = useState(true)
    const [workspaceSectionOpen, setWorkspaceSectionOpen] = useState(true)
    const [testResult, setTestResult] = useState(null)

    const handleAddWorkspace = () => {
        if (!newWorkspaceName.trim()) return
        onAddWorkspace(newWorkspaceName)
        setNewWorkspaceName('')
        setShowNewWorkspaceInput(false)
    }

    const handleApiUrlBlur = () => {
        if (localApiUrl !== apiUrl) {
            onSetApiUrl(localApiUrl)
            setTestResult(null)
        }
    }

    const handleTestConnection = async () => {
        setTestResult(null)
        const result = await onTestConnection()
        setTestResult(result)
    }

    const handleSync = () => {
        if (selectedWorkspace) {
            onSyncWorkspace()
        }
    }

    const isConnected = connectionStatus === 'connected'
    const canSync = isConnected && selectedWorkspace

    return (
        <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700 w-64 shrink-0 overflow-y-auto">
            {/* Header */}
            <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-3 shrink-0 draggable">
                <span className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <Layers size={14} className="text-zinc-400" /> Workspaces
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
            <div className="border-b border-gray-700">
                <button
                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-800 transition-colors no-drag"
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
                        {!apiUrl && (
                            <p className="text-xs text-gray-500 bg-gray-800 rounded-lg p-2 leading-relaxed">
                                Configure an API URL to enable workspace synchronization.
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
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-gray-600 no-drag"
                            />

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleTestConnection}
                                    disabled={!localApiUrl || connectionStatus === 'testing'}
                                    className="flex-1 text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 rounded-lg transition-colors flex items-center justify-center gap-1 no-drag"
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
                                <p className="text-xs text-red-400 bg-red-900/20 rounded px-2 py-1 truncate" title={testResult.error}>
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
                    className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:bg-gray-800 transition-colors no-drag"
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

                        {workspaces.map((ws) => (
                            <div
                                key={ws.uuid}
                                className={`flex items-center justify-between rounded-lg px-2 py-1.5 cursor-pointer group transition-colors no-drag ${
                                    selectedWorkspaceId === ws.uuid
                                        ? 'bg-zinc-700 text-white'
                                        : 'hover:bg-gray-800 text-gray-300'
                                }`}
                                onClick={() => onSelectWorkspace(ws.uuid)}
                            >
                                <span className="text-xs truncate flex-1">{ws.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if (confirm(`Delete workspace "${ws.name}"?`)) {
                                            onRemoveWorkspace(ws.uuid)
                                        }
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-400 text-gray-500 transition-colors shrink-0"
                                    title="Delete workspace"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}

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
                                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 no-drag"
                                    autoFocus
                                />
                                <button
                                    onClick={handleAddWorkspace}
                                    className="p-1 bg-zinc-600 hover:bg-zinc-500 rounded text-white no-drag"
                                >
                                    <Plus size={12} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowNewWorkspaceInput(true)}
                                className="w-full flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors mt-1 no-drag"
                            >
                                <Plus size={12} /> New Workspace
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Sync Section */}
            <div className="p-3 space-y-2">
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
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <LinkIcon size={10} />
                                {linksCount} link{linksCount !== 1 ? 's' : ''}
                            </span>
                            <SyncStatusBadge syncStatus={syncStatus} syncError={syncError} />
                        </div>

                        <button
                            onClick={handleSync}
                            disabled={syncStatus === 'syncing'}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-600 hover:bg-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors no-drag"
                        >
                            <RefreshCw size={12} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />
                            Sync "{selectedWorkspace.name}"
                        </button>

                        {lastSynced && (
                            <p className="text-xs text-gray-600 text-center">
                                Last synced: {new Date(lastSynced).toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
