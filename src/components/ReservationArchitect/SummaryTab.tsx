import React from 'react';
import {
    Briefcase, Zap, RefreshCw, MapPin, Star, Clock, ShieldAlert,
    Users, FileText, Mail, Share2, Printer, AlertTriangle,
    Building2, Plane, Compass, Ship, Truck, Globe, Package as PackageIcon,
    FileEdit, LayoutDashboard, Copy, User, Phone
} from 'lucide-react';
import type { Dossier, TripItem, ActivityLog } from '../../types/reservationArchitect';
import { formatDate } from '../../utils/dateUtils';
import { getReservation as getSolvexReservation } from '../../integrations/solvex/api/solvexBookingService';

interface SummaryTabProps {
    dossier: Dossier;
    setDossier: React.Dispatch<React.SetStateAction<Dossier>>;
    totalBrutto: number;
    totalPaid: number;
    balance: number;
    isSummaryNotepadView: boolean;
    setIsSummaryNotepadView: (val: boolean) => void;
    addLog: (action: string, details: string, type?: ActivityLog['type']) => void;
    setPolicyToShow: (data: { item: TripItem; idx: number } | null) => void;
    handlePrint: () => void;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({
    dossier,
    setDossier,
    totalBrutto,
    totalPaid,
    balance,
    isSummaryNotepadView,
    setIsSummaryNotepadView,
    addLog,
    setPolicyToShow,
    handlePrint
}) => {

    const getSummaryNotepadText = () => {
        let text = `Rezervacija broj : ${dossier.resCode || '---'}\n`;
        text += `Status: ${dossier.status}\n`;
        text += `Ref broj dobavljača: ${dossier.clientReference}\n`;
        text += `Cis oznaka: ${dossier.cisCode}\n`;
        text += `\nUGOVARAČ:\n${dossier.booker.fullName}\n${dossier.booker.email} | ${dossier.booker.phone}\n${dossier.booker.address}, ${dossier.booker.city}\n`;
        text += `\nPUTNICI (${dossier.passengers.length}):\n`;
        dossier.passengers.forEach((p, i) => {
            text += `${i + 1}. ${p.firstName} ${p.lastName} (${p.type}) ${p.idNumber ? `- ${p.idNumber}` : ''}\n`;
        });
        text += `\nPLAN PUTOVANJA:\n`;
        dossier.tripItems.forEach((item, i) => {
            text += `${i + 1}. ${item.type.toUpperCase()}: ${item.subject}\n`;
            text += `> Termin: ${formatDate(item.checkIn)} - ${formatDate(item.checkOut)}\n`;
            text += `> Lokacija: ${item.city}, ${item.country}\n`;
            text += `> Detalji: ${item.details} ${item.mealPlan ? `(${item.mealPlan})` : ''}\n`;
            if (item.notes) text += `> Napomena: ${item.notes}\n`;
            if (item.supplierNotes) text += `> Napomena za dobavljača: ${item.supplierNotes}\n`;
        });

        const hasNotes = dossier.notes.general || dossier.notes.internal || dossier.notes.financial || dossier.notes.specialRequests || dossier.notes.contract || dossier.notes.voucher || dossier.notes.supplier || dossier.tripItems.some(item => item.supplierNotes);
        if (hasNotes) {
            text += `\nNAPOMENE:\n`;
            if (dossier.notes.general) text += `- Opšte: ${dossier.notes.general}\n`;
            if (dossier.notes.internal) text += `- Interne: ${dossier.notes.internal}\n`;
            if (dossier.notes.financial) text += `- Finansijske: ${dossier.notes.financial}\n`;
            if (dossier.notes.specialRequests) text += `- Specijalni zahtevi: ${dossier.notes.specialRequests}\n`;
            if (dossier.notes.contract) text += `- Za ugovor: ${dossier.notes.contract}\n`;
            if (dossier.notes.voucher) text += `- Za vaučer: ${dossier.notes.voucher}\n`;
            if (dossier.notes.supplier) text += `- Dobavljač: ${dossier.notes.supplier}\n`;
            dossier.tripItems.forEach(item => {
                if (item.supplierNotes) text += `- Dobavljač (${item.subject}): ${item.supplierNotes}\n`;
            });
        }

        const docs = [
            { id: 'contract', label: 'Ugovor o Putovanju' },
            { id: 'voucher', label: 'Vaučer / Smeštaj' },
            { id: 'proforma', label: 'Račun / Profaktura' },
            { id: 'finalFiscal', label: 'Konačni fiskalni račun' },
            { id: 'itinerary', label: 'Plan Puta / Itinerer' }
        ];
        const generatedDocs = docs.filter(d => (dossier.documentTracker as any)?.[d.id]?.generated);
        if (generatedDocs.length > 0) {
            text += `\nGENERISANA DOKUMENTA:\n`;
            generatedDocs.forEach(d => {
                text += `- ${d.label}\n`;
            });
        }

        text += `\nUKUPNO ZA NAPLATU: ${totalBrutto.toFixed(2)} ${dossier.finance.currency}\n`;
        text += `UPLAĆENO: ${totalPaid.toFixed(2)} ${dossier.finance.currency}\n`;
        text += `SALDO (DUG): ${balance.toFixed(2)} ${dossier.finance.currency}\n`;
        text += `\nHvala što putujete sa Olympic Travel!`;
        return text;
    };

    const copySummaryToClipboard = () => {
        navigator.clipboard.writeText(getSummaryNotepadText());
        addLog('Sistem', 'Rezime rezervacije kopiran u clipboard.', 'success');
        alert('Rezime rezervacije je kopiran! Sada ga možete nalepiti (Paste) u Viber, Instagram ili bilo koji drugi chat.');
    };

    const shareSummaryToEmail = () => {
        const subject = encodeURIComponent(`Rezime rezervacije - Dossier ${dossier.cisCode}`);
        const body = encodeURIComponent(getSummaryNotepadText());
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const shareSummaryGeneric = async () => {
        const shareData = {
            title: `Rezime rezervacije - Dossier ${dossier.cisCode}`,
            text: getSummaryNotepadText()
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                addLog('Sistem', 'Rezime rezervacije podeljen putem eksterne aplikacije.', 'info');
            } catch (err) {
                console.log('Share cancelled', err);
            }
        } else {
            copySummaryToClipboard();
        }
    };

    return (
        <div style={{ padding: '32px', background: 'var(--bg-panel)', borderRadius: '24px', position: 'relative' }}>
            {/* View Switcher Floating Action Bar */}
            <div style={{
                position: 'sticky', top: '0', zIndex: 100, display: 'flex', justifyContent: 'flex-end', marginBottom: '24px',
                padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg-panel)'
            }}>
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <button
                        onClick={() => setIsSummaryNotepadView(false)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                            background: !isSummaryNotepadView ? 'var(--accent)' : 'transparent', color: !isSummaryNotepadView ? 'white' : 'var(--text-secondary)',
                            border: 'none', cursor: 'pointer', transition: '0.3s'
                        }}
                    >
                        <LayoutDashboard size={16} /> INTERAKTIVNI PREGLED
                    </button>
                    <button
                        onClick={() => setIsSummaryNotepadView(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 800,
                            background: isSummaryNotepadView ? 'var(--accent)' : 'transparent', color: isSummaryNotepadView ? 'white' : 'var(--text-secondary)',
                            border: 'none', cursor: 'pointer', transition: '0.3s'
                        }}
                    >
                        <FileEdit size={16} /> TEKSTUALNI REZIME (NOTEPAD)
                    </button>
                </div>
            </div>

