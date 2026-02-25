import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface B2BCampaign {
    id: string;
    title: string;
    subtitle: string;
    image: string;
    badge: string;
    commissionBoost: string;
    validFrom: string; // ISO String
    validTo: string; // ISO String
    searchParams: {
        destination?: string;
        provider?: string;
        dateFrom?: string;
        dateTo?: string;
    };
    priority: number;
    isActive: boolean;
}

interface PromoStore {
    campaigns: B2BCampaign[];
    addCampaign: (campaign: Omit<B2BCampaign, 'id'>) => void;
    updateCampaign: (id: string, campaign: Partial<B2BCampaign>) => void;
    deleteCampaign: (id: string) => void;
    toggleCampaignStatus: (id: string) => void;
}

// Initial mock data to display for first time users
const initialCampaigns: B2BCampaign[] = [
    {
        id: 'promo-1',
        title: 'Grčka First Minute: Halkidiki',
        subtitle: 'Solvex Ekskluzivni Zakup - Specijalne cene za rane uplate',
        image: 'https://images.unsplash.com/photo-1574042861218-db8cb4de06f7?q=80&w=1200&auto=format&fit=crop',
        badge: 'HOT DEAL',
        commissionBoost: '15% Provizija',
        validFrom: new Date(Date.now() - 86400000).toISOString(),
        validTo: new Date(Date.now() + 172800000).toISOString(), // Ends in 2 days
        searchParams: { destination: 'Halkidiki', provider: 'Solvex' },
        priority: 1,
        isActive: true
    },
    {
        id: 'promo-2',
        title: 'MTS Globe: Premium Antalya',
        subtitle: 'Luksuzni rizorti sa Ultra All Inclusive uslugom',
        image: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=1200&auto=format&fit=crop',
        badge: 'PREMIUM',
        commissionBoost: 'Dodatni Bonus 50€',
        validFrom: new Date(Date.now() - 200000).toISOString(),
        validTo: new Date(Date.now() + 432000000).toISOString(), // Ends in 5 days
        searchParams: { destination: 'Antalya', provider: 'MTSGlobe' },
        priority: 2,
        isActive: true
    }
];

export const usePromoStore = create<PromoStore>()(
    persist(
        (set) => ({
            campaigns: initialCampaigns,

            addCampaign: (campaignData) => set((state) => ({
                campaigns: [
                    ...state.campaigns,
                    { ...campaignData, id: `promo-${Date.now()}` }
                ]
            })),

            updateCampaign: (id, campaignData) => set((state) => ({
                campaigns: state.campaigns.map(c =>
                    c.id === id ? { ...c, ...campaignData } : c
                )
            })),

            deleteCampaign: (id) => set((state) => ({
                campaigns: state.campaigns.filter(c => c.id !== id)
            })),

            toggleCampaignStatus: (id) => set((state) => ({
                campaigns: state.campaigns.map(c =>
                    c.id === id ? { ...c, isActive: !c.isActive } : c
                )
            }))
        }),
        {
            name: 'b2b-promos-storage' // Persist in localStorage
        }
    )
);
