import React, { useEffect, useRef } from 'react';

const InteractiveBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = window.innerWidth;
        let height = window.innerHeight;

        // Fog "puffs"
        const particles = [];
        const mouse = { x: -1000, y: -1000, radius: 300 }; // Large interaction radius

        class FogPuff {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                // Larger, more visible puffs
                this.size = Math.random() * 150 + 120;

                // Movement
                this.vx = (Math.random() - 0.5) * 0.3; // Slightly faster drift
                this.vy = (Math.random() - 0.5) * 0.3;

                // Appearance - Much more visible
                this.opacity = Math.random() * 0.12 + 0.08; // Increased for visibility
                this.growth = (Math.random() - 0.5) * 0.15;
            }

            draw() {
                // Create a radial gradient for the "puff" look
                // Darker monochromatic palette to match low-poly icon
                const gradient = ctx.createRadialGradient(
                    this.x, this.y, 0,
                    this.x, this.y, this.size
                );

                // Using Zinc/Gray colors (darker, less blue)
                // Zinc-500: 113, 113, 122
                // Zinc-700: 63, 63, 70
                // Zinc-800: 39, 39, 42
                gradient.addColorStop(0, `rgba(113, 113, 122, ${this.opacity})`); // Center - zinc-500
                gradient.addColorStop(0.5, `rgba(63, 63, 70, ${this.opacity * 0.5})`); // Mid - zinc-700
                gradient.addColorStop(1, `rgba(39, 39, 42, 0)`); // Edge - zinc-800

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.size += this.growth;

                // Breathing size effect
                if (this.size > 300 || this.size < 100) this.growth *= -1;

                // Mouse interaction: Pushed away by the "Phantom" presence
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouse.radius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (mouse.radius - distance) / mouse.radius;
                    const pushX = Math.cos(angle) * force * 2;
                    const pushY = Math.sin(angle) * force * 2;

                    this.x -= pushX;
                    this.y -= pushY;
                }

                // Screen wrapping
                if (this.x < -this.size) this.x = width + this.size;
                if (this.x > width + this.size) this.x = -this.size;
                if (this.y < -this.size) this.y = height + this.size;
                if (this.y > height + this.size) this.y = -this.size;
            }
        }

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            // Re-populate fog based on screen size
            particles.length = 0;
            const area = width * height;
            // Higher density for more visible fog
            const targetCount = Math.floor(area / 10000);

            for (let i = 0; i < targetCount; i++) {
                particles.push(new FogPuff());
            }
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        // Initial setup
        resize();

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw all fog puffs
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 0.6 }}
        />
    );
};

export default InteractiveBackground;
