/**
 * SmartSearch – JSX Render Helpers
 * Small render functions used across multiple SmartSearch sub-components.
 */

import React from 'react';
import {
    Zap, XCircle, RefreshCw,
    ShieldCheck, AlertTriangle, Info,
    UtensilsCrossed, Coffee, Building2, Sparkles
} from 'lucide-react';
import { normalizeMealPlan, getMealPlanDisplayName, getRoomCancelStatus } from './helpers';

// ──────────────────────────────────────────────────────────────────────────────
// Availability Status Badge
// ──────────────────────────────────────────────────────────────────────────────

export const renderAvailabilityStatus = (status: string | undefined): React.ReactNode => {
    if (!status) return null;
    const s = status.toLowerCase();

    let Icon = RefreshCw;
    let label = 'NA UPIT';
    let className = 'status-on-request';

    if (s === 'available' || s === 'slobodno' || s === 'instant') {
        Icon = Zap; label = 'ODMAH DOSTUPNO'; className = 'status-available';
    } else if (s === 'unavailable' || s === 'rasprodato' || s === 'stop_sale') {
        Icon = XCircle; label = 'RASPRODATO'; className = 'status-sold-out';
    }

    return (
        <div className={`availability-status-v6 ${className}`}>
            <Icon size={10} />
            <span>{label}</span>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// Cancellation Badge
// ──────────────────────────────────────────────────────────────────────────────

export const renderCancellationBadge = (room: any, onBadgeClick: (r: any) => void): React.ReactNode => {
    const status = getRoomCancelStatus(room);

    let icon: React.ReactNode = <Info size={12} className="cancellation-icon" />;
    let text = 'Uslovi (Timeline)';
    let className = 'cancellation-info';
    let title = 'Kliknite za detaljan timeline otkazivanja';

    if (status === 'non-refundable') {
        icon = <AlertTriangle size={12} className="cancellation-icon" />;
        text = 'Nepovratno (Timeline)'; className = 'cancellation-non-refundable';
        title = 'Ova soba je nepovratna. Kliknite za detalje.';
    } else if (status === 'free') {
        icon = <ShieldCheck size={12} className="cancellation-icon" />;
        text = 'Besplatan otkaz (Timeline)'; className = 'cancellation-params free';
        title = 'Besplatno otkazivanje moguće. Kliknite za datume.';
    } else if (status === 'penalty') {
        icon = <AlertTriangle size={12} className="cancellation-icon" />;
        text = 'Penali (Timeline)'; className = 'cancellation-params penalty';
        title = 'Otkazivanje uz penale. Kliknite za iznose.';
    }

    return (
        <div
            className={`cancellation-badge-v2 ${className}`}
            onClick={(e) => { e.stopPropagation(); onBadgeClick(room); }}
            title={title}
            style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '4px 10px', borderRadius: '6px', fontSize: '0.7rem',
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                whiteSpace: 'nowrap', border: '1px solid rgba(255,255,255,0.1)'
            }}
        >
            {icon}
            <span>{text}</span>
        </div>
    );
};

// ──────────────────────────────────────────────────────────────────────────────
// Meal Plan Badge
// ──────────────────────────────────────────────────────────────────────────────

export const renderMealPlanBadge = (mp: string, isLedger: boolean = false): React.ReactNode => {
    const name = getMealPlanDisplayName(mp);
    const code = normalizeMealPlan(mp);
    let Icon: React.FC<any> = UtensilsCrossed;
    if (code === 'BB') Icon = Coffee;
    if (code === 'HB') Icon = UtensilsCrossed;
    if (code === 'AI' || code === 'UAI') Icon = Sparkles;
    if (code === 'RO') Icon = Building2;

    return (
        <div className={isLedger ? 'meal-plan-ledger-display' : 'meal-plan-badge-v2'}>
            <Icon size={isLedger ? 14 : 12} />
            <span>{name}</span>
        </div>
    );
};
