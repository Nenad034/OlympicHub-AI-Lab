import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    Globe,
    Building,
    Users,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    XCircle,
    ShieldAlert,
    TrendingUp,
    Zap,
    BarChart3,
    Map as MapIcon,
    MessageSquare,
    Search,
    Filter,
    ArrowLeft,
    Calendar as CalendarIcon,
    FileText,
    CreditCard
} from 'lucide-react';
import { ModernCalendar } from '../components/ModernCalendar';

// Mock Data for the Command Center - Aligned with Global Pulse
const LIVE_FEED = [
    { id: 'R-9452', customer: 'Jovan Jovanović', subagent: 'Travel Pro DOO', supplier: 'Hotelbeds', branch: 'Beograd - Knez', amount: 1250, debt: 1250, payment: 800, status: 'Confirmed', time: '10:15', risk: 'low', margin: 125, daysAgo: 0 },
    { id: 'R-9451', customer: 'Marko Marković', subagent: null, clientType: 'B2C', supplier: 'Amadeus', branch: 'Novi Sad', amount: 450, debt: 450, payment: 450, status: 'Pending', time: '10:12', risk: 'medium', margin: 45, daysAgo: 0 },
    { id: 'R-9450', customer: 'Ana Anić', subagent: 'SuperTravel', supplier: 'Mts Globe', branch: 'Niš', amount: 2100, debt: 2100, payment: 0, status: 'Confirmed', time: '10:05', risk: 'low', margin: 210, daysAgo: 1 },
    { id: 'R-9449', customer: 'Petar Petrović', subagent: 'Travel Pro DOO', supplier: 'Expedia', branch: 'Beograd - Knez', amount: 890, debt: 890, payment: 890, status: 'Confirmed', time: '09:58', risk: 'low', margin: 89, daysAgo: 3 },
    { id: 'R-9448', customer: 'Milica Milić', subagent: 'Montenegro Fly', supplier: 'Solvex', branch: 'Podgorica', amount: 3200, debt: 3200, payment: 1200, status: 'Cancelled', time: '09:45', risk: 'high', margin: 0, daysAgo: 5 },
    { id: 'R-9447', customer: 'Ivan Ivanović', subagent: null, clientType: 'B2C', supplier: 'Hotelbeds', branch: 'Novi Sad', amount: 150, debt: 150, payment: 150, status: 'Confirmed', time: '09:30', risk: 'low', margin: 15, daysAgo: 12 },
];

