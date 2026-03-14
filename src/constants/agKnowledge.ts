export interface AgModuleInfo {
    id: string;
    label: string;
    path: string;
    description: string;
    subItems?: { label: string; path: string; description?: string }[];
}

export const AG_APP_KNOWLEDGE: AgModuleInfo[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        description: 'Centralni pregled poslovanja, statistika prodaje u realnom vremenu.'
    },
    {
        id: 'reservations',
        label: 'Rezervacije',
        path: '/reservations',
        description: 'Upravljanje dosijeima i koordinacija sa predstavnicima.',
        subItems: [
            { label: 'Moje Rezervacije', path: '/reservations' },
            { label: 'Novi Dosije', path: '/reservation-architect' },
            { label: 'Destinacijski Predstavnici', path: '/destination-rep' },
            { label: 'Duboka Arhiva', path: '/deep-archive' }
        ]
    },
    {
        id: 'finances',
        label: 'Finansije',
        path: '/financial-hub',
        description: 'Financial Intelligence Hub za praćenje uplata i NBS kursnih lista.',
        subItems: [
            { label: 'Financial Intelligence', path: '/financial-hub' },
            { label: 'Mars ERP Analitika', path: '/financial-hub?view=analytics' },
            { label: 'Isplate', path: '/financial-hub?tab=payments' },
            { label: 'NBS Kursna Lista', path: '/fx-service' }
        ]
    },
    {
        id: 'reports',
        label: 'Izveštaji',
        path: '/operational-reports',
        description: 'Operativni i analitički izveštaji.',
        subItems: [
            { label: 'Operativni Izveštaji', path: '/operational-reports' },
            { label: 'Inventory', path: '/operational-reports?tab=inventory' },
            { label: 'Dnevni Izveštaj Aktivnosti', path: '/activity-log' }
        ]
    },
    {
        id: 'production',
        label: 'Produkcija',
        path: '/production',
        description: 'Upravljanje sopstvenim zakupljenim kapacitetima.',
        subItems: [
            { label: 'Generator Cenovnika', path: '/price-list-architect' },
            { label: 'Dynamic Package Builder', path: '/production?tab=packages' },
            { label: 'Smeštaj Master', path: '/production?view=accommodations' },
            { label: 'Revenue Management', path: '/revenue-management' },
            { label: 'Smart Search', path: '/production/search' }
        ]
    },
    {
        id: 'suppliers',
        label: 'Snabdevanje',
        path: '/suppliers',
        description: 'Integracija sa eksternim dobavljačima.',
        subItems: [
            { label: 'PARTNERI - DOBAVLJAČI', path: '/suppliers' },
            { label: 'API Connections', path: '/api-connections' },
            { label: 'Pricing Hub', path: '/pricing-intelligence' }
        ]
    },
    {
        id: 'customers',
        label: 'Kupci',
        path: '/customers',
        description: 'Baza klijenata i subagenata.',
        subItems: [
            { label: 'B2C Baza', path: '/customers' },
            { label: 'B2B Partner Portal', path: '/subagent-admin' }
        ]
    },
    {
        id: 'modules',
        label: 'Svi Moduli',
        path: '/modules',
        description: 'Sveobuhvatni pregled svih sistema.',
        subItems: [
            { label: 'Mars ERP Analitika', path: '/financial-hub?view=analytics' },
            { label: 'Upravljanje Produkcijom', path: '/production' },
            { label: 'Master Contact Hub', path: '/pim' },
            { label: 'Generator Cenovnika', path: '/price-list-architect' },
            { label: 'Revenue Management', path: '/revenue-management' },
            { label: 'Amazon SES Marketing', path: '/smart-marketing' },
            { label: 'ClickToTravel Mail', path: '/mail' },
            { label: 'Master Orchestrator', path: '/ag-prime' },
            { label: 'Dynamic Package Builder', path: '/production?tab=packages' },
            { label: 'Dnevni Izveštaj Aktivnosti', path: '/activity-log' },
            { label: 'Katana (To-Do)', path: '/katana' },
            { label: 'Duboka Arhiva', path: '/deep-archive' },
            { label: 'Fortress Security', path: '/settings?tab=security' },
            { label: 'Vajckin Soft Zone', path: '/vajckin' },
            { label: 'AI Hotel Importer', path: '/suppliers?tab=importer' },
            { label: 'Dest. Predstavnici', path: '/destination-rep' },
            { label: 'PARTNERI - DOBAVLJAČI', path: '/suppliers' },
            { label: 'Generator Smena', path: '/staff-shifts' },
            { label: 'Savetnica Milica', path: '/ai-assistant' },
            { label: 'Financial Intelligence', path: '/financial-hub' },
            { label: 'B2B Promo Manager', path: '/b2b-promo-manager' },
            { label: 'Dashboard Central', path: '/' },
            { label: 'Moje Rezervacije', path: '/reservations' },
            { label: 'B2B Partner Portal', path: '/subagent-admin' },
            { label: 'Operativni Izveštaji', path: '/operational-reports' },
            { label: 'Destination Prime Explorer', path: '/destination-explorer' }
        ]
    },
    {
        id: 'settings',
        label: 'Podešavanja',
        path: '/settings',
        description: 'Sistemska konfiguracija i bezbednosni protokoli.',
        subItems: [
            { label: 'Pregled Modula (MASTER)', path: '/settings/modules' },
            { label: 'Aktivne Konekcije', path: '/settings/connections' },
            { label: 'AI Orchestrator (MASTER)', path: '/settings/ai-orchestrator' },
            { label: 'AI Quota Tracker', path: '/settings/quota' },
            { label: 'Dnevni Izveštaj', path: '/settings/daily-report' },
            { label: 'General Settings', path: '/settings/general' },
            { label: 'Korisnički Nalozi', path: '/settings/accounts' },
            { label: 'Access Permissions (MASTER)', path: '/settings/permissions' },
            { label: 'Notifikacije', path: '/settings/notifications' },
            { label: 'System Snapshots (MASTER)', path: '/settings/snapshots' },
            { label: 'System Pulse', path: '/settings/pulse' },
            { label: 'Deep Archive (MASTER)', path: '/settings/deep-archive' },
            { label: 'API Documentation (MASTER)', path: '/settings/api-docs' }
        ]
    },
    {
        id: 'activity_log',
        label: 'Dnevnik Aktivnosti',
        path: '/activity-log',
        description: 'Hronološki zapis svih sistemskih promena i korisničkih akcija.'
    }
];
