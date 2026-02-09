import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Save,
    Calendar,
    Hotel,
    Users,
    DollarSign,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Clock,
    Settings,
    FileText,
    Calculator,
    ShieldCheck,
    ChevronRight,
    ArrowRight
} from 'lucide-react';

const QuickPricelistForm: React.FC<{ onAddItem?: (item: any) => void, addedItems: any[] }> = ({ onAddItem, addedItems }) => {
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const [isSaving, setIsSaving] = useState(false);

    // Premium UI Style constants
    // FIXED: Font family inherit, background opaque for dark mode selects
    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '14px 18px',
        borderRadius: '14px',
        background: 'var(--bg-input)', // Use opaque background for dark mode compatibility
        border: '1.5px solid var(--border)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontFamily: "'Inter', sans-serif", // Explicit app font
        outline: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxSizing: 'border-box'
    };

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 16px center',
        backgroundSize: '18px',
        backgroundColor: 'var(--bg-input)' // Ensure opaque background
    };

    const optionStyle: React.CSSProperties = {
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        padding: '10px'
    };

    // Form State
    const [pricelistName, setPricelistName] = useState('Leto 2026 - Grčka');
    const [selectedHotel, setSelectedHotel] = useState('Grand Resort & Spa');
    const [selectedSupplier, setSelectedSupplier] = useState('Solvex');
    const [selectedService, setSelectedService] = useState('HB');
    const [calculationModel, setCalculationModel] = useState('PER_PERSON_DAY');
    const [globalMarginPercent, setGlobalMarginPercent] = useState(20);
    const [globalMarginAmount, setGlobalMarginAmount] = useState(5);
    const [provision, setProvision] = useState(15);
    const [hasContract, setHasContract] = useState(true);
    const [contractNumber, setContractNumber] = useState('UG-2026-0045');

    // Local temporary periods in the form
    const [periods, setPeriods] = useState([
        {
            id: '1',
            dateFrom: '2026-06-01',
            dateTo: '2026-06-30',
            roomType: 'Double Room Standard (2+2)',
            netPrice: 85,
            minNights: 3,
            maxNights: 7,
            days: [true, true, true, true, true, true, true],
        },
    ]);

    const handleAddItem = (period: any) => {
        if (!onAddItem) return;

        onAddItem({
            id: `ITM-${Date.now().toString().slice(-4)}`,
            roomType: period.roomType,
            dateFrom: period.dateFrom,
            dateTo: period.dateTo,
            netPrice: period.netPrice,
            brutoPrice: Number(calculateBrutoPrice(period.netPrice)),
            occupancy: { adults: 2, children: 1 },
            status: 'active',
            days_of_week: period.days,
            pricelistTitle: pricelistName
        });

        setAutoSaveStatus('saving');
        setTimeout(() => setAutoSaveStatus('saved'), 800);
    };

    const handleSaveToDatabase = async () => {
        if (addedItems.length === 0) {
            alert('Morate dodati barem jednu stavku u listu pre čuvanja.');
            return;
        }

        setIsSaving(true);
        try {
            const { pricingService } = await import('../../services/pricing/pricingService');

            const pricelist = await pricingService.createPricelist({
                title: pricelistName,
                service_type: selectedService,
                global_margin_percent: globalMarginPercent,
                global_margin_amount: globalMarginAmount,
                contract_number: contractNumber,
                status: 'active',
                calculation_model: calculationModel
            });

            const periodsToSave = addedItems.map(item => ({
                pricelist_id: pricelist.id,
                date_from: item.dateFrom,
                date_to: item.dateTo,
                room_type_name: item.roomType,
                net_price: item.netPrice,
                provision_percent: provision,
                days_of_week: item.days_of_week || [true, true, true, true, true, true, true],
                min_stay: 1
            }));

            await pricingService.addPricePeriods(periodsToSave);
            alert('Cenovnik je uspešno aktiviran i sačuvan u bazu!');
        } catch (error: any) {
            console.error('Error saving pricelist:', error);
            alert('Greška pri čuvanju: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const calculateBrutoPrice = (netPrice: number) => {
        const afterProvision = netPrice - (netPrice * provision / 100);
        const withMargin = afterProvision + (afterProvision * globalMarginPercent / 100) + globalMarginAmount;
        return withMargin.toFixed(2);
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -10 },
        visible: { opacity: 1, x: 0 }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(300px, 1fr) minmax(400px, 2fr) minmax(300px, 1fr)',
                gap: '24px'
            }}
        >
            {/* COLUMN 1: CONFIGURATION */}
            <motion.div variants={itemVariants} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '24px',
                border: '1px solid var(--glass-border)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--gradient-blue)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Settings size={22} color="#fff" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Konfiguracija</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Osnovni parametri cenovnika</p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>NAZIV CENOVNIKA</label>
                        <input
                            type="text"
                            value={pricelistName}
                            onChange={(e) => setPricelistName(e.target.value)}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>HOTEL</label>
                            <select value={selectedHotel} onChange={(e) => setSelectedHotel(e.target.value)} style={selectStyle}>
                                <option style={optionStyle}>Grand Resort & Spa</option>
                                <option style={optionStyle}>Luxury Beach Hotel</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>DOBAVLJAČ</label>
                            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} style={selectStyle}>
                                <option style={optionStyle}>Solvex</option>
                                <option style={optionStyle}>Filos</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>MODEL OBRAČUNA</label>
                        <select
                            value={calculationModel}
                            onChange={(e) => setCalculationModel(e.target.value)}
                            style={selectStyle}
                        >
                            <option value="PER_PERSON_DAY" style={optionStyle}>Po osobi / dan</option>
                            <option value="PER_ROOM_DAY" style={optionStyle}>Po sobi / dan</option>
                        </select>
                    </div>

                    <div style={{
                        background: 'rgba(59, 130, 246, 0.05)',
                        padding: '16px',
                        borderRadius: '16px',
                        border: '1px dashed var(--accent)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>Globalna Marža (%)</span>
                            <input
                                type="number"
                                value={globalMarginPercent}
                                onChange={(e) => setGlobalMarginPercent(Number(e.target.value))}
                                style={{ width: '60px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 700, textAlign: 'right', outline: 'none', fontFamily: 'inherit' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>Fiksni Dodatak (€)</span>
                            <input
                                type="number"
                                value={globalMarginAmount}
                                onChange={(e) => setGlobalMarginAmount(Number(e.target.value))}
                                style={{ width: '60px', background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 700, textAlign: 'right', outline: 'none', fontFamily: 'inherit' }}
                            />
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '4px', fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            Automatski primenjeno na sve stavke
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* COLUMN 2: PERIOD EDITOR */}
            <motion.div variants={itemVariants} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                padding: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--gradient-green)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={22} color="#fff" />
                        </div>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Periodi Vraženja</h4>
                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Definisanje termina i tipova soba</p>
                        </div>
                    </div>
                </div>

                {periods.map((period, idx) => (
                    <motion.div
                        key={period.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'rgba(15, 23, 42, 0.4)',
                            borderRadius: '20px',
                            border: '1px solid var(--border)',
                            padding: '20px',
                            marginBottom: '16px'
                        }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>VAŽI OD</label>
                                <input type="date" value={period.dateFrom} style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>VAŽI DO</label>
                                <input type="date" value={period.dateTo} style={inputStyle} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>TIP SMEŠTAJA</label>
                            <select value={period.roomType} style={selectStyle}>
                                <option style={optionStyle}>Double Room Standard (2+2)</option>
                                <option style={optionStyle}>Double Room Sea View (2+2)</option>
                                <option style={optionStyle}>Family Suite (2+3)</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>NETO CENA (€)</label>
                                <div style={{ position: 'relative' }}>
                                    <DollarSign size={16} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent)' }} />
                                    <input
                                        type="number"
                                        value={period.netPrice}
                                        onChange={(e) => {
                                            const newList = [...periods];
                                            newList[idx].netPrice = Number(e.target.value);
                                            setPeriods(newList);
                                        }}
                                        style={{ ...inputStyle, paddingLeft: '40px' }}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => handleAddItem(period)}
                                style={{
                                    background: 'var(--accent)',
                                    color: '#fff',
                                    border: 'none',
                                    height: '50px',
                                    borderRadius: '14px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    boxShadow: '0 10px 20px rgba(59, 130, 246, 0.2)',
                                    fontFamily: 'inherit'
                                }}
                            >
                                <Save size={18} /> Snimi u Listu
                            </button>
                        </div>
                    </motion.div>
                ))}
            </motion.div>

            {/* COLUMN 3: LIVE PREVIEW & ACTIONS */}
            <motion.div variants={itemVariants} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '24px',
                border: '1px solid var(--glass-border)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--gradient-purple)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={22} color="#fff" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Finalizacija</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>Pregled i aktivacija</p>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '20px',
                    padding: '20px',
                    border: '1px solid var(--border)',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Stavke u pripremi:</span>
                        <span style={{ fontWeight: 700 }}>{addedItems.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Prosečna Bruto Cena:</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>
                            {addedItems.length > 0 ? (addedItems.reduce((acc, curr) => acc + curr.brutoPrice, 0) / addedItems.length).toFixed(2) : '0.00'} €
                        </span>
                    </div>
                </div>

                <div style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    fontSize: '13px',
                    display: 'flex',
                    gap: '12px',
                    marginBottom: 'auto'
                }}>
                    <ShieldCheck size={24} style={{ flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5' }}>
                        Cenovnik će biti vidljiv svim korisnicima sistema odmah nakon aktivacije.
                    </p>
                </div>

                <button
                    disabled={isSaving}
                    onClick={handleSaveToDatabase}
                    style={{
                        width: '100%',
                        padding: '18px',
                        background: isSaving ? 'var(--border)' : 'var(--gradient-green)',
                        color: '#fff',
                        borderRadius: '16px',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '15px',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        marginTop: '24px',
                        boxShadow: isSaving ? 'none' : '0 15px 30px rgba(16, 185, 129, 0.3)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontFamily: 'inherit'
                    }}
                >
                    {isSaving ? <Clock className="spin" /> : <CheckCircle2 size={20} />}
                    {isSaving ? 'Aktivacija u toku...' : 'Aktiviraj Cenovnik'}
                </button>
            </motion.div>
        </motion.div>
    );
};

export default QuickPricelistForm;
