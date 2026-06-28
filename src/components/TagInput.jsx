import { useState } from 'react'
import { X } from 'lucide-react'

const MAX_TAG_LENGTH = 30

export default function TagInput({ value = [], onChange, maxTags = 3, className = '' }) {
    const [inputValue, setInputValue] = useState('')

    const addTag = (raw) => {
        const trimmed = raw.trim().toLowerCase().slice(0, MAX_TAG_LENGTH)
        if (!trimmed) return
        if (value.length >= maxTags) return
        if (value.includes(trimmed)) return
        onChange([...value, trimmed])
        setInputValue('')
    }

    const removeTag = (name) => onChange(value.filter((t) => t !== name))

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            addTag(inputValue)
        }
        if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            removeTag(value[value.length - 1])
        }
    }

    const handleBlur = () => {
        if (inputValue.trim()) addTag(inputValue)
    }

    return (
        <div
            className={`flex flex-wrap gap-1.5 items-center bg-[#0d0a14] border border-purple-900/40 px-3 py-2 min-h-[38px] cursor-text ${className}`}
            onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
        >
            {value.map((tag) => (
                <span
                    key={tag}
                    className="flex items-center gap-1 bg-purple-900/50 border border-purple-700/40 text-purple-200 text-xs px-2 py-0.5"
                >
                    {tag}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
                        className="hover:text-white transition-colors"
                    >
                        <X size={10} />
                    </button>
                </span>
            ))}
            {value.length < maxTags ? (
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={handleBlur}
                    placeholder={value.length === 0 ? 'Tags (Enter para confirmar, máx. 3)' : '+ tag'}
                    className="bg-transparent text-xs text-gray-200 focus:outline-none flex-1 min-w-[100px] placeholder-gray-600"
                />
            ) : (
                <span className="text-xs text-gray-600 italic">Máximo de {maxTags} tags</span>
            )}
        </div>
    )
}
