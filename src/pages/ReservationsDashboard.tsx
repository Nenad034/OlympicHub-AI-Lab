import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, Calendar, Users, DollarSign, Clock,
    ChevronDown, ChevronUp, MoreVertical, Plus,
    Download, LayoutGrid, List, CalendarDays,
    Eye, Edit, Mail, Trash2, CheckCircle2, AlertCircle,
    X as XIcon, RefreshCw, BarChart3, TrendingUp, TrendingDown,
    MapPin, Building2, Phone, Briefcase, Tag, XCircle, Package, Globe, Truck, Plane, Zap, Compass, Ship, Star, User, ArrowUpDown, ChevronLeft, ChevronRight, CheckCheck, Receipt, CloudLightning, Bell, Send, Table, Code, FileCode, Check, Shield, MessageCircle, FileText, FileCheck, ShieldCheck
} from 'lucide-react';
import './ReservationsDashboard.css';
import ReservationEmailModal from '../components/ReservationEmailModal';
import DateRangeInput from '../components/DateRangeInput';
import { useQueryState } from '../hooks/useQueryState';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getUserReservations, saveDossierToDatabase, type DatabaseReservation } from '../services/reservationService';
import { useAuthStore } from '../stores';

// Types
type ResStatus = 'Active' | 'Reservation' | 'Canceled' | 'Offer' | 'Request' | 'Processing';
type ViewMode = 'grid' | 'list' | 'calendar';

interface TripItem {
    id: string;
    type: 'Smestaj' | 'Avio karte' | 'Dinamicki paket' | 'Putovanja' | 'Transfer' | 'Čarter' | 'Bus' | 'Krstarenje';
    supplier: string;
    subject: string;
    details: string;
    checkIn: string;
    checkOut: string;
    price: number;
}

interface Reservation {
    id: string;
    cisCode: string;
    refCode: string;
    status: ResStatus;
    customerName: string;
    customerType: 'B2C-Individual' | 'B2C-Legal' | 'B2B-Subagent';
    destination: string;
    accommodationName: string; // Hotel/Service name
    checkIn: string;
    checkOut: string;
    nights: number;
    paxCount: number;
    totalPrice: number;
    paid: number;
    currency: string;
    createdAt: string;
    supplier: string;
    tripType: string;
    phone: string;
    email: string;
    // Workflow status flags
    hotelNotified?: boolean; // Najavljeno hotelu
    reservationConfirmed?: boolean; // Potvrđena rezervacija
    proformaInvoiceSent?: boolean; // Poslata profaktura
    finalInvoiceCreated?: boolean; // Kreiran konačni račun
    hotelCategory?: number; // Broj zvezdica
    leadPassenger?: string; // Nosilac putovanja (putnik)
    items?: TripItem[];
    supplierRef?: string;
    repChecked?: boolean;
    repCheckedAt?: string;
    repCheckedBy?: string;
    repInternalNote?: string;
    // Deadline tracking
    supplierDeadline?: string;
    clientDeadline?: string;
    cancellationPolicy?: any;
}

import { ModernCalendar } from '../components/ModernCalendar';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';

// ... (existing imports)

