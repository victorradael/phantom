import { useEffect } from 'react'
import { X, Info } from 'lucide-react'

export default function Toast({ message, onClose }) {
    useEffect(() => {
        if (message) {
            const timer = setTimeout(onClose, 4000)
            return () => clearTimeout(timer)
        }
    }, [message, onClose])

    if (!message) return null

    return (
        <div className="fixed top-20 right-8 z-[120] animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="brushed-metal group relative flex items-center gap-4 px-6 py-4 shadow-2xl border border-purple-400/20 max-w-sm overflow-hidden bg-[#1a0f2e]">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>

                <div className="relative flex items-center justify-center w-12 h-12 bg-purple-500/20 shrink-0 border border-purple-400/30">
                    <Info className="text-purple-300" size={24} />
                </div>

                <div className="relative flex flex-col min-w-0 pr-6">
                    <h3 className="font-bold text-white leading-tight">
                        Aviso
                    </h3>
                    <p className="text-xs text-slate-300/90 font-medium mt-1">
                        {message}
                    </p>
                </div>

                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 p-1 text-slate-400/50 hover:text-white transition-colors no-drag"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    )
}