const CommandCenter: React.FC = () => {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState<'all' | 'Confirmed' | 'Pending' | 'Cancelled'>('all');
    const [daysFilter, setDaysFilter] = useState<number | string>(30);
    const [aggType, setAggType] = useState<'none' | 'subagent' | 'supplier' | 'branch'>('none');

    // Date Filters
    const [bookingDate, setBookingDate] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });
    const [stayDate, setStayDate] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });

    const [showBookingCal, setShowBookingCal] = useState(false);
    const [showStayCal, setShowStayCal] = useState(false);

    const filteredReservations = LIVE_FEED.filter(res => {
        const matchesStatus = statusFilter === 'all' ? true : res.status === statusFilter;
        const matchesDays = res.daysAgo < (typeof daysFilter === 'number' ? daysFilter : 30);
        return matchesStatus && matchesDays;
    });

    const totalReservations = filteredReservations.length;
    const totalDebt = filteredReservations.reduce((acc, res) => acc + (res.debt || 0), 0);
    const totalPayments = filteredReservations.reduce((acc, res) => acc + (res.payment || 0), 0);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-main)',
            color: 'var(--text-primary)',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <div style={{ width: '90%', maxWidth: '1800px' }}>

                {/* TOP BAR - PREMIUM NAVIGATION */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '40px',
                    gap: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/')}
                            style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <ArrowLeft size={18} />
                        </motion.button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>Command Center</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5, fontSize: '12px', fontWeight: '600' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                                LIVE OPERATIONS INTELLIGENCE
                            </div>
                        </div>
                    </div>

                    {/* GLOBAL CONTROL BAR - GLASSMOPHISM */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        backdropFilter: 'blur(10px)',
                        padding: '8px 12px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        {/* Status Filters */}
                        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.1)', padding: '2px', borderRadius: '10px' }}>
                            {['all', 'Confirmed', 'Pending', 'Cancelled'].map(st => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st as any)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        background: statusFilter === st ? 'var(--accent)' : 'transparent',
                                        color: statusFilter === st ? 'white' : 'var(--text-secondary)',
                                        transition: '0.2s'
                                    }}
                                >
                                    {st === 'all' ? 'Sve' : st === 'Confirmed' ? 'Potvrđene' : st === 'Pending' ? 'Na čekanju' : 'Otkazane'}
                                </button>
                            ))}
                        </div>

                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

                        {/* Days Filter */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.1)', padding: '4px 12px', borderRadius: '10px' }}>
                            <span style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5 }}>DANA:</span>
                            <input
                                type="number"
                                value={daysFilter === 0 ? '' : daysFilter}
                                onChange={(e) => setDaysFilter(e.target.value === '' ? 0 : Number(e.target.value))}
                                style={{
                                    width: '40px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--text-primary)',
                                    fontSize: '12px',
                                    fontWeight: '900',
                                    textAlign: 'center',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }} />

                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                            <input
                                type="text"
                                placeholder="Pretraži operacije..."
                                style={{
                                    background: 'rgba(0,0,0,0.1)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    padding: '10px 12px 10px 38px',
                                    fontSize: '12px',
                                    color: 'var(--text-primary)',
                                    width: '200px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* KPI INTELLIGENCE CARDS */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '24px',
                    marginBottom: '40px'
                }}>
                    {[
                        { label: 'Aktivne Rezervacije', value: totalReservations, icon: <Activity size={24} />, color: 'var(--accent)', change: '+12%' },
                        { label: 'Ukupno Zaduženje', value: `${totalDebt.toLocaleString()} €`, icon: <CreditCard size={24} />, color: '#ef4444', change: '-4%' },
                        { label: 'Realizovane Uplate', value: `${totalPayments.toLocaleString()} €`, icon: <Zap size={24} />, color: '#10b981', change: '+28%' },
                        { label: 'Prosečna Marža', value: '14.2%', icon: <TrendingUp size={24} />, color: '#a855f7', change: 'Live' }
                    ].map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '24px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                padding: '24px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '14px',
                                    background: `${card.color}15`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: card.color
                                }}>
                                    {card.icon}
                                </div>
                                <div style={{ fontSize: '11px', fontWeight: '900', color: card.color, background: `${card.color}10`, padding: '4px 10px', borderRadius: '8px' }}>
                                    {card.change}
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>{card.label}</div>
                            <div style={{ fontSize: '32px', fontWeight: '900', marginTop: '4px' }}>{card.value}</div>

                            {/* Decorative background shape */}
                            <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '100px', height: '100px', background: `radial-gradient(circle, ${card.color}10 0%, transparent 70%)` }} />
                        </motion.div>
                    ))}
                </div>

                {/* TWO-COLUMN WORKSPACE */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 400px',
                    gap: '32px'
                }}>

                    {/* LEFT COLUMN: OPERATIONS FEED */}
                    <div style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '32px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px'
                    }}>
                        {/* Feed Toolbar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                                {[
                                    { id: 'none', label: 'Real-time Feed', icon: <Activity size={12} /> },
                                    { id: 'subagent', label: 'Subagenti', icon: <Users size={12} /> },
                                    { id: 'supplier', label: 'Dobavljači', icon: <Globe size={12} /> }
                                ].map(btn => (
                                    <button
                                        key={btn.id}
                                        onClick={() => setAggType(btn.id as any)}
                                        style={{
                                            padding: '10px 18px',
                                            borderRadius: '9px',
                                            border: 'none',
                                            fontSize: '12px',
                                            fontWeight: '800',
                                            cursor: 'pointer',
                                            background: aggType === btn.id ? 'var(--accent)' : 'transparent',
                                            color: aggType === btn.id ? 'white' : 'var(--text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: '0.2s'
                                        }}
                                    >
                                        {btn.icon} {btn.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setShowBookingCal(true)}
                                    style={premiumActionBtn(bookingDate.start ? 'var(--accent)' : 'rgba(255,255,255,0.05)')}
                                >
                                    <CalendarIcon size={14} />
                                    {bookingDate.start ? `${bookingDate.start} - ${bookingDate.end}` : 'Rezervacija Od...do'}
                                </button>
                                <button
                                    onClick={() => setShowStayCal(true)}
                                    style={premiumActionBtn(stayDate.start ? '#10b981' : 'rgba(255,255,255,0.05)')}
                                >
                                    <CalendarIcon size={14} />
                                    {stayDate.start ? `${stayDate.start} - ${stayDate.end}` : 'Boravak Od...do'}
                                </button>
                            </div>
                        </div>

                        {/* DATA TABLE */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '900' }}>
                                        <th style={{ padding: '0 24px' }}>ID / VREME</th>
                                        <th>KUPAC / PUTNIK</th>
                                        <th>VRSTA KUPCA</th>
                                        <th>DOBAVLJAČ</th>
                                        <th>IZNOS</th>
                                        <th>STATUS</th>
                                        <th style={{ width: '60px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReservations.map((res, i) => (
                                        <motion.tr
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.04 }}
                                            style={{
                                                background: 'rgba(255,255,255,0.02)',
                                                transition: '0.2s',
                                                cursor: 'pointer',
                                                borderRadius: '16px'
                                            }}
                                            className="pulse-row"
                                        >
                                            <td style={{ padding: '20px 24px', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>
                                                <div style={{ fontWeight: '900', color: 'var(--text-primary)' }}>{res.id}</div>
                                                <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: '700' }}>{res.time}</div>
                                            </td>
                                            <td>
                                                <div style={{ fontWeight: '800', color: 'var(--accent)', fontSize: '14px' }}>{res.customer}</div>
                                                <div style={{ fontSize: '10px', opacity: 0.5 }}>{res.branch}</div>
                                            </td>
                                            <td>
                                                <div style={{
                                                    display: 'inline-flex',
                                                    padding: '5px 12px',
                                                    borderRadius: '8px',
                                                    background: res.subagent ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : (res.clientType === 'B2B' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'),
                                                    color: 'white',
                                                    fontSize: '9px',
                                                    fontWeight: '900',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {res.subagent ? 'SUBAGENT' : res.clientType}
                                                </div>
                                                {res.subagent && <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: '700', opacity: 0.8 }}>{res.subagent}</div>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                                                        <Globe size={14} />
                                                    </div>
                                                    {res.supplier}
                                                </div>
                                            </td>
                                            <td style={{ fontWeight: '900', fontSize: '16px' }}>{res.amount.toLocaleString()} €</td>
                                            <td>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    color: res.status === 'Confirmed' ? '#10b981' : res.status === 'Cancelled' ? '#ef4444' : '#f59e0b',
                                                    fontSize: '11px',
                                                    fontWeight: '900',
                                                    background: res.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.1)' : res.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    padding: '6px 12px',
                                                    borderRadius: '10px',
                                                    width: 'fit-content'
                                                }}>
                                                    {res.status === 'Confirmed' ? <CheckCircle2 size={12} /> : res.status === 'Cancelled' ? <XCircle size={12} /> : <Clock size={12} />}
                                                    {res.status === 'Confirmed' ? 'POTVRĐENO' : res.status === 'Cancelled' ? 'OTKAZANO' : 'NA ČEKANJU'}
                                                </div>
                                            </td>
                                            <td style={{ borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}>
                                                <motion.button
                                                    whileHover={{ scale: 1.1 }}
                                                    onClick={() => navigate(`/reservation-architect?id=${res.id}`)}
                                                    style={{
                                                        width: '36px',
                                                        height: '36px',
                                                        borderRadius: '10px',
                                                        border: 'none',
                                                        background: 'var(--accent)',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                    <ArrowUpRight size={16} />
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: INTELLIGENCE & PULSE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* DESTINATION PULSE RING */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '32px',
                            padding: '32px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <MapIcon size={18} />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>Live Market Pulse</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {[
                                        { destination: 'Antalya', count: 42, color: '#10b981', trend: '+5' },
                                        { destination: 'Hurghada', count: 28, color: '#3b82f6', trend: '+12' },
                                        { destination: 'Dubai', count: 15, color: '#f59e0b', trend: '-2' }
                                    ].map((pulse, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: pulse.color }} />
                                                <span style={{ fontWeight: '800', fontSize: '14px' }}>{pulse.destination}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: '900', fontSize: '16px' }}>{pulse.count}</span>
                                                <span style={{ fontSize: '10px', color: pulse.trend.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: '900' }}>{pulse.trend}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* AI INTELLIGENCE STREAM */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '32px',
                            padding: '32px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <MessageSquare size={20} color="var(--accent)" />
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>Intelligence Stream</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    { title: 'High Risk Alert', desc: 'R-9448 otkazana usled neplaćanja. AI detektuje obrazac.', color: '#ef4444', time: '5m ago' },
                                    { title: 'Margin Suggestion', desc: 'Potražnja za Antalya +14%. Predlog: +2% marže.', color: '#10b981', time: '12m ago' },
                                    { title: 'Milestone Reached', desc: 'Travel Pro DOO prešao 100k promet.', color: 'var(--accent)', time: '45m ago' }
                                ].map((notif, i) => (
                                    <div key={i} style={{
                                        padding: '16px',
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '20px',
                                        borderLeft: `4px solid ${notif.color}`,
                                        position: 'relative'
                                    }}>
                                        <div style={{ color: notif.color, fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px' }}>{notif.title}</div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.8, lineHeight: '1.4' }}>{notif.desc}</div>
                                        <div style={{ fontSize: '10px', opacity: 0.4, marginTop: '8px', textAlign: 'right', fontWeight: '800' }}>{notif.time}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CALENDARS - PORTAL STYLE */}
            <AnimatePresence>
                {showBookingCal && (
                    <ModernCalendar
                        startDate={bookingDate.start}
                        endDate={bookingDate.end}
                        onChange={(start, end) => setBookingDate({ start, end })}
                        onClose={() => setShowBookingCal(false)}
                        allowPast={true}
                    />
                )}
                {showStayCal && (
                    <ModernCalendar
                        startDate={stayDate.start}
                        endDate={stayDate.end}
                        onChange={(start, end) => setStayDate({ start, end })}
                        onClose={() => setShowStayCal(false)}
                        allowPast={true}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const premiumActionBtn = (borderColor: string): React.CSSProperties => ({
    padding: '10px 18px',
    borderRadius: '12px',
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${borderColor}`,
    color: 'var(--text-secondary)',
    fontSize: '12px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s'
});

export default CommandCenter;
