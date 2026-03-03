import { getTranslation } from './translations';
import type { Language } from './translations';
import { formatDate } from './dateUtils';

/**
 * Generates a premium HTML document suitable for A4 printing.
 * Types supported: 'SUMMARY' | 'PROFORMA' | 'CONTRACT' | 'VOUCHER'
 */
export const generatePremiumDocument = (dossier: any, type: 'SUMMARY' | 'PROFORMA' | 'CONTRACT' | 'VOUCHER', lang: Language = 'Srpski') => {
    const t = getTranslation(lang);
    const { booker, passengers, tripItems, resCode, cisCode, finance, notes } = dossier;
    const totalBrutto = tripItems.reduce((sum: number, item: any) => sum + (item.bruttoPrice || 0), 0);
    const dateStr = new Date().toLocaleDateString('sr-RS');

    const getDocTitle = () => {
        switch (type) {
            case 'SUMMARY': return lang === 'Srpski' ? 'REZIME REZERVACIJE' : 'RESERVATION SUMMARY';
            case 'PROFORMA': return lang === 'Srpski' ? 'PROFAKTURA / PREDRAČUN' : 'PROFORMA INVOICE';
            case 'CONTRACT': return lang === 'Srpski' ? 'UGOVOR O PUTOVANJU' : 'TRAVEL CONTRACT';
            case 'VOUCHER': return lang === 'Srpski' ? 'PUTNI VAUČER (VOUCHER)' : 'TRAVEL VOUCHER';
            default: return 'DOKUMENT';
        }
    };

    const docTitle = getDocTitle();

    const html = `
<!DOCTYPE html>
<html lang="${lang === 'Srpski' ? 'sr' : 'en'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${docTitle} - ${cisCode}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800&display=swap');
        
        :root {
            --primary: #1e293b;
            --secondary: #64748b;
            --accent: #2563eb;
            --border: #e2e8f0;
            --bg-light: #f8fafc;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Inter', sans-serif; 
            line-height: 1.5; 
            color: var(--primary); 
            background: #fff;
            padding: 0;
            margin: 0;
        }

        .a4-page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0 auto;
            position: relative;
            background: white;
        }

        @media print {
            body { background: none; }
            .a4-page { margin: 0; padding: 15mm; width: 100%; border: none; box-shadow: none; }
            .no-print { display: none; }
            @page { margin: 0; size: A4; }
        }

        /* Header */
        header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--primary);
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .logo-img {
            height: 60px;
            width: auto;
            object-fit: contain;
        }

        .company-info h1 {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: var(--accent);
            margin-bottom: 5px;
        }

        .company-details {
            font-size: 10px;
            color: var(--secondary);
            font-weight: 500;
            line-height: 1.4;
        }

        .doc-meta {
            text-align: right;
        }

        .doc-meta h2 {
            font-size: 18px;
            font-weight: 800;
            color: var(--primary);
            margin-bottom: 5px;
        }

        .doc-meta p {
            font-size: 12px;
            font-weight: 600;
            color: var(--secondary);
        }

        /* Sections */
        section { margin-bottom: 25px; }

        .section-title {
            background: var(--primary);
            color: white;
            padding: 6px 12px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
            border-radius: 4px;
        }

        .grid-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }

        .info-group {
            font-size: 12px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            border-bottom: 1px solid var(--border);
        }

        .info-row span:first-child { color: var(--secondary); font-weight: 500; }
        .info-row span:last-child { font-weight: 600; }

        /* Table */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }

        th {
            background: var(--bg-light);
            text-align: left;
            padding: 10px;
            border-bottom: 2px solid var(--border);
            color: var(--secondary);
            font-weight: 700;
            text-transform: uppercase;
        }

        td {
            padding: 12px 10px;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
        }

        .itinerary-item h4 { font-size: 13px; font-weight: 700; margin-bottom: 3px; }
        .itinerary-item p { color: var(--secondary); font-size: 11px; }

        /* Total Box */
        .total-box {
            margin-left: auto;
            width: 300px;
            margin-top: 20px;
            border: 2px solid var(--primary);
            border-radius: 8px;
            padding: 15px;
            background: var(--bg-light);
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .total-row label { font-size: 12px; font-weight: 700; color: var(--secondary); }
        .total-row .amount { font-size: 20px; font-weight: 800; color: var(--accent); }

        /* Footer */
        footer {
            margin-top: 50px;
            border-top: 1px solid var(--border);
            padding-top: 20px;
            font-size: 9px;
            color: var(--secondary);
            text-align: center;
            line-height: 1.6;
        }

        @media screen {
            body { background: #e2e8f0; padding: 40px 0; }
            .a4-page { box-shadow: 0 20px 50px rgba(0,0,0,0.1); border-radius: 2px; }
            .no-print {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 100;
            }
            .print-btn {
                background: #2563eb;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 700;
                cursor: pointer;
                box-shadow: 0 4px 12px rgba(37,99,235,0.3);
            }
        }
    </style>
</head>
<body>
    <div class="no-print">
        <button class="print-btn" onclick="window.print()">ŠTAMPAJ DOKUMENT</button>
    </div>

    <div class="a4-page">
        <header>
            <div class="header-left">
                <img src="/clicktotravel.png" class="logo-img" alt="Logo" onerror="this.style.display='none'">
                <div class="company-info">
                    <h1>ClickToTravel</h1>
                    <div class="company-details">
                        ClickToTravel Hub | Prvomajska 1, 11000 Beograd<br>
                        PIB: 100012345 | Matični broj: 06009876 | TR: 160-123456-78 (Intesa)<br>
                        Tel: +381 11 123 4567 | Web: www.clicktotravel.rs | Email: hello@clicktotravel.rs<br>
                        Licenca: OTP 123/2026 kat. A
                    </div>
                </div>
            </div>
            <div class="doc-meta">
                <h2>${docTitle}</h2>
                <p>Broj: ${resCode || cisCode}</p>
                <p>Datum: ${dateStr}</p>
            </div>
        </header>

        <section>
            <div class="grid-info">
                <div class="info-group">
                    <div class="section-title">KLIJENT / UGOVARAČ</div>
                    <div class="info-row"><span>Ime i prezime:</span> <span>${booker.fullName}</span></div>
                    <div class="info-row"><span>Adresa:</span> <span>${booker.address || '-'}, ${booker.city || '-'}</span></div>
                    <div class="info-row"><span>Telefon:</span> <span>${booker.phone || '-'}</span></div>
                    <div class="info-row"><span>Email:</span> <span>${booker.email || '-'}</span></div>
                </div>
                <div className="info-group">
                    <div className="section-title">DETALJI REZERVACIJE</div>
                    <div className="info-row"><span>Sistemski kod:</span> <span>${cisCode}</span></div>
                    <div className="info-row"><span>Status:</span> <span>${dossier.status}</span></div>
                    <div className="info-row"><span>Referenca:</span> <span>${dossier.clientReference || '-'}</span></div>
                    <div className="info-row"><span>Agent:</span> <span>PrimeToClick Agent</span></div>
                </div>
            </div>
        </section>

        <section>
            <div class="section-title">PAN PUTOVANJA I USLUGE</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%">TIP</th>
                        <th style="width: 50%">OPIS I LOKACIJA</th>
                        <th style="width: 20%">PERIOD</th>
                        <th style="width: 15%">USLUGA</th>
                    </tr>
                </thead>
                <tbody>
                    ${tripItems.map((item: any) => `
                        <tr>
                            <td><strong>${item.type.toUpperCase()}</strong></td>
                            <td class="itinerary-item">
                                <h4>${item.subject}</h4>
                                <p>${item.city}, ${item.country}</p>
                                ${item.details ? `<p style="margin-top:5px; font-style:italic;">${item.details}</p>` : ''}
                            </td>
                            <td>${formatDate(item.checkIn)} - ${formatDate(item.checkOut)}</td>
                            <td>${item.mealPlan || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </section>

        <section>
             <div class="section-title">LISTA PUTNIKA</div>
             <table>
                <thead>
                    <tr>
                        <th style="width: 10%">#</th>
                        <th style="width: 40%">IME I PREZIME</th>
                        <th style="width: 25%">DOKUMENT (PASOŠ/LK)</th>
                        <th style="width: 25%">TIP PUTNIKA</th>
                    </tr>
                </thead>
                <tbody>
                    ${passengers.map((p: any, i: number) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td><strong>${p.firstName} ${p.lastName}</strong></td>
                            <td>${p.idNumber || '-'}</td>
                            <td>${p.type}</td>
                        </tr>
                    `).join('')}
                </tbody>
             </table>
        </section>

        ${type === 'PROFORMA' ? `
        <div class="total-box">
            <div class="total-row">
                <label>ZA UPLATU (${finance.currency}):</label>
                <div class="amount">${totalBrutto.toLocaleString('sr-RS', { minimumFractionDigits: 2 })}</div>
            </div>
        </div>
        <p style="font-size: 10px; color: var(--secondary); margin-top: 10px; font-style: italic;">
            * Profaktura je validna bez pečata i potpisa. Plaćanje izvršiti u roku od 48h na gore navedeni tekući račun.
        </p>
        ` : `
        <div class="total-box">
            <div class="total-row">
                <label>UKUPNA VREDNOST:</label>
                <div class="amount">${totalBrutto.toLocaleString('sr-RS', { minimumFractionDigits: 2 })} ${finance.currency}</div>
            </div>
        </div>
        `}

        <section style="margin-top: 30px;">
           <div class="section-title">NAPOMENE I USLOVI</div>
           <div style="font-size: 11px; white-space: pre-wrap; color: var(--secondary);">
${type === 'CONTRACT' ? (notes.contract || 'Opšti uslovi putovanja agencije Olympic Travel su sastavni deo ovog ugovora.') :
            type === 'VOUCHER' ? (notes.voucher || 'Vaučer je neophodno pokazati na recepciji hotela ili predstavniku na destinaciji.') :
                'Hvala Vam na poverenju. Želimo Vam srećan put!'}
           </div>
        </section>

        <footer>
            <strong>ClickToTravel Hub - Beograd</strong><br>
            PIB: 100012345 | Matični broj: 06009876 | Registar turizma: OTP 123/2026<br>
            Prvomajska 1, 11000 Beograd, Srbija | www.clicktotravel.rs<br>
            Dokument generisan digitalno putem ClickToTravel Hub sistema
        </footer>
    </div>
</body>
</html>
    `;

    // Open in new tab and print
    const win = window.open('', '_blank');
    if (win) {
        win.document.write(html);
        win.document.close();
    }
};

// Legacy support if needed
export const generateDossierPDF = (dossier: any, lang: Language = 'Srpski') => {
    generatePremiumDocument(dossier, 'SUMMARY', lang);
};

export const generateDossierHTML = (dossier: any, lang: Language = 'Srpski') => {
    generatePremiumDocument(dossier, 'SUMMARY', lang);
};
