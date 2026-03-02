import axios from 'axios';
import type { SefCompany, SefInvoice, SefUploadResponse, SefCredentials } from '../types/sefTypes';

/**
 * SERVIS ZA KOMUNIKACIJU SA SISTEMOM E-FAKTURA (SEF) MINISTARSTVA FINANSIJA
 * Implementacija prema zvaničnom tehničkom uputstvu i Swagger dokumentaciji.
 */

const SEF_BASE_URLS = {
    production: 'https://efaktura.mfin.gov.rs',
    demo: 'https://demo.efaktura.mfin.gov.rs'
};

class SefApiService {
    private apiKey: string = '';
    private environment: 'production' | 'demo' = 'demo';

    /**
     * Postavlja kredencijale za aktivnu sesiju.
     * U realnom sistemu bi se ovi podaci vukli iz bezbednih podešavanja.
     */
    setCredentials(creds: SefCredentials) {
        this.apiKey = creds.apiKey;
        this.environment = creds.environment;
    }

    private getAuthHeader() {
        return {
            'apiKey': this.apiKey,
            'Content-Type': 'application/json'
        };
    }

    private getBaseUrl() {
        return SEF_BASE_URLS[this.environment];
    }

    /**
     * POST /api/publicApi/sales-invoice/ubl/upload 
     * Slanje i učitavanje izlazne e-Fakture u XML (UBL 2.1) formatu.
     */
    async uploadInvoiceXml(xmlContent: string, requestId: string): Promise<SefUploadResponse> {
        console.log(`[SEF-API] Šaljem XML na SEF (${this.environment}). Request ID: ${requestId}`);

        // U demo/mock modu simuliramo uspešan upload
        if (!this.apiKey) {
            await new Promise(r => setTimeout(r, 1500));
            return {
                success: true,
                salesInvoiceId: `SEF-INV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                messages: ['Uspješno otpremljeno na SEF - Demo okruženje']
            };
        }

        try {
            const response = await axios.post(`${this.getBaseUrl()}/api/publicApi/sales-invoice/ubl/upload`,
                { xml: xmlContent, requestId: requestId },
                { headers: this.getAuthHeader() }
            );
            return { success: true, ...response.data };
        } catch (error: any) {
            console.error('[SEF-API] Greška pri slanju fakture:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * GET /api/publicApi/sales-invoice
     * Preuzimanje liste ili specifične izlazne/ulazne fakture.
     */
    async getInvoices(filters: any = {}): Promise<SefInvoice[]> {
        console.log('[SEF-API] Preuzimam fakture sa SEF-a...');

        // Mock podaci za testiranje dok nema stvarnog API ključa
        if (!this.apiKey) {
            return [
                {
                    id: '129384-abc',
                    brojFakture: 'FAC-2026-001',
                    datumIzdavanja: '2026-03-01',
                    datumDospeća: '2026-03-15',
                    pibProdavca: '123456789',
                    nazivProdavca: 'MTS Globe',
                    pibKupca: '987654321',
                    nazivKupca: 'Fil Hub Agencija',
                    iznosRsd: 120000,
                    valuta: 'RSD',
                    status: 'Approved',
                    tipFakture: '380'
                }
            ];
        }

        try {
            const response = await axios.get(`${this.getBaseUrl()}/api/publicApi/sales-invoice`, {
                headers: this.getAuthHeader(),
                params: filters
            });
            return response.data as SefInvoice[];
        } catch (error) {
            console.error('[SEF-API] Greška pri preuzimanju faktura:', error);
            return [];
        }
    }

    /**
     * GET /api/publicApi/getAllCompanies
     * Provera registra kompanija na SEF portalu.
     */
    async checkCompany(pib: string): Promise<SefCompany | null> {
        console.log(`[SEF-API] Provera PIB-a: ${pib}`);

        if (!this.apiKey) {
            return {
                pib: pib,
                maticniBroj: '10293847',
                naziv: 'Test DOO d.o.o.',
                adresa: 'Knez Mihailova 1',
                grad: 'Beograd',
                postanskiBroj: '11000',
                drzava: 'Srbija',
                tipSubjekta: 'Privatno',
                status: 'Aktivan'
            };
        }

        try {
            const response = await axios.get(`${this.getBaseUrl()}/api/publicApi/getAllCompanies`, {
                headers: this.getAuthHeader(),
                params: { pib: pib }
            });
            return response.data as SefCompany;
        } catch (error) {
            console.error('[SEF-API] Kompanija nije pronađena ili API greška:', error);
            return null;
        }
    }

    /**
     * Specijalizovana metoda za slanje fakture po Članu 35 (Kategorija AE)
     */
    async uploadArticle35Invoice(data: any): Promise<SefUploadResponse> {
        // Ovde bi išla logika generisanja XML-a koji sadrži AE kategoriju poreza
        // Prema pravilima za turističke agencije.
        const mockXml = `<Invoice>... UBL 2.1 Content with AE Category for Margin Taxation ...</Invoice>`;
        return this.uploadInvoiceXml(mockXml, `REQ-${Date.now()}`);
    }
}

export const sefApiService = new SefApiService();
