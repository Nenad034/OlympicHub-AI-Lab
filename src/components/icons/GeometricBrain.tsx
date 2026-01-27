export const GeometricBrain = ({ size = 24, color = "#FFD700", className = "" }: { size?: number, color?: string, className?: string }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        {/* Geometric Brain Structure using straight lines */}
        <path d="M12 2L19 5V11L12 14L5 11V5L12 2Z" /> {/* Top/Center Lobby */}
        <path d="M12 14L19 17V21L12 23L5 21V17L12 14Z" /> {/* Bottom Stem/Base */}
        <path d="M19 5L22 8V14L19 17" /> {/* Right Outer */}
        <path d="M5 5L2 8V14L5 17" /> {/* Left Outer */}
        <path d="M12 2V14" /> {/* Center Split */}
        <path d="M5 11H19" /> {/* Mid Section Connector */}
        <path d="M8 5L12 8L16 5" /> {/* Thought lines top */}
        <path d="M8 19L12 17L16 19" /> {/* Processing lines bottom */}
    </svg>
);
