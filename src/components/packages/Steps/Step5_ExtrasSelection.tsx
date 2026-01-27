import React, { useState } from 'react';
import {
    Ticket, Search, Plus, Trash2, Info, Check,
    AlertCircle, Image as ImageIcon, Star, MapPin,
    Clock, Tag
} from 'lucide-react';
import type {
    BasicInfoData,
    ExtraSelectionData,
    Extra
} from '../../../types/packageSearch.types';

interface Step5Props {
    basicInfo: BasicInfoData | null;
    data: ExtraSelectionData[];
    onUpdate: (data: ExtraSelectionData[]) => void;
    onNext: () => void;
    onBack: () => void;
}

const EXTRA_TEMPLATES: Extra[] = [
    {
        id: 'e1',
        name: 'Panorama Grada i Večera',
        category: 'tour',
        destination: 'Pariz',
        description: 'Uživajte u predivnom pogledu na grad sa Ajfelovog tornja uz vrhunsku večeru.',
        duration: '4h',
        included: ['Večera', 'Ulaznica za toranj', 'Vodič'],
        excluded: ['Prevoz do tornja'],
        images: [],
        price: 85,
        currency: 'EUR',
        availability: { days: ['Mon', 'Wed', 'Fri'], times: ['19:00'] }
    },
    {
        id: 'e2',
        name: 'Luvr - Tura bez čekanja',
        category: 'ticket',
        destination: 'Pariz',
        description: 'Preskočite redove i obiđite najpoznatiji muzej na svetu uz stručnog vodiča.',
        duration: '3h',
        included: ['Ulaznica', 'Vodič'],
        excluded: ['Audio vodič'],
        images: [],
        price: 45,
        currency: 'EUR',
        availability: { days: ['Tue', 'Thu', 'Sat'], times: ['10:00', '14:00'] }
    },
    {
        id: 'e3',
        name: 'Vožnja Gondolom',
        category: 'activity',
        destination: 'Venecija',
        description: 'Romantična vožnja kanalima Venecije uz zvuke mandoline.',
        duration: '30 min',
        included: ['Vožnja gondolom'],
        excluded: ['Piće'],
        images: [],
        price: 80,
        currency: 'EUR',
        availability: { days: ['Everyday'], times: ['09:00-20:00'] }
    },
    {
        id: 'e4',
        name: 'Disneyland Paris - Dnevna ulaznica',
        category: 'ticket',
        destination: 'Pariz',
        description: 'Čaroban dan u svetu mašte. Ulaznica za jedan ili oba parka (Disneyland Park i Walt Disney Studios).',
        duration: 'Celodnevni',
        included: ['Ulaznica za park', 'Sve atrakcije'],
        excluded: ['Hrana i piće', 'FastPass'],
        images: [],
        price: 99,
        currency: 'EUR',
        availability: { days: ['Everyday'], times: ['09:00-22:00'] }
    },
    {
        id: 'e5',
        name: 'Milano Shopping Tour - Serravalle Outlets',
        category: 'tour',
        destination: 'Milano',
        description: 'Organizovan prevoz do najvećeg outlet centra u Evropi sa dodatnim popustima.',
        duration: '8h',
        included: ['Povratni prevoz', 'Discount Card'],
        excluded: ['Ručak'],
        images: [],
        price: 25,
        currency: 'EUR',
        availability: { days: ['Everyday'], times: ['10:00'] }
    }
];

