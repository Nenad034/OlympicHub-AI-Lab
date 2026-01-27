import { supabase } from '../supabaseClient';
import type {
    BasicInfoData,
    FlightSelectionData,
    HotelSelectionData,
    TransferSelectionData,
    ExtraSelectionData
} from '../types/packageSearch.types';

export interface PackageDraft {
    id?: string;
    name: string;
    basicInfo: BasicInfoData;
    flights: FlightSelectionData | null;
    hotels: HotelSelectionData[];
    transfers: TransferSelectionData[];
    extras: ExtraSelectionData[];
    totalPrice: number;
    status: 'draft' | 'confirmed' | 'sent';
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Service for managing Dynamic Package Drafts
 */
class DynamicPackageService {
    private readonly STORAGE_KEY = 'oh_package_drafts';

    /**
     * Save a package draft to Supabase (and/or LocalStorage)
     */
    async saveDraft(draft: PackageDraft): Promise<{ success: boolean; id?: string; error?: any }> {
        try {
            const packageData = {
                ...draft,
                updatedAt: new Date().toISOString(),
                createdAt: draft.createdAt || new Date().toISOString()
            };

            // 1. Try to save to Supabase
            const { data, error } = await supabase
                .from('package_drafts')
                .upsert([packageData])
                .select()
                .single();

            if (error) {
                console.warn('Supabase save failed, falling back to LocalStorage:', error);
                return this.saveToLocalStorage(packageData);
            }

            return { success: true, id: data.id };
        } catch (error) {
            console.error('Final error saving draft:', error);
            return this.saveToLocalStorage(draft);
        }
    }

    /**
     * Fallback: Save to LocalStorage
     */
    private saveToLocalStorage(draft: PackageDraft): { success: boolean; id: string } {
        const id = draft.id || `local-${Date.now()}`;
        const localDraft = { ...draft, id, updatedAt: new Date().toISOString() };

        try {
            const existing = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            const index = existing.findIndex((d: any) => d.id === id);

            if (index >= 0) {
                existing[index] = localDraft;
            } else {
                existing.push(localDraft);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existing));
            return { success: true, id };
        } catch (e) {
            console.error('LocalStorage save failed:', e);
            return { success: false, id: '' };
        }
    }

    /**
     * Load all drafts
     */
    async getDrafts(): Promise<PackageDraft[]> {
        // Fetch from Supabase
        const { data, error } = await supabase
            .from('package_drafts')
            .select('*')
            .order('updatedAt', { ascending: false });

        if (error) {
            // Fallback to local
            return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
        }

        return data || [];
    }

    /**
     * Get a single draft by ID
     */
    async getDraftById(id: string): Promise<PackageDraft | null> {
        if (id.startsWith('local-')) {
            const local = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            return local.find((d: any) => d.id === id) || null;
        }

        const { data, error } = await supabase
            .from('package_drafts')
            .select('*')
            .eq('id', id)
            .single();

        return error ? null : data;
    }
}

export const dynamicPackageService = new DynamicPackageService();
