export default function GhostLogo({ isHidden, onTrigger }) {
    return (
        <img
            src="/icon.png"
            alt="Phantom"
            onMouseEnter={onTrigger}
            className="w-10 h-10 inline-block cursor-default select-none transition-all duration-1000 ease-in-out"
            style={{
                opacity: isHidden ? 0 : 1,
                transform: isHidden ? 'scale(1.5)' : 'scale(1)',
                filter: isHidden ? 'blur(8px)' : 'blur(0)'
            }}
        />
    )
}