const Step5_ExtrasSelection: React.FC<Step5Props> = ({
    basicInfo,
    data,
    onUpdate,
    onNext,
    onBack
}) => {
    const [selectedExtras, setSelectedExtras] = useState<ExtraSelectionData[]>(data || []);
    const [activeDestIndex, setActiveDestIndex] = useState(0);

    const currentDest = basicInfo?.destinations[activeDestIndex];

    // Filter templates for current destination
    const availableExtras = EXTRA_TEMPLATES.filter(e =>
        e.destination.toLowerCase().includes(currentDest?.city.toLowerCase() || '') ||
        currentDest?.city.toLowerCase().includes(e.destination.toLowerCase())
    );

    const handleToggleExtra = (extra: Extra) => {
        const isSelected = selectedExtras.some(e => e.extra.id === extra.id);

        let updated;
        if (isSelected) {
            updated = selectedExtras.filter(e => e.extra.id !== extra.id);
        } else {
            const selection: ExtraSelectionData = {
                extra,
                date: currentDest?.checkIn || '',
                quantity: basicInfo?.travelers.adults || 1,
                totalPrice: extra.price * (basicInfo?.travelers.adults || 1)
            };
            updated = [...selectedExtras, selection];
        }

        setSelectedExtras(updated);
        onUpdate(updated);
    };

    return (
        <div className="step-content">
            <div className="step-header">
                <h2><Ticket size={24} /> Dodatne Usluge</h2>
                <p>Dodajte ture, atrakcije i aktivnosti vašem paketu</p>
            </div>

            {/* Destination Selector */}
            {basicInfo && basicInfo.destinations.length > 1 && (
                <div className="destination-tabs">
                    {basicInfo.destinations.map((dest, idx) => (
                        <button
                            key={idx}
                            className={`dest-tab ${activeDestIndex === idx ? 'active' : ''}`}
                            onClick={() => setActiveDestIndex(idx)}
                        >
                            <span className="dest-city">{dest.city}</span>
                            <span className="dest-status">
                                {selectedExtras.filter(e => e.extra.destination === dest.city).length} izabrano
                            </span>
                        </button>
                    ))}
                </div>
            )}

            <div className="extras-grid">
                {availableExtras.length > 0 ? (
                    availableExtras.map(extra => {
                        const isSelected = selectedExtras.some(e => e.extra.id === extra.id);
                        return (
                            <div
                                key={extra.id}
                                className={`extra-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleToggleExtra(extra)}
                            >
                                <div className="extra-image">
                                    <div className="image-placeholder">
                                        <ImageIcon size={32} />
                                    </div>
                                    <div className="extra-category-tag">{extra.category}</div>
                                </div>
                                <div className="extra-info">
                                    <div className="extra-header">
                                        <h3>{extra.name}</h3>
                                        <div className="price-tag">{extra.price} €</div>
                                    </div>
                                    <p className="extra-desc">{extra.description}</p>
                                    <div className="extra-meta">
                                        <div className="meta-item">
                                            <Clock size={14} />
                                            <span>{extra.duration}</span>
                                        </div>
                                        <div className="meta-item">
                                            <Check size={14} color="#10b981" />
                                            <span>Uključeno: {extra.included[0]}...</span>
                                        </div>
                                    </div>
                                    <button
                                        className={`select-extra-btn ${isSelected ? 'selected' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleExtra(extra);
                                        }}
                                    >
                                        {isSelected ? <><Check size={18} /> Dodato</> : 'Dodaj u paket'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-results">
                        <Info size={48} />
                        <p>Trenutno nema dostupnih dodatnih usluga za {currentDest?.city}.</p>
                    </div>
                )}
            </div>

            <div className="selected-summary-box">
                <h4>Izabrano ({selectedExtras.length}):</h4>
                {selectedExtras.length > 0 ? (
                    <ul>
                        {selectedExtras.map(e => (
                            <li key={e.extra.id}>
                                <span>{e.extra.name} ({e.extra.destination})</span>
                                <strong>{e.totalPrice.toFixed(2)} €</strong>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="hint">Nije izabrana nijedna dodatna usluga.</p>
                )}
            </div>

            <div className="step-actions">
                <button className="step-back-btn" onClick={onBack}>Nazad</button>
                <button className="step-next-btn" onClick={onNext}>
                    Nastavi na Pregled
                </button>
            </div>
        </div>
    );
};

export default Step5_ExtrasSelection;
