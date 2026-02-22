/**
 * Sentinel Network Health Utility
 * 
 * =============================================================================
 * LEGAL NOTICE: Antigravity Security Protocol - Infrastructure Monitoring
 * =============================================================================
 */

import { sentinelEvents } from './sentinelEvents';

export interface NetworkStatus {
    online: boolean;
    latency: number;
    speedEstimate: number; // Mbps
    quality: 'excellent' | 'good' | 'poor' | 'offline';
}

/**
 * Measure latency and estimate connection quality
 */
export async function checkNetworkHealth(): Promise<NetworkStatus> {
    const startTime = Date.now();

    // 1. Check navigator status (Browser's own awareness)
    if (!navigator.onLine) {
        return { online: false, latency: 0, speedEstimate: 0, quality: 'offline' };
    }

    try {
        // 2. Try to fetch a small local or standard resource with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            // Note: We use no-cors. If it's blocked by CSP, it throws an error.
            // But if navigator.onLine is true, and itthrows, it might just be the CSP.
            await fetch('https://www.google.com/favicon.ico', {
                mode: 'no-cors',
                cache: 'no-store',
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const latency = Date.now() - startTime;
            let quality: NetworkStatus['quality'] = 'excellent';
            if (latency > 500) quality = 'poor';
            else if (latency > 200) quality = 'good';

            return {
                online: true,
                latency,
                speedEstimate: 50,
                quality
            };
        } catch (fetchError) {
            clearTimeout(timeoutId);

            // If fetch failed but navigator says we are online, 
            // it's VERY likely a CSP/CORS/Corporate Proxy block, not a network loss.
            if (navigator.onLine) {
                return {
                    online: true,
                    latency: 50, // Default optimistic latency
                    speedEstimate: 50,
                    quality: 'good'
                };
            }
            throw fetchError;
        }
    } catch (error) {
        return { online: false, latency: 0, speedEstimate: 0, quality: 'offline' };
    }
}

/**
 * Start background network monitoring
 */
export function startNetworkMonitoring() {
    let lastStatus: NetworkStatus['quality'] | null = null;
    let offlineCounter = 0;

    setInterval(async () => {
        const status = await checkNetworkHealth();

        if (status.quality === 'offline') {
            offlineCounter++;
        } else {
            offlineCounter = 0;
        }

        // Only trigger 'offline' alert if it fails twice in a row (confirming it's not a micro-drop)
        const confirmedQuality = (status.quality === 'offline' && offlineCounter < 2) ? (lastStatus || 'good') : status.quality;

        if (confirmedQuality !== lastStatus) {
            if (confirmedQuality === 'poor') {
                sentinelEvents.emit({
                    title: 'Spora Internet Veza',
                    message: `Detektovana je visoka latencija (${status.latency}ms). Brzina pretrage API provajdera može biti smanjena.`,
                    type: 'warning'
                });
            } else if (confirmedQuality === 'offline') {
                sentinelEvents.emit({
                    title: 'INTERNET PREKID',
                    message: 'Izgubljena je veza sa internetom. Sentinel je pauzirao sve API pretrage radi bezbednosti.',
                    type: 'critical',
                    sendTelegram: true
                });
            } else if (lastStatus === 'offline') {
                sentinelEvents.emit({
                    title: 'INTERNET VRAĆEN',
                    message: 'Veza sa internetom je ponovo uspostavljena. Sentinel nastavlja sa radom.',
                    type: 'info'
                });
            }
            lastStatus = confirmedQuality;
        }
    }, 15000); // Check every 15 seconds for faster response but with confirmation
}
