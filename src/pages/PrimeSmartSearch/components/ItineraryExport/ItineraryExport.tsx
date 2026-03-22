import React, { useState } from 'react';
import type { HotelSearchResult } from '../../types';
import { useSearchStore, calcPaxSummary, calcBasketTotal } from '../../stores/useSearchStore';

// ─────────────────────────────────────────────────────────────
// GENERIŠI HTML ITINERER (čist, brend-ovan dokument)
// ─────────────────────────────────────────────────────────────
const generateItineraryHTML = (
    hotel: HotelSearchResult | undefined,
    paxSummary: ReturnType<typeof calcPaxSummary>,
    basketItems: ReturnType<typeof useSearchStore.getState>['packageBasket'],
    basketTotal: number,
    shareId: string
): string => {
    const formatPrice = (n: number) =>
        new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n);

    const formatDate = (d: string) => d
        ? new Date(d).toLocaleDateString('sr-Latn-RS', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

    const itemsHTML = basketItems.map(item => `
        <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
                <strong style="color:#0f172a;">${item.icon} ${item.label}</strong><br>
                <small style="color:#94a3b8;">${item.details}</small>
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a;white-space:nowrap;">
                ${formatPrice(item.totalPrice)}
            </td>
        </tr>
    `).join('');

    const hotelHTML = hotel ? `
        <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;">
                <strong style="color:#0f172a;">🏨 ${hotel.name}</strong><br>
                <small style="color:#94a3b8;">📍 ${hotel.location.city}, ${hotel.location.country} · ${hotel.stars}★</small>
            </td>
            <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700;color:#0f172a;white-space:nowrap;">
                ${formatPrice(hotel.lowestTotalPrice)}
            </td>
        </tr>
    ` : '';

    const childrenText = paxSummary.totalChildren > 0
        ? ` + ${paxSummary.totalChildren} dece (${paxSummary.childrenAges.join(', ')} god)`
        : '';

    return `<!DOCTYPE html>
<html lang="sr">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    <title>Vaša Ponuda – PrimeClick Travel · ${shareId}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', -apple-system, sans-serif; background: #f0f2f5; color: #0f172a; }
        .container { max-width: 720px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.10); }
        .header { background: #0f172a; padding: 32px; color: white; }
        .logo { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 4px; }
        .header-sub { font-size: 13px; opacity: 0.7; }
        .badge-prime { display: inline-block; padding: 3px 10px; background: rgba(180,83,9,0.25); color: #fbbf24; border-radius: 999px; font-size: 11px; font-weight: 800; margin-top: 12px; }
        .pax-banner { background: #f8fafc; padding: 16px 32px; border-bottom: 1px solid #e2e8f0; display: flex; gap: 24px; flex-wrap: wrap; font-size: 14px; }
        .pax-item { display: flex; gap: 6px; color: #475569; }
        .pax-item strong { color: #0f172a; }
        .section { padding: 24px 32px; }
        .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        .total-row td { padding: 16px; background: #f8fafc; font-size: 18px; font-weight: 900; }
        .total-row .price { color: #059669; }
        .share-link { background: #f0f2f5; padding: 20px 32px; text-align: center; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        .share-link a { color: #0f172a; font-weight: 700; }
        .footer { background: #0f172a; padding: 20px 32px; color: rgba(255,255,255,0.5); font-size: 12px; text-align: center; }
        @media print { body { background: white; } .container { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="container">
        <!-- HEADER -->
        <div class="header">
            <div class="logo">✈ PrimeClick Travel</div>
            <div class="header-sub">Vaša personalizovana ponuda · ID: ${shareId}</div>
            ${hotel?.isPrime ? '<div class="badge-prime">🏆 PRIME Ponuda</div>' : ''}
        </div>

        <!-- PAX BANNER -->
        <div class="pax-banner">
            <div class="pax-item">📅 <strong>${formatDate(paxSummary.checkIn)} — ${formatDate(paxSummary.checkOut)}</strong></div>
            <div class="pax-item">🌙 <strong>${paxSummary.nights} noćenja</strong></div>
            <div class="pax-item">👥 <strong>${paxSummary.totalAdults} odr${childrenText}</strong></div>
            <div class="pax-item">🏨 <strong>${paxSummary.totalRooms} ${paxSummary.totalRooms === 1 ? 'soba' : 'sobe'}</strong></div>
        </div>

        <!-- STAVKE -->
        <div class="section">
            <div class="section-title">Detalji Ponude</div>
            <table>
                ${hotelHTML}
                ${itemsHTML}
                <!-- Ukupno -->
                <tr class="total-row">
                    <td><strong>UKUPNO ZA VAŠU GRUPU</strong><br><small style="font-size:13px;font-weight:400;color:#94a3b8;">${paxSummary.totalAdults} odr${childrenText} · ${paxSummary.nights} noćenja</small></td>
                    <td style="text-align:right;" class="price">${formatPrice((hotel ? hotel.lowestTotalPrice : 0) + basketTotal)}</td>
                </tr>
            </table>
        </div>

        <!-- SHARE LINK -->
        <div class="share-link">
            Podelite ovu ponudu: <a href="https://prime.click/${shareId}">prime.click/${shareId}</a>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            © PrimeClick Travel · Sve cene su okvirne i podložne promeni do potvrde rezervacije
        </div>
    </div>
</body>
</html>`;
};

