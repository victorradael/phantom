import { useState, useEffect } from 'react'
import { Sparkles, Download, X } from 'lucide-react'

const REPO = 'victorradael/phantom'
const GITHUB_API = `https://api.github.com/repos/${REPO}/releases/latest`

export default function UpdateNotifier({ currentVersion }) {
    const [latestVersion, setLatestVersion] = useState(null)
    const [downloadUrl, setDownloadUrl] = useState(null)
    const [isVisible, setIsVisible] = useState(false)
    const [isDismissed, setIsDismissed] = useState(false)

    useEffect(() => {
        if (!currentVersion) return

        const checkUpdate = async () => {
            try {
                const response = await fetch(GITHUB_API)
                if (!response.ok) return

                const data = await response.json()
                const latest = data.tag_name.replace('v', '').trim()
                const current = currentVersion.replace('v', '').trim()

                if (latest !== current) {
                    setLatestVersion(data.tag_name)
                    setDownloadUrl(data.html_url)
                    setIsVisible(true)
                }
            } catch (error) {
                // FIX-11: Handled promise rejection — log only in dev
                if (import.meta.env.DEV) console.error('Failed to check for updates:', error)
            }
        }

        // FIX-11: Attach catch to the top-level call
        checkUpdate().catch((err) => {
            if (import.meta.env.DEV) console.error('[UpdateNotifier] Unexpected error:', err)
        })
    }, [currentVersion])

    // FIX-4 + FIX-7: Use the secure preload bridge (window.api.openExternal) instead of
    // direct ipcRenderer access. Removed the curl|bash clipboard copy — opens the
    // GitHub release page directly so the user can download a signed package.
    const handleUpdateClick = async () => {
        if (downloadUrl && window.api?.openExternal) {
            await window.api.openExternal(downloadUrl)
        }
    }

    if (!isVisible || isDismissed) return null

    return (
        <div className="fixed bottom-20 right-8 z-[110] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="brushed-metal group relative flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border border-blue-400/20 max-w-sm overflow-hidden">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>

                <div className="relative flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-xl shrink-0 border border-blue-400/30">
                    <Sparkles className="text-blue-300 animate-pulse" size={24} />
                </div>

                <div className="relative flex flex-col min-w-0">
                    <h3 className="font-bold text-white leading-tight">
                        New Version Available!
                    </h3>
                    <p className="text-xs text-slate-300/90 font-medium">
                        Version {latestVersion} is ready.
                    </p>
                    <button
                        onClick={handleUpdateClick}
                        className="mt-2 flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-100 py-1.5 px-3 rounded-lg text-xs font-bold transition-all border border-blue-400/30 no-drag"
                    >
                        <Download size={14} className="text-blue-300" />
                        View Release
                    </button>
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
