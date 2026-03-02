import { supabase } from '../supabaseClient';
import type { Uplata, UlazniRacun, PoreskaEvidencijaCl35 } from '../types/financialCore.types';

import { sefApiService } from './sefApiService';

console.log('[FinancialCoreService] Module loaded - v2 with SEF integration');
// Mocked Integrations for testing AI Agent flow
const ESIRService = {
    // Simuliramo pozivanje procesora fiskalnih računa za fizičko lice
    async izdajFiskalniRacun(iznos: number, klijentNaziv: string): Promise<string> {
        console.log(`[ESIR] Komunikacija sa Poreskom upravom... Zahtev za izdavanje na: ${iznos} RSD`);
        // Simulacija kašnjenja i generisanja PFR broja
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Random šansa za pad (za testiranje roll-back logike) - ovde je podešeno da uvek prođe
        const pfr = `PFR-${Math.random().toString(36).substring(2, 10).toUpperCase()}-2026`;
        return pfr;
    }
};

const SEFService = {
    async pretragaKompanije(pib: string): Promise<boolean> {
        const company = await sefApiService.checkCompany(pib);
        return !!company;
    },
    // Kategorija PDV na SEF-u za Član 35 je "AE".
    async posaljiAvansniRacunAE(iznos: number, pibKupca: string, napomena: string): Promise<string> {
        console.log(`[SEF] Slanje e-Fakture za Avans uplate. Klijent: ${pibKupca}. Iznos: ${iznos} RSD.`);
        console.log(`[SEF] Kategorija: AE. Napomena: ${napomena}`);

        const response = await sefApiService.uploadArticle35Invoice({
            amount: iznos,
            customerPib: pibKupca,
            category: 'AE',
            note: napomena
        });

        if (response.success) {
            return response.salesInvoiceId || `SEF-AV-${Math.random().toString().substring(2, 8).toUpperCase()}`;
        } else {
            throw new Error(response.error || "Greška pri slanju na SEF");
        }
    }
}

