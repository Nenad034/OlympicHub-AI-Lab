import type { Language } from '../utils/translations';

export type TripType = 'Smestaj' | 'Avio karte' | 'Dinamicki paket' | 'Putovanja' | 'Transfer' | 'Čarter' | 'Bus' | 'Krstarenje';
export type CustomerType = 'B2C-Individual' | 'B2C-Legal' | 'B2B-Subagent';
export type ResStatus = 'Active' | 'Reservation' | 'Canceled' | 'Offer' | 'Request' | 'Processing' | 'Zatvoreno';

export interface Passenger {
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

export interface FlightLeg {
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

export interface TripItem {
    id: string;
    type: TripType;
    supplier: string;
    country?: string;
    city?: string;
    subject: string; // Hotel name, Flight route, etc.
    details: string; // Room type, Flight class, etc.
    mealPlan?: string; // Meal plan (e.g. All Inclusive)
    accomType?: string; // Tip smeštaja (e.g. Hotel, Apartman)
    stars?: number; // Hotel category
    notes?: string; // Napomene za stavku
    supplierNotes?: string; // Napomena za dobavljača (stavka)
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
    cancellationPolicy?: any; // Stored cancellation policy JSON
    flightLegs?: FlightLeg[];
}

export interface CheckData {
    id: string;
    checkNumber: string;
    bank: string;
    amount: number;
    realizationDate: string;
}

export interface PaymentRecord {
    id: string;
    date: string;
    amount: number;
    currency: 'RSD' | 'EUR' | 'USD';
    method: 'Cash' | 'Card' | 'Transfer' | 'Check';
    receiptNo: string;
    fiscalReceiptNo?: string;
    registrationMark?: string;
    cardType?: 'Master' | 'Visa' | 'Dina' | 'American';
    cardNumber?: string;
    installmentsCount?: number;
    bankName?: string;
    payerName?: string;
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
    checks?: CheckData[];
}

export interface Installment {
    id: string;
    amount: number;
    dueDate: string;
    status: 'pending' | 'paid';
}

export interface ActivityLog {
    id: string;
    timestamp: string;
    operator: string;
    action: string;
    details: string;
    type: 'info' | 'warning' | 'success' | 'danger';
}

export interface Dossier {
    id: string;
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
        supplier: string;
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

export interface DossierCancellationModalProps {
    item: TripItem;
    onClose: () => void;
}

export interface PaymentEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    draft: PaymentRecord | null;
    setDraft: (p: PaymentRecord) => void;
    onSave: (p: PaymentRecord, shouldConfirm?: boolean) => void;
    dossier: Dossier;
}
