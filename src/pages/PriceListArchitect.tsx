import React, { useState } from 'react';
import {
    Calendar, Users, DollarSign, Settings, Plus, Trash2,
    Save, ChevronRight, Info, AlertCircle, Percent, Clock,
    CheckCircle2, Building2, Tag, Gift, ChevronDown,
    MousePointer2, Layers, Repeat, ArrowRight, ShieldCheck,
    Briefcase, Sparkles, X
} from 'lucide-react';
import type {
    AdvancedPriceList, AgeCategory, BasePriceEntry,
    OccupancyRule, SurchargeOrDiscount, SpecialOffer
} from '../types/priceList.types';
import './PriceListArchitect.css';

const PriceListArchitect: React.FC = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [priceList, setPriceList] = useState<AdvancedPriceList>({
        id: 'pl-' + Math.random().toString(36).substr(2, 9),
        hotelId: '',
        name: 'Novi Cenovnik 2025',
        isActive: true,
        ageCategories: [
            { id: 'cat-adl', name: 'ADL', minAge: 12, maxAge: 999, isDefault: true },
            { id: 'cat-chd1', name: 'CHD1', minAge: 2, maxAge: 7 },
            { id: 'cat-chd2', name: 'CHD2', minAge: 7, maxAge: 12 },
            { id: 'cat-inf', name: 'INF', minAge: 0, maxAge: 2 }
        ],
        basePrices: [],
        occupancyRules: [],
        surcharges: [],
        discounts: [],
        specialOffers: [],
        cancellationPolicy: { policyType: 'FreeCancellation', rules: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    const updatePriceList = (updates: Partial<AdvancedPriceList>) => {
        setPriceList(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
    };

    const renderHeader = () => (
        <div className="architect-header">
            <div className="header-left">
                <div className="icon-badge">
                    <DollarSign size={24} />
                </div>
                <div>
                    <h1>Cenovnik Architect</h1>
                    <div className="breadcrumb">
                        <span>Konfiguracija</span>
                        <ChevronRight size={14} />
                        <span className="active">{priceList.name}</span>
                    </div>
                </div>
            </div>
            <div className="header-actions">
                <button className="btn-secondary">
                    <CheckCircle2 size={18} />
                    Status: {priceList.isActive ? 'Aktivan' : 'Neaktivan'}
                </button>
                <button className="btn-primary">
                    <Save size={18} />
                    Sačuvaj Cenovnik
                </button>
            </div>
        </div>
    );

    const renderTabs = () => {
        const tabs = [
            { id: 'general', label: '1. Opšte definicije', icon: <Settings size={18} /> },
            { id: 'base_prices', label: '2. Unos osnovnih', icon: <DollarSign size={18} /> },
            { id: 'rules', label: '3. Kreiranje Pravila', icon: <Layers size={18} /> },
            { id: 'surcharges', label: '4. Doplate', icon: <Plus size={18} /> },
            { id: 'discounts', label: '5. Popusti', icon: <Percent size={18} /> },
            { id: 'special_offers', label: '6. Special Offers', icon: <Gift size={18} /> }
        ];

        return (
            <div className="architect-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>
        );
    };

    const renderGeneralTab = () => (
        <div className="tab-content animate-in">
            <div className="card-grid">
                <div className="card glass-card span-2">
                    <div className="card-header">
                        <Info size={18} />
                        <h3>Osnovne Informacije Cenovnika</h3>
                    </div>
                    <div className="form-grid">
                        <div className="form-group span-2">
                            <label>Naziv Cenovnika</label>
                            <input
                                type="text"
                                className="glass-input"
                                value={priceList.name}
                                onChange={e => updatePriceList({ name: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Valuta</label>
                            <select className="glass-select">
                                <option value="EUR">EUR - Euro</option>
                                <option value="RSD">RSD - Dinar</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tržište (Market)</label>
                            <select className="glass-select">
                                <option value="ALL">Sva tržišta</option>
                                <option value="LOCAL">Lokalno tržište</option>
                                <option value="INT">Internacionalno</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="card glass-card span-2">
                    <div className="card-header">
                        <Users size={18} />
                        <h3>Kategorije Osoba i Starosne Granice</h3>
                        <button
                            className="btn-pill"
                            onClick={() => {
                                const newCat: AgeCategory = {
                                    id: 'cat-' + Math.random().toString(36).substr(2, 5),
                                    name: 'New CHD',
                                    minAge: 0,
                                    maxAge: 12
                                };
                                updatePriceList({ ageCategories: [...priceList.ageCategories, newCat] });
                            }}
                        >
                            <Plus size={14} /> DODAJ KATEGORIJU
                        </button>
                    </div>
                    <div className="age-categories-list">
                        {priceList.ageCategories.map((cat, idx) => (
                            <div key={cat.id} className="category-row animate-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                                <div className="cat-info">
                                    <div className={`cat-icon ${cat.name.includes('ADL') ? 'adl' : 'chd'}`}>
                                        {cat.name.charAt(0)}
                                    </div>
                                    <div className="cat-text">
                                        <input
                                            className="inline-input"
                                            value={cat.name}
                                            onChange={e => {
                                                const updated = [...priceList.ageCategories];
                                                updated[idx].name = e.target.value;
                                                updatePriceList({ ageCategories: updated });
                                            }}
                                        />
                                        <span>Kategorija {idx + 1}</span>
                                    </div>
                                </div>
                                <div className="cat-range">
                                    <div className="range-input">
                                        <label>OD</label>
                                        <input
                                            type="number"
                                            value={cat.minAge === 0 ? '0' : (cat.minAge || '')}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const updated = [...priceList.ageCategories];
                                                updated[idx].minAge = val === '' ? ('' as any) : parseInt(val);
                                                updatePriceList({ ageCategories: updated });
                                            }}
                                        />
                                    </div>
                                    <div className="range-divider"></div>
                                    <div className="range-input">
                                        <label>DO</label>
                                        <input
                                            type="number"
                                            value={cat.maxAge === 0 ? '0' : (cat.maxAge || '')}
                                            onChange={e => {
                                                const val = e.target.value;
                                                const updated = [...priceList.ageCategories];
                                                updated[idx].maxAge = val === '' ? ('' as any) : parseInt(val);
                                                updatePriceList({ ageCategories: updated });
                                            }}
                                        />
                                    </div>
                                    <span className="years-label">god.</span>
                                </div>
                                {!cat.isDefault && (
                                    <button
                                        className="delete-btn"
                                        onClick={() => {
                                            updatePriceList({ ageCategories: priceList.ageCategories.filter(c => c.id !== cat.id) });
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderBasePricesTab = () => (
        <div className="tab-content animate-in">
            <div className="card glass-card">
                <div className="card-header">
                    <DollarSign size={18} />
                    <h3>Unos Osnovnih Cena po Kategorijama i Periodima</h3>
                    <button
                        className="btn-pill"
                        onClick={() => {
                            const newEntry: BasePriceEntry = {
                                id: 'bp-' + Math.random().toString(36).substr(2, 5),
                                ageCategoryId: priceList.ageCategories[0].id,
                                dateFrom: '2025-06-01',
                                dateTo: '2025-09-30',
                                amount: 50,
                                currency: 'EUR',
                                pricingType: 'PerPersonPerDay'
                            };
                            updatePriceList({ basePrices: [...priceList.basePrices, newEntry] });
                        }}
                    >
                        <Plus size={14} /> DODAJ RED / PERIOD
                    </button>
                </div>

                <div className="price-table-container">
                    <table className="price-table">
                        <thead>
                            <tr>
                                <th>Kategorija Osoba</th>
                                <th>Od Do godina</th>
                                <th>Period OD</th>
                                <th>Period DO</th>
                                <th>Tip Obračuna</th>
                                <th>Cena / Iznos</th>
                                <th>Akcija</th>
                            </tr>
                        </thead>
                        <tbody>
                            {priceList.basePrices.map((entry, idx) => {
                                const category = priceList.ageCategories.find(c => c.id === entry.ageCategoryId);
                                return (
                                    <tr key={entry.id} className="animate-in" style={{ animationDelay: `${idx * 0.05}s` }}>
                                        <td>
                                            <select
                                                className="table-select"
                                                value={entry.ageCategoryId}
                                                onChange={e => {
                                                    const updated = [...priceList.basePrices];
                                                    updated[idx].ageCategoryId = e.target.value;
                                                    updatePriceList({ basePrices: updated });
                                                }}
                                            >
                                                {priceList.ageCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </td>
                                        <td className="dimmed">{category ? `${category.minAge} - ${category.maxAge}` : '-'}</td>
                                        <td><input type="date" className="table-input" value={entry.dateFrom} onChange={e => {
                                            const updated = [...priceList.basePrices];
                                            updated[idx].dateFrom = e.target.value;
                                            updatePriceList({ basePrices: updated });
                                        }} /></td>
                                        <td><input type="date" className="table-input" value={entry.dateTo} onChange={e => {
                                            const updated = [...priceList.basePrices];
                                            updated[idx].dateTo = e.target.value;
                                            updatePriceList({ basePrices: updated });
                                        }} /></td>
                                        <td>
                                            <select
                                                className="table-select"
                                                value={entry.pricingType}
                                                onChange={e => {
                                                    const updated = [...priceList.basePrices];
                                                    updated[idx].pricingType = e.target.value as any;
                                                    updatePriceList({ basePrices: updated });
                                                }}
                                            >
                                                <option value="PerPersonPerDay">Osoba / Dan</option>
                                                <option value="PerPersonPerPeriod">Osoba / Period</option>
                                                <option value="PerRoomPerDay">Soba / Dan</option>
                                                <option value="PerRoomPerPeriod">Soba / Period</option>
                                            </select>
                                        </td>
                                        <td>
                                            <div className="amount-input">
                                                <input type="number" value={entry.amount === 0 ? '0' : (entry.amount || '')} onChange={e => {
                                                    const val = e.target.value;
                                                    const updated = [...priceList.basePrices];
                                                    updated[idx].amount = val === '' ? ('' as any) : parseFloat(val);
                                                    updatePriceList({ basePrices: updated });
                                                }} />
                                                <span>EUR</span>
                                            </div>
                                        </td>
                                        <td>
                                            <button className="icon-btn-danger" onClick={() => updatePriceList({ basePrices: priceList.basePrices.filter(b => b.id !== entry.id) })}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {priceList.basePrices.length === 0 && (
                                <tr className="empty-row">
                                    <td colSpan={7}>Definišite periode i cene za svaku kategoriju osoba (ADL, CHD1...).</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderRulesTab = () => (
        <div className="tab-content animate-in">
            <div className="card glass-card">
                <div className="card-header">
                    <Layers size={18} />
                    <h3>Grafička pravila i Varijacije zauzetosti</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-pill" onClick={() => {
                            const newRule: OccupancyRule = {
                                id: 'rule-' + Math.random().toString(36).substr(2, 5),
                                bedSetupId: 'setup-1',
                                variantKey: '2ADL_1CHD1',
                                isActive: true,
                                stayFrom: '2025-06-01',
                                stayTo: '2025-09-30',
                                roomTypeIds: []
                            };
                            updatePriceList({ occupancyRules: [...priceList.occupancyRules, newRule] });
                        }}>
                            <Plus size={14} /> KREIRAJ NOVO PRAVILO
                        </button>
                    </div>
                </div>

                <div className="rules-grid">
                    {priceList.occupancyRules.map((rule, idx) => (
                        <div key={rule.id} className="rule-card animate-in" style={{ animationDelay: `${idx * 0.1}s` }}>
                            <div className="rule-header">
                                <div className="date-badge">
                                    <Calendar size={12} />
                                    Boravak: {rule.stayFrom} - {rule.stayTo}
                                </div>
                                <button className="icon-btn-danger" onClick={() => updatePriceList({ occupancyRules: priceList.occupancyRules.filter(r => r.id !== rule.id) })}>
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="occupancy-graphical">
                                <div className="setup-label">OSN + OSN + POM</div>
                                <div className="bed-row">
                                    <div className="bed adl">ADL</div>
                                    <div className="bed adl">ADL</div>
                                    <div className="bed chd1">CHD1</div>
                                    <div className="bed-add">+</div>
                                </div>
                            </div>

                            <div className="connection-section">
                                <label>Povezani Tipovi Smeštaja:</label>
                                <div className="room-chips">
                                    <div className="chip">Standard Soba <X size={10} /></div>
                                    <div className="chip">Family Suite <X size={10} /></div>
                                    <button className="chip-add">+ VEŽI SOBU</button>
                                </div>
                            </div>

                            <div className="booking-dates">
                                <div className="date-input-group">
                                    <label>Rezervacije OD:</label>
                                    <input type="date" value={rule.bookingFrom || ''} onChange={e => {
                                        const updated = [...priceList.occupancyRules];
                                        updated[idx].bookingFrom = e.target.value;
                                        updatePriceList({ occupancyRules: updated });
                                    }} />
                                </div>
                                <div className="date-input-group">
                                    <label>DO:</label>
                                    <input type="date" value={rule.bookingTo || ''} onChange={e => {
                                        const updated = [...priceList.occupancyRules];
                                        updated[idx].bookingTo = e.target.value;
                                        updatePriceList({ occupancyRules: updated });
                                    }} />
                                </div>
                            </div>
                        </div>
                    ))}
                    {priceList.occupancyRules.length === 0 && (
                        <div className="empty-state">
                            <Layers size={32} opacity={0.3} />
                            <p>Definišite pravila zauzetosti (ADL/CHD kombinacije) za periode boravka.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderSurchargesTab = () => (
        <div className="tab-content animate-in">
            <div className="card glass-card">
                <div className="card-header">
                    <Plus size={18} />
                    <h3>Definisanje Doplate</h3>
                    <button className="btn-pill" onClick={() => {
                        const newS: SurchargeOrDiscount = {
                            id: 's-' + Math.random().toString(36).substr(2, 5),
                            type: 'Surcharge',
                            subType: 'Mandatory',
                            paymentMode: 'Agency',
                            name: 'Doplata za klimu / Superior',
                            value: 10,
                            valueType: 'Fixed',
                            appliesTo: 'BasePrice'
                        };
                        updatePriceList({ surcharges: [...priceList.surcharges, newS] });
                    }}>
                        <Plus size={14} /> DODAJ DOPLATU
                    </button>
                </div>

                <div className="surcharge-grid">
                    {priceList.surcharges.map((s, idx) => (
                        <div key={s.id} className="surcharge-card animate-in">
                            <div className="rule-card-header">
                                <Tag size={16} />
                                <span>Doplata #{idx + 1}</span>
                                <button className="icon-btn-danger" onClick={() => updatePriceList({ surcharges: priceList.surcharges.filter(item => item.id !== s.id) })}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="form-grid">
                                <div className="form-group span-2">
                                    <label>Tačan naziv doplate (biće vidljiv na sajtu i dokumentima)</label>
                                    <input type="text" className="glass-input" value={s.name} onChange={e => {
                                        const updated = [...priceList.surcharges];
                                        updated[idx].name = e.target.value;
                                        updatePriceList({ surcharges: updated });
                                    }} />
                                </div>
                                <div className="form-group">
                                    <label>Vrednost</label>
                                    <div className="combined-input">
                                        <input type="number" value={s.value === 0 ? '0' : (s.value || '')} onChange={e => {
                                            const val = e.target.value;
                                            const updated = [...priceList.surcharges];
                                            updated[idx].value = val === '' ? ('' as any) : parseFloat(val);
                                            updatePriceList({ surcharges: updated });
                                        }} />
                                        <select value={s.valueType} onChange={e => {
                                            const updated = [...priceList.surcharges];
                                            updated[idx].valueType = e.target.value as any;
                                            updatePriceList({ surcharges: updated });
                                        }}>
                                            <option value="Fixed">Iznos (EUR)</option>
                                            <option value="Percent">%</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select className="glass-select" value={s.subType} onChange={e => {
                                        const updated = [...priceList.surcharges];
                                        updated[idx].subType = e.target.value as any;
                                        updatePriceList({ surcharges: updated });
                                    }}>
                                        <option value="Mandatory">Obavezna</option>
                                        <option value="Optional">Opciona</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Mesto plaćanja</label>
                                    <select className="glass-select" value={s.paymentMode} onChange={e => {
                                        const updated = [...priceList.surcharges];
                                        updated[idx].paymentMode = e.target.value as any;
                                        updatePriceList({ surcharges: updated });
                                    }}>
                                        <option value="Agency">U agenciji</option>
                                        <option value="OnSite">Na licu mesta</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                    {priceList.surcharges.length === 0 && (
                        <div className="empty-state">
                            <Tag size={32} opacity={0.3} />
                            <p>Nema definisanih doplata.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderDiscountsTab = () => (
        <div className="tab-content animate-in">
            <div className="card glass-card">
                <div className="card-header">
                    <Percent size={18} />
                    <h3>Definisanje Popusta</h3>
                    <button
                        className="btn-pill"
                        onClick={() => {
                            const newD: SurchargeOrDiscount = {
                                id: 'd-' + Math.random().toString(36).substr(2, 9),
                                type: 'Discount',
                                subType: 'Optional',
                                paymentMode: 'Agency',
                                name: 'Popust za gotovinsko plaćanje',
                                value: 5,
                                valueType: 'Percent',
                                appliesTo: 'Total'
                            };
                            updatePriceList({ discounts: [...priceList.discounts, newD] });
                        }}
                    >
                        <Plus size={14} /> DODAJ POPUST
                    </button>
                </div>

                <div className="surcharge-grid">
                    {priceList.discounts.map((d, idx) => (
                        <div key={d.id} className="surcharge-card animate-in">
                            <div className="rule-card-header">
                                <Percent size={16} />
                                <span>Popust #{idx + 1}</span>
                                <button className="icon-btn-danger" onClick={() => updatePriceList({ discounts: priceList.discounts.filter(item => item.id !== d.id) })}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="form-grid">
                                <div className="form-group span-2">
                                    <label>Naziv popusta (vidljiv na dokumentima)</label>
                                    <input type="text" className="glass-input" value={d.name} onChange={e => {
                                        const updated = [...priceList.discounts];
                                        updated[idx].name = e.target.value;
                                        updatePriceList({ discounts: updated });
                                    }} />
                                </div>
                                <div className="form-group">
                                    <label>Vrednost</label>
                                    <div className="combined-input">
                                        <input type="number" value={d.value === 0 ? '0' : (d.value || '')} onChange={e => {
                                            const val = e.target.value;
                                            const updated = [...priceList.discounts];
                                            updated[idx].value = val === '' ? ('' as any) : parseFloat(val);
                                            updatePriceList({ discounts: updated });
                                        }} />
                                        <select value={d.valueType} onChange={e => {
                                            const updated = [...priceList.discounts];
                                            updated[idx].valueType = e.target.value as any;
                                            updatePriceList({ discounts: updated });
                                        }}>
                                            <option value="Fixed">Iznos (EUR)</option>
                                            <option value="Percent">%</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Mesto obračuna</label>
                                    <select className="glass-select" value={d.paymentMode} onChange={e => {
                                        const updated = [...priceList.discounts];
                                        updated[idx].paymentMode = e.target.value as any;
                                        updatePriceList({ discounts: updated });
                                    }}>
                                        <option value="Agency">U agenciji</option>
                                        <option value="OnSite">U hotelu</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                    {priceList.discounts.length === 0 && (
                        <div className="empty-state">
                            <Percent size={32} opacity={0.3} />
                            <p>Nema definisanih popusta.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderSpecialOffersTab = () => (
        <div className="tab-content animate-in">
            <div className="card glass-card">
                <div className="card-header">
                    <Gift size={18} />
                    <h3>Special Offers (Rani buking, Last Minute...)</h3>
                    <button
                        className="btn-pill"
                        onClick={() => {
                            const newO: SpecialOffer = {
                                id: 'o-' + Math.random().toString(36).substr(2, 9),
                                offerType: 'EarlyBooking',
                                name: 'Rani Buking -15%',
                                discountValue: 15,
                                discountType: 'Percent',
                                applyToBasePrice: true,
                                applyToSurcharges: [],
                                roomTypeIds: []
                            };
                            updatePriceList({ specialOffers: [...priceList.specialOffers, newO] });
                        }}
                    >
                        <Plus size={14} /> DODAJ SPECIAL OFFER
                    </button>
                </div>

                <div className="surcharge-grid">
                    {priceList.specialOffers.map((o, idx) => (
                        <div key={o.id} className="surcharge-card animate-in">
                            <div className="rule-card-header">
                                <Gift size={16} />
                                <span>Akcija #{idx + 1}</span>
                                <button className="icon-btn-danger" onClick={() => updatePriceList({ specialOffers: priceList.specialOffers.filter(item => item.id !== o.id) })}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Tip Akcije</label>
                                    <select className="glass-select" value={o.offerType} onChange={e => {
                                        const updated = [...priceList.specialOffers];
                                        updated[idx].offerType = e.target.value as any;
                                        updatePriceList({ specialOffers: updated });
                                    }}>
                                        <option value="EarlyBooking">Early Booking</option>
                                        <option value="LastMinute">Last Minute</option>
                                        <option value="SpecialOffer">Special Offer</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Naziv</label>
                                    <input type="text" className="glass-input" value={o.name} onChange={e => {
                                        const updated = [...priceList.specialOffers];
                                        updated[idx].name = e.target.value;
                                        updatePriceList({ specialOffers: updated });
                                    }} />
                                </div>
                                <div className="form-group">
                                    <label>Popust</label>
                                    <div className="combined-input">
                                        <input type="number" value={o.discountValue === 0 ? '0' : (o.discountValue || '')} onChange={e => {
                                            const val = e.target.value;
                                            const updated = [...priceList.specialOffers];
                                            updated[idx].discountValue = val === '' ? ('' as any) : parseFloat(val);
                                            updatePriceList({ specialOffers: updated });
                                        }} />
                                        <select value={o.discountType} onChange={e => {
                                            const updated = [...priceList.specialOffers];
                                            updated[idx].discountType = e.target.value as any;
                                            updatePriceList({ specialOffers: updated });
                                        }}>
                                            <option value="Percent">%</option>
                                            <option value="Fixed">Iznos (EUR)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Odnosi se na</label>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none' }}>
                                            <input
                                                type="checkbox"
                                                checked={o.applyToBasePrice}
                                                onChange={e => {
                                                    const updated = [...priceList.specialOffers];
                                                    updated[idx].applyToBasePrice = e.target.checked;
                                                    updatePriceList({ specialOffers: updated });
                                                }}
                                            /> Osnovnu cenu
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {priceList.specialOffers.length === 0 && (
                        <div className="empty-state">
                            <Sparkles size={32} opacity={0.3} />
                            <p>Definišite specijalne ponude na nivou hotela ili sobe.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="price-list-architect">
            {renderHeader()}
            {renderTabs()}

            <main className="architect-main">
                {activeTab === 'general' && renderGeneralTab()}
                {activeTab === 'base_prices' && renderBasePricesTab()}
                {activeTab === 'rules' && renderRulesTab()}
                {activeTab === 'surcharges' && renderSurchargesTab()}
                {activeTab === 'discounts' && renderDiscountsTab()}
                {activeTab === 'special_offers' && renderSpecialOffersTab()}
            </main>
        </div>
    );
};

export default PriceListArchitect;
