import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { BookingSubmission, Guest } from '../types/booking.types';

// Extend jsPDF with autoTable for TypeScript
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
    }
}

export const documentService = {
    /**
     * Generates a professional PDF voucher for a booking
     */
    generateVoucherPDF: (booking: BookingSubmission & { bookingId: string }) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // 1. Header & Brand
        doc.setFillColor(13, 94, 175); // Olympic Blue
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('CLICKTOTRAVEL HUB', 20, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('TRAVEL VOUCHER / POTVRDA REZERVACIJE', 20, 32);

        // 2. Booking Info Bar
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`ID Rezervacije: ${booking.bookingId}`, 20, 55);
        doc.text(`Datum izdavanja: ${new Date().toLocaleDateString('sr-RS')}`, pageWidth - 20, 55, { align: 'right' });

        doc.line(20, 60, pageWidth - 20, 60);

        // 3. Hotel Details Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALJI SMEŠTAJA', 20, 75);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Hotel:`, 20, 85);
        doc.setFont('helvetica', 'bold');
        doc.text(booking.hotelName, 60, 85);

        doc.setFont('helvetica', 'normal');
        doc.text(`Tip Sobe:`, 20, 92);
        doc.text(booking.rooms[0]?.roomName || 'Standard Room', 60, 92);

        doc.text(`Period:`, 20, 99);
        doc.text(`${new Date(booking.checkIn).toLocaleDateString('sr-RS')} - ${new Date(booking.checkOut).toLocaleDateString('sr-RS')}`, 60, 99);

        doc.text(`Broj Noći:`, 20, 106);
        const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));
        doc.text(`${nights}`, 60, 106);

        // 4. Guest List Table
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('LISTA PUTNIKA', 20, 125);

        const guestData = booking.rooms.flatMap(room =>
            room.guests.map((guest, idx) => [
                idx + 1,
                `${guest.title} ${guest.firstName} ${guest.lastName}`,
                guest.nationality,
                guest.isMainGuest ? 'NOSILAC' : 'PUTNIK'
            ])
        );

        doc.autoTable({
            startY: 130,
            head: [['#', 'Ime i Prezime', 'Državljanstvo', 'Status']],
            body: guestData,
            theme: 'striped',
            headStyles: { fillStyle: [13, 94, 175] }, // Matches brand blue
            styles: { fontSize: 9 }
        });

        // 5. Payment & Notes
        const finalY = (doc as any).lastAutoTable.finalY + 15;

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('FINANSIJSKI DETALJI', 20, finalY);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Ukupna cena:', 20, finalY + 8);
        doc.setFont('helvetica', 'bold');
        doc.text(`${booking.totalPrice.amount} ${booking.totalPrice.currency}`, 60, finalY + 8);

        if (booking.specialRequests) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('NAPOMENE', 20, finalY + 25);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text(booking.specialRequests, 20, finalY + 32, { maxWidth: pageWidth - 40 });
        }

        // 6. Footer Legal
        const footerY = doc.internal.pageSize.getHeight() - 30;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Ova potvrda služi kao dokaz o izvršenoj rezervaciji preko ClickToTravel Hub platforme.', pageWidth / 2, footerY, { align: 'center' });
        doc.text('ClickToTravel Hub - Travel B2B Solutions | www.clicktotravel.rs', pageWidth / 2, footerY + 5, { align: 'center' });

        // 7. Save / Download
        doc.save(`Voucher_${booking.bookingId}_${booking.hotelName.replace(/\s+/g, '_')}.pdf`);
    },

    /**
     * Generates a professional HTML voucher for a booking
     */
    generateVoucherHTML: (booking: BookingSubmission & { bookingId: string }) => {
        const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));

        const guestRows = booking.rooms.flatMap(room =>
            room.guests.map((guest, idx) => `
                <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${idx + 1}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${guest.title} ${guest.firstName} ${guest.lastName}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee;">${guest.nationality}</td>
                    <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
                        <span style="background: ${guest.isMainGuest ? '#10b981' : '#6b7280'}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                            ${guest.isMainGuest ? 'NOSILAC' : 'PUTNIK'}
                        </span>
                    </td>
                </tr>
            `).join('')
        );

        const htmlContent = `
<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8">
    <title>Voucher - ${booking.bookingId}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f7f9; }
        .container { max-width: 800px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: #0d5eaf; color: #fff; padding: 40px; }
        .header h1 { margin: 0; font-size: 32px; letter-spacing: 2px; }
        .header p { margin: 5px 0 0; opacity: 0.8; }
        .content { padding: 40px; }
        .booking-meta { display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #0d5eaf; padding-bottom: 15px; }
        .section-title { font-size: 18px; font-weight: bold; color: #0d5eaf; margin-bottom: 15px; text-transform: uppercase; border-left: 4px solid #0d5eaf; padding-left: 10px; }
        .details-grid { display: grid; grid-template-columns: 150px 1fr; gap: 10px; margin-bottom: 30px; }
        .label { color: #666; font-size: 14px; }
        .value { font-weight: 600; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { text-align: left; background: #f8fafc; padding: 12px; color: #0d5eaf; font-size: 14px; }
        .financials { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .total-price { font-size: 24px; color: #10b981; font-weight: 800; }
        .notes { background: #fffbeb; border: 1px solid #fef3c7; padding: 20px; border-radius: 8px; font-style: italic; }
        .footer { text-align: center; padding: 30px; color: #999; font-size: 12px; border-top: 1px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CLICKTOTRAVEL HUB</h1>
            <p>TRAVEL VOUCHER / POTVRDA REZERVACIJE</p>
        </div>
        <div class="content">
            <div class="booking-meta">
                <div>ID: <strong>${booking.bookingId}</strong></div>
                <div>Datum: <strong>${new Date().toLocaleDateString('sr-RS')}</strong></div>
            </div>

            <div class="section-title">Detalji Smeštaja</div>
            <div class="details-grid">
                <div class="label">Hotel:</div>
                <div class="value">${booking.hotelName}</div>
                <div class="label">Soba:</div>
                <div class="value">${booking.rooms[0]?.roomName}</div>
                <div class="label">Period:</div>
                <div class="value">${new Date(booking.checkIn).toLocaleDateString('sr-RS')} - ${new Date(booking.checkOut).toLocaleDateString('sr-RS')}</div>
                <div class="label">Noćenja:</div>
                <div class="value">${nights}</div>
            </div>

            <div class="section-title">Gosti</div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Ime i Prezime</th>
                        <th>Državljanstvo</th>
                        <th style="text-align: right;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${guestRows}
                </tbody>
            </table>

            <div class="section-title">Finansije</div>
            <div class="financials">
                <div class="label">Ukupna uplata:</div>
                <div class="total-price">${booking.totalPrice.amount} ${booking.totalPrice.currency}</div>
            </div>

            ${booking.specialRequests ? `
            <div class="section-title">Napomene</div>
            <div class="notes">
                ${booking.specialRequests}
            </div>
            ` : ''}
        </div>
        <div class="footer">
            Ova potvrda služi kao dokaz o izvršenoj rezervaciji preko ClickToTravel Hub platforme.<br>
            ClickToTravel Hub - Travel B2B Solutions | www.clicktotravel.rs
        </div>
    </div>
</body>
</html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Voucher_${booking.bookingId}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
