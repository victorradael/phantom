import { useState, useEffect, useRef } from 'react'
import { X, Plus, Link2 } from 'lucide-react'
import TagInput from './TagInput'

export default function CreateLinkModal({ isOpen, onClose, onSubmit }) {
    const [url, setUrl] = useState('')
    const [alias, setAlias] = useState('')
    const [tags, setTags] = useState([])
    const [visible, setVisible] = useState(false)
    const urlInputRef = useRef(null)

    useEffect(() => {
        if (isOpen) {
            setVisible(true)
            setTimeout(() => urlInputRef.current?.focus(), 50)
        } else {
            setVisible(false)
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    const handleClose = () => {
        setVisible(false)
        setTimeout(onClose, 200)
    }

    const handleSubmit = () => {
        if (!url.trim()) return
        onSubmit({ url: url.trim(), alias: alias.trim(), tags })
        setUrl('')
        setAlias('')
        setTags([])
        handleClose()
    }

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) handleClose()
    }

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
            style={{
                backgroundColor: 'rgba(8, 4, 18, 0.80)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                opacity: visible ? 1 : 0,
                transition: 'opacity 200ms ease',
            }}
        >
            <div
                className="w-full max-w-md relative"
                style={{
                    transform: visible ? 'translateY(0)' : 'translateY(16px)',
                    opacity: visible ? 1 : 0,
                    transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease',
                }}
            >
                {/* Glow accent */}
                <div
                    className="absolute -inset-px pointer-events-none"
                    style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.25) 0%, transparent 60%)',
                        borderRadius: 2,
                    }}
                />

                <div
                    className="relative border border-purple-900/50 shadow-2xl"
                    style={{ background: 'linear-gradient(160deg, #1e1133 0%, #0d0a14 60%)' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-purple-900/30">
                        <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center w-7 h-7 bg-purple-700/30 border border-purple-600/30">
                                <Link2 size={13} className="text-purple-300" />
                            </div>
                            <h2 className="text-base font-semibold text-gray-100 tracking-tight">
                                Add New Link
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1 text-gray-500 hover:text-gray-200 hover:bg-purple-900/40 transition-colors"
                            aria-label="Close modal"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-6 py-5 flex flex-col gap-3.5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                                URL <span className="text-purple-500">*</span>
                            </label>
                            <input
                                ref={urlInputRef}
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                placeholder="https://example.com"
                                className="w-full bg-[#0d0a14] border border-purple-900/40 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-600/60 focus:ring-1 focus:ring-purple-600/30 transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                                Name <span className="text-gray-700">— optional</span>
                            </label>
                            <input
                                type="text"
                                value={alias}
                                onChange={(e) => setAlias(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                placeholder="My awesome link"
                                className="w-full bg-[#0d0a14] border border-purple-900/40 px-4 py-2.5 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-purple-600/60 focus:ring-1 focus:ring-purple-600/30 transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                                Tags <span className="text-gray-700">— optional</span>
                            </label>
                            <TagInput value={tags} onChange={setTags} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 pb-5 flex gap-2.5 justify-end">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 border border-purple-900/30 hover:border-purple-800/60 bg-transparent hover:bg-purple-900/20 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!url.trim()}
                            className="px-5 py-2 text-sm font-medium flex items-center gap-2 transition-all
                                bg-purple-700 hover:bg-purple-600 text-white border border-purple-600/50 hover:border-purple-500/70
                                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-purple-700"
                        >
                            <Plus size={14} />
                            Add Link
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
