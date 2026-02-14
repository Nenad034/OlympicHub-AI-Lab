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

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    const isNeutral = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
                    const isBright = r > 180 && g > 180 && b > 180;

                    if (isNeutral && isBright) {
                        data[i + 3] = 0;
                    } else if (r > 245 && g > 245 && b > 245) {
                        data[i + 3] = 0;
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
                gap: '8px'
            }}
        >
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
                            drop-shadow(0 1px 1px rgba(0,0,0,0.2)) 
                            drop-shadow(0 4px 8px rgba(33, 136, 255, 0.15))
                            drop-shadow(0 8px 24px rgba(0,0,0,0.1))
                        `,
                        imageRendering: 'auto'
                    }}
                />
                {!imgLoaded && <div style={{ height, width: typeof height === 'number' ? height * 3 : '140px' }} />}
            </div>

            {showText && (
                <div
                    className="logo-slogan"
                    style={{
                        fontSize: typeof height === 'number' ? height * 0.16 : '13px',
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        color: '#1e3a8a',
                        textShadow: isLight ? 'none' : '0 1px 2px rgba(255,255,255,0.2)',
                        lineHeight: 1,
                        marginTop: '4px'
                    }}
                >
                    Klikni. Rezerviši. Putuj...
                </div>
            )}
        </div>
    );
};
