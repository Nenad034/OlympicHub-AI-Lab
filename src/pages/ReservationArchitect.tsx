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
    Euro, DollarSign, CirclePercent, Copy, Share2, Code
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { ModernCalendar } from '../components/ModernCalendar';
import { GoogleAddressAutocomplete } from '../components/GoogleAddressAutocomplete';
import { NATIONALITIES } from '../constants/nationalities';
import ReservationEmailModal from '../components/ReservationEmailModal';
import { saveDossierToDatabase, getNextReservationNumber, getReservationById as apiGetReservationById } from '../services/reservationService';
import { getReservation as getSolvexReservation } from '../services/solvex/solvexBookingService';
import { getCachedToken } from '../services/solvex/solvexAuthService';
import { useAuthStore } from '../stores';
import '../components/GoogleAddressAutocomplete.css';
import './ReservationArchitect.css';
import { getTranslation } from '../utils/translations';
import type { Language } from '../utils/translations';
import { generateDossierPDF, generateDossierHTML } from '../utils/dossierExport';

// --- Types ---
type TripType = 'Smestaj' | 'Avio karte' | 'Dinamicki paket' | 'Putovanja' | 'Transfer';
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
    type: 'Smestaj' | 'Avio karte' | 'Dinamicki paket' | 'Putovanja' | 'Transfer';
    supplier: string;
    country?: string;
    city?: string;
    subject: string; // Hotel name, Flight route, etc.
    details: string; // Room type, Flight class, etc.
    mealPlan?: string; // Meal plan (e.g. All Inclusive)
    stars?: number; // Hotel category
    checkIn: string;
    checkOut: string;
    netPrice: number;
    bruttoPrice: number;
    passengers?: Passenger[];
    supplierRef?: string;
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

