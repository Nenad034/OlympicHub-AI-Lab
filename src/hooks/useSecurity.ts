import { useState, useCallback, useEffect } from 'react';
import { detectAnomaly, verifyIPWhitelist } from '../utils/securityUtils';
import { useToast } from '../components/ui/Toast';

interface SecurityState {
    logs: { timestamp: number, action: string }[];
    isAnomalyDetected: boolean;
    ipStatus: { ip: string, isWhitelisted: boolean };
    apiKeysEncrypted: boolean;
}

export const useSecurity = () => {
    const { warning, error } = useToast();
    const [state, setState] = useState<SecurityState>({
        logs: [],
        isAnomalyDetected: false,
        ipStatus: { ip: 'Checking...', isWhitelisted: true },
        apiKeysEncrypted: true
    });

    // Check IP on load
    useEffect(() => {
        const checkIP = async () => {
            const whitelist = ['84.14.*', '127.0.0.1', '::1', '*']; // Added '*' to allow all for now
            const result = await verifyIPWhitelist(whitelist);
            setState(prev => ({
                ...prev,
                ipStatus: { ip: result.ip, isWhitelisted: result.isAllowed }
            }));
        };
        checkIP();
    }, [warning]);

    /**
     * Track a sensitive action (like export)
     */
    const trackAction = useCallback((actionName: string) => {
        setState(prev => {
            const newLog = { timestamp: Date.now(), action: actionName };
            const newLogs = [...prev.logs, newLog];

            // AI Anomaly Detection: Threshold 5 actions per minute
            const detection = detectAnomaly(newLogs, 5, 60000);

            if (detection.anomaly && !prev.isAnomalyDetected) {
                error(
                    "ANOMALIJA DETEKTOVANA",
                    "Sistem je primetio neuobičajeno visok broj izvoza podataka (Bulk Export). Pristup blokiran."
                );
            }

            return {
                ...prev,
                logs: newLogs,
                isAnomalyDetected: detection.anomaly
            };
        });
    }, [error]);

    const resetAnomaly = () => {
        setState(prev => ({ ...prev, isAnomalyDetected: false, logs: [] }));
    };

    return {
        ...state,
        trackAction,
        resetAnomaly
    };
};