// Animation variants for view transitions
const viewVariants: any = {
    initial: { opacity: 0, y: 20, filter: 'blur(10px)' },
    animate: {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: {
            duration: 0.4,
            ease: [0.22, 1, 0.36, 1]
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        filter: 'blur(10px)',
        transition: {
            duration: 0.3,
            ease: [0.22, 1, 0.36, 1]
        }
    }
};

const ReservationsDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { userLevel, impersonatedSubagent } = useAuthStore();
    const isSubagent = userLevel < 6 || !!impersonatedSubagent;
    const [viewMode, setViewMode] = useQueryState<ViewMode>('view', 'list');
    const [showStats, setShowStats] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTerms, setSearchTerms] = useState<string[]>([]); // Multi-term search chips
    const [calendarViewMode, setCalendarViewMode] = useState<'checkIn' | 'checkOut'>('checkIn'); // Calendar grouping
    const [activeFilters, setActiveFilters] = useState<{
        status: string[];
        reservationFrom: string;
        reservationTo: string;
        stayFrom: string;
        stayTo: string;
        customerType: string[];
        supplier: string[];
        workflow: string[];
        b2bSource: string[];
        tripType: string[];
    }>({
        status: ['all'],
        reservationFrom: '',
        reservationTo: '',
        stayFrom: '',
        stayTo: '',
        customerType: ['all'],
        supplier: ['all'],
        workflow: ['all'],
        b2bSource: ['all'],
        tripType: ['all']
    });

    const petroleumAccent = "#0E4B5E";
    const petroleumLight = "#E0ECEE";

    // Trip Type Filter Handler
    const handleTripTypeFilter = (type: string) => {
        setActiveFilters(prev => {
            const current = prev.tripType;
            let newTypes: string[];

            // If we are currently on 'all', then selecting a type starts a new selection list
            if (current.includes('all')) {
                newTypes = [type];
            } else {
                // Toggle logic
                if (current.includes(type)) {
                    newTypes = current.filter(t => t !== type);
                } else {
                    newTypes = [...current, type];
                }
            }

            // If empty, revert to 'all'
            if (newTypes.length === 0) {
                newTypes = ['all'];
            }

            return { ...prev, tripType: newTypes };
        });
    };
    const toggleWorkflowFilter = (key: string, val: boolean) => {
        const filterStr = `${key}:${val}`;
        let newWorkflow = activeFilters.workflow.includes('all') ? [] : [...activeFilters.workflow];

        if (newWorkflow.includes(filterStr)) {
            newWorkflow = newWorkflow.filter(w => w !== filterStr);
        } else {
            newWorkflow.push(filterStr);
        }

        if (newWorkflow.length === 0) newWorkflow = ['all'];

        setActiveFilters(prev => ({ ...prev, workflow: newWorkflow }));
    };
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [modalPos, setModalPos] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Handle Modal Dragging
    const handleHeaderMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).classList.contains('modal-header') || (e.target as HTMLElement).tagName === 'H2') {
            setIsDragging(true);
            setDragStart({ x: e.clientX - modalPos.x, y: e.clientY - modalPos.y });
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setModalPos({
                    x: e.clientX - dragStart.x,
                    y: e.clientY - dragStart.y
                });
            }
        };
        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, modalPos]);

    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
    const [selectedReservations, setSelectedReservations] = useState<string[]>([]); // For bulk email
    const [bulkEmailMode, setBulkEmailMode] = useState(false);

    // Mock data - replace with API call
    const mockReservations: Reservation[] = [
        {
            id: '1',
            cisCode: 'CIS-A2K5L1',
            refCode: 'REF-3045',
            status: 'Active',
            customerName: 'Petar Petrović',
            customerType: 'B2C-Individual',
            destination: 'Budva, Crna Gora',
            accommodationName: 'Hotel Splendid Conference & Spa',
            checkIn: '2025-07-20',
            checkOut: '2025-07-30',
            nights: 10,
            paxCount: 2,
            totalPrice: 1850,
            paid: 500,
            currency: 'EUR',
            createdAt: '2025-01-05',
            supplier: 'TCT (Travelgate)',
            tripType: 'Smeštaj',
            phone: '+381 64 123 4567',
            email: 'petar@email.com',
            hotelNotified: true,
            reservationConfirmed: true,
            proformaInvoiceSent: true,
            finalInvoiceCreated: false,
            hotelCategory: 5,
            leadPassenger: 'Petar Petrović',
            items: [
                {
                    id: 'i1',
                    type: 'Smestaj',
                    supplier: 'TravelgateX',
                    subject: 'Hotel Splendid Conference & Spa',
                    details: 'Superior Room, Half Board',
                    checkIn: '2025-07-20',
                    checkOut: '2025-07-30',
                    price: 1500
                },
                {
                    id: 'i2',
                    type: 'Transfer',
                    supplier: 'Local Transfer Partner',
                    subject: 'Tivat Airport - Hotel Splendid',
                    details: 'Private Car, Mercedes E-Class',
                    checkIn: '2025-07-20',
                    checkOut: '2025-07-20',
                    price: 350
                }
            ]
        },
        {
            id: '2',
            cisCode: 'CIS-B3N8P1',
            refCode: 'REF-3046',
            status: 'Request',
            customerName: 'Travel Pro Agency',
            customerType: 'B2B-Subagent',
            destination: 'Rodos, Grčka',
            accommodationName: 'Lindos Imperial Resort & Spa',
            checkIn: '2025-08-15',
            checkOut: '2025-08-22',
            nights: 7,
            paxCount: 4,
            totalPrice: 2400,
            paid: 0,
            currency: 'EUR',
            createdAt: '2025-01-06',
            supplier: 'Open Greece',
            tripType: 'Dinamički paket',
            phone: '+381 11 234 5678',
            email: 'info@travelpro.rs',
            hotelNotified: false,
            reservationConfirmed: false,
            proformaInvoiceSent: false,
            finalInvoiceCreated: false,
            hotelCategory: 5,
            leadPassenger: 'Jelena Janković'
        },
        {
            id: '3',
            cisCode: 'CIS-C5M2K9',
            refCode: 'REF-3047',
            status: 'Processing',
            customerName: 'Marko Marković',
            customerType: 'B2C-Individual',
            destination: 'Hurgada, Egipat',
            accommodationName: 'Jaz Aquamarine Resort',
            checkIn: '2025-06-10',
            checkOut: '2025-06-17',
            nights: 7,
            paxCount: 3,
            totalPrice: 1650,
            paid: 1650,
            currency: 'EUR',
            createdAt: '2025-01-04',
            supplier: 'Solvex',
            tripType: 'Smeštaj',
            phone: '+381 63 987 6543',
            email: 'marko@email.com',
            hotelNotified: true,
            reservationConfirmed: true,
            proformaInvoiceSent: true,
            finalInvoiceCreated: true,
            hotelCategory: 4,
            leadPassenger: 'Marko Marković'
        },
        {
            id: '4',
            cisCode: 'CIS-D8K3L5',
            refCode: 'REF-3048',
            status: 'Offer',
            customerName: 'Ana Anić',
            customerType: 'B2C-Individual',
            destination: 'Pariz, Francuska',
            accommodationName: 'Air France AF1234 BEG-CDG',
            checkIn: '2025-09-01',
            checkOut: '2025-09-05',
            nights: 4,
            paxCount: 2,
            totalPrice: 980,
            paid: 0,
            currency: 'EUR',
            createdAt: '2025-01-06',
            supplier: 'Amadeus',
            tripType: 'Avio karte',
            phone: '+381 65 111 2222',
            email: 'ana@email.com',
            hotelNotified: false,
            reservationConfirmed: false,
            proformaInvoiceSent: true,
            finalInvoiceCreated: false,
            leadPassenger: 'Ana Anić'
        },
        {
            id: '5',
            cisCode: 'CIS-E2M9N7',
            refCode: 'REF-3049',
            status: 'Reservation',
            customerName: 'Tech Corp d.o.o.',
            customerType: 'B2C-Legal',
            destination: 'Budva, Crna Gora',
            accommodationName: 'Hotel Splendid Conference & Spa',
            checkIn: '2025-07-20',
            checkOut: '2025-07-27',
            nights: 7,
            paxCount: 8,
            totalPrice: 3200,
            paid: 800,
            currency: 'EUR',
            createdAt: '2025-01-05',
            supplier: 'TCT (Travelgate), Local Transfer',
            tripType: 'Transfer',
            phone: '+381 11 333 4444',
            email: 'office@firma.rs',
            hotelNotified: true,
            reservationConfirmed: true,
            proformaInvoiceSent: false,
            finalInvoiceCreated: false,
            hotelCategory: 5,
            leadPassenger: 'Jovan Jovanović'
        },
        {
            id: '6',
            cisCode: 'CIS-F7P4Q2',
            refCode: 'REF-3050',
            status: 'Canceled',
            customerName: 'Milica Milić',
            customerType: 'B2C-Individual',
            destination: 'Santorini, Grčka',
            accommodationName: 'Katikies Hotel',
            checkIn: '2025-08-01',
            checkOut: '2025-08-10',
            nights: 9,
            paxCount: 2,
            totalPrice: 2100,
            paid: 500,
            currency: 'EUR',
            createdAt: '2025-01-03',
            supplier: 'Open Greece',
            tripType: 'Putovanja',
            phone: '+381 64 555 6666',
            email: 'milica@email.com',
            hotelNotified: true,
            reservationConfirmed: false,
            proformaInvoiceSent: false,
            finalInvoiceCreated: false,
            hotelCategory: 5,
            leadPassenger: 'Milica Milić'
        },
        {
            id: '7',
            cisCode: 'CIS-G9L1K3',
            refCode: 'REF-3051',
            status: 'Active',
            customerName: 'Nikola Nikolić',
            customerType: 'B2C-Individual',
            destination: 'Rim, Italija',
            accommodationName: 'Air Serbia JU500 BEG-FCO',
            checkIn: '2025-10-10',
            checkOut: '2025-10-15',
            nights: 5,
            paxCount: 1,
            totalPrice: 220,
            paid: 220,
            currency: 'EUR',
            createdAt: '2025-01-08',
            supplier: 'Kyte',
            tripType: 'Avio karte',
            phone: '+381 60 123 4567',
            email: 'nikola@email.com',
            hotelNotified: false,
            reservationConfirmed: true,
            proformaInvoiceSent: true,
            finalInvoiceCreated: true,
            leadPassenger: 'Nikola Nikolić'
        }
    ];

    const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
    const [isLoadingReservations, setIsLoadingReservations] = useState(false);

    // Funkcija za mapiranje database statusa u UI status
    const mapDatabaseStatusToUIStatus = (dbStatus: string): ResStatus => {
        const statusMap: Record<string, ResStatus> = {
            'pending': 'Request',
            'confirmed': 'Active',
            'cancelled': 'Canceled',
            'completed': 'Processing'
        };
        return statusMap[dbStatus] || 'Request';
    };

    // Funkcija za mapiranje DatabaseReservation u Reservation
    const mapDatabaseToReservation = (dbRes: DatabaseReservation): Reservation => {
        return {
            id: dbRes.id || '',
            cisCode: dbRes.cis_code,
            refCode: dbRes.ref_code,
            status: mapDatabaseStatusToUIStatus(dbRes.status),
            customerName: dbRes.customer_name,
            customerType: dbRes.customer_type,
            destination: dbRes.destination,
            accommodationName: dbRes.accommodation_name,
            checkIn: dbRes.check_in,
            checkOut: dbRes.check_out,
            nights: dbRes.nights,
            paxCount: dbRes.pax_count,
            totalPrice: dbRes.total_price,
            paid: dbRes.paid,
            currency: dbRes.currency,
            createdAt: dbRes.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
            supplier: dbRes.supplier,
            tripType: dbRes.trip_type,
            phone: dbRes.phone,
            email: dbRes.email,
            hotelNotified: dbRes.hotel_notified,
            reservationConfirmed: dbRes.reservation_confirmed,
            proformaInvoiceSent: dbRes.proforma_invoice_sent,
            finalInvoiceCreated: dbRes.final_invoice_created,
            hotelCategory: dbRes.hotel_category,
            leadPassenger: dbRes.lead_passenger,
            repChecked: dbRes.rep_checked,
            repCheckedAt: dbRes.rep_checked_at,
            repCheckedBy: dbRes.rep_checked_by,
            repInternalNote: dbRes.rep_internal_note,
            supplierDeadline: dbRes.supplier_deadline,
            clientDeadline: dbRes.client_deadline,
            cancellationPolicy: dbRes.cancellation_policy_json,
            items: (dbRes.guests_data as any)?.tripItems || [],
            supplierRef: dbRes.booking_id || (dbRes.guests_data as any)?.tripItems?.[0]?.supplierRef || ''
        };
    };

    // Učitavanje rezervacija iz baze
    useEffect(() => {
        const loadReservationsFromDatabase = async () => {
            setIsLoadingReservations(true);
            setSyncStatus('syncing');

            try {
                // If subagent or impersonated, filter by their email
                const authState = useAuthStore.getState();
                const userEmail = authState.impersonatedSubagent?.email || authState.userEmail;
                const result = await getUserReservations((isSubagent || authState.impersonatedSubagent) ? userEmail : undefined);

                if (result.success && result.data && result.data.length > 0) {
                    // Mapiranje database rezervacija u UI format
                    const mappedReservations = result.data.map(mapDatabaseToReservation);

                    // Kombinovanje sa mock podacima (opciono - možete ukloniti mockReservations ako želite samo prave podatke)
                    const allReservations = [...mappedReservations, ...mockReservations];

                    setReservations(allReservations);
                    console.log(`✅ Učitano ${mappedReservations.length} rezervacija iz baze`);
                } else {
                    // Ako nema podataka u bazi, koristi mock podatke
                    console.log('ℹ️ Nema rezervacija u bazi, koriste se mock podaci');
                    setReservations(mockReservations);
                }

                setSyncStatus('synced');
            } catch (error) {
                console.error('❌ Greška pri učitavanju rezervacija:', error);
                setSyncStatus('error');
                // U slučaju greške, koristi mock podatke
                setReservations(mockReservations);
            } finally {
                setIsLoadingReservations(false);
            }
        };

        loadReservationsFromDatabase();
    }, []); // Učitava se samo jednom pri mount-u

    // Sync State
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

    // Payment Status Filters
    const [paymentFilter, setPaymentFilter] = useState({
        paid: false,
        partial: false,
        unpaid: false
    });

    // Function to simulate update and trigger sync
    const handleReservationUpdate = (updatedRes: Reservation) => {
        setReservations(prev => prev.map(r => r.id === updatedRes.id ? updatedRes : r));

        // Trigger Sync
        setSyncStatus('syncing');
        setTimeout(() => {
            setSyncStatus('synced');
            console.log(`📡 WEBHOOK SENT: Reservation ${updatedRes.cisCode} updated. Data sent to external CRM.`);
            // Here you would do: fetch('https://external-system.com/webhook', { method: 'POST', body: JSON.stringify(updatedRes) })
        }, 1500);
    };

    // Handle adding search term on Enter
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            if (!searchTerms.includes(searchQuery.trim())) {
                setSearchTerms([...searchTerms, searchQuery.trim()]);
            }
            setSearchQuery('');
        }
    };

    // --- DIAGNOSTICS ---
    const testDbConnection = async () => {
        console.log('🕵️ Testiranje DB Konekcije...');
        try {
            // 1. Provera čitanja
            const { data: readData, error: readError } = await getUserReservations();
            if (readError) {
                console.error('❌ Greška pri čitanju:', readError);
                alert(`Greška pri čitanju iz baze: ${readError}`);
            } else {
                console.log('✅ Čitanje uspešno. Broj zapisa:', readData?.length);
            }

            // 2. Provera pisanja (Insert Test)
            const testCis = `TEST-${Date.now()}`;
            console.log('📝 Pokušavam insert testa:', testCis);
            const { data: insertData, error: insertError } = await import('../supabaseClient').then(({ supabase }) =>
                supabase.from('reservations').insert([{
                    cis_code: testCis,
                    ref_code: `REF-${Date.now()}`,
                    status: 'pending',
                    customer_name: 'Dijagnostika Test',
                    customer_type: 'B2C-Individual',
                    email: 'test@diagnostics.com',
                    phone: '123456',
                    destination: 'Test City',
                    accommodation_name: 'Test Hotel',
                    check_in: new Date().toISOString(),
                    check_out: new Date().toISOString(),
                    nights: 1,
                    pax_count: 1,
                    total_price: 100,
                    provider: 'solvex',
                    trip_type: 'Smeštaj',
                    supplier: 'Test'
                }]).select()
            );

            if (insertError) {
                console.error('❌ Greška pri pisanju:', insertError);
                alert(`Greška pri pisanju u bazu (RLS?): ${insertError.message}`);
            } else {
                console.log('✅ Pisanje uspešno:', insertData);
                alert('✅ Baza radi ispravno! (Read & Write test passed)');

                // Cleanup
                await import('../supabaseClient').then(({ supabase }) =>
                    supabase.from('reservations').delete().eq('cis_code', testCis)
                );
            }
        } catch (err) {
            console.error('❌ Neočekivana greška:', err);
            alert(`Neočekivana greška: ${err}`);
        }
    };

    const generateTestReservation = async () => {
        const confirmGen = window.confirm("Da li želite da generišete Test Rezervaciju sa aktivnim upozorenjima (Cancel Warning + Late Payment)?");
        if (!confirmGen) return;

        setSyncStatus('syncing');
        try {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const mockCancelPolicy = [
                { dateFrom: new Date().toISOString(), penaltyValue: 0, isPercent: true, description: "Besplatan otkaz do danas" },
                { dateFrom: new Date(Date.now() + 86400000).toISOString(), penaltyValue: 50, isPercent: true, description: "50% penala od sutra" },
                { dateFrom: new Date(Date.now() + 86400000 * 3).toISOString(), penaltyValue: 100, isPercent: true, description: "100% penala od prekosutra" }
            ];

            const fakeDossier = {
                cisCode: `REFAKT-TEST-${Date.now()}`,
                resCode: `0000010/2026`, // SPECIFIC REF REQUESTED BY USER
                status: 'Reservation',
                clientReference: `MOCK-DATA-XYZ`,
                booker: {
                    fullName: "Moc Podatak (Mock)",
                    email: "mock.user@example.com",
                    phone: "+381612345678",
                    address: "Test adresa 123",
                    city: "Novi Sad",
                    country: "Srbija"
                },
                passengers: [
                    { firstName: "Moc", lastName: "Podatak", type: "adult" }
                ],
                customerType: "B2C-Individual",
                tripItems: [{
                    id: `item-${Date.now()}`,
                    type: "Smestaj",
                    supplier: "Solvex",
                    subject: "Mock Hotel Premium", // Hotel name
                    city: "Sunny Beach",
                    country: "Bugarska",
                    checkIn: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
                    checkOut: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
                    supplierPaymentDeadline: yesterday.toISOString().split('T')[0], // YESTERDAY -> RED WARNING
                    bruttoPrice: 1250,
                    currency: "EUR",
                    stars: 5,
                    cancellationPolicy: mockCancelPolicy // ATTACH MOCK POLICY
                }],
                finance: {
                    currency: "EUR",
                    totalAmount: 1250,
                    payments: []
                },
                cancellationConfirmed: true,
                cancellationTimestamp: new Date().toISOString(),
                hotelNotified: false,
                proformaSent: false,
                invoiceCreated: false,
                insurance: {
                    guaranteePolicy: 'Triglav Osiguranje br. 990000123',
                    insurerContact: '+381 11 333 444',
                    insurerEmail: 'pomoć@triglav.rs',
                    cancellationOffered: true,
                    healthOffered: true,
                    confirmationText: 'Test confirmation',
                    confirmationTimestamp: new Date().toISOString()
                },
                logs: [
                    {
                        id: 'log-init',
                        timestamp: new Date().toISOString(),
                        operator: 'System',
                        action: 'Mock Rezervacija',
                        details: 'Ubačen mock podatak za testiranje cancel uslova.',
                        type: 'info'
                    }
                ],
                notes: {
                    general: 'Ovo je test rezervacija sa mock podacima.',
                    contract: '',
                    voucher: '',
                    internal: 'Proveriti dugme za cancel uslove u Arhitekti.'
                },
                language: 'Srpski'
            };

            const result = await saveDossierToDatabase(fakeDossier);

            if (result.success) {
                alert("✅ Test rezervacija uspešno kreirana! \n\nProverite 'Test Hotel With Warnings' u listi.\nPayment Deadline je podešen na JUČE (treba da bude CRVENO).");
                window.location.reload(); // Refresh to see it
            } else {
                alert("Greška: " + result.error);
            }

        } catch (e) {
            console.error(e);
            alert("Neočekivana greška pri generisanju.");
        } finally {
            setSyncStatus('idle');
        }
    };

    // Remove search term chip
    const removeSearchTerm = (term: string) => {
        setSearchTerms(searchTerms.filter(t => t !== term));
    };

    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false); // Export menu state

    // --- EXPORT LOGIC ---
    const getReservationsToExport = () => {
        // If bulk mode is active and items are selected, export only those
        if (bulkEmailMode && selectedReservations.length > 0) {
            return reservations.filter(r => selectedReservations.includes(r.id));
        }
        // Otherwise export current filtered results
        return filteredReservations;
    };

    const downloadFile = (content: string, fileName: string, contentType: string) => {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsExportMenuOpen(false);
    };

    const handleExport = (format: 'csv' | 'xml' | 'json' | 'html' | 'pdf') => {
        const data = getReservationsToExport();
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `ClickToTravelHub_Reservations_${timestamp}`;

        if (format === 'pdf') {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(18);
            doc.text('ClickToTravel Hub - Reservations Report', 14, 22);
            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleDateString('sr-RS')}`, 14, 30);

            // Table
            const tableColumn = ["CIS Code", "Customer", "Destination", "Accommodation", "Check In", "Total", "Status"];
            const tableRows = data.map(res => [
                res.cisCode,
                res.customerName,
                res.destination,
                res.accommodationName,
                res.checkIn,
                `${formatPrice(res.totalPrice)} ${res.currency}`,
                res.status
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                styles: { fontSize: 8 },
                headStyles: { fillColor: [41, 128, 185] } // Olympic Blueish
            });

            doc.save(`${fileName}.pdf`);
            setIsExportMenuOpen(false);
        } else if (format === 'json') {
            const jsonContent = JSON.stringify(data, null, 2);
            downloadFile(jsonContent, `${fileName}.txt`, 'text/plain');
        } else if (format === 'csv') {
            // Excel-compatible CSV with BOM
            const headers = ['CIS Code', 'Reference', 'Status', 'Customer', 'Type', 'Destination', 'Accommodation', 'Check In', 'Check Out', 'Nights', 'Pax', 'Total', 'Paid', 'Currency', 'Supplier', 'Trip Type'];
            const rows = data.map(r => [
                r.cisCode, r.refCode, r.status, r.customerName, r.customerType,
                r.destination, r.accommodationName, r.checkIn, r.checkOut,
                r.nights, r.paxCount, r.totalPrice, r.paid, r.currency,
                r.supplier, r.tripType
            ].map(val => `"${val}"`).join(',')); // Quote values

            const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
            downloadFile(csvContent, `${fileName}.csv`, 'text/csv;charset=utf-8;');
        } else if (format === 'xml') {
            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<reservations>
${data.map(r => `  <reservation>
    <cisCode>${r.cisCode}</cisCode>
    <refCode>${r.refCode}</refCode>
    <status>${r.status}</status>
    <customer>${r.customerName}</customer>
    <destination>${r.destination}</destination>
    <totalPrice currency="${r.currency}">${r.totalPrice}</totalPrice>
  </reservation>`).join('\n')}
</reservations>`;
            downloadFile(xmlContent, `${fileName}.xml`, 'text/xml');
        } else if (format === 'html') {
            const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h2>ClickToTravel Hub Reservations Export</h2>
    <p>Date: ${new Date().toLocaleDateString()}</p>
    <table>
        <thead>
            <tr>
                <th>CIS Code</th><th>Ref</th><th>Customer</th><th>Destination</th><th>Check In</th><th>Total</th><th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${data.map(r => `
            <tr>
                <td>${r.cisCode}</td>
                <td>${r.refCode}</td>
                <td>${r.customerName}</td>
                <td>${r.destination}</td>
                <td>${r.checkIn}</td>
                <td>${r.totalPrice} ${r.currency}</td>
                <td>${r.status}</td>
            </tr>`).join('')}
        </tbody>
    </table>
</body>
</html>`;
            downloadFile(htmlContent, `${fileName}.html`, 'text/html');
        }
    };

    // Clear all search terms
    const clearAllSearchTerms = () => {
        setSearchTerms([]);
        setSearchQuery('');
    };

    // Stats calculation

    // Filter reservations - MULTI-TERM DEEP SEARCH
    const filteredReservations = reservations.filter(res => {
        // 0. Payment Status Filter (New)
        const isPaid = res.paid >= res.totalPrice;
        const isUnpaid = res.paid === 0;
        const isPartial = res.paid > 0 && res.paid < res.totalPrice;

        const isPaymentFilterActive = paymentFilter.paid || paymentFilter.partial || paymentFilter.unpaid;

        if (isPaymentFilterActive) {
            const matchesPayment =
                (paymentFilter.paid && isPaid) ||
                (paymentFilter.partial && isPartial) ||
                (paymentFilter.unpaid && isUnpaid);

            if (!matchesPayment) return false;
        }

        // Multi-term search - ALL terms must match (AND logic)
        if (searchTerms.length > 0) {
            const allFieldsText = [
                res.cisCode,
                res.refCode,
                res.customerName,
                res.destination,
                res.accommodationName,
                res.supplier,
                res.tripType,
                res.status,
                res.phone,
                res.email,
                res.currency,
                res.customerType,
                res.leadPassenger || ''
            ].join(' ').toLowerCase();

            // Check if ALL search terms are present
            const allTermsMatch = searchTerms.every(term =>
                allFieldsText.includes(term.toLowerCase())
            );

            if (!allTermsMatch) return false;
        }

        // Date filters - Reservation Date
        if (activeFilters.reservationFrom && res.createdAt < activeFilters.reservationFrom) {
            return false;
        }
        if (activeFilters.reservationTo && res.createdAt > activeFilters.reservationTo) {
            return false;
        }

        // Date filters - Stay Date
        if (activeFilters.stayFrom && res.checkIn < activeFilters.stayFrom) {
            return false;
        }
        if (activeFilters.stayTo && res.checkOut > activeFilters.stayTo) {
            return false;
        }

        // Status filter
        // Status filter
        if (!activeFilters.status.includes('all') && !activeFilters.status.includes(res.status)) {
            return false;
        }

        // Customer Type filter
        if (!activeFilters.customerType.includes('all') && !activeFilters.customerType.includes(res.customerType)) {
            return false;
        }

        // Supplier filter
        if (!activeFilters.supplier.includes('all')) {
            const matches = activeFilters.supplier.some(selectedVal => res.supplier.includes(selectedVal));
            if (!matches) return false;
        }

        // Workflow filter (OR logic: match any selected flag)
        if (!activeFilters.workflow.includes('all')) {
            const matchesWorkflow = activeFilters.workflow.some(filter => {
                if (!filter.includes(':')) return (res as unknown as Record<string, unknown>)[filter] === true;
                const [key, valStr] = filter.split(':');
                const requiredVal = valStr === 'true';
                return (!!(res as unknown as Record<string, unknown>)[key]) === requiredVal;
            });
            if (!matchesWorkflow) return false;
        }

        // B2B Source Filter
        if (!activeFilters.b2bSource.includes('all')) {
            const isB2B = res.customerType === 'B2B-Subagent';
            const b2bMatch = activeFilters.b2bSource.includes(isB2B ? 'B2B' : 'B2C');
            if (!b2bMatch) return false;
        }

        // Trip Type Filter
        if (!activeFilters.tripType.includes('all')) {
            // Check if reservation trip type matches any of the active filters
            // We only have single select for now but logic supports array
            if (!activeFilters.tripType.includes(res.tripType)) return false;
        }

        return true;
    });

    const formatPrice = (val: number) => val.toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    /**
     * Financial Risk Tracker (Semafor)
     */
    const getPaymentRisk = (clientDeadline?: string, totalPrice?: number, paid?: number) => {
        const isPaid = (paid || 0) >= (totalPrice || 0);
        if (isPaid || !clientDeadline) return { level: 'none', color: 'transparent', opacity: 0, text: '' };

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(clientDeadline);
        deadline.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays > 14) return { level: 'safe', color: '#10b981', opacity: 0.1, text: `Dospeva za ${diffDays} dana` };
        if (diffDays <= 14 && diffDays > 7) return { level: 'soft-warning', color: '#10b981', opacity: 0.3, text: `Dospeva za ${diffDays} dana` };
        if (diffDays <= 7 && diffDays > 3) return { level: 'warning', color: '#f59e0b', opacity: 0.6, text: `ROK: ${diffDays} dana` };
        if (diffDays <= 3 && diffDays > 0) return { level: 'danger', color: '#f97316', opacity: 1, text: `HITNO: ${diffDays} d.` };
        if (diffDays === 0) return { level: 'critical', color: '#ef4444', opacity: 1, text: `DANAS JE ROK!` };
        return { level: 'expired', color: '#ef4444', opacity: 1, text: `KASNI: ${Math.abs(diffDays)} d.` };
    };

    // Stats calculation based on FILTERED results
    const stats = {
        total: filteredReservations.length,
        active: filteredReservations.filter(r => r.status === 'Active').length,
        reservation: filteredReservations.filter(r => r.status === 'Reservation').length,
        offer: filteredReservations.filter(r => r.status === 'Offer').length,
        request: filteredReservations.filter(r => r.status === 'Request').length,
        processing: filteredReservations.filter(r => r.status === 'Processing').length,
        canceled: filteredReservations.filter(r => r.status === 'Canceled').length,
        totalRevenue: filteredReservations.reduce((sum, r) => sum + r.totalPrice, 0),
        totalPaid: filteredReservations.reduce((sum, r) => sum + r.paid, 0),
        outstanding: filteredReservations.reduce((sum, r) => sum + (r.totalPrice - r.paid), 0),
        // Risk Counts
        criticalRisks: filteredReservations.filter(r => {
            const risk = getPaymentRisk(r.clientDeadline, r.totalPrice, r.paid).level;
            return risk === 'critical' || risk === 'expired';
        }).length,
        urgentRisks: filteredReservations.filter(r => getPaymentRisk(r.clientDeadline, r.totalPrice, r.paid).level === 'danger').length,
        warningRisks: filteredReservations.filter(r => getPaymentRisk(r.clientDeadline, r.totalPrice, r.paid).level === 'warning').length
    };

    const getStatusColor = (status: ResStatus) => {
        const colors = {
            'Active': '#10b981',
            'Reservation': '#3b82f6',
            'Canceled': '#ef4444',
            'Offer': '#94a3b8',
            'Request': '#a855f7',
            'Processing': '#f59e0b'
        };
        return colors[status];
    };

    const getStatusIcon = (status: ResStatus) => {
        switch (status) {
            case 'Active': return <CheckCheck size={14} />;
            case 'Reservation': return <CheckCircle2 size={14} />;
            case 'Canceled': return <XCircle size={14} />;
            case 'Offer': return <Tag size={14} />;
            case 'Request': return <Clock size={14} />;
            case 'Processing': return <RefreshCw size={14} className="animate-spin" />;
            default: return <Clock size={14} />;
        }
    };



    const getTripTypeIcon = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType.includes('smeštaj') || lowerType.includes('smestaj')) return <Building2 size={14} />;
        if (lowerType.includes('avio')) return <Plane size={14} />;
        if (lowerType.includes('paket')) return <Package size={14} />;
        if (lowerType.includes('putovanja')) return <Globe size={14} />;
        if (lowerType.includes('transfer')) return <Truck size={14} />;
        return <FileText size={14} />;
    };

    // Automation Logic
    const autoDetermineStatus = (res: Reservation): ResStatus => {
        if (res.paid > 0) return 'Active';
        if (res.totalPrice > 0 && res.paid === 0) return 'Reservation';
        if (res.hotelNotified) return 'Processing';
        return 'Request';
    };

    return (
        <div className="reservations-dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Rezervacije</h1>
                    <p className="subtitle">Centralni pregled i upravljanje statusima</p>
                </div>
                <button
                    className="btn-icon"
                    onClick={testDbConnection}
                    style={{
                        marginRight: '12px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                    title="Testiraj DB Konekciju"
                >
                    <RefreshCw size={20} />
                </button>
                <button
                    className="btn-icon"
                    onClick={() => setShowStats(!showStats)}
                    style={{
                        marginRight: '12px',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        background: showStats ? 'var(--bg-secondary)' : 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                    title={showStats ? "Sakrij statistiku" : "Prikaži statistiku"}
                >
                    {showStats ? <ChevronUp size={20} /> : <BarChart3 size={20} />}
                </button>
                <button className="btn-create-new" onClick={() => window.open('/reservation-architect', '_blank')}>
                    <Plus size={18} />
                    Nova Rezervacija
                </button>
            </header>

            {/* Stats Cards */}
            {/* Stats Overview */}
            {showStats && (
                <div className="stats-overview-container">

                    <div style={{ marginBottom: '4px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status Rezervacija</div>
                    <div className="stats-row-7">
                        {/* Total */}
                        <div className="stat-card">
                            <div className="stat-icon total"><FileText size={20} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Ukupno</span>
                                <span className="stat-value">{stats.total}</span>
                            </div>
                        </div>

                        {/* Active */}
                        <div className="stat-card">
                            <div className="stat-icon active"><CheckCircle2 size={20} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Aktivne</span>
                                <span className="stat-value">{stats.active}</span>
                            </div>
                        </div>

                        {/* Reservations */}
                        <div className="stat-card">
                            <div className="stat-icon reservation"><Briefcase size={20} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Rezervacije</span>
                                <span className="stat-value">{stats.reservation}</span>
                            </div>
                        </div>

                        {/* Offers */}
                        <div className="stat-card">
                            <div className="stat-icon offer"><Tag size={20} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Ponude</span>
                                <span className="stat-value">{stats.offer}</span>
                            </div>
                        </div>

                        {/* Requests */}
                        <div className="stat-card">
                            <div className="stat-icon requests"><AlertCircle size={20} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Zahtevi</span>
                                <span className="stat-value">{stats.request}</span>
                            </div>
                        </div>

                        {/* Processing */}
                        <div className="stat-card">
                            <div className="stat-icon processing"><Clock size={20} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Obrada</span>
                                <span className="stat-value">{stats.processing}</span>
                            </div>
                        </div>

                        {/* Canceled */}
                        <div className="stat-card">
                            <div className="stat-icon canceled"><XCircle size={20} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Otkazano</span>
                                <span className="stat-value">{stats.canceled}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={14} color="#f59e0b" />
                        Finansijski Semafor (Rizici Naplate)
                    </div>
                    <div className="stats-row-7">
                        {/* Critical / Expired */}
                        <div className="stat-card" style={{
                            background: stats.criticalRisks > 0 ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card)',
                            border: stats.criticalRisks > 0 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border)'
                        }}>
                            <div className="stat-icon" style={{ background: '#ef4444', color: 'white' }}><CloudLightning size={20} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Danas / Kasne</span>
                                <span className="stat-value" style={{ color: stats.criticalRisks > 0 ? '#ef4444' : 'inherit' }}>{stats.criticalRisks}</span>
                            </div>
                        </div>

                        {/* Urgent (3 days) */}
                        <div className="stat-card" style={{
                            background: stats.urgentRisks > 0 ? 'rgba(249, 115, 22, 0.05)' : 'var(--bg-card)',
                            border: stats.urgentRisks > 0 ? '1px solid rgba(249, 115, 22, 0.2)' : '1px solid var(--border)'
                        }}>
                            <div className="stat-icon" style={{ background: '#f97316', color: 'white' }}><AlertCircle size={20} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Hitno (do 3d)</span>
                                <span className="stat-value" style={{ color: stats.urgentRisks > 0 ? '#f97316' : 'inherit' }}>{stats.urgentRisks}</span>
                            </div>
                        </div>

                        {/* Warning (7 days) */}
                        <div className="stat-card">
                            <div className="stat-icon" style={{ background: '#f59e0b', color: 'white' }}><Clock size={20} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Najava (do 7d)</span>
                                <span className="stat-value">{stats.warningRisks}</span>
                            </div>
                        </div>

                        {/* Financial Totals */}
                        <div className="stat-card" style={{ gridColumn: 'span 2' }}>
                            <div className="stat-icon total"><DollarSign size={20} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Ukupno Dugovanje</span>
                                <span className="stat-value" style={{ fontSize: '1.2rem' }}>{formatPrice(stats.outstanding)} EUR</span>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Financials (Right Aligned) */}
                    <div style={{ marginBottom: '4px', marginTop: '12px', fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Finansijski Pregled</div>
                    <div className="stats-row-3">
                        {/* Revenue */}
                        <div className="stat-card">
                            <div className="stat-icon revenue"><TrendingUp size={24} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Ukupan Prihod</span>
                                <span className="stat-value">{formatPrice(stats.totalRevenue)} €</span>
                            </div>
                        </div>

                        {/* Paid */}
                        <div className="stat-card">
                            <div className="stat-icon paid"><CheckCircle2 size={24} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Naplaćeno</span>
                                <span className="stat-value">{formatPrice(stats.totalPaid)} €</span>
                            </div>
                        </div>

                        {/* Outstanding */}
                        <div className="stat-card">
                            <div className="stat-icon outstanding"><TrendingDown size={24} /></div>
                            <div className="stat-content">
                                <span className="stat-label">Preostalo</span>
                                <span className="stat-value">{formatPrice(stats.outstanding)} €</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Trip Type Filters */}
            <div className="trip-filters" style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                {[
                    { id: 'Smeštaj', label: 'Smeštaj', icon: <Building2 size={16} /> },
                    { id: 'Avio karte', label: 'Avio', icon: <Plane size={16} /> },
                    { id: 'Dinamički paket', label: 'Paket', icon: <Package size={16} /> },
                    { id: 'Putovanja', label: 'Putovanje', icon: <Globe size={16} /> },
                    { id: 'Transfer', label: 'Transfer', icon: <Truck size={16} /> },
                    { id: 'Čarter', label: 'Čarteri', icon: <Zap size={16} /> },
                    { id: 'Bus', label: 'Bus Ture', icon: <Compass size={16} /> },
                    { id: 'Krstarenje', label: 'Krstarenja', icon: <Ship size={16} /> }
                ].map(type => (
                    <button
                        key={type.id}
                        onClick={() => handleTripTypeFilter(type.id)}
                        className={`trip-filter-btn`}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            background: activeFilters.tripType.includes(type.id) ? 'var(--accent)' : 'var(--bg-card)',
                            color: activeFilters.tripType.includes(type.id) ? 'white' : 'var(--text-secondary)',
                            border: activeFilters.tripType.includes(type.id) ? 'none' : '1px solid var(--border)',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            whiteSpace: 'nowrap',
                            boxShadow: activeFilters.tripType.includes(type.id) ? '0 4px 12px rgba(14, 75, 94, 0.3)' : 'none'
                        }}
                    >
                        {type.icon}
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Advanced Search Module */}
            <div className="search-command-center">
                <div className="main-search-bar">
                    <input
                        type="text"
                        placeholder="Unesite pojam i pritisnite Enter da dodate filter..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        className="search-input"
                    />

                    {(searchQuery || searchTerms.length > 0) && (
                        <button className="clear-search" onClick={clearAllSearchTerms}>
                            <XIcon size={16} />
                        </button>
                    )}
                    <button
                        className="advanced-toggle"
                        onClick={() => setShowAdvancedSearch(true)}
                        style={{
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '0 12px',
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: (activeFilters.status[0] !== 'all' || activeFilters.reservationFrom || activeFilters.stayFrom) ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '13px',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Filter size={16} />
                        Filteri / Napredna Pretraga
                    </button>
                </div>

                {/* Search Terms Chips */}
                {searchTerms.length > 0 && (
                    <div className="search-chips" style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginTop: '12px',
                        padding: '12px',
                        background: 'var(--bg-sidebar)',
                        borderRadius: '12px'
                    }}>
                        {searchTerms.map((term, index) => (
                            <div
                                key={index}
                                className="search-chip"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: 'var(--accent)',
                                    color: 'white',
                                    borderRadius: '20px',
                                    fontSize: '12px',
                                    fontWeight: 700
                                }}
                            >
                                <Search size={12} />
                                {term}
                                <button
                                    onClick={() => removeSearchTerm(term)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        padding: '2px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <XIcon size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}


            </div>

            {/* Toolbar */}
            <div className="results-toolbar">
                <div className="results-count" style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '16px' }}>Pronađeno: <strong>{filteredReservations.length}</strong> rezervacija</span>

                    {/* Payment Status Filters */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setPaymentFilter(prev => ({ ...prev, paid: !prev.paid }))}
                            style={{
                                border: '1px solid #10b981',
                                background: paymentFilter.paid ? '#10b981' : 'transparent',
                                color: paymentFilter.paid ? 'white' : '#10b981',
                                fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
                                transition: 'all 0.2s', fontWeight: 600
                            }}
                        >
                            Sve uplaćeno €
                        </button>
                        <button
                            onClick={() => setPaymentFilter(prev => ({ ...prev, partial: !prev.partial }))}
                            style={{
                                border: '1px solid #f59e0b',
                                background: paymentFilter.partial ? '#f59e0b' : 'transparent',
                                color: paymentFilter.partial ? 'white' : '#f59e0b',
                                fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
                                transition: 'all 0.2s', fontWeight: 600
                            }}
                        >
                            Delimično €
                        </button>
                        <button
                            onClick={() => setPaymentFilter(prev => ({ ...prev, unpaid: !prev.unpaid }))}
                            style={{
                                border: '1px solid #ef4444',
                                background: paymentFilter.unpaid ? '#ef4444' : 'transparent',
                                color: paymentFilter.unpaid ? 'white' : '#ef4444',
                                fontSize: '11px', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer',
                                transition: 'all 0.2s', fontWeight: 600
                            }}
                        >
                            Bez uplate €
                        </button>
                    </div>

                    {/* B2B Source Filter Dropdown - ONLY FOR STAFF */}
                    {!isSubagent && (
                        <div style={{ marginLeft: '16px' }}>
                            <select
                                value={activeFilters.b2bSource[0]}
                                onChange={(e) => setActiveFilters(prev => ({ ...prev, b2bSource: [e.target.value] }))}
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-primary)',
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    outline: 'none'
                                }}
                            >
                                <option value="all">Svi Izvori Prodaje</option>
                                <option value="B2C">B2C (Direktna prodaja)</option>
                                <option value="B2B">B2B (Subagenti)</option>
                            </select>
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Bulk Email Controls */}
                    <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
                        <button
                            className={`advanced-toggle ${bulkEmailMode ? 'active' : ''}`}
                            onClick={() => {
                                setBulkEmailMode(!bulkEmailMode);
                                if (bulkEmailMode) setSelectedReservations([]);
                            }}
                            title="Grupno slanje emaila"
                        >
                            <Mail size={16} />
                            Grupni Email
                        </button>

                        {bulkEmailMode && selectedReservations.length > 0 && (
                            <>
                                <button
                                    className="btn-create-new"
                                    onClick={() => {
                                        setEmailModalOpen(true);
                                    }}
                                    style={{ padding: '8px 16px', fontSize: '12px' }}
                                >
                                    <Send size={14} />
                                    Pošalji za {selectedReservations.length}
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedReservations([]);
                                        setBulkEmailMode(false);
                                    }}
                                    style={{
                                        padding: '0 12px',
                                        height: '34px',
                                        fontSize: '12px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Poništi izbor"
                                >
                                    <XIcon size={16} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Live Sync Status */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginRight: '16px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: syncStatus === 'syncing' ? '#f59e0b' : '#10b981',
                        background: syncStatus === 'syncing' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '20px',
                        border: `1px solid ${syncStatus === 'syncing' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                        transition: 'all 0.3s ease'
                    }} title="Automatska sinhronizacija aktivna">
                        {syncStatus === 'syncing' ? (
                            <RefreshCw size={12} className="spin-animation" />
                        ) : (
                            <CloudLightning size={12} />
                        )}
                        {syncStatus === 'syncing' ? 'Syncing...' : 'Live Sync'}
                    </div>

                    <div className="export-wrapper" style={{ marginRight: '16px' }}>
                        <button
                            className="advanced-toggle"
                            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                            title="Export podataka"
                            style={{ gap: '6px' }}
                        >
                            <Download size={16} />
                            Export
                            <ChevronDown size={14} style={{ opacity: 0.5 }} />
                        </button>

                        {isExportMenuOpen && (
                            <div className="export-menu">
                                <button onClick={() => handleExport('csv')}>
                                    <Table size={14} style={{ marginRight: '8px', color: '#10b981' }} />
                                    Excel (CSV)
                                </button>
                                <button onClick={() => handleExport('xml')}>
                                    <Code size={14} style={{ marginRight: '8px', color: '#f59e0b' }} />
                                    XML Format
                                </button>
                                <button onClick={() => handleExport('json')}>
                                    <FileCode size={14} style={{ marginRight: '8px', color: '#8b5cf6' }} />
                                    JSON Data
                                </button>
                                <button onClick={() => handleExport('html')}>
                                    <Globe size={14} style={{ marginRight: '8px', color: '#3b82f6' }} />
                                    HTML Report
                                </button>
                                <button onClick={() => handleExport('pdf')}>
                                    <FileText size={14} style={{ marginRight: '8px', color: '#ef4444' }} />
                                    PDF Document
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        className="advanced-toggle"
                        onClick={generateTestReservation}
                        title="Generiši Test Rezervaciju (Cancel + Pay Warning)"
                        style={{ marginRight: '16px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)' }}
                    >
                        <CloudLightning size={16} />
                        Test (Warnings)
                    </button>

                    <div className="view-switcher">
                        <button
                            className={viewMode === 'list' ? 'active' : ''}
                            onClick={() => setViewMode('list')}
                            title="Lista"
                        >
                            <List size={18} />
                        </button>
                        <button
                            className={viewMode === 'grid' ? 'active' : ''}
                            onClick={() => setViewMode('grid')}
                            title="Kartice"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            className={viewMode === 'calendar' ? 'active' : ''}
                            onClick={() => setViewMode('calendar')}
                            title="Kalendar"
                        >
                            <CalendarDays size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className={`reservations-container view-${viewMode}`}>
                <AnimatePresence mode="wait">
                    {viewMode === 'list' && (
                        <motion.div
                            key="list"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={viewVariants}
                            className="list-view"
                        >
                            {filteredReservations.map(res => (
                                <div
                                    key={res.id}
                                    className={`reservation-row ${selectedReservations.includes(res.id) ? 'selected' : ''}`}
                                    onClick={() => window.open(`/reservation-architect?id=${res.id}`, '_blank')}
                                >
                                    {bulkEmailMode && (
                                        <div
                                            className="bulk-checkbox"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newSelection = selectedReservations.includes(res.id)
                                                    ? selectedReservations.filter(id => id !== res.id)
                                                    : [...selectedReservations, res.id];
                                                setSelectedReservations(newSelection);
                                            }}
                                            style={{
                                                marginRight: '16px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedReservations.includes(res.id)}
                                                readOnly
                                                style={{
                                                    width: '20px',
                                                    height: '20px',
                                                    cursor: 'pointer',
                                                    accentColor: 'var(--accent)'
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className="row-main">
                                        <div className="res-identity">
                                            <div className="res-codes">
                                                <span className="ref-code" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{res.refCode}</span>
                                                {res.supplierRef && (
                                                    <span className="supplier-ref" style={{
                                                        fontSize: '11px',
                                                        fontWeight: 800,
                                                        color: '#fbbf24',
                                                        background: 'rgba(251, 191, 36, 0.1)',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        marginTop: '4px',
                                                        display: 'inline-block'
                                                    }}>
                                                        EXT: {res.supplierRef}
                                                    </span>
                                                )}
                                                <span className="cis-code" style={{ color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 400, marginTop: '2px' }}>{res.cisCode}</span>
                                            </div>
                                            <div className="horizontal-status-tags" style={{ marginTop: '0px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <div
                                                    className="status-badge"
                                                    style={{
                                                        backgroundColor: 'var(--bg-card)',
                                                        color: 'var(--text-secondary)',
                                                        border: '1px solid var(--border)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    {res.tripType === 'Smeštaj' && <Building2 size={12} />}
                                                    {res.tripType === 'Avio karte' && <Plane size={12} />}
                                                    {res.tripType === 'Dinamički paket' && <Package size={12} />}
                                                    {res.tripType === 'Putovanja' && <Globe size={12} />}
                                                    {res.tripType === 'Transfer' && <Truck size={12} />}
                                                    {res.tripType === 'Čarter' && <Zap size={12} />}
                                                    {res.tripType === 'Bus' && <Compass size={12} />}
                                                    {res.tripType === 'Krstarenje' && <Ship size={12} />}
                                                    {res.tripType}
                                                </div>
                                                <div
                                                    className="status-badge"
                                                    style={{
                                                        backgroundColor: `${getStatusColor(res.status)}15`,
                                                        color: getStatusColor(res.status),
                                                        border: `1px solid ${getStatusColor(res.status)}30`,
                                                    }}
                                                >
                                                    {getStatusIcon(res.status)}
                                                    {res.status}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="res-customer">
                                            <div className="customer-name">
                                                <Users size={14} />
                                                {res.customerName}
                                            </div>
                                            {/* Lead Passenger Info - Show for B2B/Legal or if explicitly defined */}
                                            {(res.customerType === 'B2B-Subagent' || res.customerType === 'B2C-Legal' || (res.leadPassenger && res.leadPassenger !== res.customerName)) && res.leadPassenger && (
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', marginBottom: '2px' }}>
                                                    <User size={12} />
                                                    <span>Putnik: {res.leadPassenger}</span>
                                                </div>
                                            )}
                                            <div className="customer-meta">
                                                {res.customerType === 'B2B-Subagent' && <span className="type-badge b2b">B2B: {res.customerName}</span>}
                                                {res.customerType === 'B2C-Legal' && <span className="type-badge legal">Firma</span>}
                                                <span className="contact-info">
                                                    <Phone size={12} />
                                                    {res.phone}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Agency Column - ONLY FOR STAFF */}
                                        {!isSubagent && (
                                            <div className="res-agency" style={{ paddingLeft: '8px', display: 'flex', alignItems: 'center' }}>
                                                <div className="agency-name" style={{
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    color: res.customerType === 'B2B-Subagent' ? '#a855f7' : '#ff9800',
                                                    marginTop: '6px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px',
                                                    background: res.customerType === 'B2B-Subagent' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    border: `1px solid ${res.customerType === 'B2B-Subagent' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 152, 0, 0.2)'}`
                                                }}>
                                                    {res.customerType === 'B2B-Subagent' ? <Users size={12} /> : <Building2 size={12} />}
                                                    {res.customerType === 'B2B-Subagent' ? res.customerName : 'Direct Sales'}
                                                </div>
                                            </div>
                                        )}

                                        <div className="res-trip">
                                            <div className="trip-destination" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MapPin size={14} style={{ color: 'var(--accent)' }} />
                                                {res.destination}
                                            </div>

                                            {/* Display Multiple Items or Single Accommodation */}
                                            {res.items && res.items.length > 0 ? (
                                                <div className="res-items-compact" style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {res.items.map((item: TripItem) => (
                                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                            {getTripTypeIcon(item.type)}
                                                            <span style={{ fontWeight: 800, maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subject}</span>
                                                        </div>
                                                    ))}
                                                    {/* Category for items if available (checking first item for example) */}
                                                    {res.hotelCategory && res.hotelCategory > 0 && (
                                                        <div style={{ display: 'flex', gap: '1px', marginLeft: '22px' }}>
                                                            {[...Array(res.hotelCategory)].map((_, i) => (
                                                                <Star key={i} size={8} fill="#f59e0b" color="#f59e0b" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="accommodation-name" style={{
                                                    fontSize: '13px',
                                                    fontWeight: 800,
                                                    color: 'var(--text-secondary)',
                                                    marginTop: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}>
                                                    <Building2 size={12} style={{ marginRight: '4px', opacity: 0.7 }} />
                                                    <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.accommodationName}</span>

                                                    {res.hotelCategory && res.hotelCategory > 0 && (
                                                        <div style={{ display: 'flex', gap: '1px', marginLeft: '6px' }}>
                                                            {[...Array(res.hotelCategory)].map((_, i) => (
                                                                <Star key={i} size={8} fill="#f59e0b" color="#f59e0b" />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="trip-meta" style={{ marginTop: '6px' }}>
                                                <span className="supplier-badge" style={{
                                                    fontSize: '9px',
                                                    background: 'rgba(56, 189, 248, 0.08)',
                                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontWeight: 800,
                                                    color: '#38bdf8'
                                                }}>
                                                    {res.supplier}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="res-dates">
                                            <div className="date-range" style={{ fontSize: '13px', fontWeight: 800 }}>
                                                <Calendar size={14} style={{ color: 'var(--accent)' }} />
                                                <span>{new Date(res.checkIn).toLocaleDateString('sr-RS').replace(/\.$/, '')} - {new Date(res.checkOut).toLocaleDateString('sr-RS').replace(/\.$/, '')}</span>
                                            </div>
                                            <div className="nights-pax" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                <strong>{res.nights}</strong> noći • <strong>{res.paxCount}</strong> putnika
                                            </div>
                                        </div>

                                        <div className="res-finance">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>UKUPNO:</span>
                                                    <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-primary)' }}>{formatPrice(res.totalPrice)} {res.currency}</span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>PLAĆENO:</span>
                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>{formatPrice(res.paid)} {res.currency}</span>
                                                </div>

                                                {res.totalPrice - res.paid > 0 && (
                                                    <div style={{
                                                        marginTop: '4px',
                                                        padding: '4px 8px',
                                                        background: res.paid > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        border: `1px solid ${res.paid > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                                    }}>
                                                        <span style={{ fontSize: '9px', color: res.paid > 0 ? '#f59e0b' : '#ef4444', fontWeight: 800 }}>DUG:</span>
                                                        <span style={{ fontSize: '12px', fontWeight: 900, color: res.paid > 0 ? '#f59e0b' : '#ef4444' }}>
                                                            {formatPrice(res.totalPrice - res.paid)} {res.currency}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* FINANCIAL SEMAFORE - RISK TRACKER */}
                                                {(() => {
                                                    const risk = getPaymentRisk(res.clientDeadline, res.totalPrice, res.paid);
                                                    if (risk.level === 'none') return null;
                                                    return (
                                                        <div style={{
                                                            marginTop: '6px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            background: `${risk.color}${Math.round(risk.opacity * 25).toString(16).padStart(2, '0')}`,
                                                            padding: '4px 10px',
                                                            borderRadius: '20px',
                                                            border: `1px solid ${risk.color}40`,
                                                            animation: risk.level === 'critical' ? 'pulse-alert 2s infinite' : 'none'
                                                        }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: risk.color, boxShadow: `0 0 10px ${risk.color}` }} />
                                                            <span style={{ fontSize: '10px', fontWeight: 800, color: risk.color, whiteSpace: 'nowrap' }}>
                                                                {risk.text}
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row-actions">
                                        <div className="actions-stack">
                                            {/* Action Buttons */}
                                            <div className="action-buttons-group">
                                                {/* Reminder Triggers */}
                                                {res.totalPrice - res.paid > 0 && (
                                                    <>
                                                        <button
                                                            className="action-btn whatsapp"
                                                            title="Pošalji podsetnik na WhatsApp"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const msg = `Poštovani, podsećamo Vas da je rok za finalnu uplatu za Vaše putovanje (${res.accommodationName}) do ${new Date(res.clientDeadline || '').toLocaleDateString('sr-RS')}. Preostali iznos je ${formatPrice(res.totalPrice - res.paid)} ${res.currency}. Srdačan pozdrav, Vaš ClickToTravel.`;
                                                                window.open(`https://wa.me/${res.phone.replace(/\+/g, '').replace(/ /g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                                            }}
                                                            style={{ color: '#25D366', background: 'rgba(37, 211, 102, 0.1)' }}
                                                        >
                                                            <MessageCircle size={16} />
                                                        </button>
                                                        <button
                                                            className="action-btn viber"
                                                            title="Pošalji podsetnik na Viber"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                alert('Viber Desktop link se otvara...');
                                                                const msg = `Poštovani, podsećamo Vas da je rok za finalnu uplatu...`;
                                                                window.open(`viber://forward?text=${encodeURIComponent(msg)}`, '_blank');
                                                            }}
                                                            style={{ color: '#7360f2', background: 'rgba(115, 96, 242, 0.1)' }}
                                                        >
                                                            <Zap size={16} />
                                                        </button>
                                                    </>
                                                )}
                                                <button className="action-btn view" title="Pregled">
                                                    <Eye size={16} />
                                                </button>
                                                <button className="action-btn edit" title="Izmeni">
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    className="action-btn email"
                                                    title="Pošalji Email"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedReservation(res);
                                                        setEmailModalOpen(true);
                                                    }}
                                                >
                                                    <Mail size={16} />
                                                </button>
                                                <button className="action-btn download" title="Preuzmi">
                                                    <Download size={16} />
                                                </button>
                                            </div>

                                            {/* Workflow Status Icons */}
                                            <div className="workflow-status-group">
                                                <div
                                                    title="Najavljeno hotelu"
                                                    className={`workflow-dot ${res.hotelNotified ? 'completed' : 'pending'}`}
                                                >
                                                    <Bell size={12} />
                                                </div>
                                                <div
                                                    title="Potvrđena rezervacija"
                                                    className={`workflow-dot ${res.reservationConfirmed ? 'completed' : 'pending'}`}
                                                >
                                                    <CheckCheck size={12} />
                                                </div>
                                                <div
                                                    title="Poslata profaktura"
                                                    className={`workflow-dot ${res.proformaInvoiceSent ? 'completed' : 'pending'}`}
                                                >
                                                    <FileCheck size={12} />
                                                </div>
                                                <div
                                                    title="Kreiran konačni račun"
                                                    className={`workflow-dot ${res.finalInvoiceCreated ? 'completed' : 'pending'}`}
                                                >
                                                    <Receipt size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {viewMode === 'grid' && (
                        <motion.div
                            key="grid"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={viewVariants as any}
                            className="grid-view"
                        >
                            {filteredReservations.map((res: Reservation) => (
                                <div
                                    key={res.id}
                                    className="reservation-card"
                                    onClick={() => window.open(`/reservation-architect?id=${res.id}`, '_blank')}
                                >
                                    <div className="card-header">
                                        <div className="res-codes">
                                            <span className="ref-code">{res.refCode}</span>
                                            {res.supplierRef && <span className="supplier-ref" style={{
                                                fontSize: '11px', fontWeight: 700, color: '#fbbf24', background: 'rgba(251, 191, 36, 0.1)', padding: '1px 5px', borderRadius: '4px'
                                            }}>{res.supplierRef}</span>}
                                            <span className="cis-code">{res.cisCode}</span>
                                        </div>
                                        <div className="res-identity">
                                            <div
                                                className="status-badge"
                                                style={{
                                                    backgroundColor: 'var(--bg-card)',
                                                    color: 'var(--text-secondary)',
                                                    border: '1px solid var(--border)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '10px',
                                                    padding: '2px 6px',
                                                    marginBottom: '4px',
                                                    width: 'fit-content'
                                                }}
                                            >
                                                {res.tripType === 'Smeštaj' && <Building2 size={10} />}
                                                {res.tripType === 'Avio karte' && <Plane size={10} />}
                                                {res.tripType === 'Dinamički paket' && <Package size={10} />}
                                                {res.tripType === 'Putovanja' && <Globe size={10} />}
                                                {res.tripType === 'Transfer' && <Truck size={10} />}
                                                {res.tripType}
                                            </div>
                                            <div className={`status-badge ${res.status.toLowerCase()}`}>
                                                {res.status}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="card-customer">
                                        <h3>{res.customerName}</h3>
                                        <p>
                                            <MapPin size={14} style={{ color: 'var(--accent)' }} />
                                            {res.destination}
                                        </p>

                                        {res.items && res.items.length > 0 ? (
                                            <div className="res-items-compact" style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                                                {res.items.map((item: TripItem) => (
                                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                            {getTripTypeIcon(item.type)}
                                                            <span style={{ fontWeight: 800 }}>{item.subject}</span>
                                                        </div>
                                                        <span className="supplier-badge" style={{ fontSize: '9px', padding: '2px 6px' }}>{item.supplier}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="accommodation-name" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Building2 size={12} />
                                                <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.accommodationName}</span>
                                                {res.hotelCategory && res.hotelCategory > 0 && (
                                                    <div style={{ display: 'flex', gap: '1px', marginLeft: '6px' }}>
                                                        {[...Array(res.hotelCategory)].map((_, i) => (
                                                            <Star key={i} size={8} fill="#f59e0b" color="#f59e0b" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-dates">
                                        <Calendar size={14} />
                                        <span>{new Date(res.checkIn).toLocaleDateString('sr-RS')}</span>
                                        <ArrowUpDown size={10} style={{ opacity: 0.5 }} />
                                        <span>{new Date(res.checkOut).toLocaleDateString('sr-RS')}</span>
                                    </div>

                                    <div className="card-footer">
                                        <div className="card-finance">
                                            <div className="finance-row total">
                                                <span className="price">{formatPrice(res.totalPrice)} {res.currency}</span>
                                                <span className="pax">{res.paxCount} <Users size={12} /></span>
                                            </div>
                                            <div className="finance-row detail">
                                                <span className="paid-label">Uplaćeno:</span>
                                                <span className="paid-value">{formatPrice(res.paid)} {res.currency}</span>
                                            </div>
                                            {res.totalPrice - res.paid > 0 && (
                                                <div className="finance-row detail remaining">
                                                    <span className="due-label">Preostalo:</span>
                                                    <span className="due-value">{formatPrice(res.totalPrice - res.paid)} {res.currency}</span>
                                                </div>
                                            )}

                                            {/* FINANCIAL SEMAFORE */}
                                            {(() => {
                                                const risk = getPaymentRisk(res.clientDeadline, res.totalPrice, res.paid);
                                                if (risk.level === 'none') return null;
                                                return (
                                                    <div style={{
                                                        marginTop: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        background: `${risk.color}15`,
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        border: `1px solid ${risk.color}30`
                                                    }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: risk.color }} />
                                                        <span style={{ fontSize: '9px', fontWeight: 900, color: risk.color }}>
                                                            {risk.text}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="card-actions-wrapper">
                                            <div className="workflow-status-group" style={{ marginBottom: '8px' }}>
                                                <div title="Najavljeno" className={`workflow-dot mini ${res.hotelNotified ? 'completed' : 'pending'}`}>
                                                    <Bell size={10} />
                                                </div>
                                                <div title="Potvrđeno" className={`workflow-dot mini ${res.reservationConfirmed ? 'completed' : 'pending'}`}>
                                                    <CheckCheck size={10} />
                                                </div>
                                                <div title="Račun" className={`workflow-dot mini ${res.finalInvoiceCreated ? 'completed' : 'pending'}`}>
                                                    <Receipt size={10} />
                                                </div>
                                            </div>

                                            <div className="action-buttons-group">
                                                <button className="action-btn" title="Pregled" onClick={(e) => { e.stopPropagation(); window.open(`/reservation-architect?id=${res.id}`, '_blank'); }}>
                                                    <Eye size={14} />
                                                </button>
                                                <button className="action-btn" title="Email" onClick={(e) => { e.stopPropagation(); setSelectedReservation(res); setEmailModalOpen(true); }}>
                                                    <Mail size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {viewMode === 'calendar' && (
                        <motion.div
                            key="calendar"
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={viewVariants as any}
                            className="calendar-view"
                        >
                            {filteredReservations.length === 0 ? (
                                <div className="calendar-placeholder">
                                    <CalendarDays size={64} style={{ color: 'var(--accent)' }} />
                                    <h3>Nema Rezervacija</h3>
                                    <p>Nema rezervacija koje odgovaraju filterima</p>
                                </div>
                            ) : (
                                <div className="calendar-month-view">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
                                            <CalendarDays size={24} />
                                            Rezervacije po Datumima
                                        </h3>

                                        {/* Calendar View Mode Toggle */}
                                        <div style={{
                                            display: 'flex',
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border)',
                                            borderRadius: '10px',
                                            padding: '4px'
                                        }}>
                                            <button
                                                onClick={() => setCalendarViewMode('checkIn')}
                                                style={{
                                                    background: calendarViewMode === 'checkIn' ? 'var(--accent)' : 'transparent',
                                                    color: calendarViewMode === 'checkIn' ? 'white' : 'var(--text-secondary)',
                                                    border: 'none',
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Po datumu dolaska
                                            </button>
                                            <button
                                                onClick={() => setCalendarViewMode('checkOut')}
                                                style={{
                                                    background: calendarViewMode === 'checkOut' ? 'var(--accent)' : 'transparent',
                                                    color: calendarViewMode === 'checkOut' ? 'white' : 'var(--text-secondary)',
                                                    border: 'none',
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    fontSize: '13px',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                Po datumu odlaska
                                            </button>
                                        </div>
                                    </div>

                                    {/* Group reservations by check-in or check-out date */}
                                    {(() => {
                                        // Group by date (checkIn or checkOut based on mode)
                                        const reservationsByDate = filteredReservations.reduce((acc, res) => {
                                            const date = calendarViewMode === 'checkIn' ? res.checkIn : res.checkOut;
                                            if (!acc[date]) {
                                                acc[date] = [];
                                            }
                                            acc[date].push(res);
                                            return acc;
                                        }, {} as Record<string, typeof filteredReservations>);

                                        // Sort dates
                                        const sortedDates = Object.keys(reservationsByDate).sort();

                                        return (
                                            <div className="calendar-grid" style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                                gap: '16px'
                                            }}>
                                                {sortedDates.map(date => {
                                                    const dayReservations = reservationsByDate[date];
                                                    const totalRevenue = dayReservations.reduce((sum, r) => sum + r.totalPrice, 0);

                                                    // Count by type
                                                    const smestaj = dayReservations.filter(r => r.tripType === 'Smeštaj').length;
                                                    const avioKarte = dayReservations.filter(r => r.tripType === 'Avio karte').length;
                                                    const putovanja = dayReservations.filter(r => r.tripType === 'Putovanja').length;
                                                    const dinamickiPaketi = dayReservations.filter(r => r.tripType === 'Dinamički paket').length;
                                                    const transfer = dayReservations.filter(r => r.tripType === 'Transfer').length;

                                                    const dateObj = new Date(date);
                                                    const dayNum = dateObj.getDate();
                                                    const monthName = dateObj.toLocaleDateString('sr-RS', { month: 'short', year: 'numeric' });

                                                    return (
                                                        <div
                                                            key={date}
                                                            className="calendar-day-card"
                                                            onClick={() => {
                                                                // Show modal or expand with list of reservations
                                                                console.log('Show reservations for', date, dayReservations);
                                                            }}
                                                            style={{
                                                                background: 'var(--bg-card)',
                                                                border: '1px solid var(--border)',
                                                                borderRadius: '16px',
                                                                padding: '20px',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(-4px)';
                                                                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                                                                e.currentTarget.style.borderColor = 'var(--accent)';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = 'translateY(0)';
                                                                e.currentTarget.style.boxShadow = 'none';
                                                                e.currentTarget.style.borderColor = 'var(--border)';
                                                            }}
                                                        >
                                                            {/* Date Header */}
                                                            <div style={{
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                marginBottom: '16px',
                                                                paddingBottom: '12px',
                                                                borderBottom: '1px solid var(--border)'
                                                            }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <div style={{
                                                                        fontSize: '32px',
                                                                        fontWeight: 900,
                                                                        color: 'var(--accent)',
                                                                        lineHeight: 1
                                                                    }}>
                                                                        {dayNum}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                                                                            {monthName}
                                                                        </div>
                                                                        <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                                            {dayReservations.length} rezervacija
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div style={{
                                                                    background: 'var(--accent)',
                                                                    color: 'white',
                                                                    padding: '6px 12px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '12px',
                                                                    fontWeight: 900
                                                                }}>
                                                                    {formatPrice(totalRevenue)} EUR
                                                                </div>
                                                            </div>

                                                            {/* Statistics */}
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                {smestaj > 0 && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                                                                            <Building2 size={14} />
                                                                            Smeštaj
                                                                        </span>
                                                                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{smestaj}</span>
                                                                    </div>
                                                                )}
                                                                {avioKarte > 0 && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                                                                            <Plane size={14} />
                                                                            Avio karte
                                                                        </span>
                                                                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{avioKarte}</span>
                                                                    </div>
                                                                )}
                                                                {putovanja > 0 && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                                                                            <Globe size={14} />
                                                                            Putovanja
                                                                        </span>
                                                                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{putovanja}</span>
                                                                    </div>
                                                                )}
                                                                {dinamickiPaketi > 0 && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                                                                            <Package size={14} />
                                                                            Dinamički paketi
                                                                        </span>
                                                                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{dinamickiPaketi}</span>
                                                                    </div>
                                                                )}
                                                                {transfer > 0 && (
                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                                                                            <Truck size={14} />
                                                                            Transfer
                                                                        </span>
                                                                        <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{transfer}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            {/* Email Modal */}
            {emailModalOpen && (
                <ReservationEmailModal
                    isOpen={emailModalOpen}
                    onClose={() => {
                        setEmailModalOpen(false);
                        setSelectedReservation(null);
                        // Don't clear selectedReservations yet so user doesn't lose selection if they cancel
                    }}
                    reservations={
                        selectedReservation
                            ? [{
                                cisCode: selectedReservation.cisCode,
                                customerName: selectedReservation.customerName,
                                supplier: selectedReservation.supplier,
                                email: selectedReservation.email
                            }]
                            : mockReservations
                                .filter(res => selectedReservations.includes(res.id))
                                .map(res => ({
                                    cisCode: res.cisCode,
                                    customerName: res.customerName,
                                    supplier: res.supplier,
                                    email: res.email
                                }))
                    }
                    isBulk={selectedReservations.length > 1 || !selectedReservation}
                />
            )}


            {showAdvancedSearch && (
                <div className="modal-overlay" onClick={() => setShowAdvancedSearch(false)} style={{ overflow: 'hidden' }}>
                    <div
                        className="modal-content date-filter-modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            maxWidth: '1100px',
                            width: 'min(1100px, 95vw)',
                            maxHeight: '85vh',
                            transform: `translate(${modalPos.x}px, ${modalPos.y}px)`,
                            resize: 'both',
                            overflow: 'auto',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <div
                            className="modal-header"
                            onMouseDown={handleHeaderMouseDown}
                            style={{
                                cursor: isDragging ? 'grabbing' : 'grab',
                                userSelect: 'none',
                                position: 'sticky',
                                top: 0,
                                background: 'var(--bg-dark)',
                                zIndex: 10,
                                padding: '20px 24px'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Filter size={20} style={{ color: 'var(--accent)' }} />
                                <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Filteri i Napredna Pretraga</h2>
                            </div>
                            <button className="modal-close" onClick={() => setShowAdvancedSearch(false)}>×</button>
                        </div>

                        <div className="modal-body" style={{ padding: '30px', flex: 1 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

                                {/* Date Sections - Wide Side by Side */}
                                <div className="date-filter-section" style={{
                                    marginBottom: 0,
                                    padding: '20px',
                                    background: 'rgba(59, 130, 246, 0.03)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border)'
                                }}>
                                    <h3 style={{ marginBottom: '16px', fontSize: '15px' }}><Calendar size={18} /> Datum Rezervacije</h3>
                                    <DateRangeInput
                                        label="Period Rezervacije"
                                        startValue={activeFilters.reservationFrom}
                                        endValue={activeFilters.reservationTo}
                                        onChange={(start: string, end: string) => setActiveFilters({ ...activeFilters, reservationFrom: start, reservationTo: end })}
                                    />
                                </div>

                                <div className="date-filter-section" style={{
                                    marginBottom: 0,
                                    padding: '20px',
                                    background: 'rgba(16, 185, 129, 0.03)',
                                    borderRadius: '16px',
                                    border: '1px solid var(--border)'
                                }}>
                                    <h3 style={{ marginBottom: '16px', fontSize: '15px' }}><Calendar size={18} /> Datum Boravka</h3>
                                    <DateRangeInput
                                        label="Period Boravka"
                                        startValue={activeFilters.stayFrom}
                                        endValue={activeFilters.stayTo}
                                        onChange={(start: string, end: string) => setActiveFilters({ ...activeFilters, stayFrom: start, stayTo: end })}
                                    />
                                </div>

                                {/* Status and Customer Type Side by Side */}
                                <div className="date-filter-section" style={{ marginBottom: 0 }}>
                                    <h3><Tag size={18} /> Statusi</h3>
                                    <MultiSelectDropdown
                                        options={[
                                            { value: 'all', label: 'Svi Statusi' },
                                            { value: 'Active', label: 'Active' },
                                            { value: 'Reservation', label: 'Reservation' },
                                            { value: 'Request', label: 'Request' },
                                            { value: 'Processing', label: 'Processing' },
                                            { value: 'Offer', label: 'Offer' },
                                            { value: 'Canceled', label: 'Canceled' }
                                        ]}
                                        selected={activeFilters.status}
                                        onChange={(selected) => setActiveFilters({ ...activeFilters, status: selected })}
                                        placeholder="Svi Statusi"
                                    />
                                </div>

                                <div className="date-filter-section" style={{ marginBottom: 0 }}>
                                    <h3><Users size={18} /> Tip Kupca</h3>
                                    <MultiSelectDropdown
                                        options={[
                                            { value: 'all', label: 'Svi Tipovi' },
                                            { value: 'B2C-Individual', label: 'Individualni' },
                                            { value: 'B2B-Subagent', label: 'Subagent' },
                                            { value: 'B2C-Legal', label: 'Pravno Lice' }
                                        ]}
                                        selected={activeFilters.customerType}
                                        onChange={(selected) => setActiveFilters({ ...activeFilters, customerType: selected })}
                                        placeholder="Svi Tipovi"
                                    />
                                </div>

                                {/* Suppliers Full Width */}
                                <div className="date-filter-section" style={{ marginBottom: 0, gridColumn: 'span 2' }}>
                                    <h3><Building2 size={18} /> Dobavljači</h3>
                                    <MultiSelectDropdown
                                        options={[
                                            { value: 'all', label: 'Svi Dobavljači' },
                                            { value: 'TCT (Travelgate)', label: 'TCT (Travelgate)' },
                                            { value: 'Open Greece', label: 'Open Greece' },
                                            { value: 'Solvex', label: 'Solvex' },
                                            { value: 'Amadeus', label: 'Amadeus' }
                                        ]}
                                        selected={activeFilters.supplier}
                                        onChange={(selected) => setActiveFilters({ ...activeFilters, supplier: selected })}
                                        placeholder="Svi Dobavljači"
                                    />
                                </div>

                                {/* Workflow Status Section */}
                                <div className="date-filter-section" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                                    <h3><CheckCheck size={18} /> Workflow Faze</h3>
                                    <div className="workflow-grid-mobile" style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr auto auto',
                                        gap: '12px 60px',
                                        padding: '12px 20px',
                                        fontSize: '14px',
                                        alignItems: 'center',
                                        background: 'var(--bg-card)',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <span style={{ fontWeight: 800, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Faza</span>
                                        <span style={{ fontWeight: 800, fontSize: '12px', color: '#10b981', textTransform: 'uppercase', letterSpacing: '1px' }}>Završeno</span>
                                        <span style={{ fontWeight: 800, fontSize: '12px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '1px' }}>Čeka</span>

                                        {[
                                            { key: 'hotelNotified', label: 'Poslata najava hotelu' },
                                            { key: 'reservationConfirmed', label: 'Rezervacija potvrđena' },
                                            { key: 'proformaInvoiceSent', label: 'Profaktura poslata kupcu' },
                                            { key: 'finalInvoiceCreated', label: 'Konačni račun kreiran' }
                                        ].map(item => (
                                            <React.Fragment key={item.key}>
                                                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.label}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={activeFilters.workflow.includes(`${item.key}:true`)}
                                                    onChange={() => toggleWorkflowFilter(item.key, true)}
                                                    style={{ accentColor: '#10b981', cursor: 'pointer', width: '22px', height: '22px' }}
                                                />
                                                <input
                                                    type="checkbox"
                                                    checked={activeFilters.workflow.includes(`${item.key}:false`)}
                                                    onChange={() => toggleWorkflowFilter(item.key, false)}
                                                    style={{ accentColor: '#ef4444', cursor: 'pointer', width: '22px', height: '22px' }}
                                                />
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer" style={{
                            position: 'sticky',
                            bottom: 0,
                            background: 'var(--bg-dark)',
                            zIndex: 10,
                            borderTop: '1px solid var(--border)',
                            padding: '20px 24px',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}>
                            <button className="btn-secondary" style={{ padding: '0 24px', height: '44px' }} onClick={() => {
                                setActiveFilters({
                                    status: ['all'],
                                    reservationFrom: '',
                                    reservationTo: '',
                                    stayFrom: '',
                                    stayTo: '',
                                    customerType: ['all'],
                                    supplier: ['all'],
                                    workflow: ['all'],
                                    b2bSource: ['all'],
                                    tripType: ['all']
                                });
                            }}>
                                Poništi Sve
                            </button>
                            <button className="btn-primary" style={{ padding: '0 32px', height: '44px' }} onClick={() => setShowAdvancedSearch(false)}>
                                Primeni Filtere
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationsDashboard;
