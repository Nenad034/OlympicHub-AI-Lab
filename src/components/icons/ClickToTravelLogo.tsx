import React from 'react';

interface LogoProps {
    height?: number | string;
    className?: string;
}

export const ClickToTravelLogo: React.FC<LogoProps> = ({
    height = 40,
    className = ""
}) => {
    return (
        <img
            src="/clicktotravel.png"
            alt="ClickToTravel Logo"
            className={className}
            style={{
                height: height,
                width: 'auto',
                display: 'block',
                userSelect: 'none'
            }}
        />
    );
};
