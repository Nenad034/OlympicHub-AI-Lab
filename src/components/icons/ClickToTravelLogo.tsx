import React, { useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../../stores';

interface LogoProps {
    height?: number | string;
    className?: string;
    showText?: boolean;
}

export const ClickToTravelLogo: React.FC<LogoProps> = ({ height = 87, className = "", showText = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const { theme } = useThemeStore();

    useEffect(() => {
        const img = new Image();
        img.src = "/clicktotravel.png";
        img.crossOrigin = "anonymous";

        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            const scale = 4;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);

            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                const width = canvas.width;
                const height = canvas.height;

                // Crop threshold removed for new logo

                for (let i = 0; i < data.length; i += 4) {
                    const pixelIndex = i / 4;
                    // const y = Math.floor(pixelIndex / width); // y not needed if no vertical crop


                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Calculate distance from white
                    const distFromWhite = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);

                    // Thresholds for removing white/gray background alias
                    if (distFromWhite < 60) {
                        data[i + 3] = 0; // Transparent for white/near-white
                    } else if (distFromWhite < 100) {
                        // Soft fade for anti-aliased edges (remove white halo)
                        const alpha = ((distFromWhite - 60) / 40) * 255;
                        data[i + 3] = alpha;
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                setImgLoaded(true);
            } catch (err) {
                console.error("Could not process logo pixels:", err);
                ctx.drawImage(img, 0, 0);
                setImgLoaded(true);
            }
        };
    }, []);

    const isLight = theme === 'light';

    return (
        <div
            className={`click-to-travel-logo ${className}`}
            style={{
                height: showText ? 'auto' : height,
                display: 'inline-flex',
                flexDirection: 'column',
                alignItems: 'center',
                userSelect: 'none',
                overflow: 'visible',
                position: 'relative',
                gap: '0px',
                animation: 'floatLogo 6s ease-in-out infinite'
            }}
        >
            <style>{`
                @keyframes floatLogo {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-5px); }
                    100% { transform: translateY(0px); }
                }
            `}</style>
            <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        height: '100%',
                        width: 'auto',
                        display: imgLoaded ? 'block' : 'none',
                        objectFit: 'contain',
                        position: 'relative',
                        zIndex: 1,
                        filter: isLight ? 'none' : `
                            invert(1) brightness(2) contrast(1.2)
                            drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))
                        `,
                        imageRendering: 'auto'
                    }}
                />
                {!imgLoaded && <div style={{ height, width: typeof height === 'number' ? height * 3 : '140px' }} />}
            </div>


        </div>
    );
};
