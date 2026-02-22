import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    ArrowLeft,
    Search,
    Trash2,
    Waves,
    Ticket,
    Shield,
    Zap,
    Info,
    CheckCircle2
} from 'lucide-react';
import { serviceProviderManager } from '../../services/providers/ServiceProviderManager';
import type { ExtraService } from '../../services/providers/ServiceProviderInterface';

interface ServicesProps {
    onBack: () => void;
}

const Services: React.FC<ServicesProps> = ({ onBack }) => {
    const [services, setServices] = useState<ExtraService[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [isLoading, setIsLoading] = useState(false);

    const categories = ['All', 'Trip', 'Ticket', 'Transfer', 'Insurance', 'Other'];

    useEffect(() => {
        const loadServices = async () => {
            setIsLoading(true);
            const data = await serviceProviderManager.getAllServices();
            setServices(data);
            setIsLoading(false);
        };
        loadServices();
    }, []);



    const addService = async () => {
        const newService: ExtraService = {
            id: Math.random().toString(36).substr(2, 9),
            providerName: 'Local',
            name: '',
            category: 'Trip',
            description: '',
            price: 0,
            currency: 'EUR',
            isMandatory: false,
            status: 'active'
        };
        await serviceProviderManager.saveService(newService);
        setServices([...services, newService]);
    };

    const deleteService = async (id: string) => {
        await serviceProviderManager.deleteService(id);
        setServices(services.filter(s => s.id !== id));
    };

    const updateService = async (updated: ExtraService) => {
        await serviceProviderManager.saveService(updated);
        setServices(services.map(s => s.id === updated.id ? updated : s));
    };

    const filteredServices = services.filter(s => {
        const matchesCat = activeCategory === 'All' || s.category === activeCategory;
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    return (
        <div className="module-container fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={onBack} className="btn-icon circle">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="title-gradient">Dodatne Usluge</h2>
                        <p className="subtitle">Izleti, ulaznice, transferi i osiguranja</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Pretraži usluge..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                            style={{ paddingLeft: '40px', width: '250px' }}
                        />
                    </div>
                    <button className="btn-primary" onClick={addService}>
                        <Plus size={18} /> Nova Usluga
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`nav-btn ${activeCategory === cat ? 'active' : ''}`}
                    >
                        {cat === 'Trip' && <Waves size={16} />}
                        {cat === 'Ticket' && <Ticket size={16} />}
                        {cat === 'Transfer' && <Zap size={16} />}
                        {cat === 'Insurance' && <Shield size={16} />}
                        {cat === 'All' && <CheckCircle2 size={16} />}
                        {cat === 'All' ? 'Sve usluge' : cat}
                    </button>
                ))}
            </div>

            <div className="dashboard-grid">
                <AnimatePresence>
                    {filteredServices.map((service) => (
                        <motion.div
                            key={service.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="app-card"
                            style={{ padding: '24px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'var(--accent-glow)',
                                    color: 'var(--accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {service.category === 'Trip' && <Waves size={24} />}
                                    {service.category === 'Ticket' && <Ticket size={24} />}
                                    {service.category === 'Transfer' && <Zap size={24} />}
                                    {service.category === 'Insurance' && <Shield size={24} />}
                                    {service.category === 'Other' && <Info size={24} />}
                                </div>
                                <button className="btn-icon" onClick={() => deleteService(service.id)} style={{ color: '#ef4444' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Naziv Usluge</label>
                                <input
                                    type="text"
                                    value={service.name}
                                    onChange={e => {
                                        updateService({ ...service, name: e.target.value });
                                    }}
                                    className="matrix-input"
                                    placeholder="npr. Krstarenje Bosforom"
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Kategorija</label>
                                <select
                                    value={service.category}
                                    onChange={e => {
                                        updateService({ ...service, category: e.target.value as any });
                                    }}
                                    className="matrix-input"
                                >
                                    {categories.filter(c => c !== 'All').map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cena (€)</label>
                                    <input
                                        type="number"
                                        value={service.price}
                                        onChange={e => {
                                            updateService({ ...service, price: parseFloat(e.target.value) || 0 });
                                        }}
                                        className="matrix-input"
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
                                    <input
                                        type="checkbox"
                                        id={`mand-${service.id}`}
                                        checked={service.isMandatory}
                                        onChange={e => {
                                            updateService({ ...service, isMandatory: e.target.checked });
                                        }}
                                        style={{ accentColor: 'var(--accent)', width: '18px', height: '18px' }}
                                    />
                                    <label htmlFor={`mand-${service.id}`} style={{ fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Obavezno</label>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredServices.length === 0 && !isLoading && (
                    <div className="module-card add-new" onClick={addService}>
                        <Plus className="add-icon" size={32} />
                        <span className="add-text">Dodaj prvu uslugu</span>
                    </div>
                )}
            </div>

            <style>{`
                .title-gradient {
                    font-size: 24px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #fff 0%, #9198a1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .subtitle {
                    color: var(--text-secondary);
                    font-size: 14px;
                    margin-top: 4px;
                }
            `}</style>
        </div>
    );
};

export default Services;
