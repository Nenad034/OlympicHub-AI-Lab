import React, { useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../../stores';

interface LogoProps {
    height?: number | string;
    className?: string;
    showText?: boolean;
    iconOnly?: boolean;
    iconScale?: number;
    forceOutline?: boolean;
}

export const ClickToTravelLogo: React.FC<LogoProps> = ({
    height = 87,
    className = "",
    showText = false,
    iconOnly = false,
    iconScale,
    forceOutline = false
}) => {
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

            const resolutionScale = 4;
            // If iconOnly, we assume the icon is the leftmost square part of the image
            const targetWidth = iconOnly ? img.height : img.width;
            canvas.width = targetWidth * resolutionScale;
            canvas.height = img.height * resolutionScale;

            ctx.scale(resolutionScale, resolutionScale);
            ctx.drawImage(img, 0, 0);

            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
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
    }, [iconOnly]);

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
                        transition: 'all 0.3s ease',
                        transform: iconScale ? `scale(${iconScale})` : (iconOnly ? 'scale(1.4)' : 'scale(1.1)'),
                        filter: (forceOutline || !isLight) ? `
                            drop-shadow(2px 0 0 #fff)
                            drop-shadow(-2px 0 0 #fff)
                            drop-shadow(0 2px 0 #fff)
                            drop-shadow(0 -1px 0 #fff)
                            drop-shadow(1.5px 1.5px 0 #fff)
                            drop-shadow(-1.5px -1.5px 0 #fff)
                            drop-shadow(1.5px -1.5px 0 #fff)
                            drop-shadow(-1.5px 1.5px 0 #fff)
                        ` : 'none',
                        imageRendering: 'auto'
                    }}
                />
                {!imgLoaded && <div style={{ height, width: typeof height === 'number' ? (height as number) * 3 : '140px' }} />}
            </div>
        </div>
    );
};
