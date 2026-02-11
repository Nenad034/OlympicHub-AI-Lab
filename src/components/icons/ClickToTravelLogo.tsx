import React, { useEffect, useRef, useState } from 'react';

interface LogoProps {
    height?: number | string;
    className?: string;
    showText?: boolean;
}

export const ClickToTravelLogo: React.FC<LogoProps> = ({ height = 48, className = "" }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => {
        const img = new Image();
        // Pointing to the file we copied to public/clicktotravel.png
        img.src = "/clicktotravel.png";
        img.crossOrigin = "anonymous";

        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            // Maintain aspect ratio
            const aspect = img.width / img.height;
            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Algorithm to strip the checkerboard background (white and light grey pixels)
                // We target pixels that are neutral (low color variation) and bright.
                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Neutrality check (r, g, b are close to each other)
                    const isNeutral = Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && Math.abs(r - b) < 15;
                    // Brightness check
                    const isBright = r > 185 && g > 185 && b > 185;

                    if (isNeutral && isBright) {
                        data[i + 3] = 0; // Set alpha to 0 (transparent)
                    }
                }
                ctx.putImageData(imageData, 0, 0);
                setImgLoaded(true);
            } catch (err) {
                console.error("Could not process logo pixels:", err);
                // Fallback: just show the image if canvas processing fails
                ctx.drawImage(img, 0, 0);
                setImgLoaded(true);
            }
        };
    }, []);

    return (
        <div
            className={`click-to-travel-logo ${className}`}
            style={{
                height,
                display: 'inline-flex',
                alignItems: 'center',
                userSelect: 'none',
                overflow: 'visible'
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    height: '100%',
                    width: 'auto',
                    display: imgLoaded ? 'block' : 'none',
                    objectFit: 'contain'
                }}
            />
            {!imgLoaded && <div style={{ height, width: typeof height === 'number' ? height * 3 : '120px' }} />}
        </div>
    );
};
