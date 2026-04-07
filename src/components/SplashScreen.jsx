import { useState, useEffect } from 'react'
import iconSrc from '/icon.png'

export default function SplashScreen({ onComplete }) {
    const [logoVisible, setLogoVisible] = useState(false)
    const [fading, setFading] = useState(false)

    useEffect(() => {
        const appearTimer  = setTimeout(() => setLogoVisible(true), 120)
        const fadeTimer    = setTimeout(() => setFading(true), 2600)
        const completeTimer = setTimeout(() => onComplete(), 3700)

        return () => {
            clearTimeout(appearTimer)
            clearTimeout(fadeTimer)
            clearTimeout(completeTimer)
        }
    }, [onComplete])

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: '#0d0a14',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                opacity: fading ? 0 : 1,
                transition: fading ? 'opacity 1100ms ease-in-out' : 'none',
            }}
        >
            <img
                src={iconSrc}
                alt="Phantom"
                style={{
                    width: '300px',
                    height: '300px',
                    imageRendering: 'auto',
                    opacity: logoVisible ? 1 : 0,
                    filter: logoVisible
                        ? 'blur(0px) brightness(1) drop-shadow(0 0 48px rgba(139, 92, 246, 0.45))'
                        : 'blur(36px) brightness(3)',
                    transform: logoVisible ? 'scale(1)' : 'scale(1.3)',
                    transition: 'opacity 1900ms ease-out, filter 1900ms ease-out, transform 1900ms ease-out',
                }}
            />
        </div>
    )
}
