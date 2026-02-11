import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ShieldCheck, User, Users, MapPin, CreditCard, Shield,
    Scale, FileText, Hash, CheckCircle2, AlertTriangle,
    Printer, Save, RefreshCw, Plus, Trash2, X, Info,
    Plane, Building2, Utensils, Receipt, Globe, Truck,
    Package as PackageIcon, UserPlus, Fingerprint, Banknote,
    ArrowRightLeft, Briefcase, MoveRight, MoveLeft, Calendar, Mail,
    Compass, Ship, Sparkles, Search, ExternalLink, Clock, History,
    Euro, DollarSign, CirclePercent, Copy, Share2, Code, ChevronDown, Zap, Phone, Star, MessageCircle, Send, ShieldAlert
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { ModernCalendar } from '../components/ModernCalendar';
import { GoogleAddressAutocomplete } from '../components/GoogleAddressAutocomplete';
import { NATIONALITIES } from '../constants/nationalities';
import ReservationEmailModal from '../components/ReservationEmailModal';
import { saveDossierToDatabase, getNextReservationNumber, getReservationById as apiGetReservationById } from '../services/reservationService';
import { getReservation as getSolvexReservation } from '../services/solvex/solvexBookingService';
import { getCachedToken } from '../services/solvex/solvexAuthService';
import { useAuthStore, useDestRepStore } from '../stores';
import { saveToCloud, loadFromCloud } from '../utils/storageUtils';
import '../components/GoogleAddressAutocomplete.css';
import './ReservationArchitect.css';
import { getTranslation } from '../utils/translations';
import type { Language } from '../utils/translations';
import { generateDossierPDF, generateDossierHTML } from '../utils/dossierExport';
import supplierService from '../services/SupplierService';

// --- Types ---
type TripType = 'Smestaj' | 'Avio karte' | 'Dinamicki paket' | 'Putovanja' | 'Transfer' | 'Čarter' | 'Bus' | 'Krstarenje';
type CustomerType = 'B2C-Individual' | 'B2C-Legal' | 'B2B-Subagent';
type ResStatus = 'Active' | 'Reservation' | 'Canceled' | 'Offer' | 'Request' | 'Processing';

interface Passenger {
    id: string;
    firstName: string;
    lastName: string;
    idNumber: string;
    birthDate: string;
    type: 'Adult' | 'Child' | 'Infant';
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
}


interface TripItem {
    id: string;
    type: 'Smestaj' | 'Avio karte' | 'Dinamicki paket' | 'Putovanja' | 'Transfer' | 'Čarter' | 'Bus' | 'Krstarenje';
    supplier: string;
    country?: string;
    city?: string;
    subject: string; // Hotel name, Flight route, etc.
    details: string; // Room type, Flight class, etc.
    mealPlan?: string; // Meal plan (e.g. All Inclusive)
    accomType?: string; // Tip smeštaja (e.g. Hotel, Apartman)
    stars?: number; // Hotel category
    notes?: string; // Napomene za stavku
    checkIn: string;
    checkOut: string;
    netPrice: number;
    bruttoPrice: number;
    passengers?: Passenger[];
    supplierRef?: string;
    solvexStatus?: string;
    solvexKey?: string;
    supplierPaymentDeadline?: string; // Deadline for paying the supplier
    cancellationPolicyConfirmed?: boolean;
    // Flight specific
    flightLegs?: FlightLeg[];
}

interface FlightLeg {
    id: string;
    depAirport: string;
    depDate: string;
    depTime: string;
    arrAirport: string;
    arrDate: string;
    arrTime: string;
    flightNumber: string;
    airline: string;
    class?: string;
    baggage?: string;
}

interface CheckData {
    id: string;
    checkNumber: string;
    bank: string;
    amount: number;
    realizationDate: string;
}

interface PaymentRecord {
    id: string;
    date: string;
    amount: number;
    currency: 'RSD' | 'EUR' | 'USD';
    method: 'Cash' | 'Card' | 'Transfer' | 'Check';
    receiptNo: string;
    fiscalReceiptNo?: string;
    registrationMark?: string;
    // Card specific
    cardType?: 'Master' | 'Visa' | 'Dina' | 'American';
    installmentsCount?: number;
    // Transfer specific
    bankName?: string;
    payerName?: string;
    // Payer details if not a traveler
    payerDetails?: {
        fullName: string;
        phone: string;
        email: string;
        address: string;
        city: string;
        country: string;
    };
    isExternalPayer?: boolean;
    travelerPayerId?: string; // ID of traveler from dossier.passengers
    exchangeRate?: number;
    amountInRsd?: number;
    status?: 'active' | 'deleted';
    // Check specific
    checks?: CheckData[];
}

interface Installment {
    id: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid';
}

interface ActivityLog {
    id: string;
    timestamp: string;
    operator: string;
    action: string;
    details: string;
    type: 'info' | 'warning' | 'success' | 'danger';
}

interface Dossier {
    cisCode: string;
    resCode: string | null;
    status: ResStatus;
    customerType: CustomerType;
    clientReference: string;
    booker: {
        fullName: string;
        address: string;
        city: string;
        country: string;
        idNumber: string;
        phone: string;
        email: string;
        companyPib: string;
        companyName: string;
    };
    passengers: Passenger[];
    tripItems: TripItem[];
    finance: {
        currency: string;
        installments: Installment[];
        payments: PaymentRecord[];
    };
    insurance: {
        guaranteePolicy: string;
        insurerContact: string;
        insurerEmail: string;
        cancellationOffered: boolean;
        healthOffered: boolean;
        confirmationText: string;
        confirmationTimestamp: string;
    };
    logs: ActivityLog[];
    notes: {
        general: string;
        contract: string;
        voucher: string;
        internal: string;
        financial: string;
        specialRequests: string;
    };
    repChecked?: boolean;
    repCheckedAt?: string;
    repCheckedBy?: string;
    repInternalNote?: string;
    documentTracker: {
        [key: string]: {
            generated: boolean;
            sentEmail: boolean;
            sentViber: boolean;
            sentPrint: boolean;
        };
    };
    language: Language;
}

