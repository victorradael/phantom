import { useState, useEffect } from 'react'
import { Sparkles, Download, X, RefreshCw } from 'lucide-react'

export default function UpdateNotifier() {
    const [updateInfo, setUpdateInfo] = useState(null)
    const [downloadProgress, setDownloadProgress] = useState(null)
    const [isDownloaded, setIsDownloaded] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    useEffect(() => {
        window.api?.onUpdateAvailable((info) => {
            setUpdateInfo(info)
        })
        window.api?.onDownloadProgress((progress) => {
            setDownloadProgress(Math.floor(progress.percent))
        })
        window.api?.onUpdateDownloaded(() => {
            setDownloadProgress(null)
            setIsDownloaded(true)
        })
        window.api?.onUpdateError((message) => {
            if (import.meta.env.DEV) console.error('[UpdateNotifier] Error:', message)
        })
    }, [])

    if (!updateInfo || isDismissed) return null

    const handleDownload = () => {
        setDownloadProgress(0)
        window.api?.downloadUpdate()
    }

    const handleInstall = () => {
        window.api?.installUpdate()
    }

    return (
        <div className="fixed bottom-20 right-8 z-[110] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="brushed-metal group relative flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border border-purple-400/20 max-w-sm overflow-hidden">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>

                <div className="relative flex items-center justify-center w-12 h-12 bg-purple-500/20 rounded-xl shrink-0 border border-purple-400/30">
                    <Sparkles className="text-purple-300 animate-pulse" size={24} />
                </div>

                <div className="relative flex flex-col min-w-0">
                    <h3 className="font-bold text-white leading-tight">
                        New Version Available!
                    </h3>
                    <p className="text-xs text-slate-300/90 font-medium">
                        Version {updateInfo.version} is ready.
                    </p>

                    {downloadProgress !== null && !isDownloaded && (
                        <div className="mt-2 flex flex-col gap-1">
                            <div className="w-full bg-purple-900/40 rounded-full h-1.5">
                                <div
                                    className="bg-purple-400 h-1.5 rounded-full transition-all"
                                    style={{ width: `${downloadProgress}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-slate-400">{downloadProgress}% downloaded</span>
                        </div>
                    )}

                    {!isDownloaded && downloadProgress === null && (
                        <button
                            onClick={handleDownload}
                            className="mt-2 flex items-center justify-center gap-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-100 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border border-purple-400/30 no-drag"
                        >
                            <Download size={14} className="text-purple-300" />
                            Download Update
                        </button>
                    )}

                    {isDownloaded && (
                        <button
                            onClick={handleInstall}
                            className="mt-2 flex items-center justify-center gap-2 bg-green-500/20 hover:bg-green-500/40 text-green-100 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border border-green-400/30 no-drag"
                        >
                            <RefreshCw size={14} className="text-green-300" />
                            Install & Restart
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setIsDismissed(true)}
                    className="absolute top-2 right-2 p-1 text-slate-400/50 hover:text-white transition-colors no-drag"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    )
}
