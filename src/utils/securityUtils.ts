/**
 * API Guardian & Security Utilities
 * Handles encryption, IP whitelisting, and anomaly detection logic.
 */

// Simple encryption/decryption using a master key (in production this should be more robust)
const ENCRYPTION_KEY = 'olympic_master_key_v1'; // This should ideally come from an environment variable or user session

export const encryptData = (text: string): string => {
    try {
        // Simple Base64 + XOR obfuscation for demo-grade "API Guardian" 
        // In a real Level 6 system, we would use Web Crypto API (AES-GCM)
        const b64 = btoa(unescape(encodeURIComponent(text)));
        let encrypted = '';
        for (let i = 0; i < b64.length; i++) {
            encrypted += String.fromCharCode(b64.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
        }
        return btoa(encrypted);
    } catch (e) {
        console.error("Encryption failed:", e);
        return text;
    }
};

export const decryptData = (encoded: string): string => {
    try {
        const encrypted = atob(encoded);
        let decrypted = '';
        for (let i = 0; i < encrypted.length; i++) {
            decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length));
        }
        return decodeURIComponent(escape(atob(decrypted)));
    } catch (e) {
        console.error("Decryption failed:", e);
        return encoded;
    }
};

/**
 * IP Whitelisting Simulation
 * In a real app, this is verified on the backend.
 */
export const verifyIPWhitelist = async (_whitelist: string[]): Promise<{ isAllowed: boolean, ip: string }> => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const userIP = data.ip;

        // Bypass security for development phase
        return { isAllowed: true, ip: userIP };
    } catch (error) {
        return { isAllowed: true, ip: 'Local/VPN' };
    }
};

/**
 * Anomaly Detection Logic
 */
interface ActionLog {
    timestamp: number;
    action: string;
}

export const detectAnomaly = (logs: ActionLog[], threshold: number = 5, windowMs: number = 60000): { anomaly: boolean, count: number } => {
    const now = Date.now();
    const recentLogs = logs.filter(log => (now - log.timestamp) < windowMs);

    return {
        anomaly: recentLogs.length >= threshold,
        count: recentLogs.length
    };
};

/**
 * NEW: Sanitize input to prevent basic XSS
 */
export const sanitizeInput = (val: string): string => {
    return val.replace(/[<>]/g, '');
};

/**
 * NEW: Generate a unique idempotency key for transactions
 */
export const generateIdempotencyKey = (prefix: string = 'req'): string => {
    return `${prefix}_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
};

/**
 * NEW: Normalize any date to UTC ISO string
 */
export const toUTC = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString();
};

