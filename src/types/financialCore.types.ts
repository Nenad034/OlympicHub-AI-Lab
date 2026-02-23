export type TipLica = 'FIZICKO' | 'PRAVNO';
export type AranzmanStatus = 'Aktivan' | 'Završen' | 'Storniran';
export type TipTroska = 'DIREKTAN' | 'OPSTI';

export interface Klijent {
    id: string; // UUID
    ime_prezime_naziv: string;
    pib_jmbg?: string | null;
    adresa?: string | null;
    email?: string | null;
    tip_lica: TipLica;
    created_at?: string;
}

export type AranzmanFile = {
    id: string; // UUID
    file_broj: string; // GR-2026-001
    naziv_putovanja?: string | null;
    datum_polaska?: string | null;
    datum_povratka?: string | null;
    organizator_id: string; // Sopstveni ili ID dobavljača
    status: AranzmanStatus;
    created_at?: string;
    updated_at?: string;
};

export type Uplata = {
    id: string; // UUID
    aranzman_id: string; // Relacija sa Aranzman
    klijent_id: string; // Relacija sa Klijent
    iznos_rsd: number;
    nacin_placanja: string; // Gotovina, Kartica, Prenos, VCC
    vreme_uplate?: string;
    pfr_broj?: string | null; // Za ESIR
    sef_id?: string | null; // Za e-Fakture
    je_konacni_racun: boolean;
    created_at?: string;
    updated_at?: string;
};

export type UlazniRacun = {
    id: string; // UUID
    aranzman_id: string; // Relacija sa Aranzman
    dobavljac_naziv: string;
    broj_fakture: string;
    iznos_valuta: number;
    valuta: string;
    kurs_na_dan: number;
    iznos_rsd_bruto: number; // Nabavna cena sa PDV
    tip_troska: TipTroska;
    vreme_unosa?: string;
    created_at?: string;
};

export type PoreskaEvidencijaCl35 = {
    id: string; // UUID
    aranzman_id: string; // Relacija
    ukupna_prodaja_rsd: number;
    ukupna_nabavka_rsd: number;
    bruto_marza: number;
    osnovica_pdv: number;
    pdv_iznos: number;
    datum_obracuna?: string;
};

// Dummy value to ensure Vite doesn't optimize away the module if it's imported poorly
export const FINANCIAL_TYPES_LOADED = true;
