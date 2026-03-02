/**
 * TIPOVI ZA SISTEM E-FAKTURA (SEF) REPUBLIKE SRBIJE
 * U skladu sa UBL 2.1 standardom i tehničkim uputstvom Ministarstva Finansija.
 */

export interface SefCompany {
    pib: string;
    maticniBroj: string;
    naziv: string;
    adresa: string;
    grad: string;
    postanskiBroj: string;
    drzava: string;
    tipSubjekta: 'Javno' | 'Privatno' | 'Ostalo';
    status: 'Aktivan' | 'Neaktivan';
}

export interface SefInvoice {
    id: string; // SEF ID (UID)
    brojFakture: string;
    datumIzdavanja: string;
    datumDospeća: string;
    pibProdavca: string;
    nazivProdavca: string;
    pibKupca: string;
    nazivKupca: string;
    iznosRsd: number;
    valuta: string;
    status: 'Sent' | 'Approved' | 'Rejected' | 'Canceled' | 'Archived' | 'Draft';
    tipFakture: '380' | '381' | '383' | '384' | '386'; // 380-Kretidni, 381-Debetni, 383-Iznos, 386-Avansni
    urlPdf?: string;
    urlXml?: string;
}

export interface SefUploadResponse {
    success: boolean;
    purchaseInvoiceId?: string;
    salesInvoiceId?: string;
    pfrNumber?: string;
    error?: string;
    messages?: string[];
}

export interface SefCredentials {
    apiKey: string;
    environment: 'production' | 'demo';
}
