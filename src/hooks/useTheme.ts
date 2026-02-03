import { useEffect } from 'react';
import { useThemeStore, type Theme } from '../stores';

/**
 * Custom hook for theme management
 * Provides theme state and actions with automatic body class application
 */
export const useTheme = () => {
    const {
        theme,
        setTheme,
        cycleTheme,
        isPrism,
        togglePrism
    } = useThemeStore();

    // Apply theme to document body
    useEffect(() => {
        const themeClasses: Record<Theme, string> = {
            light: 'light-theme',
            navy: 'navy-theme'
        };

        const themeClass = themeClasses[theme] || 'navy-theme';
        let fullClassName = themeClass;

        if (isPrism) {
            fullClassName = `${themeClass} prism-mode`.trim();
        }

        document.body.className = fullClassName;
    }, [theme, isPrism]);

    return {
        theme,
        setTheme,
        cycleTheme,
        isPrism,
        togglePrism,
    };
};

/**
 * Get CSS variable value
 */
export const getCSSVariable = (name: string): string => {
    return getComputedStyle(document.documentElement)
        .getPropertyValue(name)
        .trim();
};

/**
 * Theme color palette for charts and visualizations
 */
export const getThemeColors = () => ({
    primary: getCSSVariable('--accent'),
    secondary: getCSSVariable('--text-secondary'),
    background: getCSSVariable('--bg-main'),
    cardBackground: getCSSVariable('--bg-card'),
    border: getCSSVariable('--border'),
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
});

export default useTheme;
