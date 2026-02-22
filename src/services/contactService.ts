import { supabase } from '../supabaseClient';

export interface Contact {
    id: string;
    type: 'Individual' | 'Legal' | 'Supplier' | 'Subagent';
    firstName?: string;
    lastName?: string;
    fullName?: string; // Derived or for companies
    firmName?: string;
    email: string;
    financeEmail?: string;
    phone: string;
    pib?: string;
    mb?: string;
    address?: string;
    city?: string;
    country?: string;
    birthDate?: string;
    passportNo?: string;
    category?: string;
    tags?: string[];
    notes?: string;
    preferredLanguage?: string;
    lastActivity?: string;
    createdAt?: string;
}

export const contactService = {
    async getAll() {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error && error.code !== 'PGRST116') {
            // Fallback for demo if table doesn't exist or error
            return this.getMockContacts();
        }
        return data || this.getMockContacts();
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            const mocks = this.getMockContacts();
            return mocks.find(m => m.id === id) || mocks[0];
        }
        return data;
    },

    async save(contact: Partial<Contact>) {
        const { data, error } = await supabase
            .from('contacts')
            .upsert([contact], { onConflict: 'id' });

        if (error) console.error('Error saving contact:', error);
        return { success: !error, data };
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);
        return { success: !error };
    },

    getMockContacts(): Contact[] {
        return [
            {
                id: 'C-001',
                type: 'Individual',
                firstName: 'Petar',
                lastName: 'Petrović',
                fullName: 'Petar Petrović',
                email: 'petar@email.com',
                phone: '+381 64 123 4567',
                city: 'Beograd',
                country: 'Srbija',
                tags: ['Vip', 'Summer-2025'],
                createdAt: '2025-01-10'
            },
            {
                id: 'C-002',
                type: 'Legal',
                firmName: 'Olympic Development DOO',
                fullName: 'Olympic Development DOO',
                pib: '123456789',
                email: 'office@olympic.rs',
                phone: '+381 11 333 444',
                city: 'Beograd',
                country: 'Srbija',
                tags: ['B2B', 'Corporate'],
                createdAt: '2025-02-01'
            }
        ];
    }
};
