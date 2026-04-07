import iconSrc from '/icon.png'

export default function GhostLogo({ isHidden }) {
    return (
        <img
            src={iconSrc}
            alt="Phantom"
            className="w-14 h-14 inline-block cursor-default select-none"
            style={{
                opacity: isHidden ? 0 : 1,
                transform: isHidden ? 'scale(1.6) translateY(-6px)' : 'scale(1) translateY(0)',
                filter: isHidden ? 'blur(14px) brightness(1.4)' : 'blur(0) brightness(1)',
                transition: 'opacity 1400ms ease-in-out, transform 1400ms ease-in-out, filter 1400ms ease-in-out',
            }}
        />
    )
}
