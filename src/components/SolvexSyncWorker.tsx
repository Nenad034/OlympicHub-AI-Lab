import React, { useEffect } from 'react';
import { syncAllSolvexReservations } from '../services/solvex/solvexSyncService';

/**
 * Background worker that triggers Solvex status checks every hour
 */
export const SolvexSyncWorker: React.FC = () => {
    useEffect(() => {
        // Run initial sync on app load
        const runSync = async () => {
            try {
                await syncAllSolvexReservations();
            } catch (e) {
                console.error('[Solvex Worker] Initial sync failed:', e);
            }
        };

        runSync();

        // Setup interval for every hour (3600000 ms)
        const interval = setInterval(() => {
            console.log('[Solvex Worker] Running scheduled hourly check...');
            runSync();
        }, 3600000);

        return () => clearInterval(interval);
    }, []);

    return null; // This component doesn't render anything
};
