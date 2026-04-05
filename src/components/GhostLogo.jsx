export default function GhostLogo({ isHidden, onTrigger }) {
    return (
        <span
            onMouseEnter={onTrigger}
            className="text-4xl inline-block cursor-default select-none transition-all duration-1000 ease-in-out"
            style={{
                opacity: isHidden ? 0 : 1,
                transform: isHidden ? 'scale(1.5)' : 'scale(1)',
                filter: isHidden ? 'blur(8px)' : 'blur(0)'
            }}
        >
            👻
        </span>
    )
}
