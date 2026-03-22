import React from 'react';

/**
 * V6 LUXURY FLAT ICONS SYSTEM
 * Designed for PrimeSmartSearch V6
 * Features: 1.5px stroke-width, Responsive Colors, Theme Awareness
 */

interface IconProps {
    size?: number;
    color?: string; // Optional override
    className?: string;
}

const strokeWidth = 1.5;

// HELPER: Get dynamic color based on theme
// In V6 styling, we can use CSS variables like --v6-accent
const defaultColor = "currentColor";

export const IconHotelV6: React.FC<IconProps> = ({ size = 32, color = defaultColor, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 42H42" />
        <path d="M10 42V14C10 11.7909 11.7909 10 14 10H34C36.2091 10 38 11.7909 38 14V42" />
        <path d="M18 10V6C18 4.89543 18.8954 4 20 4H28C29.1046 4 30 4.89543 30 6V10" />
        <path d="M24 22V22.02" strokeWidth="2.5" />
        <path d="M18 18H18.02" strokeWidth="2.5" />
        <path d="M30 18H30.02" strokeWidth="2.5" />
        <path d="M18 26H18.02" strokeWidth="2.5" />
        <path d="M30 26H30.02" strokeWidth="2.5" />
        <path d="M18 34V42" />
        <path d="M30 34V42" />
        <path d="M22 42V38C22 36.8954 22.8954 36 24 36C25.1046 36 26 36.8954 26 38V42" />
    </svg>
);

export const IconFlightV6: React.FC<IconProps> = ({ size = 32, color = defaultColor, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21.5 24L7 31V37L21.5 32M21.5 24L37 11C39.5 9 43 10.5 43 14C43 16 41.5 18 39.5 19.5L25 31M21.5 24L25 31M25 31L31 43H37L32 31M25 31L21.5 32M21.5 32L10 25V19L21.5 24" />
        <path d="M36 13L39 16" opacity="0.5" />
    </svg>
);

export const IconPackageV6: React.FC<IconProps> = ({ size = 32, color = defaultColor, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M24 4L6 13V35L24 44L42 35V13L24 4Z" />
        <path d="M6 13L24 22M42 13L24 22M24 44V22" />
        <path d="M33 8.5L15 17.5" opacity="0.5" />
        <path d="M24 22L24 30" strokeWidth="2.5" opacity="0.8" />
    </svg>
);

export const IconTransferV6: React.FC<IconProps> = ({ size = 32, color = defaultColor, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M8 32H40M8 32C6 32 4 30 4 27V20C4 18 6 16 8 16H40C42 16 44 18 44 20V27C44 30 42 32 40 32M8 32V36H14V32M40 32V36H34V32" />
        <path d="M12 16L16 6H32L36 16" />
        <circle cx="12" cy="24" r="2" fill="currentColor" />
        <circle cx="36" cy="24" r="2" fill="currentColor" />
    </svg>
);

export const IconCruiseV6: React.FC<IconProps> = ({ size = 32, color = defaultColor, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 32C10 32 12 36 16 36C20 36 22 32 28 32C34 32 36 36 40 36C44 36 46 32 48 32" opacity="0.4" />
        <path d="M8 32L6 18H42L40 32" />
        <path d="M12 18V10H36V18" />
        <path d="M18 10V6H30V10" />
        <path d="M12 14H36" opacity="0.5" />
    </svg>
);

export const IconActivityV6: React.FC<IconProps> = ({ size = 32, color = defaultColor, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="24" cy="24" r="20" />
        <path d="M33 15L27 27L15 33L21 21L33 15Z" />
        <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
);

export const IconCharterV6: React.FC<IconProps> = ({ size = 32, color = defaultColor, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 28V34H44V28" />
        <path d="M10 28C10 18 18 10 24 10C30 10 38 18 38 28" />
        <path d="M24 10V4" />
        <circle cx="14" cy="34" r="3" />
        <circle cx="34" cy="34" r="3" />
    </svg>
);

export const IconTourV6: React.FC<IconProps> = ({ size = 32, color = defaultColor, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M24 40C24 40 36 31 36 20C36 13.3726 30.6274 8 24 8C17.3726 8 12 13.3726 12 20C12 31 24 40 24 40Z" />
        <circle cx="24" cy="20" r="4" />
        <path d="M24 40V44M12 44H36" opacity="0.5" />
    </svg>
);
