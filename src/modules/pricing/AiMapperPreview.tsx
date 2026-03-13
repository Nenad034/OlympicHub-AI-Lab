import React, { useState } from 'react';
import { 
    FileText, Check, AlertCircle, ArrowRight, 
    Database, Table, Wand2, RefreshCcw 
} from 'lucide-react';

interface MappingColumn {
    source: string;
    target: string;
    confidence: number;
}

interface AiMapperPreviewProps {
    filename: string;
    extractedTablesCount: number;
    onConfirm: (mappedData: any) => void;
}

const AiMapperPreview: React.FC<AiMapperPreviewProps> = ({ filename, extractedTablesCount, onConfirm }) => {
    const [isMapping, setIsMapping] = useState(false);
    const [mapped, setMapped] = useState(false);

    const mockMappings: MappingColumn[] = [
        { source: 'Period', target: 'date_range', confidence: 0.98 },
        { source: 'Superior dvokrevetna', target: 'net_price_base', confidence: 0.95 },
        { source: 'Release / Days', target: 'release_window', confidence: 0.92 },
        { source: 'Doplata za polupansion', target: 'meal_supplement', confidence: 0.88 },
        { source: 'EBD: 10% popust', target: 'early_booking_rule', confidence: 0.97 }
    ];

    const handleStartMapping = () => {
        setIsMapping(true);
        setTimeout(() => {
            setIsMapping(false);
            setMapped(true);
        }, 2000);
    };

    return (
        <div className="card glass-card animate-in-fade" style={{ padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
                        <FileText className="text-accent" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0 }}>AI Analiza Dokumenta</h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)' }}>Fajl: {filename}</p>
                    </div>
                </div>
                <div className="badge badge-success">Spreman za mapiranje</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '15px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '30px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>{extractedTablesCount}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pronađene Tabele</div>
                    </div>
                    <div style={{ width: '1px', background: 'var(--border)' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>14</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Hotela Detektovano</div>
                    </div>
                   <div style={{ width: '1px', background: 'var(--border)' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '24px', fontWeight: 700 }}>8</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Smart Rules</div>
                    </div>
                </div>
            </div>

            {!mapped ? (
                <button 
                    onClick={handleStartMapping}
                    className="btn-primary" 
                    style={{ width: '100%', padding: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                    disabled={isMapping}
                >
                    {isMapping ? <RefreshCcw className="animate-spin" size={20} /> : <Wand2 size={20} />}
                    {isMapping ? 'AI Mapiranje u toku...' : 'Pokreni AI Inteligentno Mapiranje'}
                </button>
            ) : (
                <div className="fade-in">
                    <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Check className="text-success" size={18} /> Rezultat AI Mapiranja
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {mockMappings.map((m, i) => (
                            <div key={i} style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                background: 'rgba(255,255,255,0.05)', 
                                padding: '12px 20px', 
                                borderRadius: '10px',
                                border: '1px solid var(--border)'
                            }}>
                                <div style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{m.source}</div>
                                <ArrowRight size={14} style={{ margin: '0 20px', opacity: 0.5 }} />
                                <div style={{ flex: 1, color: 'var(--accent)', fontSize: '13px', fontWeight: 700 }}>{m.target}</div>
                                <div style={{ 
                                    width: '40px', 
                                    height: '4px', 
                                    background: `linear-gradient(to right, var(--accent) ${m.confidence*100}%, rgba(255,255,255,0.1) 0%)`,
                                    borderRadius: '2px',
                                    marginLeft: '20px'
                                }} />
                                <span style={{ fontSize: '10px', marginLeft: '10px', opacity: 0.6 }}>{Math.round(m.confidence*100)}%</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '25px', display: 'flex', gap: '15px' }}>
                         <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setMapped(false)}>Podesi Ručno</button>
                         <button className="btn-primary" style={{ flex: 2 }} onClick={() => onConfirm({})}>Uvezi u bazu podataka</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiMapperPreview;
