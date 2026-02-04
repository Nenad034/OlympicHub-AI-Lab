import { loadFromCloud, saveToCloud } from '../utils/storageUtils';
import solvexAuthService from './solvex/solvexAuthService';

// Define the shape of our unified supplier
export interface UnifiedSupplier {
    id: string; // The internal DB ID (e.g., from Suppliers.tsx logic)
    name: string;
    type: 'API' | 'Offline' | 'Hybrid';
    status: 'Active' | 'Suspended' | 'Pending';
    country: string;
    apiConnection?: string; // e.g., 'Solvex', 'Amadeus'
    apiStatus?: 'Connected' | 'Disconnected' | 'Unknown'; // Real-time status

    // Financials & Policy (Persisted in Supplier Pricing Rules or extended Supplier object)
    financials: {
        totalVolume: number;
        averageCommission: number;
        averageMargin: number;
    };
    defaultPolicy: {
        commission: number; // Incoming %
        commissionAmount: number;
        margin: number;     // Markup %
        marginAmount: number;
    };
}

/**
 * Maps the generic storage supplier to our Unified Supplier shape.
 * Default policies and financials would realistically come from a separate 'supplier_financials' table.
 * For now, we mock/default them or store them in the 'metadata' field if created by new Admin.
 */
const mapToUnified = (storageSupplier: any): UnifiedSupplier => {
    // Determine type based on data or name
    let type: 'API' | 'Offline' | 'Hybrid' = 'Offline';
    let apiConnection = '';

    if (storageSupplier.name.toLowerCase().includes('solvex')) {
        type = 'API';
        apiConnection = 'Solvex API v2';
    } else if (storageSupplier.name.toLowerCase().includes('tct') || storageSupplier.name.toLowerCase().includes('ratehawk')) {
        type = 'API';
        apiConnection = 'XML API';
    }

    return {
        id: storageSupplier.id,
        name: storageSupplier.name,
        type: type,
        status: 'Active', // Default to active if exists
        country: storageSupplier.country || 'Unknown',
        apiConnection,
        apiStatus: 'Unknown',
        financials: { totalVolume: 0, averageCommission: 0, averageMargin: 0 },
        defaultPolicy: {
            commission: storageSupplier.defaultCommission || 0,
            commissionAmount: 0,
            margin: storageSupplier.defaultMargin || 0,
            marginAmount: 0
        }
    };
};

export const supplierService = {
    /**
     * Fetches all suppliers from storage and enriches them with real-time API status.
     */
    async getAllSuppliers(): Promise<UnifiedSupplier[]> {
        try {
            // 1. Load from storage (Supabase/Local)
            const { success, data } = await loadFromCloud('suppliers');
            let suppliers: UnifiedSupplier[] = [];

            if (success && Array.isArray(data)) {
                suppliers = data.map(mapToUnified);
            } else {
                // Return some defaults if empty (or keep existing MOCKs if really needed, but better to return empty)
                console.warn('No suppliers found in storage.');
            }

            // 2. Add API Status Checks
            const enrichedSuppliers = await Promise.all(suppliers.map(async (s) => {
                if (s.name.toLowerCase().includes('solvex')) {
                    // Check Solvex Status
                    try {
                        // We use a light check or rely on cached token
                        const token = solvexAuthService.getCachedToken();
                        if (token) {
                            s.apiStatus = 'Connected';
                        } else {
                            // Try to connect briefly? Or just report Disconnected until user logs in?
                            // For dashboard speed, maybe don't force connect here unless we want to "Health Check"
                            // Let's assume Unknown until we verify.
                            // However, we can use the Auth Service to check availability if we want.
                            // For this demo, let's mark it.
                            s.apiStatus = 'Unknown';
                        }
                    } catch (e) {
                        s.apiStatus = 'Disconnected';
                    }
                }
                return s;
            }));

            // 3. Append our "System" suppliers if they aren't in the DB yet (Solvex, etc.)
            // ensuring we always have the core API partners visible
            const hasSolvex = enrichedSuppliers.some(s => s.name.toLowerCase().includes('solvex'));
            if (!hasSolvex) {
                enrichedSuppliers.push({
                    id: 'sys-solvex',
                    name: 'Solvex',
                    type: 'API',
                    status: 'Active',
                    country: 'Bulgaria',
                    apiConnection: 'Solvex API v2',
                    apiStatus: 'Unknown',
                    financials: { totalVolume: 1250000, averageCommission: 12, averageMargin: 8 },
                    defaultPolicy: { commission: 10, commissionAmount: 0, margin: 5, marginAmount: 0 }
                });
            }

            return enrichedSuppliers;

        } catch (error) {
            console.error('Failed to load unified suppliers:', error);
            return [];
        }
    },

    /**
     * Check connection for a specific supplier
     */
    async checkConnection(supplierId: string, apiName: string): Promise<boolean> {
        if (apiName.toLowerCase().includes('solvex')) {
            const res = await solvexAuthService.connect();
            return res.success;
        }
        return false;
    }
};

export default supplierService;