// --- Component ---
const ReservationArchitect: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState('summary');

    const [advisorType, setAdvisorType] = useState('accomodation');
    const [expandedPassengers, setExpandedPassengers] = useState<string[]>([]);

    // B2B Segment States
    const { userLevel } = useAuthStore();
    const isSubagent = userLevel < 6; // Basic Agents/Subagents
    const canViewFinancials = userLevel >= 7; // Managers/Admins only
    const [commsSubject, setCommsSubject] = useState('');
    const [commsMessage, setCommsMessage] = useState('');
    const [showSaveClientBtn, setShowSaveClientBtn] = useState(false);
    const [logSearch, setLogSearch] = useState('');


    // Central State
    const [dossier, setDossier] = useState({
        cisCode: 'CIS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        resCode: null as string | null, // Broj Rezervacije (e.g. 0000001/2026)
        status: 'Request' as ResStatus,
        customerType: 'B2C-Individual' as CustomerType,
        clientReference: 'REF-' + Math.floor(Math.random() * 10000),

        // 1. Ugovarač (Payer/Main Booker)
        booker: {
            fullName: 'Petar Petrović',
            address: 'Bulevar Kralja Aleksandra 100',
            city: 'Beograd',
            country: 'Srbija',
            idNumber: '123456789',
            phone: '+381 64 123 4567',
            email: 'petar@email.com',
            companyPib: '', // if B2C-Legal or B2B
            companyName: ''
        },

        // 2. Svi putnici
        passengers: [
            {
                id: '1',
                firstName: 'Petar',
                lastName: 'Petrović',
                idNumber: '123456789',
                birthDate: '1985-05-20',
                type: 'Adult',
                address: 'Bulevar Kralja Aleksandra 100',
                city: 'Beograd',
                phone: '+381 64 123 4567',
                email: 'petar@email.com'
            }
        ] as Passenger[],


        // 3. Plan puta (Stavke)
        tripItems: [
            {
                id: 't1',
                type: 'Smestaj' as TripType,
                supplier: 'TCT (Travelgate)',
                country: 'Grčka',
                city: 'Tasos',
                subject: 'Thassos Grand Resort',
                details: 'Superior Room, All Inclusive',
                checkIn: '2025-07-01',
                checkOut: '2025-07-11',
                netPrice: 1600.00,
                bruttoPrice: 1850.00
            }
        ] as TripItem[],

        // 4. Finansije
        finance: {
            currency: 'EUR',
            installments: [] as Installment[],
            payments: [] as PaymentRecord[]
        },

        // 5. Legal & Insurance
        insurance: {
            guaranteePolicy: 'Triglav Osiguranje br. 990000123',
            insurerContact: '+381 11 333 444',
            insurerEmail: 'pomoć@triglav.rs',
            cancellationOffered: true,
            healthOffered: true,
            confirmationText: '',
            confirmationTimestamp: ''
        },

        // 6. Logovi
        logs: [
            {
                id: 'l-init',
                timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
                operator: 'Sistem',
                action: 'Dosije kreiran',
                details: 'Inicijalno otvaranje dosijea iz pretrage.',
                type: 'info'
            }
        ] as ActivityLog[],

        // 7. Napomene
        notes: {
            general: '',
            contract: '',
            voucher: '',
            internal: '',
            financial: '',
            specialRequests: ''
        },
        repChecked: false,
        repCheckedAt: '',
        repCheckedBy: '',
        repInternalNote: '',
        // 8. Document Tracking
        documentTracker: {
            contract: { generated: false, sentEmail: false, sentViber: false, sentPrint: false },
            voucher: { generated: false, sentEmail: false, sentViber: false, sentPrint: false },
            itinerary: { generated: false, sentEmail: false, sentViber: false, sentPrint: false },
            proforma: { generated: false, sentEmail: false, sentViber: false, sentPrint: false }
        },
        language: 'Srpski' as Language
    });
    const [isAdminMode, setIsAdminMode] = useState(true);

    const [isNotepadView, setIsNotepadView] = useState(false);
    const [isSummaryNotepadView, setIsSummaryNotepadView] = useState(false);
    const [isPartiesNotepadView, setIsPartiesNotepadView] = useState(false);
    const [isFinanceNotepadView, setIsFinanceNotepadView] = useState(false);
    const [isNotesNotepadView, setIsNotesNotepadView] = useState(false);
    const [isLegalNotepadView, setIsLegalNotepadView] = useState(false);
    const [isHistoryNotepadView, setIsHistoryNotepadView] = useState(false);
    const [isCommsNotepadView, setIsCommsNotepadView] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [activeCalendar, setActiveCalendar] = useState<{ id: string; type?: string } | null>(null);

    // Document Settings (Per-card language control)
    const [docSettings, setDocSettings] = useState<{ [key: string]: Language }>({
        contract: 'Srpski',
        voucher: 'Srpski',
        itinerary: 'Srpski',
        paxList: 'Srpski',
        proforma: 'Srpski',
        advance: 'Srpski',
        final: 'Srpski',
        payment: 'Srpski'
    });

    const [docGenHistory, setDocGenHistory] = useState<{ [key: string]: string }>({});

    // Update docSettings when dossier language changes (sync defaults)
    useEffect(() => {
        if (dossier.language) {
            setDocSettings({
                contract: dossier.language,
                voucher: dossier.language,
                itinerary: dossier.language,
                paxList: dossier.language,
                proforma: dossier.language,
                advance: dossier.language,
                final: dossier.language,
                payment: dossier.language
            });
        }
    }, [dossier.language]);

    // --- INITIAL DATA LOAD ---
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        async function initialize() {
            // Chunk 1: Fetch suppliers
            const allSuppliers = await supplierService.getAllSuppliers();

            const urlParams = new URLSearchParams(location.search);
            // ...

            const resId = urlParams.get('id');
            const loadFrom = urlParams.get('loadFrom');

            // 1. Prioritet: Učitavanje iz baze po ID-u (Edit režim)
            // 1. Prioritet: Učitavanje iz baze po ID-u (Edit režim)
            if (resId) {
                try {
                    // Try to load from localStorage first (simulation)
                    const saved = localStorage.getItem('active_reservation_dossier');
                    let loadedData = null;

                    if (saved) {
                        const parsed = JSON.parse(saved);
                        if (parsed.resCode === resId) {
                            loadedData = parsed;
                        }
                    }

                    if (loadedData) {
                        setDossier(loadedData);
                        setIsInitialized(true);
                        return;
                    }

                    // Fallback to API call if not in local storage or ID mismatch
                    const result = await apiGetReservationById(resId);
                    if (result.success && result.data) {
                        const dbRes = result.data;
                        const rawData = dbRes.guests_data as any;

                        if (rawData && rawData.booker && rawData.tripItems) {
                            // It's a full saved dossier - safe merge
                            setDossier(prev => ({
                                ...prev,
                                ...rawData,
                                logs: rawData.logs || prev.logs || [],
                                insurance: rawData.insurance || prev.insurance,
                                notes: rawData.notes || prev.notes,
                                language: rawData.language || prev.language || 'Srpski'
                            }));
                        } else {
                            // It's a standard reservation (e.g. from BookingModal) - Map to Dossier
                            const guests = rawData?.guests || [];
                            const mainGuest = guests[0] || {};

                            setDossier(prev => ({
                                ...prev,
                                cisCode: dbRes.cis_code,
                                resCode: dbRes.ref_code || null,
                                repChecked: dbRes.rep_checked || false,
                                repCheckedAt: dbRes.rep_checked_at || '',
                                repCheckedBy: dbRes.rep_checked_by || '',
                                repInternalNote: dbRes.rep_internal_note || '',
                                clientReference: dbRes.booking_id || prev.clientReference,
                                status: dbRes.status === 'confirmed' ? 'Active' : 'Request',
                                customerType: 'B2C-Individual',
                                booker: {
                                    ...prev.booker,
                                    fullName: dbRes.customer_name,
                                    phone: dbRes.phone,
                                    email: dbRes.email
                                },
                                passengers: guests.length > 0 ? guests.map((g: any, i: number) => ({
                                    id: 'p-' + i,
                                    firstName: g.firstName || '',
                                    lastName: g.lastName || '',
                                    birthDate: g.birthDate || '',
                                    type: g.type === 'child' ? 'Child' : 'Adult',
                                    email: g.email || '',
                                    phone: g.phone || ''
                                })) : [{
                                    id: 'p-1',
                                    firstName: mainGuest.firstName || dbRes.customer_name.split(' ')[0] || '',
                                    lastName: mainGuest.lastName || dbRes.customer_name.split(' ').slice(1).join(' ') || '',
                                    type: 'Adult',
                                    email: dbRes.email,
                                    phone: dbRes.phone
                                } as any],
                                tripItems: [{
                                    id: 't-1',
                                    type: 'Smestaj',
                                    supplier: dbRes.supplier,
                                    subject: dbRes.accommodation_name,
                                    details: 'Standard Room', // Fallback
                                    checkIn: dbRes.check_in,
                                    checkOut: dbRes.check_out,
                                    netPrice: dbRes.total_price * 0.9, // Estimate net
                                    bruttoPrice: dbRes.total_price,
                                    supplierRef: dbRes.booking_id
                                }]
                            }));
                        }
                        setIsInitialized(true);
                        return;
                    }
                } catch (e) {
                    console.error('Failed to load reservation by ID', e);
                }
            }

            // 2. Prioritet: Učitavanje nove rezervacije iz pretrage (Search režim)
            let loadData: any = null;
            if (location.state && location.state.selectedResult) {
                loadData = location.state;
            } else if (loadFrom === 'pending_booking') {
                const pending = localStorage.getItem('pending_booking');
                if (pending) {
                    try {
                        loadData = JSON.parse(pending);
                    } catch (e) {
                        console.error('Failed to parse pending booking', e);
                    }
                }
            }

            if (loadData && loadData.selectedResult) {
                const res = loadData.selectedResult;
                const searchParams = loadData.searchParams;
                const prefilled = loadData.prefilledGuests || [];
                const leadPassenger = prefilled.find((p: any) => p.isLeadPassenger) || prefilled[0];

                const calculatedPassengers = prefilled.length > 0 ? prefilled.map((pg: any, i: number) => ({
                    id: 'p-' + i,
                    firstName: pg.firstName || '',
                    lastName: pg.lastName || '',
                    idNumber: pg.passportNumber || '',
                    birthDate: pg.dateOfBirth || '',
                    type: i < (searchParams.adults || 2) ? 'Adult' : 'Child',
                    address: pg.address || '',
                    city: pg.city || '',
                    country: pg.country || '',
                    phone: pg.phone || '',
                    email: pg.email || ''
                })) : Array.from({ length: (searchParams.adults || 2) + (searchParams.children || 0) }).map((_, i) => ({
                    id: 'p-' + i,
                    firstName: '',
                    lastName: '',
                    idNumber: '',
                    birthDate: '',
                    type: i < (searchParams.adults || 2) ? 'Adult' : 'Child'
                }));

                // Helper to map room codes
                const getRoomDescription = (code: string) => {
                    const c = code.toUpperCase().trim();
                    if (c === 'DBL') return 'Dvokrevetna soba (DBL)';
                    if (c === 'SGL') return 'Jednokrevetna soba (SGL)';
                    if (c === 'TRP') return 'Trokrevetna soba (TRP)';
                    if (c === 'QDPL') return 'Četvorokrevetna soba (QDPL)';
                    if (c === 'APP') return 'Apartman (APP)';
                    if (c === 'STUDIO') return 'Studio';
                    if (c === 'FAM') return 'Porodična soba (FAM)';
                    return code; // Fallback to original
                };

                // Helper to map meal plan codes
                const getMealPlanDescription = (plan: string) => {
                    if (!plan) return '';
                    const p = plan.toUpperCase().trim();

                    // If it already follows the pattern "CODE - Name", keep it but maybe standardise
                    if (p.includes(' - ')) return p;

                    if (p === 'HB' || p === 'POLUPANSION') return 'HB - Polupansion';
                    if (p === 'BB' || p === 'NOĆENJE SA DORUČKOM') return 'BB - Noćenje sa Doručkom';
                    if (p === 'FB' || p === 'PUN PANSION') return 'FB - Pun Pansion';
                    if (p === 'AI' || p === 'ALL INCLUSIVE') return 'AI - All Inclusive';
                    if (p === 'UAI' || p === 'ULTRA ALL INCLUSIVE') return 'UAI - Ultra All Inclusive';
                    if (p === 'RO' || p === 'NAJAM') return 'RO - Najam (Bez Ishrane)';
                    if (p === 'PA') return 'PA - Pun Pansion';
                    if (p === 'PP') return 'PP - Polupansion';
                    if (p === 'ND') return 'ND - Noćenje sa Doručkom';

                    // Fallback: Check if it's a long name and try to prepend code
                    if (p.includes('POLU') || p.includes('HALF')) return 'HB - Polupansion';
                    if (p.includes('DORU') || p.includes('BREAKFAST')) return 'BB - Noćenje sa Doručkom';
                    if (p.includes('ALL') || p.includes('SVE')) return 'AI - All Inclusive';

                    return p;
                };

                setDossier(prev => ({
                    ...prev,
                    cisCode: 'CIS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                    clientReference: loadData.externalBookingCode || loadData.externalBookingId || ('REF-' + Math.floor(Math.random() * 10000)),
                    resCode: null, // OBAVEZNO null za novi dosije
                    tripItems: [
                        {
                            id: 't-' + Date.now(),
                            type: (res.tripType === 'Avio karte' || res.type === 'flight' || loadData.type === 'flight') ? 'Avio karte' : 'Smestaj',
                            supplier: res.source,
                            country: res.location.includes('Grčka') ? 'Grčka' : (res.location.includes(',') ? res.location.split(',').pop()?.trim() : res.location),
                            city: res.location.split(',')[0].trim(),
                            // Clean hotel name - remove city name in parentheses, underscores, and 'Not defined' text
                            subject: res.name
                                .replace(/\s*\(.*?\)\s*/g, ' ') // Remove (Sunny Beach)
                                .replace(/Not defined/gi, '')    // Remove "Not defined"
                                .replace(/_{1,}/g, ' ')         // Replace underscores with spaces
                                .replace(/\s+/g, ' ')           // Collapse spaces
                                .trim(),
                            // Store stars separately, handle "Not defined" or non-numeric values
                            stars: typeof res.stars === 'number' ? res.stars : (isNaN(parseInt(res.stars)) ? 0 : parseInt(res.stars)),
                            // Map room code to full description
                            details: getRoomDescription(loadData.selectedRoom?.name || 'Standard Room'),
                            mealPlan: getMealPlanDescription((res.mealPlan || loadData.selectedRoom?.mealPlan || '').replace('Standard Room', '')),
                            checkIn: searchParams.checkIn,
                            checkOut: searchParams.checkOut,
                            netPrice: (() => {
                                const gross = Math.round((loadData.selectedRoom?.price || res.price) * 100) / 100;
                                const supplierName = res.source || '';
                                const matched = allSuppliers.find(s => s.name.toLowerCase().includes(supplierName.toLowerCase()) || supplierName.toLowerCase().includes(s.name.toLowerCase()));
                                const comm = matched?.defaultPolicy?.commission || 0;
                                return comm > 0 ? Math.round((gross * (1 - comm / 100)) * 100) / 100 : gross;
                            })(),
                            bruttoPrice: Math.round((loadData.selectedRoom?.price || res.price) * 100) / 100,
                            supplierRef: loadData.externalBookingCode || loadData.externalBookingId || '',
                            supplierPaymentDeadline: (() => {
                                // Default rule: 14 days before Check-In
                                const checkInDate = new Date(searchParams.checkIn);
                                checkInDate.setDate(checkInDate.getDate() - 14);
                                // If today is already past that date, assume immediate payment (today)
                                return checkInDate < new Date() ? new Date().toISOString().split('T')[0] : checkInDate.toISOString().split('T')[0];
                            })(),
                            cancellationPolicyConfirmed: loadData.cancellationConfirmed || false,
                            passengers: [...calculatedPassengers],
                            flightLegs: (res.tripType === 'Avio karte' || res.type === 'flight' || loadData.type === 'flight') ? [] : undefined
                        }
                    ],
                    booker: leadPassenger ? {
                        fullName: `${leadPassenger.firstName} ${leadPassenger.lastName}`.trim(),
                        address: leadPassenger.address || '',
                        city: leadPassenger.city || '',
                        country: leadPassenger.country || '',
                        idNumber: leadPassenger.passportNumber || '',
                        phone: leadPassenger.phone || '',
                        email: leadPassenger.email || '',
                        companyPib: '',
                        companyName: ''
                    } : prev.booker,
                    passengers: calculatedPassengers,
                    notes: {
                        ...prev.notes,
                        general: loadData.specialRequests || ''
                    },
                    insurance: {
                        ...prev.insurance,
                        confirmationText: loadData.confirmationText || '',
                        confirmationTimestamp: loadData.confirmationTimestamp || ''
                    }
                }));

                // Log cancellation confirmation if present (just once after init)
                if (loadData.cancellationConfirmed) {
                    setTimeout(() => {
                        addLog('Potvrda Otkaznih Uslova', `Putnik je prihvatio rizik od otkaznih troškova. Datum: ${loadData.cancellationTimestamp || 'N/A'}`, 'warning');
                    }, 1000);
                }

                setIsInitialized(true);
                // Go directly to Passengers tab
                setActiveSection('summary');
                return;
            }

            // 3. Prioritet: Učitavanje iz LocalStorage (samo ako nema ID-a i nema pretrage)
            const saved = localStorage.getItem('active_reservation_dossier');
            if (saved && !resId) {
                try {
                    setDossier(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to load dossier from Storage', e);
                }
            }
            setIsInitialized(true);
        }

        initialize();
    }, [location.search, location.state]);

    // Save to LocalStorage on changes (only if it's NOT a saved reservation by ID)
    useEffect(() => {
        if (isInitialized && !dossier.resCode) {
            localStorage.setItem('active_reservation_dossier', JSON.stringify(dossier));
        }
    }, [dossier, isInitialized]);

    // --- FINANCIAL CALCULATIONS (Memoized to prevent loops) ---
    const financialStats = React.useMemo(() => {
        const brutto = dossier.tripItems.reduce((sum, item) => sum + (item.bruttoPrice || 0), 0);
        const net = dossier.tripItems.reduce((sum, item) => sum + (item.netPrice || 0), 0);
        const profit = brutto - net;
        const profitPerc = net > 0 ? (profit / net) * 100 : 0;
        const paid = (dossier.finance?.payments || []).reduce((sum, p) => p.status === 'deleted' ? sum : sum + (p.amount || 0), 0);
        const bal = brutto - paid;

        return {
            totalBrutto: brutto,
            totalNet: net,
            totalProfit: profit,
            profitPercent: profitPerc,
            totalPaid: paid,
            balance: bal
        };
    }, [dossier.tripItems, dossier.finance?.payments]);

    const { totalBrutto, totalNet, totalProfit, profitPercent, totalPaid, balance } = financialStats;

    // Fix: Ensure documentTracker exists (fallback for old data)
    useEffect(() => {
        if (isInitialized && !dossier.documentTracker) {
            setDossier(prev => ({
                ...prev,
                documentTracker: {
                    contract: { generated: false, sentEmail: false, sentViber: false, sentPrint: false },
                    voucher: { generated: false, sentEmail: false, sentViber: false, sentPrint: false },
                    itinerary: { generated: false, sentEmail: false, sentViber: false, sentPrint: false },
                    proforma: { generated: false, sentEmail: false, sentViber: false, sentPrint: false }
                }
            }));
        }
    }, [isInitialized, dossier.documentTracker]);

    // --- EXCHANGE RATE SIMULATION --- (To be replaced by API)
    const NBS_RATES = {
        'EUR': 117.00,
        'USD': 108.00,
        'RSD': 1.00
    };

    // --- ACTIVITY LOG HELPER ---
    const addLog = React.useCallback((action: string, details: string, type: ActivityLog['type'] = 'info') => {
        const newLog: ActivityLog = {
            id: 'log-' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString('sr-RS') + ' ' + new Date().toLocaleDateString('sr-RS'),
            operator: 'Nenad',
            action,
            details,
            type
        };
        setDossier(prev => ({
            ...prev,
            logs: [newLog, ...(prev.logs || [])]
        }));
    }, []);

    const handlePrint = () => {
        addLog('Štampa Dokumenta', 'Pokrenuta štampa Ugovora o Putovanju.', 'info');
        window.print();
    };

    const generateDocument = (type: string) => {
        addLog('Generisanje Dokumenta', `${type} je generisana za putnika ${dossier.booker.fullName}.`, 'success');
        alert(`Generisanje dokumenta: ${type}\nU realnoj aplikaciji, ovde se generiše PDF sa podacima iz dosijea:\n- Broj: ${dossier.resCode || dossier.clientReference}\n- Putnik: ${dossier.booker.fullName}\n- Iznos: ${totalBrutto} ${dossier.finance.currency}`);
    };

    useEffect(() => {
        // Only automate to 'Active' if payment exists and not already Canceled
        if (isInitialized && dossier.status !== 'Canceled' && totalPaid > 0 && dossier.status !== 'Active') {
            setDossier(prev => {
                if (prev.status === 'Active') return prev; // Avoid redundant update
                return { ...prev, status: 'Active' };
            });
            addLog('Status Promenjen', 'Status rezervacije automatski promenjen u "Active" zbog evidentirane uplate.', 'info');
        }
    }, [totalPaid, dossier.status, isInitialized, addLog]);

    // --- SOLVEX AUTO SYNC ---
    useEffect(() => {
        // Only run if initialized AND we have a Solvex item without status
        if (!isInitialized) return;

        const solvexItem = dossier.tripItems.find(i =>
            i.supplier?.toLowerCase().includes('solvex') &&
            i.supplierRef &&
            (!i.solvexStatus || i.solvexStatus === 'Checking...')
        );

        if (solvexItem) {
            const performSync = async () => {
                console.log('[Solvex] Auto-syncing status for:', solvexItem.supplierRef);
                try {
                    const res = await getSolvexReservation(solvexItem.supplierRef!);
                    if (res.success && res.data) {
                        setDossier(prev => ({
                            ...prev,
                            tripItems: prev.tripItems.map(ti => ti.id === solvexItem.id ? {
                                ...ti,
                                solvexStatus: res.data.Status,
                                solvexKey: res.data.ID
                            } : ti)
                        }));
                        addLog('Solvex Sync', `Automatski povučen status: ${res.data.Status}`, 'success');
                    } else {
                        setDossier(prev => ({
                            ...prev,
                            tripItems: prev.tripItems.map(ti => ti.id === solvexItem.id ? {
                                ...ti,
                                solvexStatus: 'Nije pronađeno'
                            } : ti)
                        }));
                        addLog('Solvex Sync', `Rezervacija ${solvexItem.supplierRef} nije pronađena na Solvexu.`, 'danger');
                    }
                } catch (err) {
                    console.error('[Solvex Auto Sync Error]', err);
                    setDossier(prev => ({
                        ...prev,
                        tripItems: prev.tripItems.map(ti => ti.id === solvexItem.id ? {
                            ...ti,
                            solvexStatus: 'Greška pri proveri'
                        } : ti)
                    }));
                    addLog('Solvex Sync Greška', `Neuspešna komunikacija sa API: ${err instanceof Error ? err.message : 'Nepoznata greška'}`, 'danger');
                }
            };
            // Delay a bit to ensure UI is ready and logs can be seen
            const timer = setTimeout(performSync, 1500);
            return () => clearTimeout(timer);
        }
    }, [isInitialized, dossier.tripItems.length]); // Only re-run if number of items changes or on init

    const addPassenger = () => {
        const newPax: Passenger = {
            id: Math.random().toString(),
            firstName: '',
            lastName: '',
            idNumber: '',
            birthDate: '',
            type: 'Adult',
            address: '',
            phone: '',
            email: ''
        };
        setDossier(prev => ({ ...prev, passengers: [...prev.passengers, newPax] }));
        addLog('Dodavanje Putnika', 'Novi prazan red za putnika je dodat u listu.', 'info');
        // Auto-expand new passenger
        setExpandedPassengers(prev => [...prev, newPax.id]);
    };


    const removePassenger = (id: string) => {
        setDossier(prev => {
            const paxToRemove = prev.passengers.find(p => p.id === id);
            addLog('Brisanje Putnika', `Putnik ${paxToRemove?.firstName || ''} ${paxToRemove?.lastName || ''} je uklonjen iz dosijea.`, 'danger');
            return { ...prev, passengers: prev.passengers.filter(p => p.id !== id) };
        });
        setExpandedPassengers(prev => prev.filter(pId => pId !== id));
    };


    const removeTripItem = (id: string) => {
        setDossier(prev => {
            const itemToRemove = prev.tripItems.find(item => item.id === id);
            addLog('Brisanje Stavke', `Stavka "${itemToRemove?.subject}" (${itemToRemove?.type}) je uklonjena.`, 'danger');
            return { ...prev, tripItems: prev.tripItems.filter(t => t.id !== id) };
        });
    };

    const removePayment = (id: string) => {
        const password = prompt('Unesite šifru najvišeg pristupa za brisanje uplate:');
        if (password !== 'ADMIN2026') {
            alert('Pogrešna šifra! Brisanje nije dozvoljeno.');
            addLog('Neuspelo Brisanje Uplate', 'Pokušano brisanje uplate sa pogrešnom lozinkom.', 'warning');
            return;
        }

        setDossier(prev => {
            const nextPayments = prev.finance.payments.map(p => {
                if (p.id === id) {
                    addLog('Storniranje Uplate', `Uplata ID: ${id} (Iznos: ${p.amount} ${p.currency}) je STORNIRANA.`, 'danger');
                    return { ...p, status: 'deleted' as const, amount: 0, amountInRsd: 0 };
                }
                return p;
            });
            return {
                ...prev,
                finance: { ...prev.finance, payments: nextPayments }
            };
        });
    };

    const addTripItem = (type: TripType) => {
        setDossier(prev => {
            const newItem: TripItem = {
                id: Math.random().toString(),
                type,
                supplier: '',
                country: '',
                city: '',
                subject: '',
                details: '',
                checkIn: '',
                checkOut: '',
                netPrice: 0,
                bruttoPrice: 0,
                passengers: [...prev.passengers],
                flightLegs: type === 'Avio karte' ? [] : undefined
            };
            return { ...prev, tripItems: [...prev.tripItems, newItem] };
        });
        addLog('Dodavanje Stavke', `Nova stavka tipa "${type}" je dodata. Svi putnici su automatski dodeljeni.`, 'info');
    };

    const removePassengerFromItem = (itemId: string, passengerId: string) => {
        setDossier(prev => ({
            ...prev,
            tripItems: prev.tripItems.map(item => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        passengers: item.passengers?.filter(p => p.id !== passengerId)
                    };
                }
                return item;
            })
        }));
    };

    const addFlightLeg = (itemId: string) => {
        setDossier(prev => ({
            ...prev,
            tripItems: prev.tripItems.map(item => {
                if (item.id === itemId) {
                    const newLeg: FlightLeg = {
                        id: Math.random().toString(),
                        depAirport: '',
                        depDate: '',
                        depTime: '',
                        arrAirport: '',
                        arrDate: '',
                        arrTime: '',
                        flightNumber: '',
                        airline: '',
                        class: '',
                        baggage: ''
                    };
                    return { ...item, flightLegs: [...(item.flightLegs || []), newLeg] };
                }
                return item;
            })
        }));
    };

    const removeFlightLeg = (itemId: string, legId: string) => {
        setDossier(prev => ({
            ...prev,
            tripItems: prev.tripItems.map(item => {
                if (item.id === itemId) {
                    return { ...item, flightLegs: (item.flightLegs || []).filter(l => l.id !== legId) };
                }
                return item;
            })
        }));
    };

    const updateFlightLeg = (itemId: string, legId: string, field: keyof FlightLeg, value: string) => {
        setDossier(prev => ({
            ...prev,
            tripItems: prev.tripItems.map(item => {
                if (item.id === itemId) {
                    return {
                        ...item,
                        flightLegs: (item.flightLegs || []).map(l => l.id === legId ? { ...l, [field]: value } : l)
                    };
                }
                return item;
            })
        }));
    };

    const copyAllPassengersToAllItems = () => {
        setDossier(prev => ({
            ...prev,
            tripItems: prev.tripItems.map(item => ({
                ...item,
                passengers: [...prev.passengers]
            }))
        }));
        addLog('Kopiranje Putnika', 'Svi putnici su kopirani u sve stavke rezervacije.', 'success');
        alert('Svi putnici su uspešno kopirani na svaku stavku rezervacije!');
    };

    const addPayment = () => {
        setDossier(prev => {
            const newPayment: PaymentRecord = {
                id: Math.random().toString(),
                date: '', // Empty date until saved
                amount: 0,
                currency: prev.finance.currency as any,
                status: 'active' as const,
                method: 'Cash',
                receiptNo: 'PR-' + (prev.finance.payments.length + 1),
                fiscalReceiptNo: '',
                registrationMark: '',
                checks: [],
                exchangeRate: NBS_RATES[prev.finance.currency as keyof typeof NBS_RATES] || 1,
                amountInRsd: 0
            };
            return {
                ...prev,
                finance: { ...prev.finance, payments: [...prev.finance.payments, newPayment] }
            };
        });
        addLog('Dodavanje Uplate', 'Novi prazan red za uplatu je dodat.', 'info');
    };

    const commitPayment = (paymentId: string) => {
        const now = new Date();
        const localDateTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

        setDossier(prev => {
            const nextPayments = prev.finance.payments.map(p => {
                if (p.id === paymentId) {
                    const updated = { ...p, date: localDateTime };
                    // Immediate log for traceability
                    addLog('Potvrda Uplate', `Uplata od ${updated.amount} ${updated.currency} je potvrđena i proknjižena. Način: ${updated.method}.`, 'success');
                    return updated;
                }
                return p;
            });
            return {
                ...prev,
                finance: { ...prev.finance, payments: nextPayments }
            };
        });
    };

    const addCheckToPayment = (paymentId: string) => {
        setDossier(prev => {
            const nextPayments = prev.finance.payments.map(p => {
                if (p.id === paymentId) {
                    const newCheck: CheckData = {
                        id: Math.random().toString(),
                        checkNumber: '',
                        bank: '',
                        amount: 0,
                        realizationDate: ''
                    };
                    return { ...p, checks: [...(p.checks || []), newCheck] };
                }
                return p;
            });
            return { ...prev, finance: { ...prev.finance, payments: nextPayments } };
        });
        addLog('Dodavanje Čeka', `Novi ček je dodat uplati ID: ${paymentId}.`, 'info');
    };

    const removeCheckFromPayment = (paymentId: string, checkId: string) => {
        setDossier(prev => {
            const nextPayments = prev.finance.payments.map(p => {
                if (p.id === paymentId) {
                    return { ...p, checks: p.checks?.filter(c => c.id !== checkId) || [] };
                }
                return p;
            });
            return { ...prev, finance: { ...prev.finance, payments: nextPayments } };
        });
        addLog('Brisanje Čeka', `Ček ID: ${checkId} je uklonjen iz uplate ID: ${paymentId}.`, 'danger');
    };

    const togglePassengerExpand = (id: string) => {
        setExpandedPassengers(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const copyBookerToPassengers = () => {
        setDossier(prev => {
            const nextPassengers = prev.passengers.map(p => ({
                ...p,
                address: prev.booker.address || '',
                city: prev.booker.city || '',
                country: prev.booker.country || '',
                phone: prev.booker.phone || '',
                email: prev.booker.email || ''
            }));

            // Expand all after update
            setExpandedPassengers(nextPassengers.map(px => px.id));
            addLog('Kopiranje Podataka', 'Podaci ugovarača kopirani na sve putnike.', 'info');

            return {
                ...prev,
                passengers: nextPassengers
            };
        });
    };


    // --- NOTEPAD SHARE FUNCTIONS ---
    const getNotepadText = () => {
        let text = `--- PLAN PUTOVANJA / DOSSIER ${dossier.cisCode} ---\n\n`;
        dossier.tripItems.forEach((item, i) => {
            text += `${i + 1}. ${item.type.toUpperCase()}: ${item.subject}\n`;
            text += `> DATUM: ${formatDate(item.checkIn)} DO ${formatDate(item.checkOut)}\n`;
            text += `> LOKACIJA: ${item.city}, ${item.country}\n`;
            text += `> USLUGA: ${item.mealPlan || 'N/A'} - ${item.details || 'N/A'}\n`;
            const paxNames = item.passengers?.map(p => `${p.firstName} ${p.lastName}`).join(', ');
            text += `> PUTNICI: ${paxNames || 'Nema dodeljenih putnika'}\n\n`;
        });
        text += `UKUPNO ZA NAPLATU: ${totalBrutto.toFixed(2)} ${dossier.finance.currency}\n`;
        text += `\nHvala što putujete sa Olympic Travel!`;
        return text;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getNotepadText());
        addLog('Sistem', 'Plan puta kopiran u clipboard.', 'success');
        alert('Plan puta je kopiran! Sada ga možete nalepiti (Paste) u Viber, Instagram ili bilo koji drugi chat.');
    };

    const shareToEmail = () => {
        const subject = encodeURIComponent(`Plan putovanja - Dossier ${dossier.cisCode}`);
        const body = encodeURIComponent(getNotepadText());
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const shareGeneric = async () => {
        const shareData = {
            title: `Plan putovanja - Dossier ${dossier.cisCode}`,
            text: getNotepadText()
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                addLog('Sistem', 'Plan puta podeljen putem eksterne aplikacije.', 'info');
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            copyToClipboard();
        }
    };

    const getSummaryNotepadText = () => {
        let text = `Rezervacija broj : ${dossier.resCode || '---'}\n`;
        text += `Status: ${dossier.status}\n`;
        text += `Ref broj dobavljača: ${dossier.clientReference}\n`;
        text += `Cis oznaka: ${dossier.cisCode}\n`;
        text += `\nUGOVARAČ:\n${dossier.booker.fullName}\n${dossier.booker.email} | ${dossier.booker.phone}\n${dossier.booker.address}, ${dossier.booker.city}\n`;
        text += `\nPUTNICI (${dossier.passengers.length}):\n`;
        dossier.passengers.forEach((p, i) => {
            text += `${i + 1}. ${p.firstName} ${p.lastName} (${p.type}) ${p.idNumber ? `- ${p.idNumber}` : ''}\n`;
        });
        text += `\nPLAN PUTOVANJA:\n`;
        dossier.tripItems.forEach((item, i) => {
            text += `${i + 1}. ${item.type.toUpperCase()}: ${item.subject}\n`;
            text += `> Termin: ${formatDate(item.checkIn)} - ${formatDate(item.checkOut)}\n`;
            text += `> Lokacija: ${item.city}, ${item.country}\n`;
            text += `> Detalji: ${item.details} ${item.mealPlan ? `(${item.mealPlan})` : ''}\n`;
            if (item.notes) text += `> Napomena: ${item.notes}\n`;
        });

        // Add Notes Section
        const hasNotes = dossier.notes.general || dossier.notes.internal || dossier.notes.financial || dossier.notes.specialRequests || dossier.notes.contract || dossier.notes.voucher;
        if (hasNotes) {
            text += `\nNAPOMENE:\n`;
            if (dossier.notes.general) text += `- Opšte: ${dossier.notes.general}\n`;
            if (dossier.notes.internal) text += `- Interne: ${dossier.notes.internal}\n`;
            if (dossier.notes.financial) text += `- Finansijske: ${dossier.notes.financial}\n`;
            if (dossier.notes.specialRequests) text += `- Specijalni zahtevi: ${dossier.notes.specialRequests}\n`;
            if (dossier.notes.contract) text += `- Za ugovor: ${dossier.notes.contract}\n`;
            if (dossier.notes.voucher) text += `- Za vaučer: ${dossier.notes.voucher}\n`;
        }

        // Add Generated Documents Section
        const docs = [
            { id: 'contract', label: 'Ugovor o Putovanju' },
            { id: 'voucher', label: 'Vaučer / Smeštaj' },
            { id: 'proforma', label: 'Račun / Profaktura' },
            { id: 'itinerary', label: 'Plan Puta / Itinerer' }
        ];
        const generatedDocs = docs.filter(d => (dossier.documentTracker as any)?.[d.id]?.generated);
        if (generatedDocs.length > 0) {
            text += `\nGENERISANA DOKUMENTA:\n`;
            generatedDocs.forEach(d => {
                text += `- ${d.label}\n`;
            });
        }

        text += `\nUKUPNO ZA NAPLATU: ${totalBrutto.toFixed(2)} ${dossier.finance.currency}\n`;
        text += `UPLAĆENO: ${totalPaid.toFixed(2)} ${dossier.finance.currency}\n`;
        text += `SALDO (DUG): ${balance.toFixed(2)} ${dossier.finance.currency}\n`;
        text += `\nHvala što putujete sa Olympic Travel!`;
        return text;
    };

    const copySummaryToClipboard = () => {
        navigator.clipboard.writeText(getSummaryNotepadText());
        addLog('Sistem', 'Rezime rezervacije kopiran u clipboard.', 'success');
        alert('Rezime rezervacije je kopiran! Sada ga možete nalepiti (Paste) u Viber, Instagram ili bilo koji drugi chat.');
    };

    const shareSummaryToEmail = () => {
        const subject = encodeURIComponent(`Rezime rezervacije - Dossier ${dossier.cisCode}`);
        const body = encodeURIComponent(getSummaryNotepadText());
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const shareSummaryGeneric = async () => {
        const shareData = {
            title: `Rezime rezervacije - Dossier ${dossier.cisCode}`,
            text: getSummaryNotepadText()
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                addLog('Sistem', 'Rezime rezervacije podeljen putem eksterne aplikacije.', 'info');
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            copySummaryToClipboard();
        }
    };

    const getPartiesNotepadText = () => {
        let text = `--- PUTNICI I UGOVARAČ / DOSSIER ${dossier.cisCode} ---\n`;
        text += `TIP KLIJENTA: ${dossier.customerType}\n\n`;
        text += `UGOVARAČ:\n`;
        if (dossier.booker.companyName) text += `FIRMA: ${dossier.booker.companyName}\n`;
        text += `IME: ${dossier.booker.fullName}\n`;
        text += `ADRESA: ${dossier.booker.address}, ${dossier.booker.city}, ${dossier.booker.country}\n`;
        text += `EMAIL: ${dossier.booker.email}\n`;
        text += `TEL: ${dossier.booker.phone}\n`;
        text += `JEZIK: ${dossier.language}\n\n`;
        text += `SPISAK PUTNIKA (${dossier.passengers.length}):\n`;
        dossier.passengers.forEach((p, i) => {
            text += `${i + 1}. ${p.firstName} ${p.lastName} (${p.type})\n`;
            text += `   DOC: ${p.idNumber || '---'} | ROĐEN: ${p.birthDate || '---'}\n`;
            if (p.phone) text += `   TEL: ${p.phone}\n`;
            if (p.email) text += `   EMAIL: ${p.email}\n`;
        });
        return text;
    };

    const getFinanceNotepadText = () => {
        let text = `--- FINANSIJSKI IZVEŠTAJ / DOSSIER ${dossier.cisCode} ---\n`;
        text += `UKUPNO BRUTO: ${totalBrutto.toFixed(2)} ${dossier.finance.currency}\n`;
        text += `UKUPNO UPLAĆENO: ${totalPaid.toFixed(2)} ${dossier.finance.currency}\n`;
        text += `SALDO (DUG): ${balance.toFixed(2)} ${dossier.finance.currency}\n\n`;
        text += `EVIDENCIJA UPLATA:\n`;
        dossier.finance.payments.forEach((p, i) => {
            if (p.status === 'deleted') return;
            text += `${i + 1}. ${p.date || 'NEPOTVRĐENO'} | ${p.amount} ${p.currency} (${p.method})\n`;
            text += `   PLATILAC: ${p.payerName || 'N/A'} | FISKALNI: ${p.fiscalReceiptNo || '---'}\n`;
        });
        return text;
    };

    const getNotesNotepadText = () => {
        let text = `--- NAPOMENE REZERVACIJE / DOSSIER ${dossier.cisCode} ---\n\n`;
        text += `OPŠTE NAPOMENE:\n${dossier.notes.general || 'Nema napomena.'}\n\n`;
        text += `NAPOMENE ZA UGOVOR:\n${dossier.notes.contract || 'Nema napomena.'}\n\n`;
        text += `NAPOMENE ZA VAUČER:\n${dossier.notes.voucher || 'Nema napomena.'}\n\n`;
        text += `INTERNE NAPOMENE:\n${dossier.notes.internal || 'Nema napomena.'}\n`;
        return text;
    };

    const getHistoryNotepadText = () => {
        let text = `--- ISTORIJA IZMENA / DOSSIER ${dossier.cisCode} ---\n\n`;
        dossier.logs.forEach((log) => {
            text += `[${log.timestamp}] ${log.operator}: ${log.action.toUpperCase()}\n`;
            text += `> ${log.details}\n\n`;
        });
        return text;
    };

    const getLegalNotepadText = () => {
        let text = `--- PRAVA I OBAVEZE / DOSSIER ${dossier.cisCode} ---\n\n`;
        text += `GARANCIJA PUTOVANJA:\n${dossier.insurance.guaranteePolicy}\n`;
        text += `KONTAKT OSIGURAVAČA: ${dossier.insurance.insurerContact}\n`;
        text += `EMAIL OSIGURAVAČA: ${dossier.insurance.insurerEmail}\n\n`;
        text += `PONUĐENO OSIGURANJE OD OTKAZA: ${dossier.insurance.cancellationOffered ? 'DA' : 'NE'}\n`;
        text += `INFORMACIJE O ZDRAVSTVENOM OSIGURANJU: ${dossier.insurance.healthOffered ? 'DA' : 'NE'}\n\n`;
        if (dossier.insurance.confirmationText) {
            text += `ELEKTRONSKA POTVRDA PUTNIKA:\n`;
            text += `"${dossier.insurance.confirmationText}"\n`;
            text += `VREME POTVRDE: ${dossier.insurance.confirmationTimestamp}\n`;
        }
        return text;
    };

    const getCommsNotepadText = () => {
        let text = `--- B2B KOMUNIKACIJA / DOSSIER ${dossier.cisCode} ---\n\n`;
        text += `POSLEDNJI PREDMET: ${commsSubject || 'N/A'}\n`;
        text += `POSLEDNJA PORUKA:\n${commsMessage || 'N/A'}\n\n`;
        text += `KONTAKT CENTRALE: 011/33-33-333 | inf@olympic.rs\n`;
        return text;
    };

    const copyPartiesToClipboard = () => { navigator.clipboard.writeText(getPartiesNotepadText()); addLog('Sistem', 'Podaci o putnicima kopirani.', 'success'); alert('Kopirano!'); };
    const copyFinanceToClipboard = () => { navigator.clipboard.writeText(getFinanceNotepadText()); addLog('Sistem', 'Finansijski podaci kopirani.', 'success'); alert('Kopirano!'); };
    const copyNotesToClipboard = () => { navigator.clipboard.writeText(getNotesNotepadText()); addLog('Sistem', 'Napomene kopirane.', 'success'); alert('Kopirano!'); };
    const copyHistoryToClipboard = () => { navigator.clipboard.writeText(getHistoryNotepadText()); addLog('Sistem', 'Istorija izmena kopirana.', 'success'); alert('Kopirano!'); };
    const copyLegalToClipboard = () => { navigator.clipboard.writeText(getLegalNotepadText()); addLog('Sistem', 'Podaci o pravima i obavezama kopirani.', 'success'); alert('Kopirano!'); };
    const copyCommsToClipboard = () => { navigator.clipboard.writeText(getCommsNotepadText()); addLog('Sistem', 'Podaci o komunikaciji kopirani.', 'success'); alert('Kopirano!'); };

    const sharePartiesToEmail = () => { window.location.href = `mailto:?subject=${encodeURIComponent(`Putnici - Dossier ${dossier.cisCode}`)}&body=${encodeURIComponent(getPartiesNotepadText())}`; };
    const shareFinanceToEmail = () => { window.location.href = `mailto:?subject=${encodeURIComponent(`Finansije - Dossier ${dossier.cisCode}`)}&body=${encodeURIComponent(getFinanceNotepadText())}`; };
    const shareNotesToEmail = () => { window.location.href = `mailto:?subject=${encodeURIComponent(`Napomene - Dossier ${dossier.cisCode}`)}&body=${encodeURIComponent(getNotesNotepadText())}`; };
    const shareLegalToEmail = () => { window.location.href = `mailto:?subject=${encodeURIComponent(`Prava - Dossier ${dossier.cisCode}`)}&body=${encodeURIComponent(getLegalNotepadText())}`; };
    const shareCommsToEmail = () => { window.location.href = `mailto:?subject=${encodeURIComponent(`B2B Comms - Dossier ${dossier.cisCode}`)}&body=${encodeURIComponent(getCommsNotepadText())}`; };

    const sharePartiesGeneric = async () => { if (navigator.share) try { await navigator.share({ title: `Putnici - ${dossier.cisCode}`, text: getPartiesNotepadText() }); } catch (e) { } else copyPartiesToClipboard(); };
    const shareFinanceGeneric = async () => { if (navigator.share) try { await navigator.share({ title: `Finansije - ${dossier.cisCode}`, text: getFinanceNotepadText() }); } catch (e) { } else copyFinanceToClipboard(); };
    const shareNotesGeneric = async () => { if (navigator.share) try { await navigator.share({ title: `Napomene - ${dossier.cisCode}`, text: getNotesNotepadText() }); } catch (e) { } else copyNotesToClipboard(); };
    const shareLegalGeneric = async () => { if (navigator.share) try { await navigator.share({ title: `Prava - ${dossier.cisCode}`, text: getLegalNotepadText() }); } catch (e) { } else copyLegalToClipboard(); };
    const shareCommsGeneric = async () => { if (navigator.share) try { await navigator.share({ title: `B2B Comms - ${dossier.cisCode}`, text: getCommsNotepadText() }); } catch (e) { } else copyCommsToClipboard(); };

    const handleSave = async () => {
        // Obavezni podaci nosioca (Booker)
        if (!dossier.booker.fullName || dossier.booker.fullName.trim() === '') {
            alert('Molimo unesite podatke nosioca putovanja pre čuvanja.');
            setActiveSection('parties');
            return;
        }

        try {
            // Generisanje broja rezervacije ako već ne postoji
            let currentDossier = { ...dossier };
            let isInitialSave = false;

            if (!dossier.resCode) {
                // Fetch the next available reservation number from the database
                const nextNum = await getNextReservationNumber();
                currentDossier.resCode = nextNum;
                isInitialSave = true;
                setDossier(currentDossier);
            }

            // Save to Supabase
            const result = await saveDossierToDatabase(currentDossier);

            if (result.success) {
                if (isInitialSave) {
                    addLog('Čuvanje Dosijea', `Dossier je prvi put sačuvan u bazu. Dodeljen broj: ${currentDossier.resCode}`, 'success');
                    alert(`Dosije uspešno sačuvan u bazu! Dodeljen broj rezervacije: ${currentDossier.resCode}`);
                } else {
                    addLog('Izmena Dosijea', 'Podaci o dosijeu su ažurirani u bazi.', 'info');
                    alert('Izmene na dosijeu su uspešno sačuvane u bazu.');
                }
            } else {
                console.error('Save failed:', result.error);
                alert(`Greška pri čuvanju u bazu: ${result.error || 'Nepoznata greška'}`);
            }
        } catch (err) {
            console.error('Unexpected error during save:', err);
            alert('Došlo je do neočekivane greške prilikom čuvanja.');
        }
    };

    const handleSaveToClients = async () => {
        if (!dossier.booker.companyName) return;

        try {
            const newClient = {
                id: `KUP-${new Date().getFullYear().toString().substr(-2)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
                type: dossier.customerType === 'B2B-Subagent' ? 'B2B' : 'B2C',
                category: dossier.customerType === 'B2B-Subagent' ? 'Subagenti' : 'Pravna lica (Firme)',
                fname: dossier.booker.fullName.split(' ')[0] || '',
                lname: dossier.booker.fullName.split(' ').slice(1).join(' ') || '',
                email: dossier.booker.email,
                phone: dossier.booker.phone,
                firmName: dossier.booker.companyName,
                cui: dossier.booker.companyPib,
                address: dossier.booker.address,
                city: dossier.booker.city,
                country: dossier.booker.country,
                language: dossier.language || 'Srpski',
                newsletter: true,
                contacts: []
            };

            const { success } = await saveToCloud('customers', [newClient]);
            if (success) {
                alert('Klijent je uspešno sačuvan u bazi klijenata.');
                setShowSaveClientBtn(false);
                addLog('Klijent Sačuvan', `Kompanija ${newClient.firmName} dodata u bazu klijenta.`, 'success');
            }
        } catch (e) {
            console.error(e);
            alert('Greška prilikom čuvanja klijenta.');
        }
    };

    // Helper to get booker label based on customer type
    const getBookerLabel = () => {
        return 'Kontakt Osoba (Ime i Prezime)';
    };

    const getTripTypeIcon = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('smeštaj') || lowerType.includes('smestaj')) return <Building2 size={16} />;
        if (lowerType.includes('avio')) return <Plane size={16} />;
        if (lowerType.includes('paket')) return <PackageIcon size={16} />;
        if (lowerType.includes('putovanja')) return <Globe size={16} />;
        if (lowerType.includes('transfer')) return <Truck size={16} />;
        return <FileText size={16} />;
    };

    const getSupplierB2BUrl = (supplier: string) => {
        const s = supplier.toLowerCase();
        if (s.includes('solvex')) return 'https://b2b.solvex.bg/';
        if (s.includes('tct')) return 'https://b2b.tct.rs/';
        if (s.includes('opengreece')) return 'https://b2b.opengreece.com/';
        return null;
    };


    return (
        <div className="res-master-container fade-in">
            <div className="res-architect-modal">
                {/* --- HEADER V3 --- */}
                <header className="res-header-v2">
                    <div className="header-left">
                        <div className="res-badge">
                            <FileText size={14} />
                            <span>REZ: <strong>{dossier.resCode || dossier.clientReference}</strong></span>
                            {dossier.tripItems.some(i => i.supplier?.toLowerCase().includes('solvex')) && (
                                <div className="solvex-info-tag">
                                    <Zap size={10} color="#fbbf24" />
                                    <span>Solvex: <strong>{dossier.tripItems.find(i => i.supplier?.toLowerCase().includes('solvex'))?.solvexStatus || 'Checking...'}</strong></span>
                                    {dossier.tripItems.find(i => i.supplier?.toLowerCase().includes('solvex'))?.solvexKey && (
                                        <span className="solvex-internal-id">ID: {dossier.tripItems.find(i => i.supplier?.toLowerCase().includes('solvex'))?.solvexKey}</span>
                                    )}
                                    <button
                                        className="sync-solvex-btn"
                                        title="Sinhronizuj sa Solvexom"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            const item = dossier.tripItems.find(i => i.supplier?.toLowerCase().includes('solvex'));
                                            if (!item || !item.supplierRef) return;

                                            addLog('Solvex Sync', 'Pokrenuta ručna provera statusa...', 'info');

                                            try {
                                                const res = await getSolvexReservation(item.supplierRef);
                                                if (res.success && res.data) {
                                                    setDossier(prev => ({
                                                        ...prev,
                                                        tripItems: prev.tripItems.map(ti => ti.id === item.id ? {
                                                            ...ti,
                                                            solvexStatus: res.data.Status,
                                                            solvexKey: res.data.ID
                                                        } : ti)
                                                    }));
                                                    addLog('Solvex Sync Uspeh', `Novi status: ${res.data.Status}`, 'success');
                                                } else {
                                                    addLog('Solvex Sync', res.error || 'Rezervacija nije pronađena.', 'danger');
                                                    setDossier(prev => ({
                                                        ...prev,
                                                        tripItems: prev.tripItems.map(ti => ti.id === item.id ? { ...ti, solvexStatus: 'Nije pronađeno' } : ti)
                                                    }));
                                                }
                                            } catch (err) {
                                                addLog('Solvex Sync Greška', err instanceof Error ? err.message : 'Greška u komunikaciji', 'danger');
                                                setDossier(prev => ({
                                                    ...prev,
                                                    tripItems: prev.tripItems.map(ti => ti.id === item.id ? { ...ti, solvexStatus: 'Greška' } : ti)
                                                }));
                                            }
                                        }}
                                    >
                                        <RefreshCw size={10} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="horizontal-status-tags" style={{ marginLeft: dossier.resCode ? '16px' : '0' }}>

                            {['Request', 'Processing', 'Offer', 'Reservation', 'Active', 'Canceled'].map((s) => (
                                <button
                                    key={s}
                                    className={`status-item ${dossier.status === s ? 'active' : ''}`}
                                    style={{
                                        '--status-color':
                                            s === 'Active' ? '#10b981' :
                                                s === 'Reservation' ? '#3b82f6' :
                                                    s === 'Processing' ? '#f59e0b' :
                                                        s === 'Request' ? '#6366f1' :
                                                            s === 'Offer' ? '#94a3b8' : '#ef4444',
                                    } as React.CSSProperties}
                                    onClick={() => {
                                        setDossier({ ...dossier, status: s as ResStatus });
                                        addLog('Status Promenjen', `Status rezervacije promenjen u "${s}".`, 'info');
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="header-center">
                        <h2>DOSIJE REZERVACIJE</h2>
                    </div>
                    <div className="header-right">
                        <div className="cis-badge">
                            <Hash size={14} />
                            <span>CIS: <strong>{dossier.cisCode}</strong></span>
                        </div>
                        <button
                            className={`action-icon-btn ${isAdminMode ? 'admin-active' : ''}`}
                            title={isAdminMode ? "Izađi iz Admin moda" : "Meni za menadžere (Neto & Marža)"}
                            onClick={() => {
                                if (isAdminMode) {
                                    setIsAdminMode(false);
                                    addLog('Bezbednost', 'Admin mod isključen - osetljivi podaci sakriveni.', 'info');
                                } else {
                                    const pass = prompt('Unesite administratorsku šifru za pristup osetljivim podacima:');
                                    if (pass === 'ADMIN2026') {
                                        setIsAdminMode(true);
                                        addLog('Bezbednost', 'Admin mod aktiviran - omogućen uvid u neto cene i marže.', 'success');
                                    } else {
                                        alert('Pristup odbijen! Pogrešna lozinka.');
                                    }
                                }
                            }}
                            style={{
                                background: isAdminMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                                color: isAdminMode ? '#10b981' : 'var(--text-secondary)',
                                border: isAdminMode ? '1px solid #10b981' : '1px solid var(--border)',
                                marginRight: '8px'
                            }}
                        >
                            {isAdminMode ? <ShieldCheck size={20} /> : <Shield size={20} />}
                        </button>
                        <button className="action-icon-btn close" onClick={() => navigate('/reservations')}><X size={20} /></button>
                    </div>

                </header>

                <div className="res-body-layout">
                    {/* --- SIDE NAVIGATION --- */}
                    <aside className="res-sidebar-nav">
                        <button className={activeSection === 'summary' ? 'active' : ''} onClick={() => setActiveSection('summary')}>
                            <ShieldCheck size={18} /> Rezervacija
                        </button>
                        <button className={activeSection === 'parties' ? 'active' : ''} onClick={() => setActiveSection('parties')}>
                            <Users size={18} /> Svi Putnici
                        </button>
                        <button className={activeSection === 'trip' ? 'active' : ''} onClick={() => setActiveSection('trip')}>
                            <Briefcase size={18} /> Stavke Rezervacije
                        </button>
                        <button className={activeSection === 'finance' ? 'active' : ''} onClick={() => setActiveSection('finance')}>
                            <Banknote size={18} /> Uplate & Finansije
                        </button>
                        {isSubagent && (
                            <button className={`comms-btn ${activeSection === 'communication' ? 'active' : ''}`} onClick={() => setActiveSection('communication')}>
                                <Mail size={18} /> B2B Komunikacija
                            </button>
                        )}
                        <button className={activeSection === 'notes' ? 'active' : ''} onClick={() => setActiveSection('notes')}>
                            <FileText size={18} /> Napomene
                        </button>
                        <button className={activeSection === 'legal' ? 'active' : ''} onClick={() => setActiveSection('legal')}>
                            <Scale size={18} /> Prava, Garancije i Obaveze
                        </button>
                        <button className={activeSection === 'documents' ? 'active' : ''} onClick={() => setActiveSection('documents')}>
                            <FileText size={18} /> Dokumenta
                        </button>
                        <button className={activeSection === 'rep' ? 'active' : ''} onClick={() => setActiveSection('rep')}>
                            <Shield size={18} /> Predstavnik
                        </button>
                        <button className={activeSection === 'history' ? 'active' : ''} onClick={() => setActiveSection('history')}>
                            <History size={18} /> Istorija Izmena
                        </button>
                        <button
                            className="email-btn-sidebar"
                            onClick={() => setIsEmailModalOpen(true)}
                            style={{
                                marginTop: '20px',
                                border: '1px dashed var(--border)',
                                color: 'var(--accent)'
                            }}
                        >
                            <Mail size={18} /> Pošalji Email
                        </button>

                        <div className="sidebar-finance-widget">
                            <div className="finance-stat-card">
                                <span>Ukupno za naplatu</span>
                                <strong className="val-total">{totalBrutto.toFixed(2)} {dossier.finance.currency}</strong>
                            </div>
                            <div className="finance-stat-card">
                                <span>Dosad uplaćeno</span>
                                <strong className="val-paid">{totalPaid.toFixed(2)} {dossier.finance.currency}</strong>
                            </div>
                            <div className="finance-stat-card highlight">
                                <span>Preostalo (Saldo)</span>
                                <strong className={balance > 0.01 ? 'val-debt' : 'val-settled'}>
                                    {balance.toFixed(2)} {dossier.finance.currency}
                                </strong>
                            </div>
                            {isAdminMode && (
                                <div className="finance-stat-card admin-only" style={{ background: 'rgba(16, 185, 129, 0.08)', borderTop: '1px dashed rgba(16, 185, 129, 0.2)' }}>
                                    <span>Ukupna Zarada (Neto-Bruto)</span>
                                    <strong style={{ color: '#10b981' }}>
                                        {totalProfit.toFixed(2)} ({profitPercent.toFixed(1)}%)
                                    </strong>
                                </div>
                            )}
                        </div>
                    </aside>

                    {/* --- MAIN CONTENT --- */}
                    <main className="res-main-content">



                        {/* SECTION 0: SUMMARY (Rezervacija) */}
                        {activeSection === 'summary' && (
                            <section className="res-section fade-in">
                                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '20px' }}><ShieldCheck size={20} color="var(--accent)" style={{ marginRight: '10px' }} /> Pregled Rezervacije</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Konsolidovani prikaz svih stavki i podataka iz dosijea</p>
                                    </div>
                                    <button
                                        className="btn-notepad-toggle"
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            background: isSummaryNotepadView ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                                            color: isSummaryNotepadView ? 'white' : 'var(--text-secondary)',
                                            border: '1px solid var(--border)',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        onClick={() => setIsSummaryNotepadView(!isSummaryNotepadView)}
                                    >
                                        <FileText size={14} /> {isSummaryNotepadView ? 'Zatvori Notepad' : 'Notepad Pregled'}
                                    </button>
                                </div>

                                {isSummaryNotepadView ? (
                                    <div className="notepad-container" style={{
                                        background: '#1e293b',
                                        padding: '30px',
                                        borderRadius: '16px',
                                        border: '1px solid var(--border)',
                                        fontFamily: 'monospace',
                                        color: '#cbd5e1',
                                        lineHeight: '1.6',
                                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
                                        position: 'relative'
                                    }}>
                                        <div className="notepad-actions" style={{
                                            position: 'absolute',
                                            top: '20px',
                                            right: '25px',
                                            display: 'flex',
                                            gap: '8px'
                                        }}>
                                            <button
                                                onClick={copySummaryToClipboard}
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Copy size={14} /> Kopiraj
                                            </button>
                                            <button
                                                onClick={shareSummaryToEmail}
                                                style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Mail size={14} /> Email
                                            </button>
                                            <button
                                                onClick={handlePrint}
                                                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Printer size={14} /> Štampaj
                                            </button>
                                            <button
                                                onClick={shareSummaryGeneric}
                                                style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Share2 size={14} /> Viber/Wapp/Insta
                                            </button>
                                        </div>
                                        <div style={{ borderBottom: '1px dashed #475569', marginBottom: '20px', paddingBottom: '10px' }}>
                                            <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Rezervacija broj : {dossier.resCode || '---'}</div>
                                            <div>Status: {dossier.status}</div>
                                            <div>Ref broj dobavljača: {dossier.clientReference}</div>
                                            <div>Cis oznaka: {dossier.cisCode}</div>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ color: '#fff', fontWeight: 'bold' }}>UGOVARAČ:</div>
                                            <div>{dossier.booker.fullName}</div>
                                            <div>{dossier.booker.email} | {dossier.booker.phone}</div>
                                            <div>{dossier.booker.address}, {dossier.booker.city}</div>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ color: '#fff', fontWeight: 'bold' }}>PUTNICI ({dossier.passengers.length}):</div>
                                            {dossier.passengers.map((p, i) => (
                                                <div key={p.id}>{i + 1}. {p.firstName} {p.lastName} ({p.type}) {p.idNumber ? `- ${p.idNumber}` : ''}</div>
                                            ))}
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ color: '#fff', fontWeight: 'bold' }}>PLAN PUTOVANJA:</div>
                                            {dossier.tripItems.map((item, i) => (
                                                <div key={item.id} style={{ marginBottom: '10px', paddingLeft: '10px', borderLeft: '2px solid #3b82f6' }}>
                                                    <strong>{i + 1}. {item.type.toUpperCase()}: {item.subject}</strong><br />
                                                    &gt; Termin: {formatDate(item.checkIn)} - {formatDate(item.checkOut)}<br />
                                                    &gt; Lokacija: {item.city}, {item.country}<br />
                                                    &gt; Detalji: {item.details} {item.mealPlan ? `(${item.mealPlan})` : ''}
                                                    {item.notes && <><br />&gt; Napomena: {item.notes}</>}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Combined Notes Section for Notepad */}
                                        {(dossier.notes.general || dossier.notes.internal || dossier.notes.financial || dossier.notes.specialRequests || dossier.notes.contract || dossier.notes.voucher) && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <div style={{ color: '#fff', fontWeight: 'bold' }}>NAPOMENE:</div>
                                                {dossier.notes.general && <div>- Opšte: {dossier.notes.general}</div>}
                                                {dossier.notes.internal && <div>- Interne: {dossier.notes.internal}</div>}
                                                {dossier.notes.financial && <div>- Finansijske: {dossier.notes.financial}</div>}
                                                {dossier.notes.specialRequests && <div>- Specijalni zahtevi: {dossier.notes.specialRequests}</div>}
                                                {dossier.notes.contract && <div>- Za ugovor: {dossier.notes.contract}</div>}
                                                {dossier.notes.voucher && <div>- Za vaučer: {dossier.notes.voucher}</div>}
                                            </div>
                                        )}

                                        {/* Generated Documents Section for Notepad */}
                                        {(() => {
                                            const docs = [
                                                { id: 'contract', label: 'Ugovor o Putovanju' },
                                                { id: 'voucher', label: 'Vaučer / Smeštaj' },
                                                { id: 'proforma', label: 'Račun / Profaktura' },
                                                { id: 'itinerary', label: 'Plan Puta / Itinerer' }
                                            ];
                                            const generatedDocs = docs.filter(d => (dossier.documentTracker as any)?.[d.id]?.generated);
                                            if (generatedDocs.length > 0) {
                                                return (
                                                    <div style={{ marginBottom: '20px' }}>
                                                        <div style={{ color: '#fff', fontWeight: 'bold' }}>GENERISANA DOKUMENTA:</div>
                                                        {generatedDocs.map(d => (
                                                            <div key={d.id}>- {d.label}</div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}

                                        <div style={{ borderTop: '1px dashed #475569', marginTop: '20px', paddingTop: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>UKUPNO ZA NAPLATU:</span>
                                                <span style={{ color: '#fff', fontWeight: 'bold' }}>{totalBrutto.toFixed(2)} {dossier.finance.currency}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>UPLAĆENO:</span>
                                                <span style={{ color: '#10b981' }}>{totalPaid.toFixed(2)} {dossier.finance.currency}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #475569', marginTop: '5px', paddingTop: '5px' }}>
                                                <span>SALDO (DUG):</span>
                                                <span style={{ color: balance > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{balance.toFixed(2)} {dossier.finance.currency}</span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="summary-html-view" style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '20px',
                                        maxWidth: '1200px',
                                        margin: '0 auto',
                                        width: '100%'
                                    }}>
                                        {/* OSNOVNI KODOVI REZERVACIJE */}
                                        <div className="info-group codes-management-card" style={{
                                            padding: '24px',
                                            background: 'rgba(59, 130, 246, 0.03)',
                                            borderRadius: '16px',
                                            border: '1.5px dashed var(--border)',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr 1fr',
                                            gap: '24px'
                                        }}>
                                            <div className="input-field">
                                                <label style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Sistemski Broj Rezervacije (REZ)</label>
                                                <input
                                                    value={dossier.resCode || ''}
                                                    placeholder="npr. 0000001/2026"
                                                    onChange={e => setDossier({ ...dossier, resCode: e.target.value })}
                                                    style={{
                                                        background: 'var(--bg-card)',
                                                        border: '1.5px solid var(--accent)',
                                                        borderRadius: '10px',
                                                        height: '42px',
                                                        padding: '0 16px',
                                                        fontSize: '15px',
                                                        fontWeight: 700,
                                                        width: '100%'
                                                    }}
                                                />
                                            </div>
                                            <div className="input-field">
                                                <label style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Klijentska Referenca (REF)</label>
                                                <input
                                                    value={dossier.clientReference}
                                                    onChange={e => setDossier({ ...dossier, clientReference: e.target.value })}
                                                    style={{
                                                        background: 'var(--bg-card)',
                                                        borderRadius: '10px',
                                                        height: '42px',
                                                        padding: '0 16px',
                                                        fontSize: '14px',
                                                        width: '100%'
                                                    }}
                                                />
                                            </div>
                                            <div className="input-field">
                                                <label style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Interni CIS Kod</label>
                                                <input
                                                    value={dossier.cisCode}
                                                    readOnly
                                                    style={{
                                                        background: 'transparent',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '10px',
                                                        height: '42px',
                                                        padding: '0 16px',
                                                        fontSize: '14px',
                                                        color: 'var(--text-secondary)',
                                                        cursor: 'not-allowed',
                                                        width: '100%'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        {/* 1. NOSILAC PUTOVANJA - COMPACT HEADER */}
                                        <div className="summary-card" style={{
                                            background: 'var(--bg-card)',
                                            borderRadius: '16px',
                                            border: '1px solid var(--border)',
                                            padding: '24px 32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '24px'
                                        }}>
                                            <div style={{
                                                width: '48px',
                                                height: '48px',
                                                borderRadius: '12px',
                                                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05))',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'var(--accent)',
                                                flexShrink: 0
                                            }}>
                                                <User size={24} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, marginBottom: '4px' }}>Glavni Nosilac Putovanja / Ugovarač</div>
                                                <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>{dossier.booker.fullName}</div>
                                                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                        <Mail size={14} color="var(--accent)" />
                                                        {dossier.booker.email}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                        <Phone size={14} color="var(--accent)" />
                                                        {dossier.booker.phone}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                        <MapPin size={14} color="var(--accent)" />
                                                        {dossier.booker.city}, {dossier.booker.country}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. PLAN PUTOVANJA - COMPACT CARDS */}
                                        <div className="summary-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Briefcase size={18} color="var(--accent)" />
                                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Specifikacija Putovanja</h4>
                                            </div>
                                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                {dossier.tripItems.map((item, idx) => (
                                                    <div key={item.id} style={{
                                                        padding: '16px 20px',
                                                        background: 'rgba(255,255,255,0.01)',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(255,255,255,0.04)'
                                                    }}>
                                                        {/* Header Row */}
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                            <div style={{
                                                                width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-panel)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0
                                                            }}>
                                                                {item.type === 'Smestaj' && <Building2 size={20} />}
                                                                {item.type === 'Avio karte' && <Plane size={20} />}
                                                                {item.type === 'Čarter' && <Zap size={20} />}
                                                                {item.type === 'Bus' && <Compass size={20} />}
                                                                {item.type === 'Krstarenje' && <Ship size={20} />}
                                                                {item.type === 'Transfer' && <Truck size={20} />}
                                                                {item.type === 'Putovanja' && <Globe size={20} />}
                                                                {item.type === 'Dinamicki paket' && <PackageIcon size={20} />}
                                                            </div>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.type}</div>
                                                                    {item.supplier && <div style={{ fontSize: '10px', color: 'var(--text-secondary)', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>Provajder: {item.supplier}</div>}
                                                                </div>
                                                                <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    {item.subject}
                                                                    {item.stars && item.stars > 0 && (
                                                                        <div style={{ display: 'flex', gap: '1px', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                                                            {[...Array(item.stars)].map((_, i) => <Star key={i} size={8} fill="#fbbf24" color="#fbbf24" />)}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                                    <MapPin size={12} /> {item.city}, {item.country}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Details Row - 3 Columns */}
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(3, 1fr)',
                                                            gap: '12px',
                                                            padding: '12px 16px',
                                                            background: 'rgba(0,0,0,0.08)',
                                                            borderRadius: '8px',
                                                            borderTop: '1px solid rgba(255,255,255,0.05)'
                                                        }}>
                                                            <div>
                                                                <div style={{ color: 'var(--text-secondary)', marginBottom: '2px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Tip Smeštaja / Opis</div>
                                                                <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{item.details || 'Standard Room'}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-secondary)', marginBottom: '2px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Datum Putovanja</div>
                                                                <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{formatDate(item.checkIn)} - {formatDate(item.checkOut)}</div>
                                                            </div>
                                                            <div>
                                                                <div style={{ color: 'var(--text-secondary)', marginBottom: '2px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Usluga / Aranžman</div>
                                                                <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{item.mealPlan || 'BB - Noćenje sa doručkom'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 3. PUTNICI - COMPACT GRID */}
                                        <div className="summary-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <Users size={18} color="var(--accent)" />
                                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Učesnici Putovanja</h4>
                                            </div>
                                            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                                                {dossier.passengers.map((p, pIdx) => (
                                                    <div key={p.id} style={{
                                                        padding: '12px 16px',
                                                        background: 'rgba(255,255,255,0.02)',
                                                        borderRadius: '10px',
                                                        border: '1px solid rgba(255,255,255,0.05)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px'
                                                    }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>
                                                            {pIdx + 1}
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.firstName} {p.lastName}</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{p.type} {p.idNumber ? `| Dok: ${p.idNumber}` : ''}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 4. DOKUMENTA I NAPOMENE - TWO COLUMNS */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px', alignItems: 'flex-start' }}>
                                            {/* Document Tracking */}
                                            <div className="summary-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <FileText size={18} color="var(--accent)" />
                                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Slanje Dokumenata</h4>
                                                </div>
                                                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {[
                                                        { id: 'contract', label: 'Ugovor o Putovanju' },
                                                        { id: 'voucher', label: 'Vaučer / Smeštaj' },
                                                        { id: 'proforma', label: 'Račun / Profaktura' },
                                                        { id: 'itinerary', label: 'Plan Puta / Itinerer' }
                                                    ].map(doc => {
                                                        const isSentEmail = (dossier as any).documentTracker?.[doc.id]?.sentEmail;
                                                        const isSentViber = (dossier as any).documentTracker?.[doc.id]?.sentViber;
                                                        const isSentPrint = (dossier as any).documentTracker?.[doc.id]?.sentPrint;

                                                        return (
                                                            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{doc.label}</span>
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    <button
                                                                        onClick={() => {
                                                                            setDossier(prev => ({
                                                                                ...prev,
                                                                                documentTracker: {
                                                                                    ...prev.documentTracker,
                                                                                    [doc.id]: { ...(prev.documentTracker as any)[doc.id], sentEmail: !isSentEmail }
                                                                                }
                                                                            } as any));
                                                                        }}
                                                                        style={{
                                                                            width: '24px', height: '24px', borderRadius: '4px',
                                                                            background: isSentEmail ? 'var(--accent)' : 'var(--bg-panel)',
                                                                            color: isSentEmail ? 'white' : 'var(--text-secondary)',
                                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s',
                                                                            border: '1px solid var(--border)'
                                                                        }}
                                                                        title="Email"
                                                                    >
                                                                        <Mail size={10} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setDossier(prev => ({
                                                                                ...prev,
                                                                                documentTracker: {
                                                                                    ...prev.documentTracker,
                                                                                    [doc.id]: { ...(prev.documentTracker as any)[doc.id], sentViber: !isSentViber }
                                                                                }
                                                                            } as any));
                                                                        }}
                                                                        style={{
                                                                            width: '24px', height: '24px', borderRadius: '4px',
                                                                            background: isSentViber ? '#22c55e' : 'var(--bg-panel)',
                                                                            color: isSentViber ? 'white' : 'var(--text-secondary)',
                                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s',
                                                                            border: '1px solid var(--border)'
                                                                        }}
                                                                        title="Viber/WhatsApp"
                                                                    >
                                                                        <Share2 size={10} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            setDossier(prev => ({
                                                                                ...prev,
                                                                                documentTracker: {
                                                                                    ...prev.documentTracker,
                                                                                    [doc.id]: { ...(prev.documentTracker as any)[doc.id], sentPrint: !isSentPrint }
                                                                                }
                                                                            } as any));
                                                                        }}
                                                                        style={{
                                                                            width: '24px', height: '24px', borderRadius: '4px',
                                                                            background: isSentPrint ? '#94a3b8' : 'var(--bg-panel)',
                                                                            color: isSentPrint ? 'white' : 'var(--text-secondary)',
                                                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s',
                                                                            border: '1px solid var(--border)'
                                                                        }}
                                                                        title="Print"
                                                                    >
                                                                        <Printer size={10} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            {/* Unified Notes Card */}
                                            <div className="summary-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <AlertTriangle size={18} color="var(--accent)" />
                                                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Sve Napomene i Specijalni Zahtevi</h4>
                                                </div>
                                                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                                    {/* General Notes */}
                                                    {dossier.notes.general && (
                                                        <div style={{ padding: '12px 14px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid var(--accent)', borderRadius: '8px' }}>
                                                            <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--accent)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Opšte Napomene</div>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.general}</p>
                                                        </div>
                                                    )}

                                                    {/* Internal Notes */}
                                                    {dossier.notes.internal && (
                                                        <div style={{ padding: '12px 14px', background: 'rgba(168, 85, 247, 0.05)', borderLeft: '3px solid #a855f7', borderRadius: '8px' }}>
                                                            <div style={{ fontWeight: 700, marginBottom: '4px', color: '#a855f7', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔒 Interne Napomene</div>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.internal}</p>
                                                        </div>
                                                    )}

                                                    {/* Financial Notes */}
                                                    {dossier.notes.financial && (
                                                        <div style={{ padding: '12px 14px', background: 'rgba(34, 197, 94, 0.05)', borderLeft: '3px solid #22c55e', borderRadius: '8px' }}>
                                                            <div style={{ fontWeight: 700, marginBottom: '4px', color: '#22c55e', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💰 Finansijske</div>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.financial}</p>
                                                        </div>
                                                    )}

                                                    {/* Special Requests */}
                                                    {dossier.notes.specialRequests && (
                                                        <div style={{ padding: '12px 14px', background: 'rgba(234, 179, 8, 0.05)', borderLeft: '3px solid #eab308', borderRadius: '8px' }}>
                                                            <div style={{ fontWeight: 700, marginBottom: '4px', color: '#eab308', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⭐ Specijalni Zahtevi</div>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.specialRequests}</p>
                                                        </div>
                                                    )}

                                                    {/* Contract Notes */}
                                                    {dossier.notes.contract && (
                                                        <div style={{ padding: '12px 14px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid var(--accent)', borderRadius: '8px' }}>
                                                            <div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--accent)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📝 Napomena za Ugovor</div>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.contract}</p>
                                                        </div>
                                                    )}

                                                    {/* Voucher Notes */}
                                                    {dossier.notes.voucher && (
                                                        <div style={{ padding: '12px 14px', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid #10b981', borderRadius: '8px' }}>
                                                            <div style={{ fontWeight: 700, marginBottom: '4px', color: '#10b981', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎫 Napomena za Vaučer</div>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.voucher}</p>
                                                        </div>
                                                    )}

                                                    {/* Trip Item Notes */}
                                                    {dossier.tripItems.filter(item => item.notes).map((item) => (
                                                        <div key={item.id} style={{ padding: '12px 14px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid #ef4444', borderRadius: '8px' }}>
                                                            <div style={{ fontWeight: 700, marginBottom: '4px', color: '#ef4444', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚠️ {item.subject}</div>
                                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{item.notes}</p>
                                                        </div>
                                                    ))}

                                                    {/* No Notes Message */}
                                                    {!dossier.notes.general && !dossier.notes.internal && !dossier.notes.financial && !dossier.notes.specialRequests && !dossier.notes.contract && !dossier.notes.voucher && !dossier.tripItems.some(item => item.notes) && (
                                                        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic' }}>
                                                            Nema dodatnih napomena.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 5. FINANSIJSKI PREGLED - COMPACT & BALANCED */}
                                        <div className="summary-card finance-final-card" style={{
                                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))',
                                            borderRadius: '16px',
                                            padding: '24px 32px',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '20px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Status Rezervacije</div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ padding: '6px 16px', background: 'var(--accent)', borderRadius: '20px', fontWeight: 800, fontSize: '14px', color: 'white' }}>
                                                            {dossier.status.toUpperCase()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Ukupna Vrednost Dosijea</div>
                                                    <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>{totalBrutto.toFixed(2)} <span style={{ fontSize: '18px', fontWeight: 700 }}>{dossier.finance.currency}</span></div>
                                                </div>
                                            </div>

                                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)' }}></div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700, letterSpacing: '1px' }}>Dosad uplaćeno</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>{totalPaid.toFixed(2)} {dossier.finance.currency}</div>
                                                    <div style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>{((totalPaid / totalBrutto) * 100).toFixed(1)}% od ukupne sume</div>
                                                </div>
                                                <div style={{
                                                    background: balance > 0.01 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                    padding: '16px 20px',
                                                    borderRadius: '12px',
                                                    border: `1px solid ${balance > 0.01 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                                }}>
                                                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700, letterSpacing: '1px' }}>Preostalo (SALDO)</div>
                                                    <div style={{ fontSize: '20px', fontWeight: 900, color: balance > 0.01 ? '#ef4444' : '#10b981' }}>{balance.toFixed(2)} {dossier.finance.currency}</div>
                                                    <div style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                                        {balance > 0.01 ? `${((balance / totalBrutto) * 100).toFixed(1)}% preostalo za naplatu` : 'DOSIJE JE U CELOSTI ISPLAĆEN'}
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ textAlign: 'center', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '8px', fontStyle: 'italic' }}>
                                                * Ovaj dokument je informativnog karaktera. Sva plaćanja se vrše u skladu sa Opštim uslovima putovanja.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* SECTION 1: CUSTOMER & PASSENGERS */}
                        {activeSection === 'parties' && (
                            <section className="res-section fade-in">
                                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '20px' }}><Users size={20} color="var(--accent)" style={{ marginRight: '10px' }} /> Svi Putnici</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Podaci o ugovaraču (nalagodavcu) i svim učesnicima putovanja</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <button
                                            className="btn-notepad-toggle"
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                background: isPartiesNotepadView ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                                                color: isPartiesNotepadView ? 'white' : 'var(--text-secondary)',
                                                border: '1px solid var(--border)',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                            onClick={() => setIsPartiesNotepadView(!isPartiesNotepadView)}
                                        >
                                            <FileText size={14} /> {isPartiesNotepadView ? 'Zatvori Notepad' : 'Notepad Pregled'}
                                        </button>
                                        <div className="type-toggle">
                                            <button className={dossier.customerType === 'B2C-Individual' ? 'selected' : ''} disabled={isSubagent} onClick={() => { setDossier({ ...dossier, customerType: 'B2C-Individual' }); addLog('Tip Klijenta', 'Tip klijenta promenjen u "Individualni".', 'info'); }}>Individualni</button>
                                            <button className={dossier.customerType === 'B2B-Subagent' ? 'selected' : ''} disabled={isSubagent} onClick={() => { setDossier({ ...dossier, customerType: 'B2B-Subagent' }); addLog('Tip Klijenta', 'Tip klijenta promenjen u "Subagent".', 'info'); }}>Subagent</button>
                                            <button className={dossier.customerType === 'B2C-Legal' ? 'selected' : ''} disabled={isSubagent} onClick={() => { setDossier({ ...dossier, customerType: 'B2C-Legal' }); addLog('Tip Klijenta', 'Tip klijenta promenjen u "Pravno Lice".', 'info'); }}>Pravno Lice</button>
                                        </div>
                                    </div>
                                </div>

                                {isPartiesNotepadView ? (
                                    <div className="notepad-container" style={{
                                        background: '#1e293b',
                                        padding: '30px',
                                        borderRadius: '16px',
                                        border: '1px solid var(--border)',
                                        fontFamily: 'monospace',
                                        color: '#cbd5e1',
                                        lineHeight: '1.6',
                                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
                                        position: 'relative',
                                        marginBottom: '30px'
                                    }}>
                                        <div className="notepad-actions" style={{
                                            position: 'absolute',
                                            top: '20px',
                                            right: '25px',
                                            display: 'flex',
                                            gap: '8px'
                                        }}>
                                            <button
                                                onClick={copyPartiesToClipboard}
                                                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Copy size={14} /> Kopiraj
                                            </button>
                                            <button
                                                onClick={sharePartiesToEmail}
                                                style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Mail size={14} /> Email
                                            </button>
                                            <button
                                                onClick={handlePrint}
                                                style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Printer size={14} /> Štampaj
                                            </button>
                                            <button
                                                onClick={sharePartiesGeneric}
                                                style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <Share2 size={14} /> Viber/Wapp/Insta
                                            </button>
                                        </div>

                                        <div style={{ borderBottom: '1px dashed #475569', marginBottom: '20px', paddingBottom: '10px' }}>
                                            <h4 style={{ margin: 0, color: 'var(--accent)' }}>--- PUTNICI I UGOVARAČ / DOSSIER {dossier.cisCode} ---</h4>
                                        </div>
                                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                            {getPartiesNotepadText()}
                                        </pre>
                                    </div>
                                ) : (
                                    <>

                                        <div className="info-group main-booker-card">
                                            <div className="booker-header-row">
                                                <label>Ugovarač (Nalagodavac)</label>
                                                <button className="copy-to-all-btn" onClick={copyBookerToPassengers}>
                                                    <ArrowRightLeft size={12} /> Kopiraj podatke na sve putnike
                                                </button>
                                            </div>

                                            <div className="grid-v4">
                                                {dossier.customerType !== 'B2C-Individual' && (
                                                    <div className="input-field">
                                                        <label>{dossier.customerType === 'B2B-Subagent' ? 'Naziv Subagenta' : 'Naziv Firme'}</label>
                                                        <div style={{ position: 'relative' }}>
                                                            <input
                                                                value={dossier.booker.companyName}
                                                                onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, companyName: e.target.value } })}
                                                                placeholder={dossier.customerType === 'B2B-Subagent' ? 'Pretraži bazu subagenata...' : 'Naziv kompanije...'}
                                                                style={{ paddingRight: '40px' }}
                                                            />
                                                            <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="input-field">
                                                    <label>{getBookerLabel()}</label>
                                                    <input
                                                        value={dossier.booker.fullName}
                                                        onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, fullName: e.target.value } })}
                                                        placeholder="Unesite ime i prezime osobe"
                                                    />
                                                </div>
                                                <div className="input-field">
                                                    <label>Adresa</label>
                                                    <input
                                                        value={dossier.booker.address}
                                                        onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, address: e.target.value } })}
                                                        placeholder="Zmaj Jovina 1"
                                                    />
                                                </div>
                                                <div className="input-field">
                                                    <label>Grad</label>
                                                    <input
                                                        value={dossier.booker.city}
                                                        onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, city: e.target.value } })}
                                                        placeholder="Beograd"
                                                    />
                                                </div>
                                                <div className="input-field">
                                                    <label>Država</label>
                                                    <select
                                                        value={dossier.booker.country || 'Srbija'}
                                                        onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, country: e.target.value } })}
                                                    >
                                                        {NATIONALITIES.map(n => (
                                                            <option key={n.code} value={n.name}>{n.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="input-field">
                                                    <label>Email</label>
                                                    <input
                                                        value={dossier.booker.email}
                                                        onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, email: e.target.value } })}
                                                    />
                                                </div>
                                                <div className="input-field">
                                                    <label>Telefon</label>
                                                    <input
                                                        value={dossier.booker.phone}
                                                        onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, phone: e.target.value } })}
                                                        placeholder="+381..."
                                                    />
                                                </div>
                                                <div className="input-field">
                                                    <label>Jezik Dokumentacije</label>
                                                    <div className="language-selector-pills" style={{
                                                        display: 'flex',
                                                        gap: '8px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        padding: '4px',
                                                        borderRadius: '10px'
                                                    }}>
                                                        <button
                                                            className={`lang-pill ${dossier.language === 'Srpski' ? 'active' : ''}`}
                                                            style={{
                                                                flex: 1,
                                                                padding: '8px',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                fontSize: '11px',
                                                                fontWeight: 800,
                                                                transition: 'all 0.2s',
                                                                background: dossier.language === 'Srpski' ? 'var(--accent)' : 'transparent',
                                                                color: dossier.language === 'Srpski' ? 'white' : 'var(--text-secondary)'
                                                            }}
                                                            onClick={() => setDossier({ ...dossier, language: 'Srpski' })}
                                                        >
                                                            SRPSKI
                                                        </button>
                                                        <button
                                                            className={`lang-pill ${dossier.language === 'Engleski' ? 'active' : ''}`}
                                                            style={{
                                                                flex: 1,
                                                                padding: '8px',
                                                                borderRadius: '8px',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                fontSize: '11px',
                                                                fontWeight: 800,
                                                                transition: 'all 0.2s',
                                                                background: dossier.language === 'Engleski' ? 'var(--accent)' : 'transparent',
                                                                color: dossier.language === 'Engleski' ? 'white' : 'var(--text-secondary)'
                                                            }}
                                                            onClick={() => setDossier({ ...dossier, language: 'Engleski' })}
                                                        >
                                                            ENGLISH
                                                        </button>
                                                    </div>
                                                </div>
                                                {dossier.customerType !== 'B2C-Individual' && (
                                                    <div className="input-field">
                                                        <label>PIB / MB (Srpske Kompanije)</label>
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <input
                                                                value={dossier.booker.companyPib}
                                                                placeholder="Unesite PIB za auto-popunjavanje..."
                                                                onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, companyPib: e.target.value } })}
                                                            />
                                                            <button
                                                                className="btn-sync-cis"
                                                                style={{ width: 'auto', padding: '0 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                                                                onClick={() => {
                                                                    if (!dossier.booker.companyPib) return alert('Molimo unesite PIB');
                                                                    addLog('APR Pretraga', `Pokrenuta pretraga za PIB: ${dossier.booker.companyPib}`, 'info');
                                                                    // Mocking company fetch
                                                                    setTimeout(() => {
                                                                        setDossier({
                                                                            ...dossier,
                                                                            booker: {
                                                                                ...dossier.booker,
                                                                                companyName: 'OLYMPIC DEVELOPMENT DOO',
                                                                                address: 'Bulevar Despota Stefana 12',
                                                                                city: 'Beograd',
                                                                                country: 'Srbija'
                                                                            }
                                                                        });
                                                                        setShowSaveClientBtn(true);
                                                                        addLog('APR Uspeh', 'Podaci o firmi uspešno povučeni sa APR-a.', 'success');
                                                                    }, 800);
                                                                }}
                                                            >
                                                                <Zap size={14} /> APR Provera
                                                            </button>
                                                            {showSaveClientBtn && (
                                                                <button
                                                                    className="btn-sync-cis"
                                                                    style={{
                                                                        width: 'auto',
                                                                        padding: '0 12px',
                                                                        fontSize: '11px',
                                                                        whiteSpace: 'nowrap',
                                                                        background: '#10b981',
                                                                        borderColor: '#059669',
                                                                        color: 'white'
                                                                    }}
                                                                    onClick={handleSaveToClients}
                                                                >
                                                                    <Save size={14} /> Sačuvaj Klijenta
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="passengers-list">
                                            <div className="list-header">
                                                <h4>Svi putnici na ugovoru</h4>
                                                <button className="add-btn" onClick={addPassenger}><UserPlus size={14} /> Dodaj putnika</button>
                                            </div>
                                            <table className="pax-table-v4">
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: '40px' }}></th>
                                                        <th>Ime</th>
                                                        <th>Prezime</th>
                                                        <th>ID / Pasoš</th>
                                                        <th>Datum Rođenja</th>
                                                        <th>Tip</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dossier.passengers.map((pax, pIdx) => (
                                                        <React.Fragment key={pax.id}>
                                                            <tr>
                                                                <td>
                                                                    <button
                                                                        className={`expand-pax-btn ${expandedPassengers.includes(pax.id) ? 'expanded' : ''}`}
                                                                        onClick={() => togglePassengerExpand(pax.id)}
                                                                    >
                                                                        <Plus size={14} />
                                                                    </button>
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        value={pax.firstName}
                                                                        onChange={e => {
                                                                            const next = [...dossier.passengers];
                                                                            next[pIdx].firstName = e.target.value;
                                                                            setDossier({ ...dossier, passengers: next });
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        value={pax.lastName}
                                                                        onChange={e => {
                                                                            const next = [...dossier.passengers];
                                                                            next[pIdx].lastName = e.target.value;
                                                                            setDossier({ ...dossier, passengers: next });
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        value={pax.idNumber}
                                                                        onChange={e => {
                                                                            const next = [...dossier.passengers];
                                                                            next[pIdx].idNumber = e.target.value;
                                                                            setDossier({ ...dossier, passengers: next });
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <input
                                                                        type="date"
                                                                        value={pax.birthDate}
                                                                        onChange={e => {
                                                                            const next = [...dossier.passengers];
                                                                            next[pIdx].birthDate = e.target.value;
                                                                            setDossier({ ...dossier, passengers: next });
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td>
                                                                    <select
                                                                        value={pax.type}
                                                                        onChange={e => {
                                                                            const next = [...dossier.passengers];
                                                                            next[pIdx].type = e.target.value as any;
                                                                            setDossier({ ...dossier, passengers: next });
                                                                        }}
                                                                    >
                                                                        <option value="Adult" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Odrasli</option>
                                                                        <option value="Child" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Dete</option>
                                                                        <option value="Infant" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>Beba</option>
                                                                    </select>
                                                                </td>
                                                                <td><button className="del-btn-v4" onClick={() => removePassenger(pax.id)}><Trash2 size={14} /></button></td>
                                                            </tr>
                                                            {expandedPassengers.includes(pax.id) && (
                                                                <tr className="pax-extra-info-row fade-in">
                                                                    <td colSpan={1}></td>
                                                                    <td colSpan={6}>
                                                                        <div className="pax-extra-fields" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                                                            <div className="extra-field-group">
                                                                                <label>Adresa</label>
                                                                                <input
                                                                                    value={pax.address || ''}
                                                                                    placeholder="Unesite adresu..."
                                                                                    onChange={e => {
                                                                                        const next = [...dossier.passengers];
                                                                                        next[pIdx].address = e.target.value;
                                                                                        setDossier({ ...dossier, passengers: next });
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="extra-field-group">
                                                                                <label>Grad</label>
                                                                                <input
                                                                                    value={pax.city || ''}
                                                                                    placeholder="Unesite grad..."
                                                                                    onChange={e => {
                                                                                        const next = [...dossier.passengers];
                                                                                        next[pIdx].city = e.target.value;
                                                                                        setDossier({ ...dossier, passengers: next });
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="extra-field-group">
                                                                                <label>Država</label>
                                                                                <select
                                                                                    value={pax.country || 'Srbija'}
                                                                                    onChange={e => {
                                                                                        const next = [...dossier.passengers];
                                                                                        next[pIdx].country = e.target.value;
                                                                                        setDossier({ ...dossier, passengers: next });
                                                                                    }}
                                                                                >
                                                                                    {NATIONALITIES.map(n => (
                                                                                        <option key={n.code} value={n.name}>{n.name}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </div>
                                                                            <div className="extra-field-group">
                                                                                <label>Telefon</label>
                                                                                <input
                                                                                    value={pax.phone || ''}
                                                                                    placeholder="+381..."
                                                                                    onChange={e => {
                                                                                        const next = [...dossier.passengers];
                                                                                        next[pIdx].phone = e.target.value;
                                                                                        setDossier({ ...dossier, passengers: next });
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                            <div className="extra-field-group">
                                                                                <label>Email</label>
                                                                                <input
                                                                                    value={pax.email || ''}
                                                                                    placeholder="email@example.com"
                                                                                    onChange={e => {
                                                                                        const next = [...dossier.passengers];
                                                                                        next[pIdx].email = e.target.value;
                                                                                        setDossier({ ...dossier, passengers: next });
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>

                                        </div>
                                    </>
                                )}
                            </section>
                        )}

                        {/* SECTION 2: TRIP ITEMS (Stavke Rezervacije) */}
                        {activeSection === 'trip' && (
                            <section className="res-section fade-in">
                                <div className="section-title">
                                    <h3>Stavke Rezervacije</h3>
                                    <button
                                        className="btn-notepad-toggle"
                                        style={{
                                            marginLeft: 'auto',
                                            marginRight: '12px',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            background: isNotepadView ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                                            color: isNotepadView ? 'white' : 'var(--text-secondary)',
                                            border: '1px solid var(--border)',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        onClick={() => setIsNotepadView(!isNotepadView)}
                                    >
                                        <FileText size={14} /> {isNotepadView ? 'Zatvori Notepad' : 'Notepad Pregled'}
                                    </button>
                                    <button
                                        className="btn-copy-pax"
                                        style={{
                                            marginRight: '20px',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            background: 'rgba(56, 189, 248, 0.1)',
                                            color: '#38bdf8',
                                            border: '1px solid rgba(56, 189, 248, 0.2)',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}
                                        onClick={copyAllPassengersToAllItems}
                                    >
                                        <Users size={14} /> Kopiraj putnike
                                    </button>
                                    <div className="add-item-bar">
                                        <span>Dodaj:</span>
                                        <button onClick={() => addTripItem('Smestaj')}><Building2 size={12} /> Smeštaj</button>
                                        <button onClick={() => addTripItem('Avio karte')}><Plane size={12} /> Avio</button>
                                        <button onClick={() => addTripItem('Čarter')}><Zap size={12} /> Čarter</button>
                                        <button onClick={() => addTripItem('Bus')}><Compass size={12} /> Bus</button>
                                        <button onClick={() => addTripItem('Krstarenje')}><Ship size={12} /> Krstarenje</button>
                                        <button onClick={() => addTripItem('Dinamicki paket')}><PackageIcon size={12} /> Paket</button>
                                        <button onClick={() => addTripItem('Putovanja')}><Globe size={12} /> Putovanje</button>
                                        <button onClick={() => addTripItem('Transfer')}><Truck size={12} /> Transfer</button>
                                    </div>
                                </div>

                                <div className="trip-items-grid">
                                    {isNotepadView ? (
                                        <div className="notepad-container" style={{
                                            background: '#1e293b',
                                            padding: '30px',
                                            borderRadius: '16px',
                                            border: '1px solid var(--border)',
                                            fontFamily: 'monospace',
                                            color: '#cbd5e1',
                                            lineHeight: '1.6',
                                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
                                            position: 'relative'
                                        }}>
                                            <div className="notepad-actions" style={{
                                                position: 'absolute',
                                                top: '20px',
                                                right: '25px',
                                                display: 'flex',
                                                gap: '8px'
                                            }}>
                                                <button
                                                    onClick={copyToClipboard}
                                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Copy size={14} /> Kopiraj
                                                </button>
                                                <button
                                                    onClick={shareToEmail}
                                                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Mail size={14} /> Email
                                                </button>
                                                <button
                                                    onClick={shareGeneric}
                                                    style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Share2 size={14} /> Viber/Wapp/Insta
                                                </button>
                                            </div>

                                            <div style={{ borderBottom: '1px dashed #475569', marginBottom: '20px', paddingBottom: '10px' }}>
                                                <h4 style={{ margin: 0, color: 'var(--accent)' }}>--- PLAN PUTOVANJA / DOSSIER {dossier.cisCode} ---</h4>
                                            </div>
                                            {dossier.tripItems.map((item, i) => (
                                                <div key={item.id} style={{ marginBottom: '24px' }}>
                                                    <div style={{ color: '#fff', fontWeight: 'bold' }}>
                                                        {i + 1}. {item.type.toUpperCase()}: {item.subject} ({item.supplier})
                                                    </div>
                                                    <div style={{ paddingLeft: '20px' }}>
                                                        &gt; DATUM: {formatDate(item.checkIn)} DO {formatDate(item.checkOut)} <br />
                                                        &gt; LOKACIJA: {item.city}, {item.country} <br />
                                                        &gt; USLUGA: {item.mealPlan || 'N/A'} - {item.details || 'N/A'} <br />
                                                        &gt; PUTNICI: {item.passengers?.map(p => `${p.firstName} ${p.lastName}`).join(', ') || 'Nema dodeljenih putnika'}
                                                    </div>
                                                </div>
                                            ))}
                                            <div style={{ borderTop: '1px dashed #475569', marginTop: '20px', paddingTop: '10px', fontSize: '0.9em' }}>
                                                UKUPNO ZA NAPLATU: {totalBrutto.toFixed(2)} {dossier.finance.currency}
                                            </div>
                                        </div>
                                    ) : (
                                        dossier.tripItems.map((item, idx) => (
                                            <div key={item.id} className="trip-item-card">
                                                <div className="item-header" style={{ marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div className="type-tag" style={{ background: (item.type === 'Smestaj' || item.type === 'Krstarenje') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)', color: (item.type === 'Smestaj' || item.type === 'Krstarenje') ? '#10b981' : '#38bdf8', padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                                                            {item.type === 'Smestaj' && <Building2 size={16} />}
                                                            {item.type === 'Avio karte' && <Plane size={16} />}
                                                            {item.type === 'Čarter' && <Zap size={16} />}
                                                            {item.type === 'Bus' && <Compass size={16} />}
                                                            {item.type === 'Krstarenje' && <Ship size={16} />}
                                                            {item.type === 'Transfer' && <Truck size={16} />}
                                                            {item.type === 'Putovanja' && <Globe size={16} />}
                                                            {item.type === 'Dinamicki paket' && <ArrowRightLeft size={16} />}

                                                            <select
                                                                value={item.type}
                                                                onChange={(e) => {
                                                                    const newType = e.target.value as TripType;
                                                                    setDossier(prev => ({
                                                                        ...prev,
                                                                        tripItems: prev.tripItems.map(ti => {
                                                                            if (ti.id === item.id) {
                                                                                const updates: Partial<TripItem> = { type: newType };
                                                                                // Initialize/Clear flightLegs
                                                                                if (newType === 'Avio karte') {
                                                                                    if (!ti.flightLegs) updates.flightLegs = [];
                                                                                } else {
                                                                                    updates.flightLegs = undefined; // Clean up
                                                                                }
                                                                                return { ...ti, ...updates };
                                                                            }
                                                                            return ti;
                                                                        })
                                                                    }));
                                                                }}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: 'inherit',
                                                                    fontWeight: 800,
                                                                    fontSize: '11px',
                                                                    textTransform: 'uppercase',
                                                                    cursor: 'pointer',
                                                                    marginLeft: '4px',
                                                                    appearance: 'none',
                                                                    WebkitAppearance: 'none',
                                                                    outline: 'none',
                                                                    minWidth: '80px', // Ensure clickable area
                                                                    zIndex: 10
                                                                }}
                                                            >
                                                                <option value="Smestaj" style={{ color: '#333' }}>SMEŠTAJ</option>
                                                                <option value="Avio karte" style={{ color: '#333' }}>AVIO KARTE</option>
                                                                <option value="Čarter" style={{ color: '#333' }}>ČARTER</option>
                                                                <option value="Bus" style={{ color: '#333' }}>BUS</option>
                                                                <option value="Krstarenje" style={{ color: '#333' }}>KRSTARENJE</option>
                                                                <option value="Dinamicki paket" style={{ color: '#333' }}>PAKET</option>
                                                                <option value="Putovanja" style={{ color: '#333' }}>PUTOVANJE</option>
                                                                <option value="Transfer" style={{ color: '#333' }}>TRANSFER</option>
                                                            </select>
                                                            <ChevronDown size={10} style={{ marginLeft: 2, opacity: 0.7 }} />
                                                        </div>
                                                        <div className="supplier-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)' }}>DOBAVLJAČ:</span>
                                                            <input
                                                                value={item.supplier}
                                                                placeholder="Npr. OpenGreece"
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: 'var(--accent)',
                                                                    fontWeight: 800,
                                                                    fontSize: '12px',
                                                                    width: '150px',
                                                                    padding: '0'
                                                                }}
                                                                onChange={e => {
                                                                    const newItems = [...dossier.tripItems];
                                                                    newItems[idx].supplier = e.target.value;
                                                                    setDossier({ ...dossier, tripItems: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="supplier-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)' }}>REF BROJ:</span>
                                                            <input
                                                                value={item.supplierRef || ''}
                                                                placeholder="Npr. 123456"
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: '#fbbf24',
                                                                    fontWeight: 800,
                                                                    fontSize: '12px',
                                                                    width: '100px',
                                                                    padding: '0'
                                                                }}
                                                                onChange={e => {
                                                                    const newItems = [...dossier.tripItems];
                                                                    newItems[idx].supplierRef = e.target.value;
                                                                    setDossier({ ...dossier, tripItems: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="supplier-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '4px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <span style={{ fontSize: '10px', fontWeight: 800, color: item.supplierPaymentDeadline && new Date(item.supplierPaymentDeadline) < new Date() ? '#ef4444' : '#fbbf24' }}>ROK PLAĆANJA:</span>
                                                            <input
                                                                type="date"
                                                                value={item.supplierPaymentDeadline || ''}
                                                                style={{
                                                                    background: 'transparent',
                                                                    border: 'none',
                                                                    color: item.supplierPaymentDeadline && new Date(item.supplierPaymentDeadline) < new Date() ? '#ef4444' : '#fbbf24',
                                                                    fontWeight: 800,
                                                                    fontSize: '11px',
                                                                    width: '110px',
                                                                    padding: '0',
                                                                    fontFamily: 'monospace',
                                                                    colorScheme: 'dark'
                                                                }}
                                                                onChange={e => {
                                                                    const newItems = [...dossier.tripItems];
                                                                    newItems[idx].supplierPaymentDeadline = e.target.value;
                                                                    setDossier({ ...dossier, tripItems: newItems });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <button className="del-btn-v4" onClick={() => removeTripItem(item.id)}><Trash2 size={14} /></button>
                                                </div>

                                                {/* CONDITIONAL FORM RENDERING */}
                                                {item.type === 'Avio karte' ? (
                                                    <div className="flight-itinerary-form">
                                                        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '13px' }}>Plan Leta (Itinerer)</h4>
                                                            <button
                                                                onClick={() => addFlightLeg(item.id)}
                                                                style={{
                                                                    background: 'rgba(56, 189, 248, 0.1)',
                                                                    color: '#38bdf8',
                                                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                                                    padding: '6px 12px',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '11px',
                                                                    fontWeight: 700,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px'
                                                                }}
                                                            >
                                                                <Plus size={14} /> Dodaj Let
                                                            </button>
                                                        </div>

                                                        {(!item.flightLegs || item.flightLegs.length === 0) && (
                                                            <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed var(--border)', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                                Nema unetih letova. Kliknite na "Dodaj Let" da definišete itinerer.
                                                            </div>
                                                        )}

                                                        {(item.flightLegs || []).map((leg, legIdx) => (
                                                            <div key={leg.id} className="flight-leg-card" style={{
                                                                background: 'rgba(255,255,255,0.03)',
                                                                border: '1px solid var(--border)',
                                                                borderRadius: '8px',
                                                                padding: '12px',
                                                                marginBottom: '12px',
                                                                position: 'relative'
                                                            }}>
                                                                <button
                                                                    onClick={() => removeFlightLeg(item.id, leg.id)}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '8px',
                                                                        right: '8px',
                                                                        background: 'transparent',
                                                                        border: 'none',
                                                                        color: '#ef4444',
                                                                        cursor: 'pointer',
                                                                        opacity: 0.7
                                                                    }}
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                                                    Let #{legIdx + 1}
                                                                </div>

                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                                    <div className="input-group-premium">
                                                                        <label>Avio Kompanija</label>
                                                                        <input
                                                                            value={leg.airline}
                                                                            onChange={e => updateFlightLeg(item.id, leg.id, 'airline', e.target.value)}
                                                                            placeholder="Npr. Air Serbia"
                                                                        />
                                                                    </div>
                                                                    <div className="input-group-premium">
                                                                        <label>Broj Leta</label>
                                                                        <input
                                                                            value={leg.flightNumber}
                                                                            onChange={e => updateFlightLeg(item.id, leg.id, 'flightNumber', e.target.value)}
                                                                            placeholder="JU 100"
                                                                        />
                                                                    </div>
                                                                    <div className="input-group-premium">
                                                                        <label>Klasa / Prtljag</label>
                                                                        <input
                                                                            value={leg.class}
                                                                            onChange={e => updateFlightLeg(item.id, leg.id, 'class', e.target.value)}
                                                                            placeholder="Economy / 23kg"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '8px', alignItems: 'center' }}>
                                                                    {/* Departure */}
                                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                                                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>POLAZAK</div>
                                                                        <input
                                                                            value={leg.depAirport}
                                                                            onChange={e => updateFlightLeg(item.id, leg.id, 'depAirport', e.target.value)}
                                                                            placeholder="Aerodrom (BEG)"
                                                                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}
                                                                        />
                                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                                            <input
                                                                                type="date"
                                                                                value={leg.depDate}
                                                                                onChange={e => updateFlightLeg(item.id, leg.id, 'depDate', e.target.value)}
                                                                                style={{ flex: 2, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '11px', borderRadius: '4px', padding: '2px' }}
                                                                            />
                                                                            <input
                                                                                type="time"
                                                                                value={leg.depTime}
                                                                                onChange={e => updateFlightLeg(item.id, leg.id, 'depTime', e.target.value)}
                                                                                style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '11px', borderRadius: '4px', padding: '2px' }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div style={{ height: '80%', background: 'var(--border)' }}></div>

                                                                    {/* Arrival */}
                                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px' }}>
                                                                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px' }}>DOLAZAK</div>
                                                                        <input
                                                                            value={leg.arrAirport}
                                                                            onChange={e => updateFlightLeg(item.id, leg.id, 'arrAirport', e.target.value)}
                                                                            placeholder="Aerodrom (LHR)"
                                                                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}
                                                                        />
                                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                                            <input
                                                                                type="date"
                                                                                value={leg.arrDate}
                                                                                onChange={e => updateFlightLeg(item.id, leg.id, 'arrDate', e.target.value)}
                                                                                style={{ flex: 2, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '11px', borderRadius: '4px', padding: '2px' }}
                                                                            />
                                                                            <input
                                                                                type="time"
                                                                                value={leg.arrTime}
                                                                                onChange={e => updateFlightLeg(item.id, leg.id, 'arrTime', e.target.value)}
                                                                                style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', fontSize: '11px', borderRadius: '4px', padding: '2px' }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="item-row-v4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                                            <div className="input-group-premium modern-date-wrapper" onClick={() => setActiveCalendar({ id: item.id, type: 'checkIn' })}>
                                                                <label><MoveRight size={14} /> Datum Od</label>
                                                                <div className="custom-date-display">
                                                                    <Calendar size={16} />
                                                                    <span>{formatDate(item.checkIn) || 'Odaberite datum'}</span>
                                                                </div>
                                                            </div>

                                                            <div className="input-group-premium modern-date-wrapper" onClick={() => setActiveCalendar({ id: item.id, type: 'checkOut' })}>
                                                                <label><MoveLeft size={14} /> Datum Do</label>
                                                                <div className="custom-date-display">
                                                                    <Calendar size={16} />
                                                                    <span>{formatDate(item.checkOut) || 'Odaberite datum'}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Hotel Info (Name, Stars, City, Country) in ONE ROW */}
                                                        <div className="item-row-v4" style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: '2fr 130px 1fr 1fr',
                                                            gap: '12px',
                                                            marginBottom: '16px',
                                                            alignItems: 'end'
                                                        }}>
                                                            <div className="input-group-v4">
                                                                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    Naziv Hotela / Objekata
                                                                    {item.stars && item.stars > 0 && (
                                                                        <span style={{ color: '#f59e0b', fontSize: '10px' }}>
                                                                            {'⭐'.repeat(Math.round(item.stars))}
                                                                        </span>
                                                                    )}
                                                                </label>
                                                                <input
                                                                    value={item.subject}
                                                                    placeholder="Npr. Panorama Village Hotel"
                                                                    style={{ fontWeight: 800 }}
                                                                    onChange={e => {
                                                                        const next = [...dossier.tripItems];
                                                                        next[idx].subject = e.target.value;
                                                                        setDossier({ ...dossier, tripItems: next });
                                                                    }}
                                                                />
                                                            </div>

                                                            <div className="input-group-v4">
                                                                <label>Kategorija</label>
                                                                <select
                                                                    value={item.stars || 0}
                                                                    style={{
                                                                        background: 'var(--bg-input)',
                                                                        border: '1px solid var(--border)',
                                                                        borderRadius: '8px',
                                                                        padding: '10px',
                                                                        height: '42px',
                                                                        color: 'var(--text-primary)',
                                                                        fontWeight: 700,
                                                                        width: '100%'
                                                                    }}
                                                                    onChange={e => {
                                                                        const next = [...dossier.tripItems];
                                                                        next[idx].stars = parseInt(e.target.value);
                                                                        setDossier({ ...dossier, tripItems: next });
                                                                    }}
                                                                >
                                                                    <option value="0">Bez kat.</option>
                                                                    <option value="1">1*</option>
                                                                    <option value="2">2*</option>
                                                                    <option value="3">3*</option>
                                                                    <option value="4">4*</option>
                                                                    <option value="5">5*</option>
                                                                </select>
                                                            </div>

                                                            <div className="input-group-v4">
                                                                <label>Mesto</label>
                                                                <input value={item.city || ''} placeholder="Npr. Tasos" onChange={e => {
                                                                    const next = [...dossier.tripItems];
                                                                    next[idx].city = e.target.value;
                                                                    setDossier({ ...dossier, tripItems: next });
                                                                }} />
                                                            </div>

                                                            <div className="input-group-v4">
                                                                <label>Država</label>
                                                                <input value={item.country || ''} placeholder="Npr. Grčka" onChange={e => {
                                                                    const next = [...dossier.tripItems];
                                                                    next[idx].country = e.target.value;
                                                                    setDossier({ ...dossier, tripItems: next });
                                                                }} />
                                                            </div>
                                                        </div>

                                                        {/* Row 3: Accommodation Details */}
                                                        <div className="item-row-v4" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '16px' }}>
                                                            <div className="input-group-v4">
                                                                <label>Tip Objekta</label>
                                                                <input
                                                                    value={item.accomType || ''}
                                                                    placeholder="Npr. Hotel, Apartman..."
                                                                    onChange={e => {
                                                                        const next = [...dossier.tripItems];
                                                                        next[idx].accomType = e.target.value;
                                                                        setDossier({ ...dossier, tripItems: next });
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="input-group-v4">
                                                                <label>Tip Sobe / Smeštaja (Pogled, Sprat...)</label>
                                                                <input
                                                                    value={item.details}
                                                                    placeholder="Npr. Standard soba, Pogled more"
                                                                    onChange={e => {
                                                                        const newItems = [...dossier.tripItems];
                                                                        newItems[idx].details = e.target.value;
                                                                        setDossier({ ...dossier, tripItems: newItems });
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Row 4: Service & Notes */}
                                                        <div className="item-row-v4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                                            <div className="input-group-v4">
                                                                <label>Vrsta Usluge (Ishrana, Dodatne usluge...)</label>
                                                                <input
                                                                    value={item.mealPlan || ''}
                                                                    placeholder="Npr. Polupansion (HB)"
                                                                    onChange={e => {
                                                                        const next = [...dossier.tripItems];
                                                                        next[idx].mealPlan = e.target.value;
                                                                        setDossier({ ...dossier, tripItems: next });
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="input-group-v4">
                                                                <label>Napomene za ovu stavku</label>
                                                                <input
                                                                    value={item.notes || ''}
                                                                    placeholder="Npr. Kasni check-in, pomoćni ležaj..."
                                                                    onChange={e => {
                                                                        const next = [...dossier.tripItems];
                                                                        next[idx].notes = e.target.value;
                                                                        setDossier({ ...dossier, tripItems: next });
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </>)}

                                                <div className="item-finance-v4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', alignItems: 'stretch', marginBottom: '24px', background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px' }}>
                                                    <div className="input-group-v4" style={{ filter: !canViewFinancials ? 'blur(6px)' : 'none', pointerEvents: !canViewFinancials ? 'none' : 'auto', userSelect: !canViewFinancials ? 'none' : 'auto' }}>
                                                        <label style={{ color: '#94a3b8' }}>Neto ({dossier.finance.currency})</label>
                                                        <input
                                                            type="number"
                                                            value={item.netPrice}
                                                            style={{ borderBottom: '2px solid #ef4444', height: '44px' }}
                                                            onChange={e => {
                                                                const next = [...dossier.tripItems];
                                                                next[idx].netPrice = parseFloat(e.target.value) || 0;
                                                                setDossier({ ...dossier, tripItems: next });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="input-group-v4">
                                                        <label style={{ color: 'var(--accent)' }}>Bruto ({dossier.finance.currency})</label>
                                                        <input
                                                            type="number"
                                                            value={item.bruttoPrice}
                                                            style={{ fontWeight: 800, borderBottom: '2px solid var(--accent)', height: '44px' }}
                                                            onChange={e => {
                                                                const next = [...dossier.tripItems];
                                                                next[idx].bruttoPrice = parseFloat(e.target.value) || 0;
                                                                setDossier({ ...dossier, tripItems: next });
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="input-group-v4" style={{ position: 'relative' }}>
                                                        <div style={{ filter: !canViewFinancials ? 'blur(6px)' : 'none' }}>
                                                            <label style={{ color: '#3b82f6' }}>RAZLIKA (PROFIT)</label>
                                                            <div className="profit-box-v4" style={{
                                                                background: 'rgba(59, 130, 246, 0.05)',
                                                                padding: '0 14px',
                                                                borderRadius: '10px',
                                                                border: '1px solid rgba(59, 130, 246, 0.1)',
                                                                height: '44px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                fontSize: '18px',
                                                                fontWeight: 900,
                                                                color: '#3b82f6'
                                                            }}>
                                                                +{(item.bruttoPrice - item.netPrice).toFixed(2)}
                                                            </div>
                                                        </div>
                                                        {!canViewFinancials && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '10px', fontWeight: 700 }}><Shield size={12} style={{ marginRight: 4 }} /> RESTRICTED</div>}
                                                    </div>

                                                    <div className="input-group-v3" style={{ position: 'relative' }}>
                                                        <div style={{ filter: !canViewFinancials ? 'blur(6px)' : 'none' }}>
                                                            <label style={{ color: '#10b981', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>MARŽA %</label>
                                                            <div className="profit-box-v4" style={{
                                                                background: 'rgba(16, 185, 129, 0.05)',
                                                                padding: '0 14px',
                                                                borderRadius: '10px',
                                                                border: '1px solid rgba(16, 185, 129, 0.1)',
                                                                height: '44px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                fontSize: '18px',
                                                                fontWeight: 900,
                                                                color: '#10b981'
                                                            }}>
                                                                {item.netPrice > 0 ? (((item.bruttoPrice - item.netPrice) / item.netPrice) * 100).toFixed(1) : '0'}%
                                                            </div>
                                                        </div>
                                                        {!canViewFinancials && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '10px', fontWeight: 700 }}><Shield size={12} style={{ marginRight: 4 }} /> RESTRICTED</div>}
                                                    </div>
                                                </div>




                                                {/* Passengers list inside TripItem - One per line */}
                                                {item.passengers && item.passengers.length > 0 && (
                                                    <div className="item-pax-list-v4" style={{ marginTop: '20px', padding: '16px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <h5 style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '1px' }}>
                                                            <Users size={14} /> Spisak putnika za ovu uslugu:
                                                        </h5>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            {item.passengers.map((pax, pIdx) => (
                                                                <div key={pax.id} style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: '40px 2fr 1fr 1fr',
                                                                    alignItems: 'center',
                                                                    padding: '10px 14px',
                                                                    background: 'rgba(255,255,255,0.03)',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                                    fontSize: '12px'
                                                                }}>
                                                                    <span style={{ color: 'var(--text-secondary)', fontWeight: 800 }}>{pIdx + 1}.</span>
                                                                    <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{pax.firstName} {pax.lastName}</span>
                                                                    <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{pax.birthDate ? new Date(pax.birthDate).toLocaleDateString('sr-RS') : '-'}</span>
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                                                                        <span style={{ color: 'var(--text-secondary)', fontSize: '11px', fontFamily: 'monospace' }}>{pax.idNumber || '---'}</span>
                                                                        <button
                                                                            className="btn-pax-remove-from-item"
                                                                            onClick={() => removePassengerFromItem(item.id, pax.id)}
                                                                            style={{
                                                                                background: 'rgba(239, 68, 68, 0.1)',
                                                                                color: '#ef4444',
                                                                                border: 'none',
                                                                                padding: '4px',
                                                                                borderRadius: '4px',
                                                                                cursor: 'pointer',
                                                                                display: 'flex'
                                                                            }}
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Supplier B2B Link & Verification */}
                                                {(item.supplier.toLowerCase().includes('solvex') || item.supplier.toLowerCase().includes('b2b')) && (
                                                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                                        <button
                                                            onClick={async () => {
                                                                const ref = item.supplierRef;
                                                                if (!ref) {
                                                                    alert('Nedostaje REF broj dobavljača za proveru!');
                                                                    return;
                                                                }

                                                                // Visual feedback
                                                                const btn = document.getElementById('solvex-btn-' + item.id);
                                                                if (btn) btn.innerText = 'PROVERAVAM...';

                                                                try {
                                                                    const res = await getSolvexReservation(ref);

                                                                    if (res.success) {
                                                                        const token = getCachedToken();
                                                                        // Try to construct auto-login URL if token exists, else standard URL
                                                                        // Note: ?guid= is a common pattern for Solvex/Megatec, but not guaranteed.
                                                                        const url = token ? `https://incomingnew.solvex.bg/Default.aspx?guid=${token}` : "https://incomingnew.solvex.bg/";

                                                                        if (confirm(`✅ REZERVACIJA PRONAĐENA!\n\nStatus: ${res.data.Status || 'Potvrđeno'}\nBroj: ${res.data.Number || ref}\n\nKliknite OK da otvorite portal.`)) {
                                                                            window.open(url, '_blank');
                                                                        }
                                                                    } else {
                                                                        alert('❌ Rezervacija nije pronađena u Solvex sistemu.\nProverite REF broj ili pokušajte ručno logovanje.');
                                                                        window.open("https://incomingnew.solvex.bg/", '_blank');
                                                                    }
                                                                } catch (e) {
                                                                    console.error(e);
                                                                    alert('Greška pri komunikaciji sa Solvex API-jem.');
                                                                    window.open("https://incomingnew.solvex.bg/", '_blank');
                                                                } finally {
                                                                    if (btn) btn.innerHTML = '<div style="display:flex;flex-direction:column;align-items:flex-start"><span style="fontSize:11px;fontWeight:900;textTransform:uppercase">SOLVEX PROVERA</span><span style="fontSize:9px">KLIKNI ZA STATUS</span></div>';
                                                                }
                                                            }}
                                                            id={'solvex-btn-' + item.id}
                                                            style={{
                                                                background: 'rgba(30, 41, 59, 0.5)',
                                                                border: '1px solid #10b981',
                                                                borderRadius: '8px',
                                                                padding: '8px 20px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                color: '#10b981'
                                                            }}
                                                            className="supplier-link-btn"
                                                        >
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                                <span style={{ fontSize: '11px', fontWeight: 900, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                                    SOLVEX B2B
                                                                </span>
                                                                <span style={{ fontSize: '9px', color: '#10b981', fontWeight: 600 }}>
                                                                    KLIKNI ZA PROVERU STATUSA
                                                                </span>
                                                            </div>
                                                            <ExternalLink size={14} color="#10b981" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        )
                        }

                        {/* SECTION 3: FINANCE (Payments & Receipts) */}
                        {
                            activeSection === 'finance' && (
                                <section className="res-section fade-in">
                                    <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3>Finansijski Dossier & Uplate</h3>
                                        <button
                                            className="btn-notepad-toggle"
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                background: isFinanceNotepadView ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                                                color: isFinanceNotepadView ? 'white' : 'var(--text-secondary)',
                                                border: '1px solid var(--border)',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                            onClick={() => setIsFinanceNotepadView(!isFinanceNotepadView)}
                                        >
                                            <FileText size={14} /> {isFinanceNotepadView ? 'Zatvori Notepad' : 'Notepad Pregled'}
                                        </button>
                                    </div>

                                    {isFinanceNotepadView ? (
                                        <div className="notepad-container" style={{
                                            background: '#1e293b',
                                            padding: '30px',
                                            borderRadius: '16px',
                                            border: '1px solid var(--border)',
                                            fontFamily: 'monospace',
                                            color: '#cbd5e1',
                                            lineHeight: '1.6',
                                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
                                            position: 'relative',
                                            marginBottom: '30px'
                                        }}>
                                            <div className="notepad-actions" style={{
                                                position: 'absolute',
                                                top: '20px',
                                                right: '25px',
                                                display: 'flex',
                                                gap: '8px'
                                            }}>
                                                <button
                                                    onClick={copyFinanceToClipboard}
                                                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Copy size={14} /> Kopiraj
                                                </button>
                                                <button
                                                    onClick={shareFinanceToEmail}
                                                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Mail size={14} /> Email
                                                </button>
                                                <button
                                                    onClick={handlePrint}
                                                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Printer size={14} /> Štampaj
                                                </button>
                                                <button
                                                    onClick={shareFinanceGeneric}
                                                    style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Share2 size={14} /> Viber/Wapp/Insta
                                                </button>
                                            </div>

                                            <div style={{ borderBottom: '1px dashed #475569', marginBottom: '20px', paddingBottom: '10px' }}>
                                                <h4 style={{ margin: 0, color: 'var(--accent)' }}>--- FINANSIJSKI IZVEŠTAJ / DOSSIER {dossier.cisCode} ---</h4>
                                            </div>
                                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                                {getFinanceNotepadText()}
                                            </pre>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="finance-hero-v4">
                                                <div className="hero-box">
                                                    <span>Ukupno (BRUTO)</span>
                                                    <h2>{totalBrutto.toFixed(2)} {dossier.finance.currency}</h2>
                                                </div>
                                                <div className="hero-box success">
                                                    <span>Dosad uplaćeno</span>
                                                    <h2>{totalPaid.toFixed(2)} {dossier.finance.currency}</h2>
                                                </div>
                                                {isAdminMode && (
                                                    <>
                                                        <div className="hero-box net-cost" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                            <span>Neto Zaduženje</span>
                                                            <h2 style={{ color: '#ef4444' }}>{totalNet.toFixed(2)} <small style={{ fontSize: '0.5em', marginLeft: '4px' }}>{dossier.finance.currency}</small></h2>
                                                        </div>
                                                        <div className="hero-box profit" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                            <span>Ukupna Zarada (Iznos)</span>
                                                            <h2 style={{ color: '#10b981' }}>{totalProfit.toFixed(2)} <small style={{ fontSize: '0.5em', marginLeft: '4px' }}>{dossier.finance.currency}</small></h2>
                                                        </div>
                                                        <div className="hero-box margin" style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                                            <span>Marža Dosijea</span>
                                                            <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#31c48d', margin: 0 }}>{profitPercent.toFixed(1)}%</h3>
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div className="payments-log">
                                                <div className="log-header">
                                                    <h4>Evidencija svih uplata</h4>
                                                    <button className="add-btn green" onClick={addPayment}><Plus size={14} /> Nova Uplata</button>
                                                </div>
                                                <table className="payments-table">
                                                    <colgroup>
                                                        <col style={{ width: '16%' }} />
                                                        <col style={{ width: '10%' }} />
                                                        <col style={{ width: '12%' }} />
                                                        <col style={{ width: '14%' }} />
                                                        <col style={{ width: '23%' }} />
                                                        <col style={{ width: '15%' }} />
                                                        <col style={{ width: '10%' }} />
                                                    </colgroup>
                                                    <thead>
                                                        <tr>
                                                            <th>Datum/Vreme</th>
                                                            <th>Iznos</th>
                                                            <th style={{ paddingLeft: '20px' }}>Valuta</th>
                                                            <th>Način</th>
                                                            <th>Ko plaća?</th>
                                                            <th>Reg. Oznaka</th>
                                                            <th style={{ textAlign: 'right' }}>Radnje</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dossier.finance.payments.map((p, pidx) => (
                                                            <React.Fragment key={p.id}>
                                                                <tr className={`${!p.date ? 'unsaved-payment' : ''} ${p.status === 'deleted' ? 'deleted-payment-row' : ''}`}>
                                                                    <td>
                                                                        {p.status === 'deleted' ? (
                                                                            <span className="deleted-tag">OBRISANO</span>
                                                                        ) : p.date ? (
                                                                            <input type="datetime-local" value={p.date} onChange={e => {
                                                                                const next = [...dossier.finance.payments];
                                                                                next[pidx].date = e.target.value;
                                                                                setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                            }} />
                                                                        ) : (
                                                                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Čeka potvrdu...</span>
                                                                        )}
                                                                    </td>
                                                                    <td className={p.status === 'deleted' ? 'strikethrough' : ''}><input
                                                                        className="payment-amount-input"
                                                                        type="number"
                                                                        disabled={p.status === 'deleted'}
                                                                        value={p.amount === 0 && p.status !== 'deleted' ? '' : p.amount}
                                                                        placeholder="0"
                                                                        onChange={e => {
                                                                            const val = e.target.value;
                                                                            const newPayments = [...dossier.finance.payments];
                                                                            newPayments[pidx].amount = val === '' ? ('' as any) : parseFloat(val);
                                                                            // Auto calculate RSD if dossier is in EUR/USD
                                                                            const numVal = parseFloat(val) || 0;
                                                                            if (p.currency !== 'RSD') {
                                                                                newPayments[pidx].amountInRsd = numVal * (p.exchangeRate || 1);
                                                                            } else {
                                                                                newPayments[pidx].amountInRsd = numVal;
                                                                            }
                                                                            setDossier({ ...dossier, finance: { ...dossier.finance, payments: newPayments } });
                                                                        }} /></td>
                                                                    <td>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                            <select value={p.currency} onChange={e => {
                                                                                const curr = e.target.value as any;
                                                                                const rate = NBS_RATES[curr as keyof typeof NBS_RATES] || 1;
                                                                                const newPayments = [...dossier.finance.payments];
                                                                                newPayments[pidx].currency = curr;
                                                                                newPayments[pidx].exchangeRate = rate;
                                                                                newPayments[pidx].amountInRsd = p.amount * rate;
                                                                                setDossier({ ...dossier, finance: { ...dossier.finance, payments: newPayments } });
                                                                            }}>
                                                                                <option value="RSD">RSD</option>
                                                                                <option value="EUR">EUR</option>
                                                                                <option value="USD">USD</option>
                                                                            </select>
                                                                            {p.currency !== 'RSD' && (
                                                                                <span style={{ fontSize: '10px', color: 'var(--accent)' }}>
                                                                                    Kurs: {p.exchangeRate} | {p.amountInRsd?.toFixed(2)} RSD
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <select value={p.method} onChange={e => {
                                                                            const newPayments = [...dossier.finance.payments];
                                                                            newPayments[pidx].method = e.target.value as any;
                                                                            setDossier({ ...dossier, finance: { ...dossier.finance, payments: newPayments } });
                                                                        }}>
                                                                            <option value="Cash">Gotovina</option>
                                                                            <option value="Card">Kartica</option>
                                                                            <option value="Transfer">Preko računa</option>
                                                                            <option value="Check">Čekovi</option>
                                                                        </select>
                                                                    </td>
                                                                    <td>
                                                                        <div className="payer-selection" style={{ minWidth: '150px' }}>
                                                                            <select
                                                                                value={p.isExternalPayer ? 'external' : (p.travelerPayerId || '')}
                                                                                onChange={e => {
                                                                                    const val = e.target.value;
                                                                                    const next = [...dossier.finance.payments];
                                                                                    if (val === 'external') {
                                                                                        next[pidx].isExternalPayer = true;
                                                                                        next[pidx].travelerPayerId = undefined;
                                                                                        if (!next[pidx].payerDetails) {
                                                                                            next[pidx].payerDetails = { fullName: '', phone: '', email: '', address: '', city: '', country: '' };
                                                                                        }
                                                                                    } else {
                                                                                        next[pidx].isExternalPayer = false;
                                                                                        next[pidx].travelerPayerId = val;
                                                                                        const pax = dossier.passengers.find(px => px.id === val);
                                                                                        next[pidx].payerName = pax ? `${pax.firstName} ${pax.lastName}` : '';
                                                                                    }
                                                                                    setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                }}
                                                                            >
                                                                                <option value="">Ko plaća?</option>
                                                                                {dossier.passengers.map(px => (
                                                                                    <option key={px.id} value={px.id}>{px.firstName} {px.lastName} (Putnik)</option>
                                                                                ))}
                                                                                <option value="external">+ Drugo lice (koje ne putuje)</option>
                                                                            </select>
                                                                        </div>
                                                                    </td>
                                                                    <td><input value={p.fiscalReceiptNo || ''} placeholder="Broj fiskalnog" onChange={e => {
                                                                        const newPayments = [...dossier.finance.payments];
                                                                        newPayments[pidx].fiscalReceiptNo = e.target.value;
                                                                        setDossier({ ...dossier, finance: { ...dossier.finance, payments: newPayments } });
                                                                    }} /></td>
                                                                    <td className="actions-cell">
                                                                        <div className="actions-wrapper">
                                                                            {!p.date ? (
                                                                                <button
                                                                                    className="btn-save-mini"
                                                                                    title="Potvrdi i sačuvaj uplatu"
                                                                                    onClick={() => commitPayment(p.id)}
                                                                                >
                                                                                    <Save size={14} /> Potvrdi
                                                                                </button>
                                                                            ) : (
                                                                                <button className="btn-receipt" title="Štampaj" onClick={() => generateDocument('Priznanica')}><Receipt size={14} /></button>
                                                                            )}
                                                                            <button className="del-btn-v4" onClick={() => removePayment(p.id)}><Trash2 size={14} /></button>
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {/* Row for External Payer Details */}
                                                                {p.isExternalPayer && (
                                                                    <tr className="payment-details-row">
                                                                        <td colSpan={7}>
                                                                            <div className="payment-specific-fields" style={{ borderLeft: '4px solid #f97316' }}>
                                                                                <div style={{ gridColumn: '1/-1', fontSize: '11px', fontWeight: 800, color: '#f97316', marginBottom: '-8px' }}>
                                                                                    PODACI O PLATIOCU (Lice koje ne putuje)
                                                                                </div>
                                                                                <div className="extra-field-group">
                                                                                    <label>Ime i Prezime</label>
                                                                                    <input value={p.payerDetails?.fullName || ''} onChange={e => {
                                                                                        const next = [...dossier.finance.payments];
                                                                                        next[pidx].payerDetails!.fullName = e.target.value;
                                                                                        setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                    }} />
                                                                                </div>
                                                                                <div className="extra-field-group">
                                                                                    <label>Telefon</label>
                                                                                    <input value={p.payerDetails?.phone || ''} onChange={e => {
                                                                                        const next = [...dossier.finance.payments];
                                                                                        next[pidx].payerDetails!.phone = e.target.value;
                                                                                        setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                    }} />
                                                                                </div>
                                                                                <div className="extra-field-group">
                                                                                    <label>Email</label>
                                                                                    <input value={p.payerDetails?.email || ''} onChange={e => {
                                                                                        const next = [...dossier.finance.payments];
                                                                                        next[pidx].payerDetails!.email = e.target.value;
                                                                                        setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                    }} />
                                                                                </div>
                                                                                <div className="extra-field-group">
                                                                                    <label>Adresa</label>
                                                                                    <input value={p.payerDetails?.address || ''} onChange={e => {
                                                                                        const next = [...dossier.finance.payments];
                                                                                        next[pidx].payerDetails!.address = e.target.value;
                                                                                        setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                    }} />
                                                                                </div>
                                                                                <div className="extra-field-group">
                                                                                    <label>Grad / Mesto</label>
                                                                                    <input value={p.payerDetails?.city || ''} onChange={e => {
                                                                                        const next = [...dossier.finance.payments];
                                                                                        next[pidx].payerDetails!.city = e.target.value;
                                                                                        setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                    }} />
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}

                                                                {/* Row for conditional fields */}
                                                                {p.method !== 'Cash' && (
                                                                    <tr className="payment-details-row">
                                                                        <td colSpan={7}>
                                                                            <div className="payment-specific-fields">
                                                                                {p.method === 'Card' && (
                                                                                    <>
                                                                                        <div className="extra-field-group">
                                                                                            <label>Vrsta kartice</label>
                                                                                            <select value={p.cardType || ''} onChange={e => {
                                                                                                const next = [...dossier.finance.payments];
                                                                                                next[pidx].cardType = e.target.value as any;
                                                                                                setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                            }}>
                                                                                                <option value="">Odaberi...</option>
                                                                                                <option value="Master">Master</option>
                                                                                                <option value="Visa">Visa</option>
                                                                                                <option value="Dina">Dina</option>
                                                                                                <option value="American">American</option>
                                                                                            </select>
                                                                                        </div>
                                                                                        <div className="extra-field-group">
                                                                                            <label>Banka</label>
                                                                                            <input value={p.bankName || ''} placeholder="Naziv banke..." onChange={e => {
                                                                                                const next = [...dossier.finance.payments];
                                                                                                next[pidx].bankName = e.target.value;
                                                                                                setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                            }} />
                                                                                        </div>
                                                                                        <div className="extra-field-group">
                                                                                            <label>Broj rata</label>
                                                                                            <input type="number" min="1" value={p.installmentsCount || ''} placeholder="Npr. 6" onChange={e => {
                                                                                                const val = e.target.value;
                                                                                                const next = [...dossier.finance.payments];
                                                                                                next[pidx].installmentsCount = val === '' ? ('' as any) : parseInt(val);
                                                                                                setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                            }} />
                                                                                        </div>
                                                                                    </>
                                                                                )}


                                                                                {p.method === 'Transfer' && (
                                                                                    <>
                                                                                        <div className="extra-field-group">
                                                                                            <label>Odabir banke</label>
                                                                                            <input value={p.bankName || ''} placeholder="Naziv banke..." onChange={e => {
                                                                                                const next = [...dossier.finance.payments];
                                                                                                next[pidx].bankName = e.target.value;
                                                                                                setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                            }} />
                                                                                        </div>
                                                                                        <div className="extra-field-group">
                                                                                            <label>Ime i prezime uplatioca</label>
                                                                                            <input value={p.payerName || ''} placeholder="Ko uplaćuje?" onChange={e => {
                                                                                                const next = [...dossier.finance.payments];
                                                                                                next[pidx].payerName = e.target.value;
                                                                                                setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                            }} />
                                                                                        </div>
                                                                                    </>
                                                                                )}

                                                                                {p.method === 'Check' && (
                                                                                    <div className="checks-container">
                                                                                        <div className="checks-header">
                                                                                            <h5><CreditCard size={14} /> Specifikacija Čekova</h5>
                                                                                            <button className="add-btn" onClick={() => addCheckToPayment(p.id)} style={{ padding: '4px 10px', fontSize: '10px' }}>
                                                                                                <Plus size={10} /> Dodaj Ček
                                                                                            </button>
                                                                                        </div>
                                                                                        <table className="checks-sub-table">
                                                                                            <thead>
                                                                                                <tr>
                                                                                                    <th>Broj čeka</th>
                                                                                                    <th>Banka</th>
                                                                                                    <th>Iznos</th>
                                                                                                    <th>Datum realizacije</th>
                                                                                                    <th></th>
                                                                                                </tr>
                                                                                            </thead>
                                                                                            <tbody>
                                                                                                {(p.checks || []).map((check, cidx) => (
                                                                                                    <tr key={check.id}>
                                                                                                        <td><input value={check.checkNumber} onChange={e => {
                                                                                                            const next = [...dossier.finance.payments];
                                                                                                            next[pidx].checks![cidx].checkNumber = e.target.value;
                                                                                                            setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                                        }} /></td>
                                                                                                        <td><input value={check.bank} onChange={e => {
                                                                                                            const next = [...dossier.finance.payments];
                                                                                                            next[pidx].checks![cidx].bank = e.target.value;
                                                                                                            setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                                        }} /></td>
                                                                                                        <td><input type="number" value={check.amount || ''} onChange={e => {
                                                                                                            const val = e.target.value;
                                                                                                            const next = [...dossier.finance.payments];
                                                                                                            next[pidx].checks![cidx].amount = val === '' ? ('' as any) : parseFloat(val);
                                                                                                            setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                                        }} /></td>
                                                                                                        <td><input type="date" value={check.realizationDate} onChange={e => {
                                                                                                            const next = [...dossier.finance.payments];
                                                                                                            next[pidx].checks![cidx].realizationDate = e.target.value;
                                                                                                            setDossier({ ...dossier, finance: { ...dossier.finance, payments: next } });
                                                                                                        }} /></td>
                                                                                                        <td><button className="del-btn-v4" onClick={() => removeCheckFromPayment(p.id, check.id)}><X size={10} /></button></td>
                                                                                                    </tr>
                                                                                                ))}
                                                                                            </tbody>
                                                                                        </table>
                                                                                        <div className="checks-total-bar">
                                                                                            <span>Ukupno čekovima:</span>
                                                                                            <span>{(p.checks || []).reduce((sum, c) => sum + c.amount, 0).toFixed(2)} {p.currency}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        ))}
                                                        {dossier.finance.payments.length === 0 && (
                                                            <tr><td colSpan={7} className="empty">Nema zabeleženih uplata.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </>
                                    )}
                                </section>
                            )}

                        {/* SECTION: NOTES */}
                        {
                            activeSection === 'notes' && (
                                <section className="res-section fade-in">
                                    <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <div>
                                            <h3 style={{ margin: 0 }}><FileText size={20} color="var(--accent)" style={{ marginRight: '10px' }} /> Napomene Rezervacije</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Upravljajte napomenama za putnike, ugovore i internu evidenciju</p>
                                        </div>
                                        <button
                                            className="btn-notepad-toggle"
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                background: isNotesNotepadView ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                                                color: isNotesNotepadView ? 'white' : 'var(--text-secondary)',
                                                border: '1px solid var(--border)',
                                                fontSize: '11px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}
                                            onClick={() => setIsNotesNotepadView(!isNotesNotepadView)}
                                        >
                                            <FileText size={14} /> {isNotesNotepadView ? 'Zatvori Notepad' : 'Notepad Pregled'}
                                        </button>
                                    </div>

                                    {isNotesNotepadView ? (
                                        <div className="notepad-container" style={{
                                            background: '#1e293b',
                                            padding: '30px',
                                            borderRadius: '16px',
                                            border: '1px solid var(--border)',
                                            fontFamily: 'monospace',
                                            color: '#cbd5e1',
                                            lineHeight: '1.6',
                                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
                                            position: 'relative',
                                            marginBottom: '30px'
                                        }}>
                                            <div className="notepad-actions" style={{
                                                position: 'absolute',
                                                top: '20px',
                                                right: '25px',
                                                display: 'flex',
                                                gap: '8px'
                                            }}>
                                                <button
                                                    onClick={copyNotesToClipboard}
                                                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Copy size={14} /> Kopiraj
                                                </button>
                                                <button
                                                    onClick={shareNotesToEmail}
                                                    style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Mail size={14} /> Email
                                                </button>
                                                <button
                                                    onClick={handlePrint}
                                                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Printer size={14} /> Štampaj
                                                </button>
                                                <button
                                                    onClick={shareNotesGeneric}
                                                    style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Share2 size={14} /> Viber/Wapp/Insta
                                                </button>
                                            </div>

                                            <div style={{ borderBottom: '1px dashed #475569', marginBottom: '20px', paddingBottom: '10px' }}>
                                                <h4 style={{ margin: 0, color: 'var(--accent)' }}>--- NAPOMENE / DOSSIER {dossier.cisCode} ---</h4>
                                            </div>
                                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                                {getNotesNotepadText()}
                                            </pre>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="notes-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
                                                {/* General Notes */}
                                                <div className="note-box" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '12px', color: 'var(--accent)' }}>
                                                        <Sparkles size={16} /> Generalna Napomena
                                                    </label>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Napomena uvezena iz forme za pretragu/buking.</p>
                                                    <textarea
                                                        value={dossier.notes.general}
                                                        onChange={(e) => setDossier({ ...dossier, notes: { ...dossier.notes, general: e.target.value } })}
                                                        style={{ width: '100%', minHeight: '120px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', resize: 'vertical' }}
                                                        placeholder="Napomena od putnika..."
                                                    />
                                                </div>

                                                {/* Contract Notes */}
                                                <div className="note-box" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '12px', color: '#10b981' }}>
                                                        <FileText size={16} /> Napomena za Ugovor
                                                    </label>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Ova napomena će biti štampana na Ugovoru o Putovanju.</p>
                                                    <textarea
                                                        value={dossier.notes.contract}
                                                        onChange={(e) => setDossier({ ...dossier, notes: { ...dossier.notes, contract: e.target.value } })}
                                                        style={{ width: '100%', minHeight: '120px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', resize: 'vertical' }}
                                                        placeholder="Tekst koji ide na ugovor..."
                                                    />
                                                </div>

                                                {/* Voucher Notes */}
                                                <div className="note-box" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '12px', color: '#3b82f6' }}>
                                                        <Building2 size={16} /> Napomena za Vaučer
                                                    </label>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Napomena za hotelijera/supplier-a koja izlazi na vaučeru.</p>
                                                    <textarea
                                                        value={dossier.notes.voucher}
                                                        onChange={(e) => setDossier({ ...dossier, notes: { ...dossier.notes, voucher: e.target.value } })}
                                                        style={{ width: '100%', minHeight: '120px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', resize: 'vertical' }}
                                                        placeholder="Napomena za hotel..."
                                                    />
                                                </div>

                                                {/* Internal Notes */}
                                                <div className="note-box" style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '12px', color: '#ef4444' }}>
                                                        <Shield size={16} /> Interna Napomena (Samo Agencija)
                                                    </label>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Poverljiva napomena vidljiva isključivo agentima prodaje.</p>
                                                    <textarea
                                                        value={dossier.notes.internal}
                                                        onChange={(e) => setDossier({ ...dossier, notes: { ...dossier.notes, internal: e.target.value } })}
                                                        style={{ width: '100%', minHeight: '120px', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', color: 'var(--text-primary)', resize: 'vertical' }}
                                                        placeholder="Interni dogovori, upozorenja..."
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </section>
                            )}

                        {/* SECTION 4: LEGAL & INSURANCE */}
                        {
                            activeSection === 'legal' && (
                                <section className="res-section fade-in">
                                    <div className="section-title">
                                        <h3><Scale size={20} color="var(--accent)" style={{ marginRight: '10px' }} /> Prava, Garancije i Obaveze</h3>
                                        <button
                                            className={`btn-notepad-toggle ${isLegalNotepadView ? 'active' : ''}`}
                                            onClick={() => setIsLegalNotepadView(!isLegalNotepadView)}
                                            title="Prebaci na Notepad pregled"
                                        >
                                            <FileText size={16} /> Notepad
                                        </button>
                                    </div>

                                    {isLegalNotepadView ? (
                                        <div className="notepad-container fade-in">
                                            <div className="notepad-header">
                                                <span><FileText size={14} /> NOTEPAD: PRAVA I OBAVEZE</span>
                                                <div className="notepad-actions">
                                                    <button onClick={copyLegalToClipboard} title="Copy to Clipboard"><Copy size={14} /> Copy</button>
                                                    <button onClick={shareLegalToEmail} title="Send via Email"><Mail size={14} /> Email</button>
                                                    <button onClick={() => window.print()} title="Print"><Printer size={14} /> Print</button>
                                                    <button onClick={shareLegalGeneric} title="Share"><Share2 size={14} /> Share</button>
                                                </div>
                                            </div>
                                            <textarea
                                                readOnly
                                                value={getLegalNotepadText()}
                                                className="notepad-area"
                                            />
                                            <div className="notepad-footer">
                                                Formatirano za brzo deljenje putem poruka (Viber, WhatsApp, Email)
                                            </div>
                                        </div>
                                    ) : (
                                        <>

                                            {dossier.insurance.confirmationText && (
                                                <div className="confirmation-consent-box" style={{
                                                    background: 'rgba(59, 130, 246, 0.05)',
                                                    border: '1px solid #3b82f6',
                                                    borderRadius: '12px',
                                                    padding: '20px',
                                                    marginBottom: '24px',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '8px 12px', background: '#3b82f6', color: 'white', fontSize: '10px', fontWeight: 800, borderBottomLeftRadius: '12px' }}>
                                                        SNIMLJENA SAGLASNOST
                                                    </div>
                                                    <h4 style={{ margin: '0 0 10px 0', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <ShieldCheck size={20} /> Elektronska Potvrda Putnika
                                                    </h4>
                                                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                                                        "{dossier.insurance.confirmationText}"
                                                    </p>
                                                    <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <Clock size={14} /> Vreme potvrde: <strong>{dossier.insurance.confirmationTimestamp}</strong>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="insurance-card v4">
                                                <div className="card-top">
                                                    <ShieldCheck size={32} color="#eab308" />
                                                    <div>
                                                        <strong>Garancija Putovanja</strong>
                                                        <p>{dossier.insurance.guaranteePolicy}</p>
                                                    </div>
                                                </div>
                                                <div className="legal-toggles">
                                                    <div className="toggle-box">
                                                        <input type="checkbox" checked={dossier.insurance.cancellationOffered} />
                                                        <label>Ponudjeno osiguranje od otkaza (Travel Cancellation)</label>
                                                    </div>
                                                    <div className="toggle-box">
                                                        <input type="checkbox" checked={dossier.insurance.healthOffered} />
                                                        <label>Pružene informacije o zdravstvenom osiguranju</label>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="cis-sync-card">
                                                <div className="sync-status">
                                                    <div className="pulse-indicator"></div>
                                                    <span>Sistem je spreman za sinhronizaciju sa CIS portalom eTurista.</span>
                                                </div>
                                                <button className="btn-sync-cis">Pošalji na CIS</button>
                                            </div>
                                        </>
                                    )}
                                </section>
                            )
                        }
                        {/* SECTION: B2B COMMUNICATION CENTER */}
                        {
                            activeSection === 'communication' && isSubagent && (
                                <section className="res-section fade-in b2b-comms-center">
                                    <div className="section-title">
                                        <h3><Mail size={20} color="#ff9800" style={{ marginRight: '10px' }} /> B2B Centar za Komunikaciju</h3>
                                        <button
                                            className={`btn-notepad-toggle ${isCommsNotepadView ? 'active' : ''}`}
                                            onClick={() => setIsCommsNotepadView(!isCommsNotepadView)}
                                            title="Prebaci na Notepad pregled"
                                        >
                                            <FileText size={16} /> Notepad
                                        </button>
                                    </div>

                                    {isCommsNotepadView ? (
                                        <div className="notepad-container fade-in">
                                            <div className="notepad-header">
                                                <span><FileText size={14} /> NOTEPAD: B2B KOMUNIKACIJA</span>
                                                <div className="notepad-actions">
                                                    <button onClick={copyCommsToClipboard} title="Copy to Clipboard"><Copy size={14} /> Copy</button>
                                                    <button onClick={shareCommsToEmail} title="Send via Email"><Mail size={14} /> Email</button>
                                                    <button onClick={() => window.print()} title="Print"><Printer size={14} /> Print</button>
                                                    <button onClick={shareCommsGeneric} title="Share"><Share2 size={14} /> Share</button>
                                                </div>
                                            </div>
                                            <textarea
                                                readOnly
                                                value={getCommsNotepadText()}
                                                className="notepad-area"
                                            />
                                            <div className="notepad-footer">
                                                Formatirano za brzo deljenje upita sa centralom
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '20px' }}>Direktni upiti centrali (inf@olympic.rs) vezani za ovu rezervaciju</p>

                                            <div className="b2b-comms-grid">
                                                <div className="comms-form-card">
                                                    <div className="quick-subjects">
                                                        <label>Brzi Predmeti:</label>
                                                        <div className="subject-chips">
                                                            {[
                                                                `Promena imena putnika - REZ: ${dossier.resCode || dossier.clientReference}`,
                                                                `Otkaz rezervacije - REZ: ${dossier.resCode || dossier.clientReference}`,
                                                                `Dodatne usluge / Napomene - REZ: ${dossier.resCode || dossier.clientReference}`,
                                                                `Pitanje oko plaćanja - REZ: ${dossier.resCode || dossier.clientReference}`,
                                                                `Problem sa vaučerom - REZ: ${dossier.resCode || dossier.clientReference}`
                                                            ].map((subj, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    className={`subject-chip ${commsSubject === subj ? 'active' : ''}`}
                                                                    onClick={() => setCommsSubject(subj)}
                                                                >
                                                                    {subj.split(' - ')[0]}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="input-field full-width">
                                                        <label>Predmet poruke</label>
                                                        <input
                                                            type="text"
                                                            value={commsSubject}
                                                            onChange={(e) => setCommsSubject(e.target.value)}
                                                            placeholder="Npr: Hitna promena u rezervaciji..."
                                                        />
                                                    </div>

                                                    <div className="input-field full-width">
                                                        <label>Vaša poruka / Upit</label>
                                                        <textarea
                                                            value={commsMessage}
                                                            onChange={(e) => setCommsMessage(e.target.value)}
                                                            placeholder="Detaljno opišite šta je potrebno..."
                                                            style={{ minHeight: '150px' }}
                                                        />
                                                    </div>

                                                    <button
                                                        className="send-b2b-query-btn"
                                                        onClick={() => {
                                                            addLog('B2B Upit Poslat', `Poslat upit centrali: ${commsSubject}`, 'success');
                                                            alert(`Upit uspešno poslat na inf@olympic.rs!\n\nPredmet: ${commsSubject}\n\nOdgovor možete očekivati u roku od 15 minuta u "History" sekciji ili na Vaš email.`);
                                                            setCommsMessage('');
                                                        }}
                                                        disabled={!commsSubject || !commsMessage}
                                                    >
                                                        <Mail size={18} /> Pošalji Upit Centrali
                                                    </button>
                                                </div>

                                                <div className="comms-info-card">
                                                    <div className="support-info">
                                                        <h4>Direktna Podrška</h4>
                                                        <p>Radno vreme: Pon-Pet 09-20h, Sub 09-15h</p>
                                                        <div className="support-phone">
                                                            <History size={16} /> 011/33-33-333
                                                        </div>
                                                    </div>
                                                    <div className="comms-history-preview">
                                                        <h5>Poslednji statusi Komunikacije</h5>
                                                        <div className="p-mini-log">
                                                            <div className="log-line success">✓ Rezervacija potvrđena od strane dobavljača (sistem)</div>
                                                            <div className="log-line info">ℹ Upit primljen i dodeljen operateru (sistem)</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </section>
                            )
                        }

                        {/* SECTION: DOCUMENTS */}
                        {
                            activeSection === 'documents' && (
                                <section className="res-section fade-in">
                                    <div className="section-title" style={{ marginBottom: '32px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '22px' }}><FileText size={24} color="var(--accent)" style={{ marginRight: '12px' }} /> Dokumentacija i Dokumenti</h3>
                                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                                Generišite profesionalne PDF i HTML dokumente prilagođene jeziku putnika ili ino-partnera.
                                            </p>
                                        </div>
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                                            <button className="btn-secondary" style={{ padding: '8px 20px', fontSize: '12px' }} onClick={() => addLog('Štampa', 'Pokrenuta serijska štampa svih dokumenata.', 'info')}>
                                                <Printer size={16} /> Štampaj Paket
                                            </button>
                                            <button className="btn-primary" style={{ padding: '8px 20px', fontSize: '12px' }} onClick={() => setIsEmailModalOpen(true)}>
                                                <Mail size={16} /> Email Dokumente
                                            </button>
                                        </div>
                                    </div>

                                    {/* GROUP 1: PUTNA DOKUMENTA */}
                                    <div className="doc-group-container">
                                        <h4 className="doc-group-title">
                                            <div className="title-decorator"></div>
                                            Putna Dokumenta (Travel Documents)
                                        </h4>
                                        <div className="docs-premium-grid">
                                            {[
                                                { id: 'contract', title: 'Ugovor o Putovanju', icon: <ShieldCheck size={22} />, desc: 'Glavni dokument o uslovima putovanja.' },
                                                { id: 'itinerary', title: 'Plan Putovanja', icon: <Compass size={22} />, desc: 'Detaljan itinerer po danima/stavkama.' },
                                                { id: 'guarantee', title: 'Garancija Putovanja', icon: <Shield size={22} />, desc: 'Polisa osiguranja od insolventnosti.' },
                                                { id: 'voucher', title: 'Voucher', icon: <Building2 size={22} />, desc: 'Dokument za prijavu u hotelu.' }
                                            ].map(doc => (
                                                <div key={doc.id} className="doc-card-v5">
                                                    <div className="doc-card-header">
                                                        <div className="doc-icon-v5">{doc.icon}</div>
                                                        <div className="doc-title-meta">
                                                            <h5>{doc.title}</h5>
                                                            <span>{doc.desc}</span>
                                                        </div>
                                                    </div>

                                                    <div className="doc-lang-selector">
                                                        <button
                                                            className={docSettings[doc.id] === 'Srpski' ? 'active' : ''}
                                                            onClick={() => setDocSettings({ ...docSettings, [doc.id]: 'Srpski' })}
                                                        >SR</button>
                                                        <button
                                                            className={docSettings[doc.id] === 'Engleski' ? 'active' : ''}
                                                            onClick={() => setDocSettings({ ...docSettings, [doc.id]: 'Engleski' })}
                                                        >EN</button>
                                                    </div>

                                                    <div className="doc-card-actions">
                                                        <button className="doc-action pdf" onClick={() => {
                                                            generateDossierPDF(dossier, docSettings[doc.id]);
                                                            setDocGenHistory(prev => ({ ...prev, [doc.id]: new Date().toLocaleTimeString() }));
                                                            addLog('Generisanje PDF', `${doc.title} generisan na jeziku: ${docSettings[doc.id]}`, 'success');
                                                        }} title="Preuzmi PDF">
                                                            <FileText size={16} /> <span>PDF</span>
                                                        </button>
                                                        <button className="doc-action html" onClick={() => {
                                                            generateDossierHTML(dossier, docSettings[doc.id]);
                                                            setDocGenHistory(prev => ({ ...prev, [doc.id]: new Date().toLocaleTimeString() }));
                                                            addLog('Generisanje WEB', `${doc.title} generisan na jeziku: ${docSettings[doc.id]}`, 'info');
                                                        }} title="Pregled HTML">
                                                            <Code size={16} /> <span>WEB</span>
                                                        </button>
                                                        <button className="doc-action print" onClick={() => {
                                                            window.print();
                                                            setDocGenHistory(prev => ({ ...prev, [doc.id]: new Date().toLocaleTimeString() }));
                                                        }} title="Štampaj">
                                                            <Printer size={16} />
                                                        </button>
                                                        <button className="doc-action email" onClick={() => setIsEmailModalOpen(true)} title="Pošalji na email">
                                                            <Mail size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="doc-status-line">
                                                        <Clock size={10} /> Poslednje generisano: <span>{docGenHistory[doc.id] || 'Nikada'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* GROUP 2: FINANSIJSKA DOKUMENTA */}
                                    <div className="doc-group-container" style={{ marginTop: '40px' }}>
                                        <h4 className="doc-group-title">
                                            <div className="title-decorator financial"></div>
                                            Finansijska Dokumenta (Financials)
                                        </h4>
                                        <div className="docs-premium-grid">
                                            {[
                                                { id: 'proforma', title: 'Profaktura (Predračun)', icon: <FileText size={22} />, desc: 'Instrukcije za uplatu preko računa.' },
                                                { id: 'advance', title: 'Avansni Račun', icon: <Receipt size={22} />, desc: 'Potvrda o delimičnoj uplati (akontaciji).' },
                                                { id: 'final', title: 'Konačni Račun', icon: <CheckCircle2 size={22} />, desc: 'Zatvaranje rezervacije i fiskalizacija.' },
                                                { id: 'payment', title: 'Potvrda o Uplati ili Refund', icon: <Banknote size={22} />, desc: 'Službena potvrda primljenih sredstava.' }
                                            ].map(doc => (
                                                <div key={doc.id} className="doc-card-v5 financial">
                                                    <div className="doc-card-header">
                                                        <div className="doc-icon-v5">{doc.icon}</div>
                                                        <div className="doc-title-meta">
                                                            <h5>{doc.title}</h5>
                                                            <span>{doc.desc}</span>
                                                        </div>
                                                    </div>

                                                    <div className="doc-lang-selector">
                                                        <button
                                                            className={docSettings[doc.id] === 'Srpski' ? 'active' : ''}
                                                            onClick={() => setDocSettings({ ...docSettings, [doc.id]: 'Srpski' })}
                                                        >SR</button>
                                                        <button
                                                            className={docSettings[doc.id] === 'Engleski' ? 'active' : ''}
                                                            onClick={() => setDocSettings({ ...docSettings, [doc.id]: 'Engleski' })}
                                                        >EN</button>
                                                    </div>

                                                    <div className="doc-card-actions">
                                                        <button className="doc-action pdf" onClick={() => {
                                                            generateDossierPDF(dossier, docSettings[doc.id]);
                                                            setDocGenHistory(prev => ({ ...prev, [doc.id]: new Date().toLocaleTimeString() }));
                                                            addLog('Generisanje PDF', `${doc.title} generisan na jeziku: ${docSettings[doc.id]}`, 'success');
                                                        }} title="Preuzmi PDF">
                                                            <FileText size={16} /> <span>PDF</span>
                                                        </button>
                                                        <button className="doc-action html" onClick={() => {
                                                            generateDossierHTML(dossier, docSettings[doc.id]);
                                                            setDocGenHistory(prev => ({ ...prev, [doc.id]: new Date().toLocaleTimeString() }));
                                                            addLog('Generisanje WEB', `${doc.title} generisan na jeziku: ${docSettings[doc.id]}`, 'info');
                                                        }} title="Pregled HTML">
                                                            <Code size={16} /> <span>WEB</span>
                                                        </button>
                                                        <button className="doc-action print" onClick={() => {
                                                            window.print();
                                                            setDocGenHistory(prev => ({ ...prev, [doc.id]: new Date().toLocaleTimeString() }));
                                                        }} title="Štampaj">
                                                            <Printer size={16} />
                                                        </button>
                                                        <button className="doc-action email" onClick={() => setIsEmailModalOpen(true)} title="Pošalji na email">
                                                            <Mail size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="doc-status-line">
                                                        <Clock size={10} /> Poslednje generisano: <span>{docGenHistory[doc.id] || 'Nikada'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            )
                        }
                        {/* SECTION 7: HISTORY (ACTIVITY LOGS) */}
                        {
                            activeSection === 'history' && (
                                <section className="res-section fade-in">
                                    <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <div>
                                            <h3 style={{ margin: 0 }}><History size={18} /> Istorija aktivnosti (Audit Log)</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Hronološki zapis svih sistemskih i korisničkih akcija</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <button
                                                className="btn-notepad-toggle"
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    background: isHistoryNotepadView ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                                                    color: isHistoryNotepadView ? 'white' : 'var(--text-secondary)',
                                                    border: '1px solid var(--border)',
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                                onClick={() => setIsHistoryNotepadView(!isHistoryNotepadView)}
                                            >
                                                <FileText size={14} /> {isHistoryNotepadView ? 'Zatvori Notepad' : 'Notepad Pregled'}
                                            </button>
                                            <div className="log-search-wrap" style={{ position: 'relative', width: '300px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Pretraži logove..."
                                                    value={logSearch}
                                                    onChange={(e) => setLogSearch(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        background: 'var(--bg-card)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '10px',
                                                        padding: '10px 16px 10px 40px',
                                                        fontSize: '13px',
                                                        color: 'var(--text-primary)'
                                                    }}
                                                />
                                                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                            </div>
                                        </div>
                                    </div>

                                    {isHistoryNotepadView ? (
                                        <div className="notepad-container" style={{
                                            background: '#1e293b',
                                            padding: '30px',
                                            borderRadius: '16px',
                                            border: '1px solid var(--border)',
                                            fontFamily: 'monospace',
                                            color: '#cbd5e1',
                                            lineHeight: '1.6',
                                            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)',
                                            position: 'relative',
                                            marginBottom: '30px'
                                        }}>
                                            <div className="notepad-actions" style={{
                                                position: 'absolute',
                                                top: '20px',
                                                right: '25px',
                                                display: 'flex',
                                                gap: '8px'
                                            }}>
                                                <button
                                                    onClick={copyHistoryToClipboard}
                                                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Copy size={14} /> Kopiraj
                                                </button>
                                                <button
                                                    onClick={handlePrint}
                                                    style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                                                >
                                                    <Printer size={14} /> Štampaj
                                                </button>
                                            </div>

                                            <div style={{ borderBottom: '1px dashed #475569', marginBottom: '20px', paddingBottom: '10px' }}>
                                                <h4 style={{ margin: 0, color: 'var(--accent)' }}>--- ISTORIJA AKTIVNOSTI / DOSSIER {dossier.cisCode} ---</h4>
                                            </div>
                                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                                                {getHistoryNotepadText()}
                                            </pre>
                                        </div>
                                    ) : (
                                        <div className="activity-timeline">
                                            {dossier.logs
                                                .filter(log =>
                                                    !logSearch ||
                                                    log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                                                    log.details.toLowerCase().includes(logSearch.toLowerCase()) ||
                                                    log.operator.toLowerCase().includes(logSearch.toLowerCase())
                                                )
                                                .map((log) => (
                                                    <div key={log.id} className={`log-item-v4 ${log.type}`}>
                                                        <div className="log-icon-wrap">
                                                            {log.type === 'success' && <CheckCircle2 size={12} />}
                                                            {log.type === 'danger' && <X size={12} />}
                                                            {log.type === 'warning' && <AlertTriangle size={12} />}
                                                            {log.type === 'info' && <Info size={12} />}
                                                        </div>
                                                        <div className="log-content">
                                                            <div className="log-top">
                                                                <span className="log-operator">{log.operator}</span>
                                                                <span className="log-dot"></span>
                                                                <span className="log-action">{log.action}</span>
                                                                <span className="log-time">{log.timestamp}</span>
                                                            </div>
                                                            <div className="log-details">{log.details}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            {dossier.logs.length === 0 && (
                                                <div className="empty-logs">Nema zapisa u istoriji.</div>
                                            )}
                                        </div>
                                    )}
                                </section>
                            )
                        }
                        {/* SECTION: DESTINATION REPRESENTATIVE */}
                        {
                            activeSection === 'rep' && (
                                <section className="res-section fade-in">
                                    <div className="section-title">
                                        <h3><Shield size={20} color="#10b981" style={{ marginRight: '10px' }} /> Predstavnik</h3>
                                    </div>

                                    <div className="rep-chat-container" style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 340px',
                                        gap: '20px',
                                        marginTop: '20px'
                                    }}>
                                        <div className="rep-chat-box" style={{
                                            background: 'var(--bg-card)',
                                            borderRadius: '16px',
                                            border: '1px solid var(--border)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            height: '600px',
                                            overflow: 'hidden'
                                        }}>
                                            <div className="chat-messages" style={{
                                                flex: 1,
                                                padding: '20px',
                                                overflowY: 'auto',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px',
                                                background: 'rgba(0,0,0,0.2)'
                                            }}>
                                                {useDestRepStore.getState().getDossierMessages(dossier.resCode || dossier.clientReference).length === 0 ? (
                                                    <div style={{ textAlign: 'center', marginTop: '100px', color: 'var(--text-secondary)' }}>
                                                        <MessageCircle size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                                                        <p>Nema poruka za ovaj dosije.</p>
                                                    </div>
                                                ) : (
                                                    useDestRepStore.getState().getDossierMessages(dossier.resCode || dossier.clientReference).map((msg: any) => (
                                                        <div key={msg.id} className={`chat-message ${msg.role}`} style={{
                                                            maxWidth: '80%',
                                                            padding: '12px 16px',
                                                            borderRadius: '16px',
                                                            alignSelf: msg.role === 'agent' ? 'flex-end' : 'flex-start',
                                                            background: msg.role === 'agent' ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                                            color: msg.role === 'agent' ? 'white' : 'var(--text-primary)',
                                                            border: msg.role === 'rep' ? '1px solid var(--border)' : 'none'
                                                        }}>
                                                            <div style={{ fontSize: '11px', opacity: 0.7, marginBottom: '4px', fontWeight: 700 }}>
                                                                {msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{msg.text}</div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div className="chat-input-area" style={{ padding: '20px', background: 'var(--bg-sidebar)', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Unesite poruku za predstavnika..."
                                                    style={{
                                                        flex: 1,
                                                        background: 'var(--bg-card)',
                                                        border: '1px solid var(--border)',
                                                        borderRadius: '10px',
                                                        padding: '10px 16px',
                                                        color: 'var(--text-primary)'
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            const val = e.currentTarget.value;
                                                            if (!val.trim()) return;
                                                            useDestRepStore.getState().addMessage({
                                                                dossierId: dossier.resCode || dossier.clientReference || undefined,
                                                                sender: 'Agent Nenad',
                                                                senderEmail: 'nenad@olympic.rs',
                                                                text: val,
                                                                role: 'agent'
                                                            });
                                                            e.currentTarget.value = '';
                                                        }
                                                    }}
                                                />
                                                <button className="btn-primary" style={{ padding: '0 20px', borderRadius: '10px' }}>
                                                    <Send size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="rep-status-aside" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div className="status-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Status Provere</div>
                                                {dossier.repChecked ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(16, 185, 129, 0.1)',
                                                            color: '#10b981',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <Shield size={24} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 800, color: '#10b981' }}>Provereno (Checked)</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                                {dossier.repCheckedBy} @ {dossier.repCheckedAt ? new Date(dossier.repCheckedAt).toLocaleString() : '---'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', opacity: 0.5 }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '10px',
                                                            background: 'rgba(239, 68, 68, 0.1)',
                                                            color: '#ef4444',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <ShieldAlert size={24} />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 800, color: '#ef4444' }}>Nije Provereno</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Čeka se na proveru predstavnika</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {dossier.repInternalNote && (
                                                    <div style={{ fontSize: '12px', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                                        <strong>Interna Napomena Predstavnika:</strong><br />
                                                        {dossier.repInternalNote}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="status-card" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase' }}>Dodeljeni Predstavnici</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyItems: 'center', fontWeight: 700, fontSize: '12px', justifyContent: 'center' }}>MP</div>
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: 700 }}>Miloš Predstavnik</div>
                                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Regija: Hurgada</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )
                        }
                    </main >
                </div >

                {/* --- MODERN CALENDAR MODAL --- */}
                {
                    activeCalendar && (
                        <ModernCalendar
                            startDate={dossier.tripItems.find(it => it.id === activeCalendar.id)?.checkIn || null}
                            endDate={dossier.tripItems.find(it => it.id === activeCalendar.id)?.checkOut || null}
                            onChange={(start, end) => {
                                const newItems = dossier.tripItems.map(it =>
                                    it.id === activeCalendar.id ? { ...it, checkIn: start, checkOut: end } : it
                                );
                                setDossier({ ...dossier, tripItems: newItems });
                                setActiveCalendar(null);
                            }}
                            onClose={() => setActiveCalendar(null)}
                        />
                    )
                }

                {/* --- EMAIL MODAL --- */}
                {
                    isEmailModalOpen && (
                        <ReservationEmailModal
                            isOpen={isEmailModalOpen}
                            onClose={() => setIsEmailModalOpen(false)}
                            reservations={[
                                {
                                    cisCode: dossier.cisCode,
                                    customerName: dossier.booker.fullName,
                                    supplier: dossier.tripItems[0]?.supplier || 'N/A',
                                    email: dossier.booker.email
                                }
                            ]}
                            isBulk={false}
                        />
                    )
                }

                {/* --- FOOTER V3 --- */}
                <footer className="res-footer-v2">
                    <div className="footer-meta">
                        <Fingerprint size={14} />
                        <span>Operater: <strong>Nenad</strong> (Office Belgrade)</span>
                    </div>

                    {/* Suppliers in Footer Center - HIDDEN FOR SUBAGENTS */}
                    <div className="footer-suppliers-center">
                        {!isSubagent && Array.from(new Set(dossier.tripItems.map(item => `${item.supplier}|${item.type}`))).map((providerKey, idx) => {
                            const [supplier, type] = providerKey.split('|');
                            if (!supplier) return null;
                            return (
                                <div key={idx} className="footer-provider-tag" onClick={() => getSupplierB2BUrl(supplier) && window.open(getSupplierB2BUrl(supplier)!, '_blank')}>
                                    <span className="p-tag-icon">{getTripTypeIcon(type)}</span>
                                    <div className="p-tag-content">
                                        <span className="p-tag-name">{supplier}</span>
                                        <span className="p-tag-type">{type}</span>
                                    </div>
                                    {getSupplierB2BUrl(supplier) && <ExternalLink size={10} style={{ opacity: 0.6 }} />}
                                </div>
                            );
                        })}
                        {isSubagent && (
                            <div className="b2b-footer-notice">
                                <ShieldCheck size={14} />
                                <span>Verifikovana B2B Rezervacija</span>
                            </div>
                        )}
                    </div>

                    <div className="footer-actions">
                        {!isSubagent && <button className="btn-save-master" onClick={handleSave}><Save size={16} /> Sačuvaj Dossier</button>}
                    </div>
                </footer>

                {/* --- PRINTABLE CONTRACT SECTION (Hidden in UI, visible in Print) --- */}
                <div className="printable-contract">
                    <div className="print-header">
                        <h1>Olympic Travel - Ugovor o Putovanju</h1>
                        <p>Dossier: {dossier.resCode || dossier.cisCode}</p>
                    </div>

                    <div className="print-grid">
                        <section>
                            <h4>Ugovarač / Nosilac</h4>
                            <p><strong>{dossier.booker.fullName}</strong></p>
                            <p>{dossier.booker.address}, {dossier.booker.city}</p>
                            <p>{dossier.booker.phone} | {dossier.booker.email}</p>
                        </section>

                        <section>
                            <h4>Program Putovanja</h4>
                            {dossier.tripItems.map((item, i) => (
                                <div key={i} className="print-item">
                                    <p><strong>{item.subject}</strong> ({item.details})</p>
                                    <p>{formatDate(item.checkIn)} - {formatDate(item.checkOut)}</p>
                                    <p>{item.city}, {item.country} | {item.mealPlan}</p>
                                </div>
                            ))}
                        </section>
                    </div>

                    <section className="print-passengers">
                        <h4>Putnici</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>Br.</th>
                                    <th>Ime i Prezime</th>
                                    <th>Br. Pasoša</th>
                                    <th>Datum Rođenja</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dossier.passengers.map((p, i) => (
                                    <tr key={i}>
                                        <td>{i + 1}.</td>
                                        <td>{p.firstName} {p.lastName}</td>
                                        <td>{p.idNumber}</td>
                                        <td>{formatDate(p.birthDate)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <div className="print-legal-section">
                        <h4>Prava, Garancije i Obaveze</h4>
                        {dossier.insurance.confirmationText ? (
                            <div className="print-confirmation-text">
                                <p><strong>ELEKTRONSKA POTVRDA SAGLASNOSTI:</strong></p>
                                <p>"{dossier.insurance.confirmationText}"</p>
                                <p>Datum i vreme potvrde: <strong>{dossier.insurance.confirmationTimestamp}</strong></p>
                            </div>
                        ) : (
                            <p>Nije zabeležena elektronska potvrda.</p>
                        )}
                        <p className="general-terms-notice">Potpisivanjem ovog ugovora/plaćanjem akontacije, putnik potvrđuje da je upoznat sa Opštim uslovima putovanja agencije Olympic Travel i programom putovanja.</p>
                    </div>

                    <div className="print-signatures">
                        <div className="sig">
                            <p>Za Agenciju:</p>
                            <div className="line"></div>
                        </div>
                        <div className="sig">
                            <p>Putnik / Ugovarač:</p>
                            <div className="line"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ReservationArchitect;
