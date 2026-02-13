import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
    UnifiedFlightOffer,
    HotelSelectionData,
    TransferSelectionData,
    ExtraSelectionData,
    BasicInfoData
} from '../types/packageSearch.types';
import { getTranslation } from './translations';
import type { Language } from './translations';

export interface ExportData {
    basicInfo: BasicInfoData;
    flights?: {
        outboundFlight?: UnifiedFlightOffer;
        returnFlight?: UnifiedFlightOffer;
        multiCityFlights?: UnifiedFlightOffer[];
        totalPrice: number;
    };
    hotels: HotelSelectionData[];
    transfers: TransferSelectionData[];
    extras: ExtraSelectionData[];
    totalPrice: number;
}

/**
 * Generate PDF Report
 */
export const generatePackagePDF = (data: ExportData, lang: Language = 'Srpski') => {
    const doc = new jsPDF();
    const t = getTranslation(lang);
    const { basicInfo, flights, hotels, transfers, extras, totalPrice } = data;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(102, 126, 234);
    doc.text(t.docTitle, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`${t.createdAt}: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.line(14, 35, 196, 35);

    // Basic Info
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(t.basicInfo, 14, 45);

    const infoRows = [
        [`${t.destinations}:`, basicInfo.destinations.map((d: any) => d.city).join(' / ')],
        [`${t.travelers}:`, `${basicInfo.travelers.adults} ${t.adults}, ${basicInfo.travelers.children} ${t.children}`],
        [`${t.budget}:`, `${basicInfo.budget} €`],
        [`${t.totalPrice}:`, `${totalPrice.toFixed(2)} €`]
    ];

    autoTable(doc, {
        startY: 50,
        body: infoRows,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    let currentY = (doc as any).lastAutoTable?.finalY ?? 65;

    // Flights
    if (flights) {
        doc.setFontSize(14);
        doc.text(t.flights, 14, currentY);

        const flightRows: any[] = [];
        if (flights.outboundFlight) {
            flights.outboundFlight.slices.forEach((s: any) => {
                flightRows.push([t.outbound, `${s.origin.city} - ${s.origin.name} (${s.origin.iataCode})`, `${s.destination.city} - ${s.destination.name} (${s.destination.iataCode})`, new Date(s.departure).toLocaleDateString()]);
            });
        }
        if (flights.returnFlight) {
            flights.returnFlight.slices.forEach((s: any) => {
                flightRows.push([t.return, `${s.origin.city} - ${s.origin.name} (${s.origin.iataCode})`, `${s.destination.city} - ${s.destination.name} (${s.destination.iataCode})`, new Date(s.departure).toLocaleDateString()]);
            });
        }
        if (flights.multiCityFlights) {
            flights.multiCityFlights.forEach((offer: UnifiedFlightOffer, idx: number) => {
                const s = offer.slices[0];
                flightRows.push([`Let ${idx + 1}`, `${s.origin.city} - ${s.origin.name} (${s.origin.iataCode})`, `${s.destination.city} - ${s.destination.name} (${s.destination.iataCode})`, new Date(s.departure).toLocaleDateString()]);
            });
        }

        autoTable(doc, {
            startY: currentY + 5,
            head: [[t.type, t.from, t.to, t.date]],
            body: flightRows,
            headStyles: { fillColor: [102, 126, 234] }
        });
        currentY = (doc as any).lastAutoTable?.finalY ?? currentY + 15;
    }

    // Hotels
    if (hotels.length > 0) {
        doc.setFontSize(14);
        doc.text(t.accommodation, 14, currentY);

        const hotelRows = hotels.map(h => [
            h.hotel.name,
            h.hotel.city,
            `${h.checkIn} - ${h.checkOut}`,
            `${h.nights} ${t.nights}`,
            h.mealPlan.name,
            `${h.totalPrice.toFixed(2)} €`
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [[t.hotel, t.city, t.period, t.nights, t.service, t.price]],
            body: hotelRows,
            headStyles: { fillColor: [102, 126, 234] }
        });
        currentY = (doc as any).lastAutoTable?.finalY ?? currentY + 15;
    }

    // Transfers & Extras
    if (transfers.length > 0 || extras.length > 0) {
        doc.setFontSize(14);
        doc.text(t.transfersAndExtras, 14, currentY);

        const otherRows: any[] = [];
        transfers.forEach(tobj => {
            otherRows.push([t.transfer, `${tobj.transfer.from} -> ${tobj.transfer.to}`, tobj.date, `${tobj.totalPrice.toFixed(2)} €`]);
        });
        extras.forEach(e => {
            otherRows.push([t.extraService, e.extra.name, e.date, `${e.totalPrice.toFixed(2)} €`]);
        });

        autoTable(doc, {
            startY: currentY + 5,
            head: [[t.type, t.description, t.date, t.price]],
            body: otherRows,
            headStyles: { fillColor: [102, 126, 234] }
        });
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(t.footerTag, 14, 285);
        doc.text(`${t.page} ${i} ${t.of} ${pageCount}`, 180, 285);
    }

    doc.save(`${t.docTitle.replace(/\s+/g, '-')}-${Date.now()}.pdf`);
};

/**
 * Generate HTML Report
 */
export const generatePackageHTML = (data: ExportData, lang: Language = 'Srpski') => {
    const t = getTranslation(lang);
    const { basicInfo, flights, hotels, transfers, extras, totalPrice } = data;

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
                .total-box h3 { margin: 0; font-size: 1.5em; }
                .footer { margin-top: 50px; text-align: center; color: #999; font-size: 0.8em; }
            </style>
        </head>
        <body>
            <header>
                <h1>ClickToTravel Hub</h1>
                <p class="meta">${t.docTitle} | ${t.createdAt}: ${new Date().toLocaleDateString()}</p>
            </header>

            <section>
                <h2>${t.basicInfo}</h2>
                <table>
                    <tr><th>${t.destinations}</th><td>${basicInfo.destinations.map((d: any) => d.city).join(' / ')}</td></tr>
                    <tr><th>${t.travelers}</th><td>${basicInfo.travelers.adults} ${t.adults}, ${basicInfo.travelers.children} ${t.children}</td></tr>
                    <tr><th>${t.budget}</th><td>${basicInfo.budget} €</td></tr>
                </table>
            </section>

            ${flights ? `
            <section>
                <h2>${t.flights}</h2>
                <table>
                    <thead>
                        <tr><th>${t.type}</th><th>${t.from}</th><th>${t.to}</th><th>${t.date}</th></tr>
                    </thead>
                    <tbody>
                        ${flights.outboundFlight?.slices.map((s: any) => `<tr><td>${t.outbound}</td><td>${s.origin.city}<br/><small>${s.origin.name}</small></td><td>${s.destination.city}<br/><small>${s.destination.name}</small></td><td>${new Date(s.departure).toLocaleDateString()}</td></tr>`).join('') || ''}
                        ${flights.returnFlight?.slices.map((s: any) => `<tr><td>${t.return}</td><td>${s.origin.city}<br/><small>${s.origin.name}</small></td><td>${s.destination.city}<br/><small>${s.destination.name}</small></td><td>${new Date(s.departure).toLocaleDateString()}</td></tr>`).join('') || ''}
                        ${flights.multiCityFlights?.map((offer: UnifiedFlightOffer, idx: number) => `<tr><td>Let ${idx + 1}</td><td>${offer.slices[0].origin.city}<br/><small>${offer.slices[0].origin.name}</small></td><td>${offer.slices[0].destination.city}<br/><small>${offer.slices[0].destination.name}</small></td><td>${new Date(offer.slices[0].departure).toLocaleDateString()}</td></tr>`).join('') || ''}
                    </tbody>
                </table>
            </section>
            ` : ''}

            <section>
                <h2>${t.accommodation}</h2>
                <table>
                    <thead>
                        <tr><th>${t.hotel}</th><th>${t.city}</th><th>${t.period}</th><th>${t.nights}</th><th>${t.service}</th></tr>
                    </thead>
                    <tbody>
                        ${hotels.map(h => `
                            <tr>
                                <td><strong>${h.hotel.name}</strong></td>
                                :<td>${h.hotel.city}</td>
                                <td>${h.checkIn} - ${h.checkOut}</td>
                                <td>${h.nights}</td>
                                <td>${h.mealPlan.name}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </section>

            ${transfers.length > 0 || extras.length > 0 ? `
            <section>
                <h2>${t.transfersAndExtras}</h2>
                <table>
                    <thead>
                        <tr><th>${t.type}</th><th>${t.description}</th><th>${t.date}</th><th>${t.price}</th></tr>
                    </thead>
                    <tbody>
                        ${transfers.map(tobj => `<tr><td>${t.transfer}</td><td>${tobj.transfer.from} → ${tobj.transfer.to}</td><td>${tobj.date}</td><td>${tobj.totalPrice.toFixed(2)} €</td></tr>`).join('')}
                        ${extras.map(e => `<tr><td>${t.extraService}</td><td>${e.extra.name}</td><td>${e.date}</td><td>${e.totalPrice.toFixed(2)} €</td></tr>`).join('')}
                    </tbody>
                </table>
            </section>
            ` : ''}

            <div class="total-box">
                <p>${t.totalPrice}</p>
                <h3>${totalPrice.toFixed(2)} €</h3>
            </div>

            <div class="footer">
                <p>&copy; 2026 ClickToTravel Hub. ${t.footerTag}</p>
            </div>
        </body>
        </html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t.docTitle.replace(/\s+/g, '-')}-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