// --- Component ---
const ReservationArchitect: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState('parties');

    const [advisorType, setAdvisorType] = useState('accomodation');
    const [expandedPassengers, setExpandedPassengers] = useState<string[]>([]);

    // B2B Segment States
    const { userLevel } = useAuthStore();
    const isSubagent = userLevel < 6;
    const [commsSubject, setCommsSubject] = useState('');
    const [commsMessage, setCommsMessage] = useState('');


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
            internal: ''
        },
        language: 'Srpski' as Language
    });
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [isNotepadView, setIsNotepadView] = useState(false);
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
            const urlParams = new URLSearchParams(location.search);
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
                            // It's a full saved dossier
                            setDossier(rawData);
                        } else {
                            // It's a standard reservation (e.g. from BookingModal) - Map to Dossier
                            const guests = rawData?.guests || [];
                            const mainGuest = guests[0] || {};

                            setDossier(prev => ({
                                ...prev,
                                cisCode: dbRes.cis_code,
                                resCode: dbRes.ref_code,
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
                            type: 'Smestaj',
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
                            netPrice: Math.round((loadData.selectedRoom?.price || res.price) * 100) / 100,
                            bruttoPrice: Math.round((loadData.selectedRoom?.price || res.price) * 100) / 100,
                            supplierRef: loadData.externalBookingCode || loadData.externalBookingId || '',
                            passengers: [...calculatedPassengers]
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
                setIsInitialized(true);
                // Go directly to Passengers tab
                setActiveSection('parties');
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

    // Helpers
    const totalBrutto = dossier.tripItems.reduce((sum, item) => sum + (item.bruttoPrice || 0), 0);
    const totalNet = dossier.tripItems.reduce((sum, item) => sum + (item.netPrice || 0), 0);
    const totalProfit = totalBrutto - totalNet;
    const profitPercent = totalNet > 0 ? (totalProfit / totalNet) * 100 : 0;

    const totalPaid = dossier.finance.payments.reduce((sum, p) => p.status === 'deleted' ? sum : sum + (p.amount || 0), 0);
    const balance = totalBrutto - totalPaid;

    // --- EXCHANGE RATE SIMULATION --- (To be replaced by API)
    const NBS_RATES = {
        'EUR': 117.00,
        'USD': 108.00,
        'RSD': 1.00
    };

    // --- ACTIVITY LOG HELPER ---
    const addLog = (action: string, details: string, type: ActivityLog['type'] = 'info') => {
        const newLog: ActivityLog = {
            id: 'log-' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString('sr-RS') + ' ' + new Date().toLocaleDateString('sr-RS'),
            operator: 'Nenad', // U realnoj aplikaciji ovde ide ID ulogovanog korisnika
            action,
            details,
            type
        };
        setDossier(prev => ({
            ...prev,
            logs: [newLog, ...prev.logs]
        }));
    };

    const handlePrint = () => {
        addLog('Štampa Dokumenta', 'Pokrenuta štampa Ugovora o Putovanju.', 'info');
        window.print();
    };

    const generateDocument = (type: string) => {
        addLog('Generisanje Dokumenta', `${type} je generisana za putnika ${dossier.booker.fullName}.`, 'success');
        alert(`Generisanje dokumenta: ${type}\nU realnoj aplikaciji, ovde se generiše PDF sa podacima iz dosijea:\n- Broj: ${dossier.resCode || dossier.clientReference}\n- Putnik: ${dossier.booker.fullName}\n- Iznos: ${totalBrutto} ${dossier.finance.currency}`);
    };

    // --- AUTOMATION LOGIC ---
    useEffect(() => {
        // Only automate to 'Active' if payment exists and not already Canceled
        if (dossier.status !== 'Canceled' && totalPaid > 0 && dossier.status !== 'Active') {
            setDossier(prev => ({ ...prev, status: 'Active' }));
            addLog('Status Promenjen', 'Status rezervacije automatski promenjen u "Active" zbog evidentirane uplate.', 'info');
        }
    }, [totalPaid, dossier.status]);

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
                passengers: [...prev.passengers]
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

    // Helper to get booker label based on customer type
    const getBookerLabel = () => {
        if (dossier.customerType === 'B2B-Subagent') return 'Subagent';
        if (dossier.customerType === 'B2C-Legal') return 'Firma';
        return 'Ime i Prezime';
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



                        {/* SECTION 1: CUSTOMER & PASSENGERS */}
                        {activeSection === 'parties' && (
                            <section className="res-section fade-in">
                                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '20px' }}><Users size={20} color="var(--accent)" style={{ marginRight: '10px' }} /> Svi Putnici</h3>
                                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Podaci o ugovaraču (nalagodavcu) i svim učesnicima putovanja</p>
                                    </div>
                                    <div className="type-toggle">
                                        <button className={dossier.customerType === 'B2C-Individual' ? 'selected' : ''} disabled={isSubagent} onClick={() => { setDossier({ ...dossier, customerType: 'B2C-Individual' }); addLog('Tip Klijenta', 'Tip klijenta promenjen u "Individualni".', 'info'); }}>Individualni</button>
                                        <button className={dossier.customerType === 'B2B-Subagent' ? 'selected' : ''} disabled={isSubagent} onClick={() => { setDossier({ ...dossier, customerType: 'B2B-Subagent' }); addLog('Tip Klijenta', 'Tip klijenta promenjen u "Subagent".', 'info'); }}>Subagent</button>
                                        <button className={dossier.customerType === 'B2C-Legal' ? 'selected' : ''} disabled={isSubagent} onClick={() => { setDossier({ ...dossier, customerType: 'B2C-Legal' }); addLog('Tip Klijenta', 'Tip klijenta promenjen u "Pravno Lice".', 'info'); }}>Pravno Lice</button>
                                    </div>
                                </div>

                                {/* OSNOVNI KODOVI REZERVACIJE */}
                                <div className="info-group codes-management-card" style={{
                                    marginBottom: '30px',
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
                                                fontWeight: 700
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
                                                fontSize: '14px'
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
                                                cursor: 'not-allowed'
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="info-group main-booker-card">
                                    <div className="booker-header-row">
                                        <label>Ugovarač (Nalagodavac)</label>
                                        <button className="copy-to-all-btn" onClick={copyBookerToPassengers}>
                                            <ArrowRightLeft size={12} /> Kopiraj podatke na sve putnike
                                        </button>
                                    </div>

                                    <div className="grid-v4">
                                        <div className="input-field">
                                            <label>{getBookerLabel()}</label>
                                            <input
                                                value={dossier.booker.fullName}
                                                onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, fullName: e.target.value } })}
                                                placeholder={dossier.customerType === 'B2B-Subagent' ? 'Pretraži subagente...' : dossier.customerType === 'B2C-Legal' ? 'Pretraži firme...' : 'Unesite ime i prezime'}
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
                                                <label>PIB Kompanije</label>
                                                <input value={dossier.booker.companyPib} onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, companyPib: e.target.value } })} />
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
                                                        <div className="type-tag" style={{ background: item.type === 'Smestaj' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(56, 189, 248, 0.1)', color: item.type === 'Smestaj' ? '#10b981' : '#38bdf8' }}>
                                                            {item.type === 'Smestaj' && <Building2 size={16} />}
                                                            {item.type === 'Avio karte' && <Plane size={16} />}
                                                            {item.type === 'Transfer' && <Truck size={16} />}
                                                            {item.type === 'Putovanja' && <Globe size={16} />}
                                                            {item.type === 'Dinamicki paket' && <ArrowRightLeft size={16} />}
                                                            <span>{item.type === 'Smestaj' ? 'SMEŠTAJ' : item.type.toUpperCase()}</span>
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
                                                    </div>
                                                    <button className="del-btn-v4" onClick={() => removeTripItem(item.id)}><Trash2 size={14} /></button>
                                                </div>

                                                {/* Row 1: Dates */}
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
                                                <div className="item-row-v4" style={{ marginBottom: '16px' }}>
                                                    <div className="input-group-v4">
                                                        <label>Tip Smeštaja (Tip sobe, Pogled, Sprat...)</label>
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

                                                {/* Row 4: Service Type */}
                                                <div className="item-row-v4" style={{ marginBottom: '24px' }}>
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
                                                </div>

                                                <div className="item-finance-v4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', alignItems: 'stretch', opacity: isAdminMode ? 1 : 0.8, marginBottom: '24px', background: 'rgba(0,0,0,0.1)', padding: '16px', borderRadius: '12px' }}>
                                                    <div className="input-group-v4" style={{ filter: !isAdminMode ? 'blur(4px)' : 'none', pointerEvents: !isAdminMode ? 'none' : 'auto' }}>
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
                                                    <div className="input-group-v4" style={{ filter: !isAdminMode ? 'blur(4px)' : 'none' }}>
                                                        <label style={{ color: '#3b82f6' }}>ZARADA</label>
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

                                                    <div className="input-group-v3" style={{
                                                        filter: !isAdminMode ? 'blur(4px)' : 'none',
                                                        position: 'relative'
                                                    }}>
                                                        <label style={{ color: '#10b981', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>MARŽA</label>
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
                                                        {!isAdminMode && (
                                                            <div style={{
                                                                position: 'absolute',
                                                                inset: 0,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'var(--text-secondary)',
                                                                fontSize: '9px',
                                                                fontWeight: 800,
                                                                textAlign: 'center',
                                                                background: 'rgba(0,0,0,0.1)',
                                                                borderRadius: '10px',
                                                                zIndex: 2
                                                            }}>
                                                                <Shield size={10} style={{ marginRight: '4px' }} /> LOKOVANO
                                                            </div>
                                                        )}
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
                        )}

                        {/* SECTION 3: FINANCE (Payments & Receipts) */}
                        {activeSection === 'finance' && (
                            <section className="res-section fade-in">
                                <div className="section-title"><h3>Finansijski Dossier & Uplate</h3></div>

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
                                                                const val = parseFloat(e.target.value) || 0;
                                                                const newPayments = [...dossier.finance.payments];
                                                                newPayments[pidx].amount = val;
                                                                // Auto calculate RSD if dossier is in EUR/USD
                                                                if (p.currency !== 'RSD') {
                                                                    newPayments[pidx].amountInRsd = val * (p.exchangeRate || 1);
                                                                } else {
                                                                    newPayments[pidx].amountInRsd = val;
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
                                                                                    const next = [...dossier.finance.payments];
                                                                                    next[pidx].installmentsCount = parseInt(e.target.value) || 0;
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
                                                                                            <td><input type="number" value={check.amount} onChange={e => {
                                                                                                const next = [...dossier.finance.payments];
                                                                                                next[pidx].checks![cidx].amount = parseFloat(e.target.value) || 0;
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
                            </section>
                        )}

                        {/* SECTION: NOTES */}
                        {activeSection === 'notes' && (
                            <section className="res-section fade-in">
                                <div className="section-title">
                                    <h3><FileText size={20} color="var(--accent)" style={{ marginRight: '10px' }} /> Napomene Rezervacije</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Upravljajte napomenama za putnike, ugovore i internu evidenciju</p>
                                </div>

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
                            </section>
                        )}

                        {/* SECTION 4: LEGAL & INSURANCE */}
                        {activeSection === 'legal' && (
                            <section className="res-section fade-in">
                                <div className="section-title"><h3>Prava, Garancije i Obaveze</h3></div>

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
                            </section>
                        )}
                        {/* SECTION: B2B COMMUNICATION CENTER */}
                        {activeSection === 'communication' && isSubagent && (
                            <section className="res-section fade-in b2b-comms-center">
                                <div className="section-title">
                                    <h3><Mail size={20} color="#ff9800" style={{ marginRight: '10px' }} /> B2B Centar za Komunikaciju</h3>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Direktni upiti centrali (inf@olympic.rs) vezani za ovu rezervaciju</p>
                                </div>

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
                            </section>
                        )}

                        {/* SECTION: DOCUMENTS */}
                        {activeSection === 'documents' && (
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
                        )}
                        {/* SECTION 7: HISTORY (ACTIVITY LOGS) */}
                        {activeSection === 'history' && (
                            <section className="res-section fade-in">
                                <div className="section-title">
                                    <h3><History size={18} /> Istorija aktivnosti (Audit Log)</h3>
                                </div>

                                <div className="activity-timeline">
                                    {dossier.logs.map((log) => (
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
                            </section>
                        )}
                    </main>
                </div>

                {/* --- MODERN CALENDAR MODAL --- */}
                {activeCalendar && (
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
                )}

                {/* --- EMAIL MODAL --- */}
                {isEmailModalOpen && (
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
                )}

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
        </div>
    );
};

export default ReservationArchitect;
