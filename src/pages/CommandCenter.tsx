import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    CreditCard,
    Download,
    Ship,
    Bus,
    PlaneTakeoff,
    Zap as ZapIcon,
    Package as PackageIcon,
    Monitor,
    Mail
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useThemeStore } from '../stores';
import { ModernCalendar } from '../components/ModernCalendar';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Line, ComposedChart, Legend, BarChart, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';

// Mock Data for the Command Center - Aligned with Global Pulse
const LIVE_FEED = [
    { id: 'R-9452', customer: 'Jovan Jovanović', subagent: 'Travel Pro DOO', supplier: 'Hotelbeds', branch: 'Beograd - Knez', amount: 1250, debt: 1250, payment: 800, status: 'Confirmed', time: '10:15', risk: 'low', margin: 125, daysAgo: 0, country: 'Grčka', destination: 'Rodos', serviceName: 'Hotel Lindos Blu Luxury', checkIn: '2026-06-15', checkOut: '2026-06-22', productType: 'hotel' },
    { id: 'R-9451', customer: 'Marko Marković', subagent: null, clientType: 'B2C', supplier: 'Amadeus', branch: 'Novi Sad', amount: 450, debt: 450, payment: 450, status: 'Pending', time: '10:12', risk: 'medium', margin: 45, daysAgo: 0, country: 'Turska', destination: 'Antalija', serviceName: 'Itinerer: BEG-AYT-BEG', checkIn: '2026-07-01', checkOut: '2026-07-10', productType: 'flight' },
    { id: 'R-9450', customer: 'Ana Anić', subagent: 'SuperTravel', supplier: 'Mts Globe', branch: 'Niš', amount: 2100, debt: 2100, payment: 0, status: 'Confirmed', time: '10:05', risk: 'low', margin: 210, daysAgo: 1, country: 'Egipat', destination: 'Hurgada', serviceName: 'Sunrise Crystal Bay', checkIn: '2026-08-10', checkOut: '2026-08-20', productType: 'package' },
    { id: 'R-9449', customer: 'Petar Petrović', subagent: 'Travel Pro DOO', supplier: 'Expedia', branch: 'Beograd - Knez', amount: 890, debt: 890, payment: 890, status: 'Confirmed', time: '09:58', risk: 'low', margin: 89, daysAgo: 3, country: 'Grčka', destination: 'Krit', serviceName: 'Mitsis Rinela Beach', checkIn: '2026-09-05', checkOut: '2026-09-12', productType: 'hotel' },
    { id: 'R-9448', customer: 'Milica Milić', subagent: 'Montenegro Fly', supplier: 'Solvex', branch: 'Podgorica', amount: 3200, debt: 3200, payment: 1200, status: 'Cancelled', time: '09:45', risk: 'high', margin: 0, daysAgo: 5, country: 'Grčka', destination: 'Halkidiki', serviceName: 'Putovanje: Grčka Klasika', checkIn: '2026-10-12', checkOut: '2026-10-22', productType: 'travel' },
    { id: 'R-9447', customer: 'Ivan Ivanović', subagent: null, clientType: 'B2C', supplier: 'Hotelbeds', branch: 'Novi Sad', amount: 150, debt: 150, payment: 150, status: 'Confirmed', time: '09:30', risk: 'low', margin: 15, daysAgo: 12, country: 'Srbija', destination: 'Zlatibor', serviceName: 'Hotel Mona Plaza', checkIn: '2026-12-20', checkOut: '2026-12-27', productType: 'hotel' },
    { id: 'R-9446', customer: 'Dara Darić', subagent: 'Travel Pro DOO', supplier: 'Amadeus', branch: 'Beograd - Knez', amount: 620, debt: 620, payment: 620, status: 'Confirmed', time: '09:15', risk: 'low', margin: 62, daysAgo: 0, country: 'Austrija', destination: 'Beč', serviceName: 'Hotel Sacher Wien', checkIn: '2026-05-10', checkOut: '2026-05-13', productType: 'hotel' },
];

