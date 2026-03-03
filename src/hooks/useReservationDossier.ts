import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
    saveDossierToDatabase,
    getReservationById as apiGetReservationById
} from '../services/reservationService';
import { getReservation as getSolvexReservation } from '../integrations/solvex/api/solvexBookingService';
import supplierService from '../services/SupplierService';
import { NBS_RATES, DOCUMENT_TRACKER_DEFAULT } from '../constants/reservationArchitect';
import type {
    Dossier, TripItem, Passenger, ActivityLog,
    TripType, ResStatus, PaymentRecord, FlightLeg,
    CommunicationRecord
} from '../types/reservationArchitect';
import type { Language } from '../utils/translations';

export const useReservationDossier = (resId: string | null) => {
    const location = useLocation();

    // Initial Dossier State
    const [dossier, setDossier] = useState<Dossier>({
        id: 'NEW-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        cisCode: 'CIS-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        resCode: null,
        status: 'Request' as ResStatus,
        customerType: 'B2C-Individual',
        clientReference: 'REF-' + Math.floor(Math.random() * 10000),
        booker: {
            fullName: '',
            address: '',
            city: '',
            country: 'Srbija',
            idNumber: '',
            phone: '',
            email: '',
            companyPib: '',
            companyName: ''
        },
        passengers: [] as Passenger[],
        tripItems: [] as TripItem[],
        finance: {
            currency: 'EUR',
            installments: [],
            payments: [] as PaymentRecord[]
        },
        insurance: {
            guaranteePolicy: 'Triglav Osiguranje br. 990000123',
            insurerContact: '+381 11 333 444',
            insurerEmail: 'pomoć@triglav.rs',
            cancellationOffered: true,
            healthOffered: true,
            confirmationText: '',
            confirmationTimestamp: ''
        },
        logs: [] as ActivityLog[],
        notes: {
            general: '',
            contract: '',
            voucher: '',
            internal: '',
            financial: '',
            specialRequests: '',
            supplier: ''
        },
        documentTracker: DOCUMENT_TRACKER_DEFAULT,
        language: 'Srpski' as Language
    });

    const [isInitialized, setIsInitialized] = useState(false);
    const [history, setHistory] = useState<Dossier[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedDossier, setLastSavedDossier] = useState<Dossier | null>(null);
    const [originalDossier, setOriginalDossier] = useState<Dossier | null>(null);

    // Activity Log Helper
    const addLog = useCallback((action: string, details: string, type: ActivityLog['type'] = 'info') => {
        const newLog: ActivityLog = {
            id: 'log-' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString('sr-RS') + ' ' + new Date().toLocaleDateString('sr-RS'),
            operator: 'Nenad', // This should probably come from an auth store
            action,
            details,
            type
        };
        setDossier(prev => ({
            ...prev,
            logs: [newLog, ...(prev.logs || [])]
        }));
    }, []);

    const addCommunication = useCallback((record: Omit<CommunicationRecord, 'id' | 'timestamp'>) => {
        const newComm: CommunicationRecord = {
            id: 'comm-' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toLocaleTimeString('sr-RS') + ' ' + new Date().toLocaleDateString('sr-RS'),
            ...record
        };
        setDossier(prev => ({
            ...prev,
            communications: [newComm, ...(prev.communications || [])]
        }));
    }, []);

    // Initial Data Load
    useEffect(() => {
        async function initialize() {
            const allSuppliers = await supplierService.getAllSuppliers();
            const urlParams = new URLSearchParams(location.search);
            const resIdFromUrl = urlParams.get('id');
            const loadFrom = urlParams.get('loadFrom');

            let finalDossier = dossier;

            if (resIdFromUrl) {
                try {
                    const saved = localStorage.getItem('active_reservation_dossier');
                    let loadedData = null;

                    if (saved) {
                        const parsed = JSON.parse(saved);
                        if (parsed.resCode === resIdFromUrl) {
                            loadedData = parsed;
                        }
                    }

                    if (loadedData) {
                        setDossier(loadedData);
                        setLastSavedDossier(loadedData);
                        setOriginalDossier(loadedData);
                        setIsInitialized(true);
                        return;
                    }

                    const result = await apiGetReservationById(resIdFromUrl);
                    if (result.success && result.data) {
                        const dbRes = result.data;
                        const rawData = dbRes.guests_data as any;

                        if (rawData && rawData.booker && rawData.tripItems) {
                            finalDossier = {
                                ...dossier,
                                ...rawData,
                                logs: rawData.logs || dossier.logs || [],
                                insurance: rawData.insurance || dossier.insurance,
                                notes: rawData.notes || dossier.notes,
                                language: rawData.language || dossier.language || 'Srpski'
                            };
                        } else {
                            const guests = rawData?.guests || [];
                            const mainGuest = guests[0] || {};

                            finalDossier = {
                                ...dossier,
                                cisCode: dbRes.cis_code,
                                resCode: dbRes.ref_code || null,
                                repChecked: dbRes.rep_checked || false,
                                repCheckedAt: dbRes.rep_checked_at || '',
                                repCheckedBy: dbRes.rep_checked_by || '',
                                repInternalNote: dbRes.rep_internal_note || '',
                                clientReference: dbRes.booking_id || dossier.clientReference,
                                status: dbRes.status === 'confirmed' ? 'Active' : 'Request',
                                booker: {
                                    ...dossier.booker,
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
                                    details: 'Standard Room',
                                    checkIn: dbRes.check_in,
                                    checkOut: dbRes.check_out,
                                    netPrice: dbRes.total_price * 0.9,
                                    bruttoPrice: dbRes.total_price,
                                    supplierRef: dbRes.booking_id,
                                    cancellationPolicy: dbRes.cancellation_policy_json
                                }]
                            };
                        }
                        setDossier(finalDossier);
                        setLastSavedDossier(finalDossier);
                        setOriginalDossier(finalDossier);
                        setIsInitialized(true);
                        return;
                    }
                } catch (e) {
                    console.error('Failed to load reservation by ID', e);
                }
            }

            // Handle new reservation from search
            let loadData: any = null;
            if (location.state && (location.state as any).selectedResult) {
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

                finalDossier = {
                    ...dossier,
                    cisCode: loadData.cisCode || ('CIS-' + Math.random().toString(36).substr(2, 9).toUpperCase()),
                    clientReference: loadData.externalBookingCode || loadData.externalBookingId || ('REF-' + Math.floor(Math.random() * 10000)),
                    resCode: null,
                    tripItems: [
                        {
                            id: 't-' + Date.now(),
                            type: (res.tripType === 'Avio karte' || res.type === 'flight' || loadData.type === 'flight') ? 'Avio karte' : 'Smestaj',
                            supplier: res.source,
                            country: res.location.includes('Grčka') ? 'Grčka' : (res.location.includes(',') ? res.location.split(',').pop()?.trim() : res.location),
                            city: res.location.split(',')[0].trim(),
                            subject: res.name.replace(/\s*\(.*?\)\s*/g, ' ').replace(/Not defined/gi, '').replace(/_{1,}/g, ' ').replace(/\s+/g, ' ').trim(),
                            stars: typeof res.stars === 'number' ? res.stars : (isNaN(parseInt(res.stars)) ? 0 : parseInt(res.stars)),
                            details: loadData.selectedRoom?.name || 'Standard Room',
                            mealPlan: (res.mealPlan || loadData.selectedRoom?.mealPlan || '').replace('Standard Room', ''),
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
                                const checkInDate = new Date(searchParams.checkIn);
                                checkInDate.setDate(checkInDate.getDate() - 14);
                                return checkInDate < new Date() ? new Date().toISOString().split('T')[0] : checkInDate.toISOString().split('T')[0];
                            })(),
                            cancellationPolicyConfirmed: loadData.cancellationConfirmed || false,
                            cancellationPolicy: loadData.selectedRoom?.cancellationPolicy || loadData.selectedRoom?.cancellationPolicyRequestParams || null,
                            passengers: [...calculatedPassengers],
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
                    } : dossier.booker,
                    passengers: calculatedPassengers,
                    notes: {
                        ...dossier.notes,
                        general: loadData.specialRequests || ''
                    },
                    insurance: {
                        ...dossier.insurance,
                        confirmationText: loadData.confirmationText || '',
                        confirmationTimestamp: loadData.confirmationTimestamp || ''
                    }
                };

                setDossier(finalDossier);
                setLastSavedDossier(finalDossier);
                setOriginalDossier(finalDossier);

                if (loadData.cancellationConfirmed) {
                    setTimeout(() => {
                        addLog('Potvrda Otkaznih Uslova', `Putnik je prihvatio rizik od otkaznih troškova. Datum: ${loadData.cancellationTimestamp || 'N/A'}`, 'warning');
                    }, 1000);
                }

                setIsInitialized(true);
                return;
            }

            setIsInitialized(true);
        }

        initialize();
    }, [location.search, location.state, addLog]);

    // Track History & Auto-Save
    useEffect(() => {
        if (!isInitialized) return;

        // Debounced Save
        const timer = setTimeout(async () => {
            if (JSON.stringify(dossier) !== JSON.stringify(lastSavedDossier)) {
                setIsSaving(true);
                try {
                    // Simulating actual DB save
                    await saveDossierToDatabase(dossier as any);
                    localStorage.setItem('active_reservation_dossier', JSON.stringify(dossier));
                    setLastSavedDossier(dossier);
                    console.log('[Auto-Save] Dossier saved successfully.');
                } finally {
                    setIsSaving(false);
                }
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [dossier, lastSavedDossier, isInitialized]);

    // Maintain History (max 5 steps)
    const pushToHistory = useCallback((state: Dossier) => {
        setHistory(prev => {
            const newHistory = [state, ...prev];
            return newHistory.slice(0, 5);
        });
    }, []);

    const undo = useCallback(() => {
        if (history.length > 0) {
            const previous = history[0];
            setHistory(prev => prev.slice(1));
            setDossier(previous);
            addLog('Undo', 'Poništena poslednja izmena.', 'info');
        }
    }, [history, addLog]);

    const deepReset = useCallback(() => {
        if (originalDossier) {
            setDossier(originalDossier);
            setHistory([]);
            addLog('Reset', 'Dosije vraćen na početno stanje uz odobrenje administratora.', 'warning');
        }
    }, [originalDossier, addLog]);

    // Wrap setDossier to capture history
    const updateDossierState = (newDossier: Dossier | ((prev: Dossier) => Dossier)) => {
        setDossier(prev => {
            const next = typeof newDossier === 'function' ? newDossier(prev) : newDossier;
            if (JSON.stringify(prev) !== JSON.stringify(next)) {
                pushToHistory(prev);
            }
            return next;
        });
    };

    // Financial Calculations
    const financialStats = useMemo(() => {
        const brutto = dossier.tripItems.reduce((sum, item) => sum + (item.bruttoPrice || 0), 0);
        const net = dossier.tripItems.reduce((sum, item) => sum + (item.netPrice || 0), 0);
        const profit = brutto - net;
        const profitPerc = net > 0 ? (profit / net) * 100 : 0;
        const paid = (dossier.finance?.payments || []).reduce((sum, p) => {
            if (p.status === 'deleted') return sum;
            if (p.currency === dossier.finance.currency) return sum + (p.amount || 0);
            const amountInRsd = p.amountInRsd || ((p.amount || 0) * (p.exchangeRate || 1));
            const dossierCurrencyRate = NBS_RATES[dossier.finance.currency as keyof typeof NBS_RATES] || 1;
            return sum + (amountInRsd / dossierCurrencyRate);
        }, 0);
        const bal = brutto - paid;

        return {
            totalBrutto: brutto,
            totalNet: net,
            totalProfit: profit,
            profitPercent: profitPerc,
            totalPaid: paid,
            balance: bal
        };
    }, [dossier.tripItems, dossier.finance?.payments, dossier.finance.currency]);

    // Solvex Sync Logic
    useEffect(() => {
        if (!isInitialized) return;

        const solvexItem = dossier.tripItems.find(i =>
            i.supplier?.toLowerCase().includes('solvex') &&
            i.supplierRef &&
            (!i.solvexStatus || i.solvexStatus === 'Checking...')
        );

        if (solvexItem) {
            const performSync = async () => {
                try {
                    const res = await getSolvexReservation(solvexItem.supplierRef!);
                    if (res.success && res.data) {
                        updateDossierState(prev => ({
                            ...prev,
                            tripItems: prev.tripItems.map(ti => ti.id === solvexItem.id ? {
                                ...ti,
                                solvexStatus: res.data.Status,
                                solvexKey: res.data.ID
                            } : ti)
                        }));
                        addLog('Solvex Sync', `Automatski povučen status: ${res.data.Status}`, 'success');
                    }
                } catch (err) {
                    console.error('[Solvex Auto Sync Error]', err);
                }
            };
            const timer = setTimeout(performSync, 1500);
            return () => clearTimeout(timer);
        }
    }, [isInitialized, dossier.tripItems, addLog]);

    // Auto-status to Active
    useEffect(() => {
        if (isInitialized && dossier.status !== 'Canceled' && financialStats.totalPaid > 0 && dossier.status !== 'Active') {
            updateDossierState(prev => ({ ...prev, status: 'Active' }));
            addLog('Status Promenjen', 'Status rezervacije automatski promenjen u "Active" zbog evidentirane uplate.', 'info');
        }
    }, [financialStats.totalPaid, dossier.status, isInitialized, addLog]);

    const updateDossier = useCallback((updates: Partial<Dossier>) => {
        updateDossierState(prev => ({ ...prev, ...updates }));
    }, []);

    const updateTripItem = useCallback((itemId: string, updates: Partial<TripItem>) => {
        updateDossierState(prev => {
            const oldItem = prev.tripItems.find(item => item.id === itemId);
            const nextTripItems = prev.tripItems.map(item => item.id === itemId ? { ...item, ...updates } : item);

            // SMART AUTOMATION: Flight Change Detection
            if (oldItem?.type === 'Avio karte' && updates.checkIn && updates.checkIn !== oldItem.checkIn) {
                setTimeout(() => {
                    addLog('Smart Push', `Automatska notifikacija poslata klijentu zbog promene vremena leta: ${updates.checkIn}`, 'warning');
                }, 500);
            }

            return { ...prev, tripItems: nextTripItems };
        });
    }, [addLog, updateDossierState]);

    const removeTripItem = useCallback((id: string) => {
        updateDossierState(prev => {
            const itemToRemove = prev.tripItems.find(item => item.id === id);
            addLog('Brisanje Stavke', `Stavka "${itemToRemove?.subject}" (${itemToRemove?.type}) je uklonjena.`, 'danger');
            return { ...prev, tripItems: prev.tripItems.filter(t => t.id !== id) };
        });
    }, [addLog]);

    const addTripItem = useCallback((type: TripType) => {
        const newItem: TripItem = {
            id: Math.random().toString(),
            type,
            supplier: '',
            subject: '',
            details: '',
            checkIn: '',
            checkOut: '',
            netPrice: 0,
            bruttoPrice: 0,
            passengers: [...dossier.passengers]
        };
        updateDossierState(prev => ({ ...prev, tripItems: [...prev.tripItems, newItem] }));
        addLog('Dodavanje Stavke', `Nova stavka tipa "${type}" je dodata.`, 'info');
    }, [dossier.passengers, addLog]);

    return {
        dossier,
        setDossier: updateDossierState,
        updateDossier,
        updateTripItem,
        removeTripItem,
        addTripItem,
        financialStats,
        addLog,
        addCommunication,
        undo,
        deepReset,
        isHistoryAvailable: history.length > 0,
        isSaving,
        isInitialized
    };
};
