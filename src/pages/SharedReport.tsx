import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export const SharedReport: React.FC = () => {
    const { reportId } = useParams<{ reportId: string }>();
    const [reportData, setReportData] = useState<any>(null);

    useEffect(() => {
        console.log("Loading shared report for ID:", reportId);
        if (reportId) {
            // Support both direct ID and report_ prefix
            const cleanId = reportId.replace('report_', '');
            const key = `report_${cleanId}`;
            const savedData = localStorage.getItem(key);
            console.log("Looking for localStorage key:", key, "Found:", !!savedData);

            if (savedData) {
                try {
                    setReportData(JSON.parse(savedData));
                } catch (e) {
                    console.error("Failed to parse report data:", e);
                }
            }
        }
    }, [reportId]);

    if (!reportData) {
        return (
            <div style={{ padding: '100px', textAlign: 'center', fontFamily: 'sans-serif', color: '#64748b' }}>
                <h2>Izveštaj nije pronađen</h2>
                <p>Moguće je da je link istekao ili da je izveštaj obrisan.</p>
            </div>
        );
    }

    const { reservations, filters, totals } = reportData;

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '60px 20px', display: 'flex', justifyContent: 'center', boxSizing: 'border-box' }}>
            <style>
                {`
                    @media print {
                        body { padding: 0 !important; background: white !important; }
                        .shared-report-container { box-shadow: none !important; padding: 0 !important; max-width: none !important; border-radius: 0 !important; }
                        .print-btn { display: none !important; }
                    }
                `}
            </style>
            <div className="shared-report-container" style={{ padding: '60px', maxWidth: '1800px', width: '100%', background: 'white', borderRadius: '16px', boxShadow: '0 10px 50px rgba(0,0,0,0.1)', fontFamily: 'Segoe UI, system-ui, sans-serif' }}>
                <div style={{ borderBottom: '5px solid #3b82f6', paddingBottom: '30px', marginBottom: '50px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '48px', fontWeight: 800, letterSpacing: '-1px' }}>Operativni Izveštaj - PrimeClick</h1>
                        <p style={{ margin: '5px 0 0 0', color: '#3b82f6', fontWeight: 700, fontSize: '20px' }}>COMMAND CENTER INTELLIGENCE</p>
                    </div>
                    <div style={{ fontSize: '22px', color: '#64748b', textAlign: 'right' }}>
                        <strong>Datum izdavanja:</strong> {new Date().toLocaleDateString('sr-RS')}<br />
                        <strong>Status:</strong> <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, marginLeft: '10px', fontSize: '18px' }}>{filters.status.toUpperCase()}</span>
                        {(!filters.bookingDate?.start && !filters.stayDate?.start) ? (
                            <><br /><strong>Period:</strong> <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, marginLeft: '10px', fontSize: '18px' }}>{filters.days} dana</span></>
                        ) : (
                            <>
                                {filters.bookingDate?.start && <><br /><strong>Rezervacija:</strong> <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, marginLeft: '10px', fontSize: '18px' }}>{filters.bookingDate.start} - {filters.bookingDate.end}</span></>}
                                {filters.stayDate?.start && <><br /><strong>Boravak:</strong> <span style={{ background: '#f1f5f9', padding: '4px 12px', borderRadius: '8px', fontWeight: 700, marginLeft: '10px', fontSize: '18px' }}>{filters.stayDate.start} - {filters.stayDate.end}</span></>}
                            </>
                        )}
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '40px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', textTransform: 'uppercase', fontWeight: 800, color: '#475569', fontSize: '16px' }}>
                            <th style={{ border: '2px solid #e2e8f0', padding: '20px 15px' }}>ID / DATUM</th>
                            <th style={{ border: '2px solid #e2e8f0', padding: '20px 15px' }}>KUPAC / DETALJI</th>
                            <th style={{ border: '2px solid #e2e8f0', padding: '20px 15px' }}>VREDNOST</th>
                            <th style={{ border: '2px solid #e2e8f0', padding: '20px 15px' }}>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reservations.map((res: any, idx: number) => (
                            <tr key={idx} style={{ background: idx % 2 === 0 ? 'white' : '#fafbfc' }}>
                                <td style={{ border: '2px solid #e2e8f0', padding: '20px 15px' }}>
                                    <div style={{ fontWeight: 900, color: '#3b82f6', fontSize: '30px' }}>{res.id}</div>
                                    <div style={{ fontSize: '18px', fontWeight: 700, opacity: 0.7 }}>{res.date}</div>
                                </td>
                                <td style={{ border: '2px solid #e2e8f0', padding: '20px 15px' }}>
                                    <div style={{ fontWeight: 800, fontSize: '30px' }}>{res.customer}</div>
                                    <div style={{ fontSize: '20px', color: '#64748b', fontWeight: 600, lineHeight: 1.4 }}>{res.details}</div>
                                </td>
                                <td style={{ border: '2px solid #e2e8f0', padding: '20px 15px', textAlign: 'right' }}>
                                    <div style={{ fontSize: '28px', fontWeight: 800 }}>Zad: {res.debt.toLocaleString()} €</div>
                                    <div style={{ color: '#10b981', fontSize: '26px', fontWeight: 800 }}>Nap: {res.payment.toLocaleString()} €</div>
                                </td>
                                <td style={{ border: '2px solid #e2e8f0', padding: '20px 15px', textAlign: 'center' }}>
                                    <span style={{ color: res.statusColor, border: `3px solid ${res.statusColor}44`, padding: '8px 15px', borderRadius: '8px', background: `${res.statusColor}11`, fontSize: '20px', fontWeight: 900 }}>
                                        {res.statusLabel}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: '#0f172a', color: 'white', fontWeight: 900 }}>
                            <td colSpan={2} style={{ padding: '30px 15px', fontSize: '32px' }}>UKUPNO ({reservations.length})</td>
                            <td style={{ padding: '30px 15px', textAlign: 'right', fontSize: '32px' }}>
                                <div>{totals.debt.toLocaleString()} €</div>
                            </td>
                            <td style={{ padding: '30px 15px', textAlign: 'right', fontSize: '32px' }}>
                                <div style={{ color: totals.balance > 0 ? '#ff8181' : '#34d399' }}>Saldo: {totals.balance.toLocaleString()} €</div>
                            </td>
                        </tr>
                    </tfoot>
                </table>

                <div style={{ marginTop: '60px', textAlign: 'center' }}>
                    <button className="print-btn" onClick={() => window.print()} style={{ padding: '20px 40px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '20px', boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)' }}>ŠTAMPAJ IZVEŠTAJ</button>
                </div>
            </div>
        </div>
    );
};

export default SharedReport;
