import { supabase } from '../supabaseClient';

export const saveToCloud = async (tableName: string, data: any[]) => {
    try {
        // We use upsert to insert or update existing records based on 'id'
        const { error } = await supabase
            .from(tableName)
            .upsert(data, { onConflict: 'id' });

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error(`Error saving to ${tableName}:`, error.message);
        return { success: false, error: error.message };
    }
};

export const deleteFromCloud = async (tableName: string, column: string, pattern: string) => {
    try {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .ilike(column, pattern);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error(`Error deleting from ${tableName}:`, error.message);
        return { success: false, error: error.message };
    }
};

export const loadFromCloud = async (tableName: string) => {
    try {
        let allData: any[] = [];
        let from = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .range(from, from + batchSize - 1);

            if (error) throw error;
            if (data && data.length > 0) {
                // HARD FILTER: Remove Solvex KidsCamp spam at the source level
                const cleanData = data.filter((item: any) => {
                    const str = JSON.stringify(item).toLowerCase();
                    return !str.includes('kidscamp') && !str.includes('kids camp') && !str.includes('kidscam');
                });

                allData = [...allData, ...cleanData];
                if (data.length < batchSize) {
                    hasMore = false;
                } else {
                    from += batchSize;
                }
            } else {
                hasMore = false;
            }
        }
        return { success: true, data: allData };
    } catch (error: any) {
        console.error(`Error loading from ${tableName}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Generic sync hook logic (simplified for immediate use in components)
 */
export const syncAppStates = async (datasets: { table: string, data: any[] }[]) => {
    const promises = datasets.map(d => saveToCloud(d.table, d.data));
    return Promise.all(promises);
};

// Basic Archive Utility
export const archiveItem = async (
    entityType: string,
    entityId: string,
    data: any,
    userEmail: string,
    summary: string,
    actionType: 'DELETE' | 'UPDATE' = 'DELETE'
) => {
    const archiveRecord = {
        id: `arc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        type: actionType,
        entityType,
        entityId,
        oldData: data,
        changedBy: 'Current User', // In real app, get from Context
        userEmail,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        summary
    };

    // 1. Save to LocalStorage (Immediate Backup)
    try {
        const currentArchive = JSON.parse(localStorage.getItem('olympic_deep_archive') || '[]');
        const updatedArchive = [archiveRecord, ...currentArchive];
        localStorage.setItem('olympic_deep_archive', JSON.stringify(updatedArchive));
    } catch (e) {
        console.error("Local Archive Error:", e);
    }

    // 2. Try Save to Cloud (Async)
    try {
        await supabase.from('deep_archive').insert([archiveRecord]);
        return { success: true };
    } catch (e) {
        console.warn("Cloud Archive skipped (offline/no table):", e);
        return { success: true, localOnly: true };
    }
};

export const restoreItem = async (item: any) => {
    // 1. Restore to LocalStorage
    try {
        if (item.entityType === 'Supplier') {
            const currentSuppliers = JSON.parse(localStorage.getItem('olympic_hub_suppliers') || '[]');
            // Check if already exists to prevent duplicates
            if (!currentSuppliers.find((s: any) => s.id === item.entityId)) {
                // Restore logic: Use oldData as the source of truth
                const restored = { ...item.oldData };
                currentSuppliers.push(restored);
                localStorage.setItem('olympic_hub_suppliers', JSON.stringify(currentSuppliers));
            }
        }
    } catch (e) {
        console.error("Local Restore Error:", e);
        return { success: false, error: "Local restore failed" };
    }

    return { success: true };
};
