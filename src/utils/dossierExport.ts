import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getTranslation } from './translations';
import type { Language } from './translations';
import { formatDate } from './dateUtils';

export const generateDossierPDF = (dossier: any, lang: Language = 'Srpski') => {
    const doc = new jsPDF();
    const t = getTranslation(lang);
    const { booker, passengers, tripItems, resCode, cisCode, finance } = dossier;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(102, 126, 234);
    doc.text(t.docTitle, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${t.resCode}: ${resCode || cisCode}`, 14, 30);
    doc.text(`${t.createdAt}: ${new Date().toLocaleDateString()}`, 14, 35);
    doc.line(14, 40, 196, 40);

    // Booker Info
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(t.booker, 14, 50);

    const bookerRows = [
        [`${t.fullName}:`, booker.fullName],
        [`${t.address}:`, `${booker.address}, ${booker.city}`],
        [`${t.phone}:`, booker.phone],
        [`${t.email}:`, booker.email]
    ];

    autoTable(doc, {
        startY: 55,
        body: bookerRows,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    let currentY = (doc as any).lastAutoTable?.finalY ?? 75;

    // Trip Items
    doc.setFontSize(14);
    doc.text(t.itinerary, 14, currentY + 10);

    const tripRows = tripItems.map((item: any) => {
        let desc = item.subject;

        if (item.type === 'Avio karte' && item.flightLegs && item.flightLegs.length > 0) {
            const legs = item.flightLegs.map((l: any) =>
                `${l.airline} ${l.flightNumber} | ${l.depAirport} ${l.depTime} -> ${l.arrAirport} ${l.arrTime}`
            ).join('\n');
            desc = (item.subject ? item.subject + '\n' : '') + legs;
        }

        return [
            item.type.toUpperCase(),
            desc,
            `${formatDate(item.checkIn)} - ${formatDate(item.checkOut)}`,
            `${item.city || ''} ${item.country || ''}`,
            item.mealPlan || item.details || '-'
        ];
    });

    autoTable(doc, {
        startY: currentY + 15,
        head: [[t.type, t.description, t.period, t.city, t.service]],
        body: tripRows,
        headStyles: { fillColor: [102, 126, 234] },
        styles: { overflow: 'linebreak', cellWidth: 'wrap' },
        columnStyles: { 1: { cellWidth: 70 } }
    });

    currentY = (doc as any).lastAutoTable?.finalY ?? currentY + 40;

    // Passengers
    doc.setFontSize(14);
    doc.text(t.travelers, 14, currentY + 10);

    const paxRows = passengers.map((p: any, i: number) => [
        i + 1,
        `${p.firstName} ${p.lastName}`,
        p.idNumber,
        formatDate(p.birthDate),
        p.type
    ]);

    autoTable(doc, {
        startY: currentY + 15,
        head: [['#', t.fullName, t.idNumber, t.birthDate, t.type]],
        body: paxRows,
        headStyles: { fillColor: [102, 126, 234] }
    });

    // Footer
    const totalBrutto = tripItems.reduce((sum: number, item: any) => sum + (item.bruttoPrice || 0), 0);
    doc.setFontSize(14);
    doc.text(`${t.totalPrice}: ${totalBrutto.toFixed(2)} ${finance.currency}`, 14, (doc as any).lastAutoTable?.finalY + 20);

    doc.save(`Rezervacija-${resCode || cisCode}-${lang}.pdf`);
};

export const generateDossierHTML = (dossier: any, lang: Language = 'Srpski') => {
    const t = getTranslation(lang);
    const { booker, passengers, tripItems, resCode, cisCode, finance } = dossier;
    const totalBrutto = tripItems.reduce((sum: number, item: any) => sum + (item.bruttoPrice || 0), 0);

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${t.docTitle}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 20px; }
                header { border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }
                h1 { color: #667eea; margin: 0; }
                .meta { color: #666; font-size: 0.9em; margin-top: 5px; }
                section { margin-bottom: 30px; }
                h2 { border-left: 4px solid #667eea; padding-left: 10px; font-size: 1.2em; color: #444; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
                th { background-color: #f8fafc; color: #667eea; font-weight: 600; }
                .total-box { background: #667eea; color: white; padding: 20px; border-radius: 8px; text-align: right; margin-top: 40px; }
            </style>
        </head>
        <body>
            <header>
                <h1>ClickToTravel Hub</h1>
                <p class="meta">${t.resCode}: ${resCode || cisCode} | ${t.createdAt}: ${new Date().toLocaleDateString()}</p>
            </header>

            <section>
                <h2>${t.booker}</h2>
                <table>
                    <tr><th>${t.fullName}</th><td>${booker.fullName}</td></tr>
                    <tr><th>${t.address}</th><td>${booker.address}, ${booker.city}</td></tr>
                    <tr><th>${t.phone}</th><td>${booker.phone}</td></tr>
                    <tr><th>${t.email}</th><td>${booker.email}</td></tr>
                </table>
            </section>

            <section>
                <h2>${t.itinerary}</h2>
                <table>
                    <thead>
                        <tr><th>${t.type}</th><th>${t.description}</th><th>${t.period}</th><th>${t.service}</th></tr>
                    </thead>
                    <tbody>
                        ${tripItems.map((item: any) => {
        let desc = item.subject;
        if (item.type === 'Avio karte' && item.flightLegs && item.flightLegs.length > 0) {
            const legs = item.flightLegs.map((l: any) =>
                `<div><small>✈ ${l.airline} ${l.flightNumber} | ${l.depAirport} ${l.depTime} &rarr; ${l.arrAirport} ${l.arrTime}</small></div>`
            ).join('');
            desc = (item.subject ? `<div><strong>${item.subject}</strong></div>` : '') + legs;
        } else {
            desc = `<strong>${item.subject}</strong>`;
        }

        return `
                            <tr>
                                <td>${item.type.toUpperCase()}</td>
                                <td>${desc}</td>
                                <td>${formatDate(item.checkIn)} - ${formatDate(item.checkOut)}</td>
                                <td>${item.mealPlan || item.details || '-'}</td>
                            </tr>
                        `;
    }).join('')}
                    </tbody>
                </table>
            </section>

            <section>
                <h2>${t.travelers}</h2>
                <table>
                    <thead>
                        <tr><th>#</th><th>${t.fullName}</th><th>${t.idNumber}</th><th>${t.birthDate}</th></tr>
                    </thead>
                    <tbody>
                        ${passengers.map((p: any, i: number) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${p.firstName} ${p.lastName}</td>
                                <td>${p.idNumber}</td>
                                <td>${formatDate(p.birthDate)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>

            <div class="total-box">
                <p>${t.totalPrice}</p>
                <h3>${totalBrutto.toFixed(2)} ${finance.currency}</h3>
            </div>
        </body>
        </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rezervacija-${resCode || cisCode}-${lang}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};
