import React, { useEffect } from 'react';
import { MobileRouter } from './router/mobile-router';
import { useThemeStore } from './stores';

const AppMobile: React.FC = () => {
    // Force mobile-friendly theme defaults locally
    useEffect(() => {
        document.body.className = `navy-theme layout-mobile mobile-view`;
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    }, []);

    return <MobileRouter />;
};

export default AppMobile;
