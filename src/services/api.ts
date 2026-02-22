import { supabase } from '../supabaseClient';

/**
 * API Service Layer
 * Centralized API calls with error handling and caching
 */

interface ApiResponse<T> {
    data: T | null;
    error: string | null;
    success: boolean;
}

// Cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Generic fetch with caching
 */
async function fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    forceRefresh = false
): Promise<ApiResponse<T>> {
    try {
        // Check cache first
        if (!forceRefresh) {
            const cached = cache.get(key);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                return { data: cached.data, error: null, success: true };
            }
        }

        const data = await fetchFn();

        // Update cache
        cache.set(key, { data, timestamp: Date.now() });

        return { data, error: null, success: true };
    } catch (error) {
        console.error(`API Error [${key}]:`, error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false
        };
    }
}

/**
 * Clear specific cache key or all cache
 */
export function clearCache(key?: string) {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
}

// ============ Properties (Hotels) API ============

export async function getProperties(forceRefresh = false): Promise<ApiResponse<any[]>> {
    return fetchWithCache('properties', async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }, forceRefresh);
}

export async function getPropertyById(id: string): Promise<ApiResponse<any>> {
    return fetchWithCache(`property-${id}`, async () => {
        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    });
}

export async function createProperty(property: any): Promise<ApiResponse<any>> {
    try {
        const { data, error } = await supabase
            .from('properties')
            .insert([property])
            .select()
            .single();

        if (error) throw error;

        // Invalidate cache
        clearCache('properties');

        return { data, error: null, success: true };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to create property',
            success: false
        };
    }
}

export async function updateProperty(id: string, updates: any): Promise<ApiResponse<any>> {
    try {
        const { data, error } = await supabase
            .from('properties')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Invalidate cache
        clearCache('properties');
        clearCache(`property-${id}`);

        return { data, error: null, success: true };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to update property',
            success: false
        };
    }
}

export async function deleteProperty(id: string): Promise<ApiResponse<boolean>> {
    try {
        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Invalidate cache
        clearCache('properties');
        clearCache(`property-${id}`);

        return { data: true, error: null, success: true };
    } catch (error) {
        return {
            data: false,
            error: error instanceof Error ? error.message : 'Failed to delete property',
            success: false
        };
    }
}

// ============ Suppliers API ============

export async function getSuppliers(forceRefresh = false): Promise<ApiResponse<any[]>> {
    return fetchWithCache('suppliers', async () => {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    }, forceRefresh);
}

// ============ Customers API ============

export async function getCustomers(forceRefresh = false): Promise<ApiResponse<any[]>> {
    return fetchWithCache('customers', async () => {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }, forceRefresh);
}

// ============ Config API ============

export async function getConfig(): Promise<ApiResponse<any>> {
    return fetchWithCache('config', async () => {
        const { data, error } = await supabase
            .from('app_config')
            .select('*')
            .single();

        if (error) throw error;
        return data?.content || {};
    });
}

export async function updateConfig(config: any): Promise<ApiResponse<any>> {
    try {
        const { data, error } = await supabase
            .from('app_config')
            .upsert({ id: 'main', content: config })
            .select()
            .single();

        if (error) throw error;

        clearCache('config');

        return { data, error: null, success: true };
    } catch (error) {
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Failed to update config',
            success: false
        };
    }
}

// ============ Export all ============

export const api = {
    properties: {
        getAll: getProperties,
        getById: getPropertyById,
        create: createProperty,
        update: updateProperty,
        delete: deleteProperty,
    },
    suppliers: {
        getAll: getSuppliers,
    },
    customers: {
        getAll: getCustomers,
    },
    config: {
        get: getConfig,
        update: updateConfig,
    },
    cache: {
        clear: clearCache,
    },
};

export default api;
