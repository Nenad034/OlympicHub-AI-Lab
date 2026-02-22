import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom hook for navigation utilities
 * Provides commonly used navigation patterns
 */
export const useNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const goBack = useCallback(() => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            navigate('/');
        }
    }, [navigate]);

    const goHome = useCallback(() => {
        navigate('/');
    }, [navigate]);

    const goTo = useCallback((path: string) => {
        navigate(path);
    }, [navigate]);

    const isActive = useCallback((path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    }, [location.pathname]);

    const getCurrentModule = useCallback(() => {
        const path = location.pathname;
        const segments = path.split('/').filter(Boolean);
        return segments[0] || 'dashboard';
    }, [location.pathname]);

    return {
        goBack,
        goHome,
        goTo,
        isActive,
        getCurrentModule,
        currentPath: location.pathname,
    };
};

export default useNavigation;
