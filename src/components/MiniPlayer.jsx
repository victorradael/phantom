import { useEffect, useRef, useState } from 'react'
import iconSrc from '/icon.png'
import { ArrowLeft, ArrowRight, RotateCw, Maximize2 } from 'lucide-react'

function MarqueeText({ text }) {
    const containerRef = useRef(null)
    const measureRef = useRef(null)
    const [shouldScroll, setShouldScroll] = useState(false)

    useEffect(() => {
        const container = containerRef.current
        const measure = measureRef.current
        if (!container || !measure) return

        const check = () => setShouldScroll(measure.scrollWidth > container.clientWidth)
        check()

        // Re-check on actual layout changes (e.g. the OS window resizing into
        // mini mode happens asynchronously, after this effect's first run)
        const observer = new ResizeObserver(check)
        observer.observe(container)
        return () => observer.disconnect()
    }, [text])

    return (
        <div ref={containerRef} className="relative overflow-hidden whitespace-nowrap w-full leading-tight text-xs font-medium text-gray-200">
            <span ref={measureRef} className="absolute opacity-0 pointer-events-none whitespace-pre">{text}</span>
            {shouldScroll ? (
                <span className="inline-block whitespace-pre animate-marquee">{text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{text}</span>
            ) : (
                <span className="block truncate">{text}</span>
            )}
        </div>
    )
}

export default function MiniPlayer({ title, url, canGoBack, canGoForward, onBack, onForward, onReload, onRestore }) {
    const hostname = (() => {
        try { return new URL(url).hostname }
        catch { return '' }
    })()

    return (
        <div className="h-full w-full flex items-center bg-[#0d0a14] px-2 gap-2 draggable select-none">
            <img src={iconSrc} alt="Phantom" className="w-9 h-9 shrink-0 no-drag" />

            <div className="flex-1 min-w-0 flex flex-col justify-center no-drag">
                <MarqueeText text={title || 'Materializing...'} />
                <span className="text-[10px] text-gray-500 truncate leading-tight opacity-70">{hostname}</span>
            </div>

            <div className="flex items-center gap-0.5 shrink-0 no-drag">
                <button
                    onClick={onBack}
                    disabled={!canGoBack}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-purple-900/30 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Back"
                >
                    <ArrowLeft size={14} />
                </button>
                <button
                    onClick={onReload}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-purple-900/30"
                    title="Reload"
                >
                    <RotateCw size={14} />
                </button>
                <button
                    onClick={onForward}
                    disabled={!canGoForward}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-purple-900/30 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Forward"
                >
                    <ArrowRight size={14} />
                </button>
                <button
                    onClick={onRestore}
                    className="p-1.5 text-purple-300 hover:text-white hover:bg-purple-900/30"
                    title="Restore"
                >
                    <Maximize2 size={14} />
                </button>
            </div>
        </div>
    )
}
