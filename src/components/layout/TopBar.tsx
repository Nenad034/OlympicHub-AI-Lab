import React, { useEffect } from 'react';
import { useAppStore } from '../../stores';

const TopBar: React.FC = () => {
    const { setAppStatus } = useAppStore();

    useEffect(() => {
        fetch('/app-status.json')
            .then(res => res.json())
            .then(data => setAppStatus(data))
            .catch(err => console.error("Error fetching app status:", err));
    }, [setAppStatus]);

    return (
        <div className="top-bar" style={{ height: '0px', visibility: 'hidden', overflow: 'hidden' }}>
            {/* TopBar is now deprecated in favor of integrated Navigation Dock/Tray */}
        </div>
    );
};

export default TopBar;
