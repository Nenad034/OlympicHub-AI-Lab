import React, { useState, useEffect } from 'react';
import { 
    Zap, 
    ArrowUpCircle, 
    ArrowDownCircle, 
    Percent, 
    DollarSign, 
    Loader2, 
    CheckCircle2, 
    AlertCircle,
    Building2,
    Calendar,
    ChevronRight,
    Play
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface BulkPriceManagementProps {
    onSuccess?: () => void;
}

const BulkPriceManagement: React.FC<BulkPriceManagementProps> = ({ onSuccess }) => {
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');
    const [hotels, setHotels] = useState<any[]>([]);
    const [selectedHotel, setSelectedHotel] = useState('all');
    const [action, setAction] = useState<'increase' | 'decrease'>('increase');
    const [target, setTarget] = useState<'net_price' | 'margin_percent'>('net_price');
    const [valueType, setValueType] = useState<'percent' | 'fixed'>('percent');
    const [value, setValue] = useState(0);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string; count: number } | null>(null);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        if (selectedSupplier) {
            fetchHotels(selectedSupplier);
        } else {
            setHotels([]);
        }
    }, [selectedSupplier]);

    const fetchSuppliers = async () => {
        const { data } = await supabase.from('suppliers').select('id, name').order('name');
        if (data) setSuppliers(data);
    };

    const fetchHotels = async (supplierId: string) => {
        // In a real app, we'd link hotels to suppliers. For now, we'll fetch all or mock.
        const { data } = await supabase.from('hotels').select('id, name').order('name');
        if (data) setHotels(data);
    };

    const handleExecute = async () => {
        if (!selectedSupplier || value === 0) {
            alert('Molimo izaberite dobavljača i unesite vrednost.');
            return;
        }

        setIsExecuting(true);
        setResult(null);

        try {
            // Calculate final value (negative for decrease)
            const finalValue = action === 'increase' ? value : -value;
            
            // Call Postgres function or execute batch update
            // We use the new logic that relies on triggers for Gross/Margin
            
            let query = supabase.from('price_periods').update({
                [target]: target === 'net_price' 
                    ? (valueType === 'percent' ? 0 : 0) // Placeholder for complex logic, we'll use RPC for better control
                    : 0
            });

            // For now, let's use a specialized RPC function if available, 
            // or perform the calculation here if we have IDs.
            // BETTER: Use natural language agent's logic but in a structured way.
            
            const { data, error, count } = await supabase.rpc('bulk_update_prices', {
                p_supplier_id: selectedSupplier === 'all' ? null : selectedSupplier,
                p_hotel_id: selectedHotel === 'all' ? null : selectedHotel,
                p_target: target,
                p_value_type: valueType,
                p_value: finalValue,
                p_date_from: dateFrom || null,
                p_date_to: dateTo || null
            });

            if (error) throw error;

            setResult({
                success: true,
                message: `Uspešno izmenjeno ${data} stavki.`,
                count: data
            });
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error('Bulk update error:', error);
            setResult({
                success: false,
                message: error.message || 'Greška pri masovnoj izmeni.',
                count: 0
            });
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Zap size={24} className="text-accent" />
                <h3 style={{ margin: 0, fontSize: '20px' }}>Masovno Upravljanje Cenama</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                {/* Filters */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>DOBAVLJAČ</label>
                    <select 
                        value={selectedSupplier} 
                        onChange={e => setSelectedSupplier(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                        <option value="">Izaberi dobavljača...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>HOTEL (Opciono)</label>
                    <select 
                        value={selectedHotel} 
                        onChange={e => setSelectedHotel(e.target.value)}
                        style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    >
                        <option value="all">Svi hoteli</option>
                        {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                    </select>
                </div>

                {/* Dates */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>PERIOD VAŽENJA</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} />
                    </div>

                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>ŠTA MENJAMO?</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => setTarget('net_price')}
                            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: target === 'net_price' ? '1px solid var(--accent)' : '1px solid var(--border)', background: target === 'net_price' ? 'var(--accent-glow)' : 'transparent', color: target === 'net_price' ? 'var(--accent)' : 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}
                        >
                            Neto Cenu
                        </button>
                        <button 
                            onClick={() => setTarget('margin_percent')}
                            style={{ flex: 1, padding: '10px', borderRadius: '10px', border: target === 'margin_percent' ? '1px solid var(--accent)' : '1px solid var(--border)', background: target === 'margin_percent' ? 'var(--accent-glow)' : 'transparent', color: target === 'margin_percent' ? 'var(--accent)' : 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}
                        >
                            Maržu (%)
                        </button>
                    </div>
                </div>

                {/* Value & Action */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>AKCIJA I VREDNOST</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => setAction('increase')}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: action === 'increase' ? '1px solid #10b981' : '1px solid var(--border)', background: action === 'increase' ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: action === 'increase' ? '#10b981' : 'var(--text-secondary)' }}
                        >
                            <ArrowUpCircle size={16} /> Povećaj
                        </button>
                        <button 
                            onClick={() => setAction('decrease')}
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: action === 'decrease' ? '1px solid #ef4444' : '1px solid var(--border)', background: action === 'decrease' ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: action === 'decrease' ? '#ef4444' : 'var(--text-secondary)' }}
                        >
                            <ArrowDownCircle size={16} /> Smanji
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <input 
                                type="number" 
                                value={value} 
                                onChange={e => setValue(parseFloat(e.target.value) || 0)}
                                style={{ width: '100%', padding: '12px', paddingRight: '40px', borderRadius: '10px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} 
                            />
                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                                {valueType === 'percent' ? <Percent size={16} /> : <DollarSign size={16} />}
                            </div>
                        </div>
                        <div style={{ display: 'flex', background: 'var(--bg-input)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <button onClick={() => setValueType('percent')} style={{ padding: '6px', borderRadius: '6px', background: valueType === 'percent' ? 'var(--accent)' : 'transparent', color: valueType === 'percent' ? '#fff' : 'var(--text-secondary)', border: 'none' }}>%</button>
                            <button onClick={() => setValueType('fixed')} style={{ padding: '6px', borderRadius: '6px', background: valueType === 'fixed' ? 'var(--accent)' : 'transparent', color: valueType === 'fixed' ? '#fff' : 'var(--text-secondary)', border: 'none' }}>€</button>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
                {result && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: result.success ? '#10b981' : '#ef4444', fontSize: '14px' }}>
                        {result.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                        {result.message}
                    </div>
                )}
                
                <button 
                    onClick={handleExecute}
                    disabled={isExecuting || !selectedSupplier}
                    style={{ 
                        padding: '12px 32px', 
                        borderRadius: '12px', 
                        background: 'var(--accent)', 
                        color: '#fff', 
                        border: 'none', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px',
                        cursor: isExecuting ? 'not-allowed' : 'pointer',
                        opacity: isExecuting || !selectedSupplier ? 0.7 : 1,
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    {isExecuting ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                    Izvrši Masovnu Promenu
                </button>
            </div>
            
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                ℹ️ <strong>Napomena:</strong> Sve promene na Neto ceni će automatski ažurirati Bruto cenu klijentu na osnovu baze podataka i definisanih trigera za profitabilnost.
            </div>
        </div>
    );
};

export default BulkPriceManagement;