const CommandCenter: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const isDark = theme === 'navy';

    const [statusFilter, setStatusFilter] = useState<'all' | 'Confirmed' | 'Pending' | 'Cancelled' | 'Active' | 'Reservation'>('all');
    const [daysFilter, setDaysFilter] = useState<number | string>(30);
    const [aggType, setAggType] = useState<'none' | 'subagent' | 'supplier' | 'branch' | 'clientType'>('none');
    const [productFilter, setProductFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [searchQuery, setSearchQuery] = useState('');
    const [searchTerms, setSearchTerms] = useState<string[]>([]);

    // Moved these to follows Rules of Hooks (top level)
    const [bookingDate, setBookingDate] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });
    const [stayDate, setStayDate] = useState<{ start: string | null, end: string | null }>({ start: null, end: null });
    const [showBookingCal, setShowBookingCal] = useState(false);
    const [showStayCal, setShowStayCal] = useState(false);

    const addSearchTerm = (term: string) => {
        if (!searchTerms.includes(term)) {
            setSearchTerms([...searchTerms, term]);
        }
        setSearchQuery('');
    };

    const toggleSearchTerm = (term: string) => {
        if (searchTerms.includes(term)) {
            setSearchTerms(searchTerms.filter(t => t !== term));
        } else {
            setSearchTerms([...searchTerms, term]);
        }
        setSearchQuery('');
    };

    const removeSearchTerm = (term: string) => {
        setSearchTerms(searchTerms.filter(t => t !== term));
    };

    const stLabelToTerm: Record<string, string> = {
        'Rezervacije': 'Rezervacija',
        'Potvrđene': 'Confirmed',
        'Na čekanju': 'Pending',
        'Otkazane': 'Cancelled'
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            addSearchTerm(searchQuery.trim());
        }
    };

    const filteredReservations = LIVE_FEED.filter(res => {
        // 1. Status Filter
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            if (statusFilter === 'Active') {
                matchesStatus = (res.status === 'Confirmed' && res.payment > 0);
            } else if (statusFilter === 'Reservation') {
                matchesStatus = (res.status === 'Confirmed' && res.payment === 0);
            } else {
                matchesStatus = (res.status === statusFilter);
            }
        }

        // 2. Date Logic (New: Prioritize Ranges)
        let matchesDate = true;
        const isRangeActive = !!bookingDate.start || !!stayDate.start;

        if (isRangeActive) {
            if (bookingDate.start) {
                const bDate = new Date();
                bDate.setDate(bDate.getDate() - (res.daysAgo || 0));
                bDate.setHours(0, 0, 0, 0);
                const start = new Date(bookingDate.start);
                const end = new Date(bookingDate.end || bookingDate.start);
                if (bDate < start || bDate > end) matchesDate = false;
            }
            if (matchesDate && stayDate.start) {
                const sDate = new Date(res.checkIn);
                sDate.setHours(0, 0, 0, 0);
                const start = new Date(stayDate.start);
                const end = new Date(stayDate.end || stayDate.start);
                if (sDate < start || sDate > end) matchesDate = false;
            }
        } else {
            matchesDate = res.daysAgo < (typeof daysFilter === 'number' ? daysFilter : 30);
        }

        const matchesProduct = productFilter === 'all' ? true : (res as any).productType === productFilter;

        // 3. Multi-term Search Logic
        if (searchTerms.length > 0) {
            const productTypes = ['smeštaj', 'avio', 'paket', 'putovanje', 'transfer', 'čarteri', 'bus ture', 'krstarenja'];
            const productTerms = searchTerms.filter(t => productTypes.includes(t.toLowerCase()));
            const otherTerms = searchTerms.filter(t => !productTypes.includes(t.toLowerCase()));

            const searchSource = [
                res.id,
                res.customer,
                res.subagent || '',
                res.supplier,
                res.branch,
                res.serviceName,
                res.country,
                res.destination,
                res.status,
                res.productType
            ].join(' ').toLowerCase();

            if (productTerms.length > 0) {
                const matchesAnyProduct = productTerms.some(term => {
                    const t = term.toLowerCase();
                    const mapped = t === 'smeštaj' ? 'hotel' :
                        t === 'avio' ? 'flight' :
                            t === 'paket' ? 'package' :
                                t === 'putovanje' ? 'travel' :
                                    t === 'transfer' ? 'transfer' :
                                        t === 'čarteri' ? 'charter' :
                                            t === 'bus ture' ? 'bus' :
                                                t === 'krstarenja' ? 'cruise' : t;
                    return (res as any).productType === mapped || (res.serviceName && res.serviceName.toLowerCase().includes(mapped));
                });
                if (!matchesAnyProduct) return false;
            }

            if (otherTerms.length > 0) {
                // Group status terms to handle them with OR logic, other terms with AND logic
                const statusTerms = ['rezervacija', 'confirmed', 'pending', 'cancelled', 'potvrđene'];
                const selectedStatusTerms = otherTerms.filter(t => statusTerms.includes(t.toLowerCase()));
                const nonStatusTerms = otherTerms.filter(t => !statusTerms.includes(t.toLowerCase()));

                // 1. All non-status terms must match (AND)
                const nonStatusMatch = nonStatusTerms.every(term => searchSource.includes(term.toLowerCase()));
                if (!nonStatusMatch) return false;

                // 2. If status terms are present, at least one must match (OR)
                if (selectedStatusTerms.length > 0) {
                    const statusMatch = selectedStatusTerms.some(term => {
                        const t = term.toLowerCase();
                        if (t === 'rezervacija') return res.status === 'Confirmed' && res.payment === 0;
                        if (t === 'confirmed' || t === 'potvrđene') return res.status === 'Confirmed' && res.payment > 0;
                        if (t === 'pending') return res.status === 'Pending';
                        if (t === 'cancelled') return res.status === 'Cancelled';
                        return searchSource.includes(t);
                    });
                    if (!statusMatch) return false;
                }
            }
        }

        return matchesStatus && matchesDate && matchesProduct;
    });

    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
    const paginatedReservations = filteredReservations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const totalReservations = filteredReservations.length;
    const totalDebt = filteredReservations.reduce((acc: number, res: any) => acc + (res.debt || 0), 0);
    const totalPayments = filteredReservations.reduce((acc: number, res: any) => acc + (res.payment || 0), 0);

    const getStatusDisplay = (res: any) => {
        if (res.status === 'Cancelled') return { label: 'Storno', color: '#ef4444' };
        if (res.status === 'Pending') return { label: 'Pending', color: '#f59e0b' };
        if (res.status === 'Confirmed') {
            if (res.payment > 0) return { label: 'Aktivna', color: '#10b981' };
            return { label: 'Rezervacija', color: '#3b82f6' };
        }
        return { label: res.status, color: '#64748b' };
    };

    const exportToExcel = () => {
        const dataToExport = filteredReservations.map(res => ({
            'ID': res.id,
            'Vreme': res.time,
            'Kupac': res.customer,
            'Vrsta': res.productType?.toUpperCase() || 'N/A',
            'Usluga': res.productType === 'flight' ? `Itinerer: ${res.serviceName}` : res.productType === 'package' ? `Putovanje: ${res.serviceName}` : `Hotel: ${res.serviceName}`,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Operacije');
        XLSX.writeFile(workbook, `CommandCenter_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleSendEmail = () => {
        const shareId = Math.random().toString(36).substr(2, 9);
        const reportData = {
            reservations: filteredReservations.map(res => {
                const d = new Date();
                d.setDate(d.getDate() - (res.daysAgo || 0));
                return {
                    id: res.id,
                    date: d.toLocaleDateString('sr-Latn-RS'),
                    customer: res.customer,
                    details: res.productType === 'flight' ? `Itinerer: ${res.serviceName}` : res.productType === 'package' ? `Putovanje: ${res.serviceName}` : `Hotel: ${res.serviceName}`,
                    debt: res.debt,
                    payment: res.payment,
                    statusLabel: getStatusDisplay(res).label,
                    statusColor: getStatusDisplay(res).color
                };
            }),
            filters: {
                status: statusFilter,
                days: daysFilter,
                bookingDate,
                stayDate
            },
            totals: {
                debt: totalDebt,
                balance: totalDebt - totalPayments
            }
        };

        // Save data to localStorage to simulate a database for the "public" link
        const key = `report_${shareId}`;
        localStorage.setItem(key, JSON.stringify(reportData));

        // Verify save
        console.log(`Saved report to ${key}`, reportData);

        const publicLink = `${window.location.origin}/share/report/${shareId}`;
        const subject = encodeURIComponent('Operativni Izveštaj - PrimeClick');
        const body = encodeURIComponent(`Poštovani,\n\nU prilogu je operativni izveštaj za period: ${bookingDate.start ? `${bookingDate.start} - ${bookingDate.end}` : (daysFilter + ' dana')}.\nJavni link za pregled: ${publicLink}\n\nOvaj link je vidljiv dok je aktivan vaš pretraživač.\n\nSrdačan pozdrav!`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    React.useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data === 'sendEmail') {
                handleSendEmail();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [filteredReservations, statusFilter, daysFilter, bookingDate, stayDate]);

    const openReport = () => {
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
            const totalDebtVal = filteredReservations.reduce((acc, res) => acc + res.debt, 0);
            const totalPaidVal = filteredReservations.reduce((acc, res) => acc + res.payment, 0);
            const totalBalanceVal = totalDebtVal - totalPaidVal;

            reportWindow.document.write(`
                <html>
                    <head>
                        <title>Operativni Izveštaj - Command Center</title>
                        <style>
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; line-height: 1.5; }
                            .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                            h1 { margin: 0; color: #0f172a; font-size: 28px; font-weight: 800; }
                            .meta { font-size: 13px; color: #64748b; text-align: right; }
                            .filter-pill { display: inline-block; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: 700; color: #334155; margin-left: 5px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                            th, td { border: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; }
                            th { background-color: #f8fafc; text-transform: uppercase; font-weight: 800; color: #475569; font-size: 11px; }
                            td { font-size: 15px; }
                            tr:nth-child(even) { background-color: #f8fafc; }
                            .total-row { background: #1e293b !important; color: white; font-weight: 900; }
                            .total-row td { border-color: #334155; font-size: 16px; padding: 14px 8px; }
                            .amount { text-align: right; font-weight: 600; white-space: nowrap; font-size: 16px; }
                            .status { font-weight: 700; text-align: center; font-size: 14px; }
                            .id-cell { font-weight: 700; color: #3b82f6; font-size: 16px; }
                            .actions { margin-top: 40px; border-top: 2px solid #f1f5f9; padding-top: 30px; display: flex; gap: 15px; }
                            @media print {
                                .actions { display: none; }
                                body { padding: 0; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div>
                                <h1>Operativni Izveštaj - PrimeClick</h1>
                                <p style="margin: 5px 0 0 0; color: #3b82f6; font-weight: 700; font-size: 12px;">COMMAND CENTER INTELLIGENCE</p>
                            </div>
                            <div class="meta">
                                <strong>Datum izdavanja:</strong> ${new Date().toLocaleDateString('sr-RS')}<br/>
                                <strong>Status:</strong> <span class="filter-pill">${statusFilter.toUpperCase()}</span> 
                                ${(!bookingDate.start && !stayDate.start) ? `<strong>Period:</strong> <span class="filter-pill">${daysFilter} dana</span>` : ''}<br/>
                                ${bookingDate.start ? `<strong>Rezervacija:</strong> <span class="filter-pill">${bookingDate.start} - ${bookingDate.end}</span>` : ''}
                                ${stayDate.start ? `<strong>Boravak:</strong> <span class="filter-pill">${stayDate.start} - ${stayDate.end}</span>` : ''}
                            </div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>ID / DATUM / VREME</th>
                                    <th>KUPAC / DETALJI</th>
                                    <th>VRSTA</th>
                                    <th>KLIJENT</th>
                                    <th>DOBAVLJAČ</th>
                                    <th>POSLOVNICA</th>
                                    <th class="amount">ZADUŽENJE</th>
                                    <th class="amount">NAPLAĆENO</th>
                                    <th class="amount">ZA UPLATU</th>
                                    <th class="status">STATUS</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredReservations.map(res => {
                const d = new Date();
                d.setDate(d.getDate() - (res.daysAgo || 0));
                const dateStr = d.toLocaleDateString('sr-Latn-RS');
                const balance = res.debt - res.payment;
                const statusObj = getStatusDisplay(res);

                return `
                                        <tr>
                                            <td>
                                                <div class="id-cell">${res.id}</div>
                                                <div style="font-size: 12px; opacity: 0.7;">${dateStr}</div>
                                                <div style="font-size: 12px; opacity: 0.5;">${res.time}</div>
                                            </td>
                                            <td>
                                                <div style="font-weight: 700; font-size: 16px;">${res.customer}</div>
                                                <div style="font-size: 12px; color: #64748b;">
                                                    ${res.productType === 'flight' ? `Itinerer: ${res.serviceName}` : res.productType === 'package' ? `Putovanje: ${res.serviceName}` : `Hotel: ${res.serviceName}`}
                                                    <br/>${res.country}, ${res.destination}
                                                </div>
                                            </td>
                                            <td>${res.productType?.toUpperCase()}</td>
                                            <td>${res.subagent || (res.clientType === 'B2B' ? 'B2B Klijent' : 'Direktni Putnik')}</td>
                                            <td>${res.supplier}</td>
                                            <td>${res.branch}</td>
                                            <td class="amount">${res.debt.toLocaleString()} €</td>
                                            <td class="amount">${res.payment.toLocaleString()} €</td>
                                            <td class="amount" style="color: ${balance > 0 ? '#ef4444' : '#10b981'}">${balance.toLocaleString()} €</td>
                                            <td class="status">
                                                <span style="color: ${statusObj.color}; border: 1px solid ${statusObj.color}33; padding: 4px 8px; border-radius: 4px; background: ${statusObj.color}11;">
                                                    ${statusObj.label}
                                                </span>
                                            </td>
                                        </tr>
                                    `;
            }).join('')}
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="6">UKUPNO (${filteredReservations.length} rezervacija)</td>
                                    <td class="amount">${totalDebtVal.toLocaleString()} €</td>
                                    <td class="amount" style="color: #10b981;">${totalPaidVal.toLocaleString()} €</td>
                                    <td class="amount" style="color: ${totalBalanceVal > 0 ? '#ef4444' : '#10b981'}">${totalBalanceVal.toLocaleString()} €</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>

                        <div class="actions">
                            <button onclick="window.print()" style="padding: 12px 24px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">ŠTAMPAJ IZVEŠTAJ</button>
                            <button onclick="window.opener.postMessage('sendEmail', '*')" style="padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">POŠALJI MEJLOM</button>
                            <button onclick="window.close()" style="padding: 12px 24px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 14px;">ZATVORI</button>
                        </div>
                        <script>
                            window.addEventListener('message', (event) => {
                                if (event.data === 'emailSent') {
                                    alert('Mejl klijent je pokrenut!');
                                }
                            });
                        </script>
                    </body>
                </html>
            `);
            reportWindow.document.close();
        }
    };

    const aggregatedData = React.useMemo(() => {
        if (aggType === 'none') return [];
        const map = new Map();
        const key = aggType === 'subagent' ? 'subagent' :
            aggType === 'supplier' ? 'supplier' :
                aggType === 'branch' ? 'branch' : 'clientType';

        filteredReservations.forEach(res => {
            let val = (res as any)[key];
            if (aggType === 'clientType' && res.subagent) {
                val = 'SUBAGENT';
            }
            if (!val && aggType === 'subagent') val = 'Direktna Prodaja';

            if (!map.has(val)) {
                map.set(val, { name: val, count: 0, amount: 0, debt: 0, payment: 0 });
            }
            const node = map.get(val);
            node.count++;
            node.amount += res.amount;
            node.debt += res.debt;
            node.payment += res.payment;
        });
        return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
    }, [filteredReservations, aggType]);

    const livePulseData = React.useMemo(() => {
        const destMap = new Map();
        filteredReservations.forEach(res => {
            if (!destMap.has(res.destination)) {
                destMap.set(res.destination, 0);
            }
            destMap.set(res.destination, destMap.get(res.destination) + 1);
        });

        const sorted = Array.from(destMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const colors = ['#10b981', '#3b82f6', '#f59e0b', '#a855f7', '#ef4444'];

        return sorted.map(([dest, count], index) => ({
            destination: dest,
            count: count,
            color: colors[index % colors.length],
            trend: `+${Math.floor(Math.random() * 5) + 1}`
        }));
    }, [filteredReservations]);

    const chartData = React.useMemo(() => {
        const dailyMap = new Map();

        filteredReservations.forEach(res => {
            const daysAgo = res.daysAgo || 0;
            if (!dailyMap.has(daysAgo)) {
                dailyMap.set(daysAgo, { daysAgo, amount: 0, count: 0 });
            }
            const entry = dailyMap.get(daysAgo);
            entry.amount += res.amount;
            entry.count++;
        });

        return Array.from(dailyMap.values())
            .sort((a, b) => b.daysAgo - a.daysAgo)
            .map(item => {
                const d = new Date();
                d.setDate(d.getDate() - item.daysAgo);
                return {
                    name: d.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' }),
                    amount: item.amount,
                    count: item.count
                };
            });
    }, [filteredReservations]);

    const pulseData = React.useMemo(() => {
        const hourlyMap = new Map();
        // Initialize working hours or full 24h? Full 24h is safer for "pulse"
        for (let i = 8; i < 21; i++) { // Showing typical business hours 8-20h to keep it clean
            const hour = i.toString().padStart(2, '0') + ':00';
            hourlyMap.set(hour, {
                name: hour,
                Confirmed: 0,
                Option: 0,
                Cancelled: 0,
                amount: 0
            });
        }

        filteredReservations.forEach(res => {
            if (res.time) {
                const hourKey = res.time.split(':')[0] + ':00';
                if (hourlyMap.has(hourKey)) {
                    const entry = hourlyMap.get(hourKey);
                    entry.amount += res.amount;
                    if (res.status === 'Confirmed') entry.Confirmed++;
                    else if (res.status === 'Option') entry.Option++;
                    else if (res.status === 'Cancelled') entry.Cancelled++;
                }
            }
        });

        return Array.from(hourlyMap.values());
    }, [filteredReservations]);

    const radarData = React.useMemo(() => {
        const productLanes = { 'hotel': 4, 'avio': 3, 'paket': 2, 'auto': 1 };
        return filteredReservations.map((res: any) => {
            const timeStr = res.time || "12:00";
            const [h, m] = timeStr.split(':').map(Number);
            const timeVal = h + (m / 60);
            return {
                id: res.id,
                time: timeStr,
                timeLabel: timeStr,
                x: timeVal,
                y: (productLanes as any)[res.productType] || 0.5,
                z: res.amount,
                amount: res.amount,
                type: res.productType,
                customer: res.customer,
                color: res.productType === 'hotel' ? '#3b82f6' :
                    res.productType === 'avio' ? '#10b981' :
                        res.productType === 'paket' ? '#a855f7' : '#f59e0b'
            };
        }).filter(d => d.x >= 0 && d.x <= 24); // Keep full 24h
    }, [filteredReservations]);

    const topHour = React.useMemo(() => {
        const hoursMap = new Array(24).fill(0).map((_, i) => ({ hour: i, total: 0 }));
        filteredReservations.forEach(res => {
            if (res.time) {
                const h = parseInt(res.time.split(':')[0]);
                if (h >= 0 && h < 24) hoursMap[h].total += res.amount;
            }
        });
        return hoursMap.reduce((prev, current) => (prev.total > current.total) ? prev : current, { hour: 0, total: 0 });
    }, [filteredReservations]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, daysFilter, aggType, productFilter]);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-card)', // Using card bg as main to make it slightly lighter than the usual deep dark
            color: 'var(--text-primary)',
            padding: '40px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <div style={{ width: '95%', maxWidth: '2400px' }}>

                {/* HEADER ROW */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px'
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
                                border: '0.5px solid rgba(0,0,0,0.07)',
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

                </div>

                {/* FULL-WIDTH SEARCH BAR SECTION */}
                <div style={{
                    marginBottom: '40px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
                        <div style={{
                            flex: 1,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.05)',
                            border: '0.5px solid rgba(0,0,0,0.07)',
                            borderRadius: '24px',
                            padding: '8px 20px',
                            minHeight: '64px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                            transition: 'all 0.3s ease'
                        }}>
                            <Search size={24} style={{ opacity: 0.4, marginRight: '16px' }} />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
                                <AnimatePresence>
                                    {searchTerms.map(term => (
                                        <motion.div
                                            key={term}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '6px 14px',
                                                background: 'var(--accent)',
                                                color: 'white',
                                                borderRadius: '12px',
                                                fontSize: '13px',
                                                fontWeight: '700',
                                                boxShadow: '0 4px 12px var(--accent)40'
                                            }}
                                        >
                                            {term}
                                            <XCircle
                                                size={14}
                                                style={{ cursor: 'pointer', opacity: 0.8 }}
                                                onClick={() => removeSearchTerm(term)}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                <input
                                    type="text"
                                    placeholder={searchTerms.length === 0 ? "Pretražite po ID-u, kupcu, hotelu, statusu..." : ""}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    style={{
                                        flex: 1,
                                        minWidth: '200px',
                                        background: 'transparent',
                                        border: 'none',
                                        outline: 'none',
                                        color: 'var(--text-primary)',
                                        fontSize: '18px',
                                        fontWeight: '600'
                                    }}
                                />
                            </div>
                            {(searchTerms.length > 0 || searchQuery) && (
                                <button
                                    onClick={() => { setSearchTerms([]); setSearchQuery(''); }}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        border: 'none',
                                        color: 'var(--text-secondary)',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        padding: '8px 16px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    OBRIŠI SVE
                                </button>
                            )}
                        </div>

                        {/* Date and Period Filters Positioned Next to Search */}
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {/* PERIOD (DAYS) inline */}
                            {/* DAYS FILTER - UPRIGHT BOX */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                background: 'rgba(30, 41, 59, 0.7)',
                                padding: '10px 20px',
                                borderRadius: '20px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                minHeight: '64px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                                opacity: (bookingDate.start || stayDate.start) ? 0.3 : 1,
                                pointerEvents: (bookingDate.start || stayDate.start) ? 'none' : 'auto',
                            }}>
                                <span style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>Za broj dana</span>
                                <div style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    padding: '5px 12px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <input
                                        type="number"
                                        value={daysFilter === 0 ? '' : daysFilter}
                                        onChange={(e) => setDaysFilter(e.target.value === '' ? 0 : Number(e.target.value))}
                                        disabled={!!(bookingDate.start || stayDate.start)}
                                        style={{
                                            width: '35px',
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#fff',
                                            fontSize: '18px',
                                            fontWeight: '900',
                                            textAlign: 'center',
                                            outline: 'none',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* CALENDAR BUTTONS - WHITE UPRIGHT BOXES */}
                            <button
                                onClick={() => setShowBookingCal(true)}
                                style={{
                                    background: bookingDate.start ? 'rgba(59, 130, 246, 0.2)' : '#ffffff',
                                    border: bookingDate.start ? '2px solid #3b82f6' : 'none',
                                    padding: '10px 25px',
                                    minHeight: '64px',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '2px',
                                    cursor: 'pointer',
                                    minWidth: '180px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <span style={{ fontSize: '9px', fontWeight: '900', color: bookingDate.start ? '#3b82f6' : '#94a3b8', textTransform: 'uppercase' }}>Datum Rezervacije</span>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: bookingDate.start ? '#3b82f6' : '#1e293b' }}>
                                    {bookingDate.start ? `${new Date(bookingDate.start).toLocaleDateString('sr-RS')} - ${new Date(bookingDate.end || bookingDate.start).toLocaleDateString('sr-RS')}` : 'Izaberi period'}
                                </span>
                            </button>

                            <button
                                onClick={() => setShowStayCal(true)}
                                style={{
                                    background: stayDate.start ? 'rgba(16, 185, 129, 0.2)' : '#ffffff',
                                    border: stayDate.start ? '2px solid #10b981' : 'none',
                                    padding: '10px 25px',
                                    minHeight: '64px',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '2px',
                                    cursor: 'pointer',
                                    minWidth: '180px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <span style={{ fontSize: '9px', fontWeight: '900', color: stayDate.start ? '#10b981' : '#94a3b8', textTransform: 'uppercase' }}>Datum Boravka</span>
                                <span style={{ fontSize: '14px', fontWeight: '800', color: stayDate.start ? '#10b981' : '#1e293b' }}>
                                    {stayDate.start ? `${new Date(stayDate.start).toLocaleDateString('sr-RS')} - ${new Date(stayDate.end || stayDate.start).toLocaleDateString('sr-RS')}` : 'Izaberi period'}
                                </span>
                            </button>

                            {(bookingDate.start || stayDate.start) && (
                                <button
                                    onClick={() => {
                                        setBookingDate({ start: null, end: null });
                                        setStayDate({ start: null, end: null });
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '44px',
                                        height: '64px',
                                        borderRadius: '16px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        color: '#ef4444',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Resetuj datume"
                                >
                                    <XCircle size={20} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* FILTER TAGS ROW - BELOW SEARCH */}
                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '12px',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', opacity: 0.5, letterSpacing: '1px' }}>BRZI FILTERI:</span>

                        {/* Status Tags */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['Rezervacija', 'Confirmed', 'Pending', 'Cancelled'].map(st => {
                                const stColors: Record<string, string> = {
                                    'Rezervacija': '#3b82f6',
                                    'Confirmed': '#10b981',
                                    'Pending': '#f59e0b',
                                    'Cancelled': '#ef4444'
                                };
                                const stLabels: Record<string, string> = {
                                    'Rezervacija': 'Rezervacije',
                                    'Confirmed': 'Potvrđene',
                                    'Pending': 'Na čekanju',
                                    'Cancelled': 'Otkazane'
                                };
                                const stTerm = stLabelToTerm[stLabels[st]] || st;
                                const isActive = searchTerms.includes(stTerm);

                                return (
                                    <motion.button
                                        key={st}
                                        whileHover={{ translateY: -2 }}
                                        onClick={() => toggleSearchTerm(stTerm)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            border: isActive ? 'none' : '1.5px solid rgba(0,0,0,0.1)',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            cursor: 'pointer',
                                            background: isActive ? stColors[st] : 'rgba(0,0,0,0.03)',
                                            color: isActive ? 'white' : 'var(--text-secondary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                                            transition: 'all 0.2s ease',
                                            opacity: isActive ? 1 : 0.7
                                        }}
                                    >
                                        <div style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: isActive ? 'rgba(255,255,255,0.6)' : stColors[st],
                                            boxShadow: isActive ? 'none' : `0 0 5px ${stColors[st]}`
                                        }} />
                                        {stLabels[st]}
                                    </motion.button>
                                );
                            })}
                        </div>

                        <div style={{ width: '1px', height: '20px', background: 'var(--border)' }} />

                        {/* Product Tags */}
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[
                                { id: 'all', label: 'Sve', icon: <Activity size={14} /> },
                                { id: 'hotel', label: 'Smeštaj', icon: <Building size={14} /> },
                                { id: 'flight', label: 'Avio', icon: <PlaneTakeoff size={14} /> },
                                { id: 'package', label: 'Paket', icon: <PackageIcon size={14} /> },
                                { id: 'travel', label: 'Putovanje', icon: <Globe size={14} /> },
                                { id: 'transfer', label: 'Transfer', icon: <TrendingUp size={14} /> },
                                { id: 'charter', label: 'Čarteri', icon: <Zap size={14} /> },
                                { id: 'bus', label: 'Bus Ture', icon: <Monitor size={14} /> },
                                { id: 'cruise', label: 'Krstarenja', icon: <Ship size={14} /> }
                            ].map(p => {
                                const isActive = p.id === 'all'
                                    ? searchTerms.filter(t => ['smeštaj', 'avio', 'paket', 'putovanje', 'transfer', 'čarteri', 'bus ture', 'krstarenja'].includes(t.toLowerCase())).length === 0
                                    : searchTerms.includes(p.label);

                                return (
                                    <motion.button
                                        key={p.id}
                                        whileHover={{ translateY: -2 }}
                                        onClick={() => {
                                            if (p.id === 'all') {
                                                setSearchTerms(prev => prev.filter(t => !['smeštaj', 'avio', 'paket', 'putovanje', 'transfer', 'čarteri', 'bus ture', 'krstarenja'].includes(t.toLowerCase())));
                                            } else {
                                                if (!searchTerms.includes(p.label)) {
                                                    addSearchTerm(p.label);
                                                } else {
                                                    setSearchTerms(prev => prev.filter(t => t !== p.label));
                                                }
                                            }
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '8px 16px', borderRadius: '12px',
                                            border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                                            background: isActive ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.03)',
                                            color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                                            fontSize: '12px', fontWeight: '800', cursor: 'pointer'
                                        }}
                                    >
                                        {p.icon} {p.label}
                                    </motion.button>
                                )
                            })}
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
                        { label: 'Aktivne Rezervacije', value: totalReservations, icon: <Activity size={20} />, color: 'var(--accent)', change: '+12%' },
                        { label: 'Ukupno Zaduženje', value: `${totalDebt.toLocaleString()} €`, icon: <CreditCard size={20} />, color: '#ef4444', change: '-4%' },
                        { label: 'Realizovane Uplate', value: `${totalPayments.toLocaleString()} €`, icon: <Zap size={20} />, color: '#10b981', change: '+28%' },
                        { label: 'Prosečna Marža', value: '14.2%', icon: <TrendingUp size={20} />, color: '#a855f7', change: 'Live' }
                    ].map((card, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'rgba(0,0,0,0.02)',
                                borderRadius: '20px',
                                border: '0.5px solid rgba(0,0,0,0.05)',
                                padding: '16px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '20px',
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                            }}
                        >
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '14px',
                                background: `${card.color}15`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: card.color,
                                flexShrink: 0
                            }}>
                                {card.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{card.label}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ fontSize: '30px', fontWeight: '900', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>{card.value}</div>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: '900',
                                    color: card.color,
                                    background: `${card.color}10`,
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {card.change}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* TWO-COLUMN WORKSPACE */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) 400px',
                    gap: '32px'
                }}>

                    {/* LEFT COLUMN: OPERATIONS FEED */}
                    <div style={{
                        background: 'none',
                        borderRadius: '32px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        padding: '32px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                        overflowX: 'auto'
                    }}>
                        {/* CONSOLIDATED HUB: AGGREGATORS & ACTIONS */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(255,255,255,0.03)',
                            padding: '12px 20px',
                            borderRadius: '16px',
                            border: '0.5px solid rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {[
                                    { id: 'none', label: 'Feed', icon: <Activity size={12} /> },
                                    { id: 'clientType', label: 'Kupci', icon: <Users size={12} /> },
                                    { id: 'subagent', label: 'Subagenti', icon: <Users size={12} /> },
                                    { id: 'supplier', label: 'Dobavljači', icon: <Globe size={12} /> },
                                    { id: 'branch', label: 'Poslovnice', icon: <Building size={12} /> }
                                ].map(btn => (
                                    <button
                                        key={btn.id}
                                        onClick={() => setAggType(btn.id as any)}
                                        style={{
                                            padding: '8px 16px', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: '900', cursor: 'pointer',
                                            background: aggType === btn.id ? 'var(--accent)' : 'rgba(0,0,0,0.2)',
                                            color: aggType === btn.id ? 'white' : 'var(--text-secondary)',
                                            display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2'
                                        }}
                                    >
                                        {btn.icon} {btn.label}
                                    </button>
                                ))}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={exportToExcel} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b98133', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Download size={16} /></button>
                                <button onClick={openReport} style={{ padding: '0 16px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f633', color: '#3b82f6', fontSize: '11px', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><FileText size={14} /> IZVEŠTAJ</button>
                                <button
                                    onClick={handleSendEmail}
                                    style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid #a855f733', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                    <Mail size={16} />
                                </button>
                            </div>
                        </div>

                        {/* TABLE WITH GRID LINES */}
                        <div style={{
                            background: 'none',
                            borderRadius: '20px',
                            border: '1px solid rgba(0,0,0,0.05)',
                            overflow: 'hidden'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.15)' }}>
                                    {aggType === 'none' ? (
                                        <tr style={{ background: 'rgba(0,0,0,0.1)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '900' }}>
                                            <th style={{ padding: '16px 24px', width: '130px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>ID / DATUM / VREME</th>
                                            <th style={{ padding: '16px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Kupac / Detalji</th>
                                            <th style={{ padding: '16px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Vrsta</th>
                                            <th style={{ padding: '16px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Vrsta Kupca</th>
                                            <th style={{ padding: '16px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Dobavljač</th>
                                            <th style={{ padding: '16px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Poslovnica</th>
                                            <th style={{ padding: '16px', textAlign: 'right', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Zaduženje</th>
                                            <th style={{ padding: '16px', textAlign: 'right', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Naplaćeno</th>
                                            <th style={{ padding: '16px', textAlign: 'right', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Za uplatu</th>
                                            <th style={{ padding: '16px', textAlign: 'center', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Status</th>
                                            <th style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}></th>
                                        </tr>
                                    ) : (
                                        <tr style={{ background: 'rgba(0,0,0,0.05)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '900' }}>
                                            <th style={{ padding: '16px 24px', flex: 2, borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>{aggType === 'subagent' ? 'Subagent' : aggType === 'supplier' ? 'Dobavljač' : aggType === 'branch' ? 'Poslovnica' : 'Vrsta Kupca'}</th>
                                            <th style={{ padding: '16px', textAlign: 'center', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Broj Rezervacija</th>
                                            <th style={{ padding: '16px', textAlign: 'right', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Zaduženje</th>
                                            <th style={{ padding: '16px', textAlign: 'right', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Naplaćeno</th>
                                            <th style={{ padding: '16px', textAlign: 'right', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>Za uplatu</th>
                                            <th style={{ borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}></th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {aggType === 'none' ? (
                                        paginatedReservations.map((res, i) => (
                                            <motion.tr
                                                key={res.id}
                                                initial={{ opacity: 0, x: -15 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.03 }}
                                                style={{
                                                    background: 'transparent',
                                                    transition: 'all 0.2s',
                                                    cursor: 'pointer',
                                                    borderBottom: '0.5px solid rgba(0,0,0,0.05)', // Stronger line for light mode
                                                }}
                                                className="pulse-row"
                                            >
                                                <td style={{ padding: '14px 24px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                                                    <Link to={`/reservation-architect?id=${res.id}`} target="_blank" style={{ textDecoration: 'none' }}>
                                                        <div style={{
                                                            fontWeight: '900',
                                                            background: res.status === 'Confirmed'
                                                                ? (res.payment > 0 ? '#10b981' : '#3b82f6')
                                                                : res.status === 'Cancelled' ? '#ef4444' : '#f59e0b',
                                                            color: 'white',
                                                            fontSize: '11px',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            textAlign: 'center',
                                                            width: '80px',
                                                            marginBottom: '4px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                            className="id-pill-hover"
                                                        >{res.id}</div>
                                                    </Link>
                                                    <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: '700' }}>
                                                        {(() => {
                                                            const d = new Date();
                                                            d.setDate(d.getDate() - (res.daysAgo || 0));
                                                            return d.toLocaleDateString('sr-Latn-RS');
                                                        })()}
                                                    </div>
                                                    <div style={{ fontSize: '10px', opacity: 0.4, fontWeight: '600' }}>{res.time}</div>
                                                </td>
                                                <td style={{ padding: '12px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                                                    <div style={{ fontWeight: '700', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', fontSize: '15px' }}>{res.customer}</div>
                                                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={{ fontWeight: '800', fontSize: '12px', color: 'var(--text-primary)', opacity: 0.9 }}>
                                                            {res.productType === 'flight' ? `Itinerer: ${res.serviceName}` : res.productType === 'package' ? `Putovanje: ${res.serviceName}` : `Hotel: ${res.serviceName}`}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Globe size={10} /> {res.country}, {res.destination}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontWeight: '700' }}>
                                                            <Clock size={10} /> Boravak: {new Date(res.checkIn).toLocaleDateString('sr-Latn-RS')} - {new Date(res.checkOut).toLocaleDateString('sr-Latn-RS')}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                                                    <div style={{
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        background: 'rgba(0,0,0,0.05)',
                                                        color: 'var(--text-primary)',
                                                        fontSize: '10px',
                                                        fontWeight: '800',
                                                        textTransform: 'uppercase',
                                                        width: 'fit-content'
                                                    }}>
                                                        {res.productType}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <div style={{ fontWeight: '800', fontSize: '13px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                                                            {res.subagent ? res.subagent : (res.clientType === 'B2B' ? 'Agencijski Klijent' : 'Direktni Putnik')}
                                                        </div>
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            justifyContent: 'center',
                                                            padding: '2px 8px',
                                                            borderRadius: '5px',
                                                            background: 'rgba(150, 150, 150, 0.1)',
                                                            color: 'var(--text-secondary)',
                                                            fontSize: '9px',
                                                            fontWeight: '900',
                                                            width: '75px'
                                                        }}>
                                                            {res.subagent ? 'SUBAGENT' : res.clientType}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '12px' }}>
                                                        <Globe size={12} color="#10b981" />
                                                        {res.supplier}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                                                    <div style={{ fontSize: '12px', fontWeight: '700' }}>{res.branch}</div>
                                                </td>
                                                <td style={{ padding: '12px', fontWeight: '900', fontSize: '14px', textAlign: 'right', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                                                    {res.debt.toLocaleString()} €
                                                </td>
                                                <td style={{ padding: '12px', fontWeight: '900', fontSize: '14px', textAlign: 'right', color: '#10b981', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                                                    {res.payment.toLocaleString()} €
                                                </td>
                                                <td style={{ padding: '12px', fontWeight: '900', fontSize: '14px', textAlign: 'right', color: '#ef4444', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                                                    {(res.debt - res.payment).toLocaleString()} €
                                                </td>
                                                <td style={{ padding: '12px', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                                                    <div style={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                        color: res.status === 'Confirmed' ? '#10b981' : res.status === 'Cancelled' ? '#ef4444' : '#f59e0b',
                                                        fontSize: '10px', fontWeight: '900',
                                                        background: res.status === 'Confirmed' ? 'rgba(16, 185, 129, 0.1)' : res.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                        padding: '4px 12px', borderRadius: '6px', margin: '0 auto',
                                                        width: '100px'
                                                    }}>
                                                        {res.status.toUpperCase()}
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button onClick={() => navigate(`/reservation-architect?id=${res.id}`)} style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ArrowUpRight size={14} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        aggregatedData.map((data, idx) => (
                                            <motion.tr
                                                key={idx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.04 }}
                                                style={{ background: 'transparent', borderBottom: '0.5px solid rgba(0,0,0,0.05)', transition: '0.2s', cursor: 'pointer' }}
                                                className="pulse-row"
                                            >
                                                <td style={{ padding: '16px 24px', fontWeight: '800', fontSize: '15px', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>{data.name}</td>
                                                <td style={{ textAlign: 'center', borderRight: '0.5px solid rgba(0,0,0,0.05)', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                                                    <div style={{ display: 'inline-block', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '4px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '900' }}>
                                                        {data.count} Rez.
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right', fontWeight: '900', fontSize: '14px', borderRight: '0.5px solid rgba(0,0,0,0.07)', borderBottom: '0.5px solid rgba(0,0,0,0.07)', padding: '12px' }}>{data.debt.toLocaleString()} €</td>
                                                <td style={{ textAlign: 'right', fontWeight: '900', fontSize: '14px', color: '#10b981', borderRight: '0.5px solid rgba(0,0,0,0.07)', borderBottom: '0.5px solid rgba(0,0,0,0.07)', padding: '12px' }}>{data.payment.toLocaleString()} €</td>
                                                <td style={{ textAlign: 'right', fontWeight: '900', fontSize: '14px', color: '#ef4444', borderBottom: '0.5px solid rgba(0,0,0,0.05)', padding: '12px' }}>{(data.debt - data.payment).toLocaleString()} €</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <button style={{ width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                        <ArrowUpRight size={14} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination at the bottom of the table */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '24px 0',
                            gap: '12px',
                            borderTop: '0.5px solid rgba(0,0,0,0.05)',
                            marginTop: '8px'
                        }}>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '0.5px solid rgba(0,0,0,0.05)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === 1 ? 0.3 : 1
                                }}
                            >
                                Prethodna
                            </button>
                            <div style={{ fontSize: '13px', fontWeight: '800', border: '0.5px solid rgba(0,0,0,0.05)', padding: '6px 16px', borderRadius: '8px' }}>
                                <span style={{ color: 'var(--accent)' }}>{currentPage}</span> / {totalPages || 1}
                            </div>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '0.5px solid rgba(0,0,0,0.05)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                                    opacity: currentPage >= totalPages ? 0.3 : 1
                                }}
                            >
                                Sledeća
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: INTELLIGENCE & PULSE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* DESTINATION PULSE RING */}
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '24px',
                            padding: '24px',
                            border: '0.5px solid rgba(0,0,0,0.05)',
                            position: 'relative',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <MapIcon size={16} />
                                </div>
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>Live Market Pulse</h3>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {livePulseData.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>Nema podataka za prikaz</div>
                                ) : (
                                    livePulseData.map((pulse, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.03)', padding: '10px 14px', borderRadius: '12px', border: '0.5px solid rgba(0,0,0,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: pulse.color }} />
                                                <span style={{ fontWeight: '800', fontSize: '13px' }}>{pulse.destination}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: '900', fontSize: '14px' }}>{pulse.count}</span>
                                                <span style={{ fontSize: '10px', color: pulse.trend.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: '900' }}>{pulse.trend}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* AI INTELLIGENCE STREAM */}
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '24px',
                            padding: '24px',
                            border: '0.5px solid rgba(0,0,0,0.05)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                <MessageSquare size={18} color="var(--accent)" />
                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>Intelligence Stream</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {[
                                    { title: 'Alarm: 2 jedinice', desc: 'Nizak nivo za Hotel Hunguest Sun Resort (Double Room) na dan 2026-06-06.', color: '#f59e0b', type: 'warning' },
                                    { title: 'DANGER: Samo 1 jedinica!', desc: 'Hotel: Hotel Hunguest Sun Resort, Soba: Double Room (2026-06-11). Hitno zatvaranje prodaje!', color: '#ef4444', type: 'danger' },
                                    { title: 'Alarm: 2 jedinice', desc: 'Nizak nivo za Hotel Hunguest Sun Resort (Double Room) na dan 2026-06-21.', color: '#f59e0b', type: 'warning' }
                                ].map((notif, i) => (
                                    <motion.div
                                        key={i}
                                        whileHover={{ scale: 1.02 }}
                                        style={{
                                            padding: '20px',
                                            background: notif.type === 'danger' ? 'rgba(254, 242, 242, 0.9)' : 'rgba(255, 251, 235, 0.9)',
                                            borderRadius: '20px',
                                            border: `1px solid ${notif.type === 'danger' ? '#fecaca' : '#fef3c7'}`,
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                                            position: 'relative',
                                            display: 'flex',
                                            gap: '16px'
                                        }}
                                    >
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '12px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: notif.color, flexShrink: 0
                                        }}>
                                            {notif.type === 'danger' ? <ShieldAlert size={28} /> : <Zap size={28} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#1e293b', marginBottom: '4px' }}>{notif.title}</div>
                                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', lineHeight: '1.5' }}>{notif.desc}</div>
                                        </div>
                                        <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', alignSelf: 'flex-start' }}>
                                            <Users size={16} /> {/* Mock X as Users for now or real icon */}
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS FOR ID LINKS */}
            <style>{`
                .id-pill-hover:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    filter: brightness(1.1);
                    cursor: pointer;
                }
                .radar-id-link {
                    color: #64748b;
                    text-decoration: none;
                    transition: all 0.2s;
                }
                .radar-id-link:hover {
                    color: #3b82f6;
                    text-decoration: underline;
                }
            `}</style>

            {/* SALES FLOW RADAR SECTION */}
            <div style={{ padding: '0 20px', width: '100%', marginBottom: '100px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '30px', marginTop: '40px' }}>

                    {/* RADAR 1: THE BUBBLE TIMELINE */}
                    <div style={{
                        background: isDark ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 1) 100%)' : '#fff',
                        borderRadius: '40px',
                        padding: '40px',
                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                        boxShadow: isDark ? '0 30px 100px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.05)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '28px', fontWeight: '900', color: isDark ? '#fff' : '#1e293b', letterSpacing: '-1px' }}>Sales Flow Radar</h3>
                                <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: isDark ? '#64748b' : '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '2px' }}>Real-time Booking Stream (0h - 24h)</p>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', padding: '8px 15px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: isDark ? '#fff' : '#1e293b' }}>Hotel</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 15px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: isDark ? '#fff' : '#1e293b' }}>Avio</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '400px', cursor: 'crosshair' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="1 10" vertical={true} horizontal={false} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        domain={[0, 24]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#334155', fontSize: 13, fontWeight: 900 }}
                                        ticks={[0, 4, 8, 12, 16, 20, 24]}
                                        tickFormatter={(val) => `${val}:00`}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        domain={[0, 5]}
                                        hide
                                    />
                                    <ZAxis type="number" dataKey="z" range={[100, 3000]} />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3', stroke: '#3b82f6' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div style={{
                                                        background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                                                        backdropFilter: 'blur(20px)',
                                                        padding: '20px',
                                                        borderRadius: '24px',
                                                        border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                                        boxShadow: isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.1)',
                                                        minWidth: '220px'
                                                    }}>
                                                        <div style={{ color: data.color, fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '1px' }}>
                                                            {data.type} • {data.timeLabel}h
                                                        </div>
                                                        <div style={{ fontSize: '16px', fontWeight: '900', color: isDark ? '#fff' : '#1e293b', marginBottom: '4px' }}>{data.customer}</div>
                                                        <div style={{ fontSize: '20px', fontWeight: '900', color: isDark ? '#fff' : '#1e293b' }}>{data.amount.toLocaleString()} €</div>
                                                        <div style={{ marginTop: '10px', fontSize: '10px', fontWeight: '700' }}>
                                                            <Link to={`/reservation-architect?id=${data.id}`} target="_blank" className="radar-id-link">
                                                                ID: {data.id}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter data={radarData}>
                                        {radarData.map((entry: any, index: number) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                style={{
                                                    filter: `drop-shadow(0 0 10px ${entry.color}66)`,
                                                    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                                }}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>

                        {/* DECORATIVE RADAR GRID LINES */}
                        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: isDark ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)' : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.03), transparent)' }} />
                    </div>

                    {/* RADAR 2: STATS & CATEGORY PULSE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                        {/* THE "GOLDEN HOUR" CARD */}
                        <div style={{
                            background: isDark ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            borderRadius: '32px',
                            padding: '30px',
                            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                            boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.3)' : '0 10px 20px rgba(0,0,0,0.05)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '50%', filter: 'blur(40px)' }} />
                            <Zap size={24} color="#f59e0b" style={{ marginBottom: '15px' }} />
                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Zlatni Sat</h4>
                            <div style={{ margin: '10px 0', fontSize: '32px', fontWeight: '950', color: isDark ? '#fff' : '#1e293b' }}>{topHour.hour}:00h</div>
                            <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '800' }}>Promet: {topHour.total.toLocaleString()} €</div>
                            <div style={{ marginTop: '15px', padding: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '14px', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                Najveći intenzitet upita detektovan u ovom periodu.
                            </div>
                        </div>

                        {/* CATEGORY PULSE */}
                        <div style={{
                            flex: 1,
                            background: isDark ? 'rgba(15, 23, 42, 0.8)' : '#fff',
                            borderRadius: '32px',
                            padding: '30px',
                            border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: isDark ? 'none' : '0 10px 30px rgba(0,0,0,0.05)'
                        }}>
                            <h4 style={{ margin: '0 0 20px 0', fontSize: '12px', fontWeight: '900', color: isDark ? '#64748b' : '#94a3b8', textTransform: 'uppercase' }}>Puls Kategorija</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {[
                                    { label: 'Hotel', val: 75, color: '#3b82f6' },
                                    { label: 'Avio', val: 45, color: '#10b981' },
                                    { label: 'Paket', val: 30, color: '#a855f7' },
                                    { label: 'Auto', val: 12, color: '#f59e0b' }
                                ].map(cat => (
                                    <div key={cat.label}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: isDark ? '#fff' : '#1e293b' }}>{cat.label}</span>
                                            <span style={{ fontSize: '12px', fontWeight: '800', color: isDark ? '#94a3b8' : '#64748b' }}>{cat.val}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${cat.val}%`, height: '100%', background: cat.color, boxShadow: `0 0 10px ${cat.color}66` }} />
                                        </div>
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