export const FinancialCoreService = {
    /**
     * KORAK B: REGISTRACIJA UPLATA (Fiskalizacija i SEF)
     * "Fiskalni Safety Switch": Ako uplata ne prođe kroz ESIR, ne knjiži se u bazu.
     */
    async evidentirajUplatu(
        aranzmanId: string,
        klijentId: string,
        tipLica: 'FIZICKO' | 'PRAVNO',
        pibJmbg: string | null,
        iznosRsd: number,
        nacinPlacanja: string,
        klijentNaziv: string
    ) {
        let pfrBroj = null;
        let sefId = null;

        // 1. Zavisno od tipa lica, okidamo servis
        if (tipLica === 'FIZICKO') {
            try {
                // Poziv ESIR-a PRE upisa u bazu (atomsko garantovanje)
                pfrBroj = await ESIRService.izdajFiskalniRacun(iznosRsd, klijentNaziv);
                if (!pfrBroj) {
                    throw new Error("Poreska Uprava nije vratila PFR broj! Transakcija se prekida.");
                }
            } catch (error) {
                console.error("ESIR GREŠKA:", error);
                throw error; // Prekida se sve, ništa se ne upisuje u bazu ("Lockdown" / Atomičnost)
            }
        } else {
            try {
                // Pravno lice ide na SEF
                sefId = await SEFService.posaljiAvansniRacunAE(
                    iznosRsd,
                    pibJmbg || 'Nepoznat PIB',
                    "Oporezivanje posebnim postupkom turističkih agencija po Članu 35 Zakona o PDV"
                );
            } catch (error) {
                console.error("SEF GREŠKA:", error);
                throw error;
            }
        }

        // 2. Nakon uspešnog okidanja servisa poreza, vršimo upis u bazu
        const { data, error } = await supabase
            .from('uplate')
            .insert({
                aranzman_id: aranzmanId,
                klijent_id: klijentId,
                iznos_rsd: iznosRsd,
                nacin_placanja: nacinPlacanja,
                pfr_broj: pfrBroj,
                sef_id: sefId
            })
            .select()
            .single();

        if (error) {
            // U realnom svetu, ovde bi morali stornirati fiskalni/SEF jer je pao upis baze!
            console.error("Greška pri upisu uplate u bazu:", error);
            throw new Error("Transakcija baze neuspešna.");
        }

        return data as Uplata;
    },

    /**
     * KORAK C: EVIDENCIJA ULAZNIH RAČUNA
     */
    async dodajUlazniRacun(
        aranzmanId: string,
        dobavljac: string,
        brojFakture: string,
        iznosValuta: number,
        valuta: string,
        kurs: number,
        tipTroska: 'DIREKTAN' | 'OPSTI' = 'DIREKTAN'
    ) {
        // Pretvaranje u RSD se obavlja automatski po pravilu Člana 35. Ceo iznos ulazi u nabavnu cenu!
        const iznosRsdBruto = iznosValuta * kurs;

        const { data, error } = await supabase
            .from('ulazni_racuni')
            .insert({
                aranzman_id: aranzmanId,
                dobavljac_naziv: dobavljac,
                broj_fakture: brojFakture,
                iznos_valuta: iznosValuta,
                valuta: valuta,
                kurs_na_dan: kurs,
                iznos_rsd_bruto: iznosRsdBruto,
                tip_troska: tipTroska
            })
            .select()
            .single();

        if (error) throw error;
        return data as UlazniRacun;
    },

    /**
     * KORAK D: ZATVARANJE DOSIJEA I "THE LOCKDOWN" PRAVILO + OBRAČUN PDV PO ČLANU 35
     */
    async obracunajPDV(aranzmanId: string, ugovorenaCenaRSD: number) {

        // 1. Povlačenje svih prihoda (uplata)
        const { data: uplate, error: errUplate } = await supabase
            .from('uplate')
            .select('iznos_rsd')
            .eq('aranzman_id', aranzmanId);

        if (errUplate) throw errUplate;

        // 2. Povlačenje svih direktnih troškova nabavke (Član 35)
        const { data: troskovi, error: errTroskovi } = await supabase
            .from('ulazni_racuni')
            .select('iznos_rsd_bruto')
            .eq('aranzman_id', aranzmanId)
            .eq('tip_troska', 'DIREKTAN');

        if (errTroskovi) throw errTroskovi;

        const ukupnoUplaceno = uplate.reduce((sum: number, u: any) => sum + Number(u.iznos_rsd), 0);
        const ukupnaNabavka = troskovi.reduce((sum: number, t: any) => sum + Number(t.iznos_rsd_bruto), 0);

        // LOCKDOWN PRAVILO: Uplaćeno mora biti jednako ugovorenoj ceni (Nema ostavljenih dugova putnika)
        // Radi bezbednosti za float aritmetiku, uzima se razlika manja od 1 rsd
        if (Math.abs(ukupnoUplaceno - ugovorenaCenaRSD) > 0.01) {
            throw new Error(`[LOCKDOWN] Zbir uplata (${ukupnoUplaceno} RSD) se ne poklapa sa ugovorenom cenom (${ugovorenaCenaRSD} RSD). Dosije se ne može zatvoriti!`);
        }

        // LOCKDOWN PRAVILO 2: Moramo imati bar 1 direktan trošak da bi marža postojala
        if (ukupnaNabavka === 0) {
            throw new Error("[LOCKDOWN] Nijedan direktni trošak (Ulazni račun za dobavljača) nije unet za ovaj aranžman!");
        }

        const brutoMarza = ukupnoUplaceno - ukupnaNabavka;
        let pdvIznos = 0;
        let osnovicaPdv = 0;

        // Obračun preračunatom stopom samo na maržu iznad 0 (Član 35, stav 8)
        if (brutoMarza > 0) {
            // Obračunavanje unutrašnjeg poreza: PDV = Marža * 20 / 120
            pdvIznos = brutoMarza - (brutoMarza / 1.20);
            osnovicaPdv = brutoMarza - pdvIznos;
        } else {
            // "Porez se ne plaća kod negativne marže"
            pdvIznos = 0;
            osnovicaPdv = 0;
        }

        // 3. Zapisujemo poresku obavezu u bazu
        const evidencijaPayload = {
            aranzman_id: aranzmanId,
            ukupna_prodaja_rsd: ukupnoUplaceno,
            ukupna_nabavka_rsd: ukupnaNabavka,
            bruto_marza: brutoMarza,
            osnovica_pdv: osnovicaPdv,
            pdv_iznos: pdvIznos,
            datum_obracuna: new Date().toISOString()
        };

        const { data: poreskaEvidencija, error: evidencijaErr } = await supabase
            .from('poreska_evidencija_cl35')
            // upsert se koristi da bismo mogli obrisati i ponoviti obrčun ako je u isto testiranje
            .upsert([evidencijaPayload], { onConflict: 'aranzman_id' })
            .select()
            .single();

        if (evidencijaErr) {
            console.error("Greška pri upisu u knjigu Člana 35:", evidencijaErr);
            throw evidencijaErr;
        }

        return poreskaEvidencija as PoreskaEvidencijaCl35;
    }

};