            {isSummaryNotepadView ? (
                <div className="notepad-view" style={{ background: '#1e293b', border: '2px solid #334155', color: '#94a3b8', padding: '40px', borderRadius: '16px', fontFamily: '"Courier New", Courier, monospace', fontSize: '14px', lineHeight: '1.6', maxWidth: '900px', margin: '0 auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
                    <div className="notepad-actions" style={{ marginBottom: '30px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={copySummaryToClipboard}
                            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Copy size={14} /> Kopiraj
                        </button>
                        <button
                            onClick={shareSummaryToEmail}
                            style={{ background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', color: '#60a5fa', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Mail size={14} /> Email
                        </button>
                        <button
                            onClick={handlePrint}
                            style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border)', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Printer size={14} /> Štampaj
                        </button>
                        <button
                            onClick={shareSummaryGeneric}
                            style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', color: '#34d399', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Share2 size={14} /> Viber/Wapp/Insta
                        </button>
                    </div>
                    <div style={{ borderBottom: '1px dashed #475569', marginBottom: '20px', paddingBottom: '10px' }}>
                        <div style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Rezervacija broj : {dossier.resCode || '---'}</div>
                        <div>Status: {dossier.status}</div>
                        <div>Ref broj dobavljača: {dossier.clientReference}</div>
                        <div>Cis oznaka: {dossier.cisCode}</div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>UGOVARAČ:</div>
                        <div>{dossier.booker.fullName}</div>
                        <div>{dossier.booker.email} | {dossier.booker.phone}</div>
                        <div>{dossier.booker.address}, {dossier.booker.city}</div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>PUTNICI ({dossier.passengers.length}):</div>
                        {dossier.passengers.map((p, i) => (
                            <div key={p.id}>{i + 1}. {p.firstName} {p.lastName} ({p.type}) {p.idNumber ? `- ${p.idNumber}` : ''}</div>
                        ))}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>PLAN PUTOVANJA:</div>
                        {dossier.tripItems.map((item, i) => (
                            <div key={item.id} style={{ marginBottom: '10px', paddingLeft: '10px', borderLeft: '2px solid #3b82f6' }}>
                                <strong>{i + 1}. {item.type.toUpperCase()}: {item.subject}</strong><br />
                                &gt; Termin: {formatDate(item.checkIn)} - {formatDate(item.checkOut)}<br />
                                &gt; Lokacija: {item.city}, {item.country}<br />
                                &gt; Detalji: {item.details} {item.mealPlan ? `(${item.mealPlan})` : ''}
                                {item.notes && <><br />&gt; Napomena: {item.notes}</>}
                            </div>
                        ))}
                    </div>

                    {(dossier.notes.general || dossier.notes.internal || dossier.notes.financial || dossier.notes.specialRequests || dossier.notes.contract || dossier.notes.voucher) && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ color: '#fff', fontWeight: 'bold' }}>NAPOMENE:</div>
                            {dossier.notes.general && <div>- Opšte: {dossier.notes.general}</div>}
                            {dossier.notes.internal && <div>- Interne: {dossier.notes.internal}</div>}
                            {dossier.notes.financial && <div>- Finansijske: {dossier.notes.financial}</div>}
                            {dossier.notes.specialRequests && <div>- Specijalni zahtevi: {dossier.notes.specialRequests}</div>}
                            {dossier.notes.contract && <div>- Za ugovor: {dossier.notes.contract}</div>}
                            {dossier.notes.voucher && <div>- Za vaučer: {dossier.notes.voucher}</div>}
                        </div>
                    )}

                    {(() => {
                        const docs = [
                            { id: 'contract', label: 'Ugovor o Putovanju' },
                            { id: 'voucher', label: 'Vaučer / Smeštaj' },
                            { id: 'proforma', label: 'Račun / Profaktura' },
                            { id: 'finalFiscal', label: 'Konačni fiskalni račun' },
                            { id: 'itinerary', label: 'Plan Puta / Itinerer' }
                        ];
                        const generatedDocs = docs.filter(d => (dossier.documentTracker as any)?.[d.id]?.generated);
                        if (generatedDocs.length > 0) {
                            return (
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ color: '#fff', fontWeight: 'bold' }}>GENERISANA DOKUMENTA:</div>
                                    {generatedDocs.map(d => (
                                        <div key={d.id}>- {d.label}</div>
                                    ))}
                                </div>
                            );
                        }
                        return null;
                    })()}

                    <div style={{ borderTop: '1px dashed #475569', marginTop: '20px', paddingTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>UKUPNO ZA NAPLATU:</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{totalBrutto.toFixed(2)} {dossier.finance.currency}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>UPLAĆENO:</span>
                            <span style={{ color: '#10b981' }}>{totalPaid.toFixed(2)} {dossier.finance.currency}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #475569', marginTop: '5px', paddingTop: '5px' }}>
                            <span>SALDO (DUG):</span>
                            <span style={{ color: balance > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{balance.toFixed(2)} {dossier.finance.currency}</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="summary-html-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
                    {/* OSNOVNI KODOVI REZERVACIJE */}
                    <div className="info-group codes-management-card" style={{ padding: '24px', background: 'rgba(59, 130, 246, 0.03)', borderRadius: '16px', border: '1.5px dashed var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
                        <div className="input-field">
                            <label style={{ color: 'var(--accent)', fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Sistemski Broj Rezervacije (REZ)</label>
                            <input
                                value={dossier.resCode || ''}
                                placeholder="npr. 0000001/2026"
                                onChange={e => setDossier({ ...dossier, resCode: e.target.value })}
                                style={{ background: 'var(--bg-card)', border: '1.5px solid var(--accent)', borderRadius: '10px', height: '42px', padding: '0 16px', fontSize: '15px', fontWeight: 700, width: '100%' }}
                            />
                        </div>
                        <div className="input-field">
                            <label style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Klijentska Referenca (REF)</label>
                            <input
                                value={dossier.clientReference}
                                onChange={e => setDossier({ ...dossier, clientReference: e.target.value })}
                                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', height: '42px', padding: '0 16px', fontSize: '14px', width: '100%' }}
                            />
                        </div>
                        <div className="input-field">
                            <label style={{ fontWeight: 800, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Interni CIS Kod</label>
                            <input
                                value={dossier.cisCode}
                                readOnly
                                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '10px', height: '42px', padding: '0 16px', fontSize: '14px', color: 'var(--text-secondary)', cursor: 'not-allowed', width: '100%' }}
                            />
                        </div>
                    </div>

                    {/* 1. NOSILAC PUTOVANJA - COMPACT HEADER */}
                    <div className="summary-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                            <User size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 700, marginBottom: '4px' }}>Glavni Nosilac Putovanja / Ugovarač</div>
                            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>{dossier.booker.fullName}</div>
                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <Mail size={14} color="var(--accent)" />
                                    {dossier.booker.email}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <Phone size={14} color="var(--accent)" />
                                    {dossier.booker.phone}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                    <MapPin size={14} color="var(--accent)" />
                                    {dossier.booker.city}, {dossier.booker.country}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. PLAN PUTOVANJA - COMPACT CARDS */}
                    <div className="summary-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Briefcase size={18} color="var(--accent)" />
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Specifikacija Putovanja</h4>
                        </div>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {dossier.tripItems.map((item, idx) => (
                                <div key={item.id} style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    {/* Header Row */}
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0 }}>
                                            {item.type === 'Smestaj' && <Building2 size={20} />}
                                            {item.type === 'Avio karte' && <Plane size={20} />}
                                            {item.type === 'Čarter' && <Zap size={20} />}
                                            {item.type === 'Bus' && <Compass size={20} />}
                                            {item.type === 'Krstarenje' && <Ship size={20} />}
                                            {item.type === 'Transfer' && <Truck size={20} />}
                                            {item.type === 'Putovanja' && <Globe size={20} />}
                                            {item.type === 'Dinamicki paket' && <PackageIcon size={20} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.type}</div>
                                                    {item.supplier && <div style={{ fontSize: '10px', color: 'var(--text-secondary)', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>Provajder: {item.supplier}</div>}
                                                </div>
                                                {item.supplier && (
                                                    <div className="solvex-info-tag" style={{ margin: 0, padding: '2px 8px' }}>
                                                        <Zap size={10} color="#fbbf24" />
                                                        <span>{item.supplier} checking: <strong>{item.solvexStatus || 'Checking...'}</strong></span>
                                                        {item.solvexKey && <span className="solvex-internal-id">ID: {item.solvexKey}</span>}
                                                        {item.supplier?.toLowerCase().includes('solvex') && item.supplierRef && (
                                                            <button
                                                                className="sync-solvex-btn"
                                                                title={`Sinhronizuj sa ${item.supplier}`}
                                                                onClick={async (e) => {
                                                                    e.stopPropagation();
                                                                    addLog('Solvex Sync', `Pokrenuta provera za ${item.subject}...`, 'info');
                                                                    try {
                                                                        const res = await getSolvexReservation(item.supplierRef!);
                                                                        if (res.success && res.data) {
                                                                            setDossier(prev => ({
                                                                                ...prev,
                                                                                tripItems: prev.tripItems.map(ti => ti.id === item.id ? {
                                                                                    ...ti,
                                                                                    solvexStatus: res.data.Status,
                                                                                    solvexKey: res.data.ID
                                                                                } : ti)
                                                                            }));
                                                                            addLog('Solvex Sync Uspeh', `Novi status: ${res.data.Status}`, 'success');
                                                                        } else {
                                                                            addLog('Solvex Sync', res.error || 'Rezervacija nije pronađena.', 'danger');
                                                                            setDossier(prev => ({
                                                                                ...prev,
                                                                                tripItems: prev.tripItems.map(ti => ti.id === item.id ? { ...ti, solvexStatus: 'Nije pronađeno' } : ti)
                                                                            }));
                                                                        }
                                                                    } catch (err) {
                                                                        addLog('Solvex Sync Greška', err instanceof Error ? err.message : 'Greška u komunikaciji', 'danger');
                                                                    }
                                                                }}
                                                            >
                                                                <RefreshCw size={10} />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {item.subject}
                                                {item.stars && item.stars > 0 && (
                                                    <div style={{ display: 'flex', gap: '1px', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                                        {[...Array(item.stars)].map((_, i) => <Star key={i} size={8} fill="#fbbf24" color="#fbbf24" />)}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                <MapPin size={12} /> {item.city}, {item.country}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Details Row - 3 Columns */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '12px 16px', background: 'rgba(0,0,0,0.08)', borderRadius: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div>
                                            <div style={{ color: 'var(--text-secondary)', marginBottom: '2px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Tip Smeštaja / Opis</div>
                                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{item.details || 'Standard Room'}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-secondary)', marginBottom: '2px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Datum Putovanja</div>
                                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{formatDate(item.checkIn)} - {formatDate(item.checkOut)}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-secondary)', marginBottom: '2px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Usluga / Aranžman</div>
                                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>{item.mealPlan || 'BB - Noćenje sa doručkom'}</div>
                                        </div>
                                        {item.supplierPaymentDeadline && (
                                            <div style={{ gridColumn: 'span 3', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Clock size={12} color="#f59e0b" />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>ROK PLAĆANJA DOBAVLJAČU:</span>
                                                    <span style={{ fontSize: '11px', fontWeight: 800, color: new Date(item.supplierPaymentDeadline) < new Date() ? '#ef4444' : '#f59e0b' }}>{formatDate(item.supplierPaymentDeadline)}</span>
                                                </div>
                                            </div>
                                        )}
                                        {item.cancellationPolicy && (
                                            <div style={{ gridColumn: 'span 3', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <ShieldAlert size={12} color="#94a3b8" />
                                                    <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>OTKAZNI USLOVI:</span>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Dostupni u bazi</span>
                                                </div>
                                                <button onClick={() => setPolicyToShow({ item, idx })} style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, cursor: 'pointer' }}>PRIKAŽI USLOVE</button>
                                            </div>
                                        )}
                                    </div>
                                    {item.supplierNotes && (
                                        <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(251, 191, 36, 0.05)', borderLeft: '3px solid #fbbf24', borderRadius: '8px' }}>
                                            <div style={{ fontWeight: 700, marginBottom: '2px', color: '#fbbf24', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Briefcase size={12} /> Napomena za Dobavljača
                                            </div>
                                            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.4' }}>{item.supplierNotes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. PUTNICI - COMPACT GRID */}
                    <div className="summary-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Users size={18} color="var(--accent)" />
                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Učesnici Putovanja</h4>
                        </div>
                        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                            {dossier.passengers.map((p, pIdx) => (
                                <div key={p.id} style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 800, flexShrink: 0 }}>{pIdx + 1}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.firstName} {p.lastName}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{p.type} {p.idNumber ? `| Dok: ${p.idNumber}` : ''}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. DOKUMENTA I NAPOMENE - TWO COLUMNS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px', alignItems: 'stretch' }}>
                        {/* Document Tracking */}
                        <div className="summary-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FileText size={18} color="var(--accent)" />
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Slanje Dokumenata</h4>
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                {[
                                    { id: 'contract', label: 'Ugovor o Putovanju' },
                                    { id: 'voucher', label: 'Vaučer / Smeštaj' },
                                    { id: 'proforma', label: 'Račun / Profaktura' },
                                    { id: 'finalFiscal', label: 'Konačni fiskalni račun' },
                                    { id: 'itinerary', label: 'Plan Puta / Itinerer' }
                                ].map(doc => {
                                    const isSentEmail = (dossier as any).documentTracker?.[doc.id]?.sentEmail;
                                    const isSentViber = (dossier as any).documentTracker?.[doc.id]?.sentViber;
                                    const isSentPrint = (dossier as any).documentTracker?.[doc.id]?.sentPrint;
                                    return (
                                        <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{doc.label}</span>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <button onClick={() => setDossier(prev => ({ ...prev, documentTracker: { ...prev.documentTracker, [doc.id]: { ...(prev.documentTracker as any)[doc.id], sentEmail: !isSentEmail } } } as any))} style={{ width: '24px', height: '24px', borderRadius: '4px', background: isSentEmail ? 'var(--accent)' : 'var(--bg-panel)', color: isSentEmail ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', border: '1px solid var(--border)' }} title="Email"><Mail size={10} /></button>
                                                <button onClick={() => setDossier(prev => ({ ...prev, documentTracker: { ...prev.documentTracker, [doc.id]: { ...(prev.documentTracker as any)[doc.id], sentViber: !isSentViber } } } as any))} style={{ width: '24px', height: '24px', borderRadius: '4px', background: isSentViber ? '#22c55e' : 'var(--bg-panel)', color: isSentViber ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', border: '1px solid var(--border)' }} title="Viber/WhatsApp"><Share2 size={10} /></button>
                                                <button onClick={() => setDossier(prev => ({ ...prev, documentTracker: { ...prev.documentTracker, [doc.id]: { ...(prev.documentTracker as any)[doc.id], sentPrint: !isSentPrint } } } as any))} style={{ width: '24px', height: '24px', borderRadius: '4px', background: isSentPrint ? '#94a3b8' : 'var(--bg-panel)', color: isSentPrint ? 'white' : 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s', border: '1px solid var(--border)' }} title="Print"><Printer size={10} /></button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Unified Notes Card */}
                        <div className="summary-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertTriangle size={18} color="var(--accent)" />
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Sve Napomene i Specijalni Zahtevi</h4>
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                                {dossier.notes.general && (<div style={{ padding: '12px 14px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid var(--accent)', borderRadius: '8px' }}><div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--accent)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📋 Opšte Napomene</div><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.general}</p></div>)}
                                {dossier.notes.internal && (<div style={{ padding: '12px 14px', background: 'rgba(168, 85, 247, 0.05)', borderLeft: '3px solid #a855f7', borderRadius: '8px' }}><div style={{ fontWeight: 700, marginBottom: '4px', color: '#a855f7', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🔒 Interne Napomene</div><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.internal}</p></div>)}
                                {dossier.notes.financial && (<div style={{ padding: '12px 14px', background: 'rgba(34, 197, 94, 0.05)', borderLeft: '3px solid #22c55e', borderRadius: '8px' }}><div style={{ fontWeight: 700, marginBottom: '4px', color: '#22c55e', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💰 Finansijske</div><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.financial}</p></div>)}
                                {dossier.notes.specialRequests && (<div style={{ padding: '12px 14px', background: 'rgba(234, 179, 8, 0.05)', borderLeft: '3px solid #eab308', borderRadius: '8px' }}><div style={{ fontWeight: 700, marginBottom: '4px', color: '#eab308', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⭐ Specijalni Zahtevi</div><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.specialRequests}</p></div>)}
                                {dossier.notes.contract && (<div style={{ padding: '12px 14px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid var(--accent)', borderRadius: '8px' }}><div style={{ fontWeight: 700, marginBottom: '4px', color: 'var(--accent)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📝 Napomena za Ugovor</div><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.contract}</p></div>)}
                                {dossier.notes.voucher && (<div style={{ padding: '12px 14px', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid #10b981', borderRadius: '8px' }}><div style={{ fontWeight: 700, marginBottom: '4px', color: '#10b981', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎫 Napomena za Vaučer</div><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{dossier.notes.voucher}</p></div>)}
                                <div style={{ padding: '12px 14px', background: 'rgba(251, 191, 36, 0.05)', borderLeft: '3px solid #fbbf24', borderRadius: '8px' }}><div style={{ fontWeight: 700, marginBottom: '8px', color: '#fbbf24', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={12} /> Napomena za Dobavljača</div><textarea value={dossier.notes.supplier} onChange={(e) => setDossier({ ...dossier, notes: { ...dossier.notes, supplier: e.target.value } })} style={{ width: '100%', minHeight: '45px', background: 'transparent', border: 'none', padding: 0, color: 'var(--text-primary)', resize: 'vertical', fontSize: '12px', lineHeight: '1.5', outline: 'none' }} placeholder="Unesite napomenu za dobavljača..." /></div>
                                {dossier.tripItems.filter(item => item.notes).map((item) => (<div key={item.id} style={{ padding: '12px 14px', background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid #ef4444', borderRadius: '8px' }}><div style={{ fontWeight: 700, marginBottom: '4px', color: '#ef4444', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>⚠️ {item.subject}</div><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{item.notes}</p></div>))}
                                {dossier.tripItems.filter(item => item.supplierNotes).map((item) => (<div key={item.id} style={{ padding: '12px 14px', background: 'rgba(251, 191, 36, 0.05)', borderLeft: '3px solid #fbbf24', borderRadius: '8px' }}><div style={{ fontWeight: 700, marginBottom: '4px', color: '#fbbf24', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>💼 {item.subject} (Dobavljač)</div><p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '12px', lineHeight: '1.5' }}>{item.supplierNotes}</p></div>))}
                                {!dossier.notes.general && !dossier.notes.internal && !dossier.notes.financial && !dossier.notes.specialRequests && !dossier.notes.contract && !dossier.notes.voucher && !dossier.notes.supplier && !dossier.tripItems.some(item => item.notes || item.supplierNotes) && (<div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px', fontStyle: 'italic' }}>Nema dodatnih napomena.</div>)}
                            </div>
                        </div>
                    </div>

                    {/* 5. FINANSIJSKI PREGLED - COMPACT & BALANCED */}
                    <div className="summary-card finance-final-card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05))', borderRadius: '16px', padding: '24px 32px', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Status Rezervacije</div><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><div style={{ padding: '6px 16px', background: 'var(--accent)', borderRadius: '20px', fontWeight: 800, fontSize: '14px', color: 'white' }}>{dossier.status.toUpperCase()}</div></div></div>
                            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontWeight: 600 }}>Ukupna Vrednost Dosijea</div><div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1, color: 'var(--text-primary)' }}>{totalBrutto.toFixed(2)} <span style={{ fontSize: '18px', fontWeight: 700 }}>{dossier.finance.currency}</span></div></div>
                        </div>
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.15)' }}></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}><div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700, letterSpacing: '1px' }}>Dosad uplaćeno</div><div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)' }}>{totalPaid.toFixed(2)} {dossier.finance.currency}</div><div style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>{((totalPaid / totalBrutto) * 100).toFixed(1)}% od ukupne sume</div></div>
                            <div style={{ background: balance > 0.01 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', padding: '16px 20px', borderRadius: '12px', border: balance > 0.01 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)' }}><div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: 700, letterSpacing: '1px' }}>{balance > 0.01 ? 'Preostalo duga' : 'Status Plaćanja'}</div><div style={{ fontSize: '20px', fontWeight: 900, color: balance > 0.01 ? '#ef4444' : '#10b981' }}>{balance > 0.01 ? `${balance.toFixed(2)} ${dossier.finance.currency}` : 'ISPLAĆENO U CELOSTI'}</div><div style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-secondary)', fontWeight: 600 }}>{balance > 0.01 ? 'Potrebno izmiriti do putovanja' : 'Sve obaveze su izmirene'}</div></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