// ─────────────────────────────────────────────────────────────
// MAIN: Itinerary Export Component
// ─────────────────────────────────────────────────────────────
interface ItineraryExportProps {
    hotel?: HotelSearchResult;  // Opciono — radi i za Package Wizard
    onClose: () => void;
}

export const ItineraryExport: React.FC<ItineraryExportProps> = ({ hotel, onClose }) => {
    const { roomAllocations, checkIn, checkOut, packageBasket } = useSearchStore();
    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);
    const basketTotal = calcBasketTotal(packageBasket);
    const [shareId] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
    const [copied, setCopied] = useState(false);
    const [exporting, setExporting] = useState(false);

    const shareUrl = `https://prime.click/${shareId}`;

    // ── HTML Preview / Preuzimanje ─────────────────────────
    const handleDownloadHTML = () => {
        setExporting(true);
        const html = generateItineraryHTML(hotel, pax, packageBasket, basketTotal, shareId);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PrimeClick-Ponuda-${shareId}.html`;
        a.click();
        URL.revokeObjectURL(url);
        setTimeout(() => setExporting(false), 800);
    };

    // ── PDF Print ─────────────────────────────────────────
    const handlePrint = () => {
        const html = generateItineraryHTML(hotel, pax, packageBasket, basketTotal, shareId);
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 500);
    };

    // ── Copy share link ────────────────────────────────────
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback za starije browsere
            const input = document.createElement('input');
            input.value = shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const formatPrice = (n: number) =>
        new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n);

    const totalPrice = (hotel?.lowestTotalPrice ?? 0) + basketTotal;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 4000,
                background: 'rgba(15,23,42,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Export i deljenje ponude"
        >
            <div style={{
                background: 'var(--v6-bg-card)',
                borderRadius: 'var(--v6-radius-xl)',
                boxShadow: 'var(--v6-shadow-lg)',
                width: '100%',
                maxWidth: '520px',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--v6-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                            📤 Export & Deljenje
                        </h2>
                        <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--v6-text-muted)' }}>
                            ID Ponude: <strong style={{ color: 'var(--v6-text-primary)' }}>{shareId}</strong>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Zatvori"
                        style={{ background: 'none', border: '1.5px solid var(--v6-border)', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontSize: '16px', color: 'var(--v6-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >✕</button>
                </div>

                {/* Summary */}
                <div style={{ padding: '20px 24px', background: 'var(--v6-bg-section)', borderBottom: '1px solid var(--v6-border)' }}>
                {/* Hotel info — prikaži samo ako postoji */}
                {hotel && (
                    <div style={{ fontSize: 'var(--v6-fs-sm)', fontWeight: 700, color: 'var(--v6-text-primary)', marginBottom: '4px' }}>
                        🏨 {hotel.name}
                    </div>
                )}
                {hotel ? (
                    <div style={{ fontSize: '13px', color: 'var(--v6-text-muted)', marginBottom: '12px' }}>
                        📍 {hotel.location.city} · {hotel.stars}★ · {pax.nights} noćenja · {pax.totalAdults} odr
                        {pax.totalChildren > 0 ? ` + ${pax.totalChildren} dece` : ''}
                    </div>
                ) : (
                    <div style={{ fontSize: '13px', color: 'var(--v6-text-muted)', marginBottom: '12px' }}>
                        📦 Dinamički paket · {pax.nights} noćenja · {pax.totalAdults} odr
                        {pax.totalChildren > 0 ? ` + ${pax.totalChildren} dece` : ''}
                    </div>
                )}
                    <div style={{ fontSize: 'var(--v6-fs-xl)', fontWeight: 900, color: 'var(--v6-text-primary)' }}>
                        {formatPrice(totalPrice)}
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--v6-text-muted)', marginLeft: '8px' }}>ukupno za grupu</span>
                    </div>
                </div>

                {/* Export opcije */}
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* PDF */}
                    <button
                        onClick={handlePrint}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 16px', border: '1.5px solid var(--v6-border)',
                            borderRadius: 'var(--v6-radius-md)', background: 'var(--v6-bg-main)',
                            color: 'var(--v6-text-primary)', cursor: 'pointer', fontFamily: 'var(--v6-font)',
                            fontSize: 'var(--v6-fs-sm)', fontWeight: 600, textAlign: 'left' as const,
                            transition: 'border-color 0.2s',
                        }}
                    >
                        <span style={{ fontSize: '24px' }}>📄</span>
                        <div>
                            <div>Preuzmi PDF</div>
                            <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', fontWeight: 400 }}>Profesionalan dokument, ikad štampaj</div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: 'var(--v6-text-muted)' }}>→</span>
                    </button>

                    {/* HTML */}
                    <button
                        onClick={handleDownloadHTML}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 16px', border: '1.5px solid var(--v6-border)',
                            borderRadius: 'var(--v6-radius-md)', background: 'var(--v6-bg-main)',
                            color: 'var(--v6-text-primary)', cursor: 'pointer', fontFamily: 'var(--v6-font)',
                            fontSize: 'var(--v6-fs-sm)', fontWeight: 600, textAlign: 'left' as const,
                        }}
                    >
                        <span style={{ fontSize: '24px' }}>🌐</span>
                        <div>
                            <div>{exporting ? 'Preuzimanje...' : 'Preuzmi HTML'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', fontWeight: 400 }}>Interaktivni link koji možeš poslati porodici</div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: 'var(--v6-text-muted)' }}>→</span>
                    </button>

                    {/* Copy Link */}
                    <button
                        onClick={handleCopyLink}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 16px', border: '1.5px solid var(--v6-border)',
                            borderRadius: 'var(--v6-radius-md)', background: 'var(--v6-bg-main)',
                            color: 'var(--v6-text-primary)', cursor: 'pointer', fontFamily: 'var(--v6-font)',
                            fontSize: 'var(--v6-fs-sm)', fontWeight: 600, textAlign: 'left' as const,
                        }}
                    >
                        <span style={{ fontSize: '24px' }}>{copied ? '✅' : '🔗'}</span>
                        <div>
                            <div>{copied ? 'Link kopiran!' : 'Kopiraj link'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', fontWeight: 400 }}>prime.click/{shareId}</div>
                        </div>
                        <span style={{ marginLeft: 'auto', color: 'var(--v6-text-muted)' }}>→</span>
                    </button>
                </div>

                {/* Share Hub */}
                <div style={{ padding: '0 24px 20px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '10px' }}>
                        Pošalji direktno
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {[
                            { icon: '🟢', label: 'WhatsApp',  url: `https://wa.me/?text=${encodeURIComponent(`Pogledaj moju ponudu: ${shareUrl}`)}` },
                            { icon: '🔵', label: 'Viber',     url: `viber://forward?text=${encodeURIComponent(`Ponuda: ${shareUrl}`)}` },
                            { icon: '🔷', label: 'Telegram',  url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent('Pogledaj moju ponudu')}` },
                            { icon: '📘', label: 'Facebook',  url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
                            { icon: '📨', label: 'Email',     url: `mailto:?subject=PrimeClick Ponuda&body=Pogledaj moju ponudu: ${shareUrl}` },
                        ].map(ch => (
                            <a
                                key={ch.label}
                                href={ch.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Podeli na ${ch.label}`}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 14px', border: '1.5px solid var(--v6-border)',
                                    borderRadius: 'var(--v6-radius-md)', background: 'var(--v6-bg-main)',
                                    color: 'var(--v6-text-primary)', textDecoration: 'none',
                                    fontSize: '13px', fontWeight: 600, fontFamily: 'var(--v6-font)',
                                    transition: 'border-color 0.15s',
                                }}
                            >
                                <span>{ch.icon}</span>
                                <span>{ch.label}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ItineraryExport;
