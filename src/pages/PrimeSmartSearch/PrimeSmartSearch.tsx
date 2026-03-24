import React, { useState, useMemo, useEffect } from 'react';
import { useSearchStore, calcPaxSummary } from './stores/useSearchStore';
import { useThemeStore } from '../../stores';
import { BookingModal } from '../../components/booking/BookingModal';
import type { BookingData } from '../../types/booking.types';
import { SearchTabs } from './components/SearchTabs/SearchTabs';
import { PaxSummaryBanner } from './components/PaxSummaryBanner/PaxSummaryBanner';
import { HotelSearchForm } from './components/HotelSearchForm/HotelSearchForm';
import { FlightSearchForm } from './components/FlightSearchForm/FlightSearchForm';
import { CharterSearchForm } from './components/CharterSearchForm/CharterSearchForm';
import { CarSearchForm } from './components/CarSearchForm/CarSearchForm';
import { TransferSearchForm } from './components/TransferSearchForm/TransferSearchForm';
import { PackageWizard } from './components/PackageWizard/PackageWizard';
import { HotelCard, type ViewMode } from './components/HotelCard/HotelCard';
import { FlightCard } from './components/FlightCard/FlightCard';
import { CharterCard } from './components/CharterCard/CharterCard';
import { CarCard } from './components/CarCard/CarCard';
import { TransferCard } from './components/TransferCard/TransferCard';
import { FilterBar } from './components/FilterBar/FilterBar';
import { FilterSidebar } from './components/FilterSidebar/FilterSidebar';
import { SmartConcierge } from './components/SmartConcierge/SmartConcierge';
import { ItineraryExport } from './components/ItineraryExport/ItineraryExport';
import { PackageBasketBar } from './components/PackageBasketBar/PackageBasketBar';
import { TourSearchForm } from './components/TourSearchForm/TourSearchForm';
import { TourCard } from './components/TourCard/TourCard';
import { ActivitySearchForm } from './components/ActivitySearchForm/ActivitySearchForm';
import { ActivityCard } from './components/ActivityCard/ActivityCard';
import { CruiseSearchForm } from './components/CruiseSearchForm/CruiseSearchForm';
import { CruiseCard } from './components/CruiseCard/CruiseCard';
import { DynamicPackageCheckout } from './components/DynamicPackageCheckout/DynamicPackageCheckout';
import { SavedOffersPanel } from './components/SavedOffersPanel';
import { HorizontalPriceCalendar } from './components/HorizontalPriceCalendar/HorizontalPriceCalendar';
import { DashboardWelcome } from './components/DashboardWelcome';
import { MilicaChat } from '../SmartSearch/components/MilicaChat';
import { Bot, MessageCircle, List, LayoutGrid, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../../stores';

import type { HotelSearchResult, FlightSearchResult } from './types';
import './styles/PrimeSmartSearch.css';

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// SKELETON
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const SkeletonGrid: React.FC = () => (
    <div className="v6-results-grid" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="v6-skeleton-card" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="v6-skeleton-img" />
                <div className="v6-skeleton-body">
                    <div className="v6-skeleton-line v6-w-80" />
                    <div className="v6-skeleton-line v6-w-60" />
                    <div className="v6-skeleton-line v6-w-40" />
                </div>
            </div>
        ))}
    </div>
);

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// NO RESULTS
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const NoResults: React.FC = () => (
    <div className="v6-no-results v6-active">
        <div className="v6-no-results-icon">Ã°Å¸â€œÂ­</div>
        <h2>Nema dostupnih rezultata</h2>
        <p>NaÃ…Â¾alost, nismo pronaÃ…Â¡li niÃ…Â¡ta Ã…Â¡to odgovara tvojim kriterijumima.</p>
    </div>
);

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// UI COMPONENTS
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
const ViewToggleBar: React.FC<{ viewMode: ViewMode; onChange: (v: ViewMode) => void }> = ({ viewMode, onChange }) => (
    <div className="v6-view-toggle-bar" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '4px', 
        background: 'rgba(255,255,255,0.03)', 
        padding: '4px', 
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)'
    }}>
        {(['list', 'grid', 'notepad'] as ViewMode[]).map((mode) => (
            <button
                key={mode}
                className={`v6-view-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => onChange(mode)}
                style={{
                    padding: '8px',
                    fontSize: '18px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {mode === 'list' && <List size={22} />}
                {mode === 'grid' && <LayoutGrid size={22} />}
                {mode === 'notepad' && <FileText size={22} />}
            </button>
        ))}
    </div>
);

const TabForm: React.FC<{ activeTab: string }> = ({ activeTab }) => {
    switch (activeTab) {
        case 'hotel':        return <HotelSearchForm />;
        case 'flight':       return <FlightSearchForm />;
        case 'charter':      return <CharterSearchForm />;
        case 'car':          return <CarSearchForm />;
        case 'transfer':     return <TransferSearchForm />;
        case 'tour':         return <TourSearchForm />;
        case 'things-to-do': return <ActivitySearchForm />;
        case 'cruise':       return <CruiseSearchForm />;
        case 'package':      return null;
        default:             return <HotelSearchForm />;
    }
};

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// MAIN COMPONENT
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const PrimeSmartSearch: React.FC = () => {
    const {
        activeTab,
        isSearching,
        searchPerformed,
        results,
        flightResults,
        charterResults,
        carResults,
        transferResults,
        tourResults,
        activityResults,
        cruiseResults,
        showPackageCheckout,
        alerts,
        dismissAlert,
        selectedHotel,
        roomAllocations,
        checkIn,
        checkOut,
        searchMode,
    } = useSearchStore();

    const { theme } = useThemeStore();
    
    // UI Local State
    const [showExport, setShowExport] = useState(false);
    const [hotelViewMode, setHotelViewMode] = useState<ViewMode>('grid');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [pendingBookingData, setPendingBookingData] = useState<BookingData | null>(null);

    const totalPax = useMemo(() => 
        roomAllocations.reduce((sum, r) => sum + r.adults + r.children, 0) || 1
    , [roomAllocations]);

    // Handlers
    const handleViewOptions = (hotel: HotelSearchResult) => {
        const params = new URLSearchParams();
        params.set('checkIn', checkIn);
        params.set('checkOut', checkOut);
        const roomsStr = roomAllocations.map(r => 
            `${r.adults}-${r.children}${r.childrenAges.length > 0 ? '-' + r.childrenAges.join('-') : ''}`
        ).join(';');
        params.set('rooms', roomsStr);
        params.set('nat', useSearchStore.getState().nationality || 'RS');
        
        window.open(`/prime-smart-search/hotel/${hotel.id}?${params.toString()}`, '_blank');
    };

    const handleFlightBook = (flight: FlightSearchResult) => {
        console.log("Booking flight:", flight);
    };

    const handleBookingSuccess = (id: string) => {
        setShowBookingModal(false);
        alert(`UspeÃ…Â¡na rezervacija: ${id}`);
    };

    const showSidebar = activeTab === 'hotel' && searchMode === 'classic';

    return (
        <div className={`v6-prime-hub v6-cockpit-layout ${theme === 'navy' ? 'v6-dark' : ''}`}>
            <header className="v6-header-zone">
                <SearchTabs />
            </header>

            {activeTab !== 'package' && (
                <section className="v6-form-zone v6-wide-mode">
                    <TabForm activeTab={activeTab} />
                </section>
            )}

            <PaxSummaryBanner />

            {alerts.length > 0 && (
                <div className="v6-alerts-zone">
                    {alerts.map(a => (
                        <div key={a.id} className={`v6-alert v6-alert-${a.severity}`}>
                            <span>{a.message}</span>
                            <button onClick={() => dismissAlert(a.id)}>Ã¢Å“â€¢</button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab !== 'hotel' && activeTab !== 'package' && <FilterBar />}

            <div className="v6-results-zone v6-wide-mode" style={{ paddingLeft: '2.5%', paddingRight: '2.5%' }}>
                {activeTab === 'hotel' ? (
                    <div className="v6-search-results-page-layout" style={{ 
                        display: 'grid', 
                        gridTemplateColumns: showSidebar ? '300px 1fr' : '1fr',
                        gap: '24px'
                    }}>
                        {showSidebar && (
                            <aside className="v6-sidebar-group v6-silent-scroll" style={{ 
                                position: 'sticky', 
                                top: '100px',
                                height: 'calc(100vh - 120px)',
                                overflowY: 'auto'
                            }}>
                                <div style={{ marginTop: '16px' }}><FilterSidebar /></div>
                            </aside>
                        )}

                        <main className="v6-results-main-col">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                   {activeTab === 'hotel' && <HorizontalPriceCalendar />}
                                </div>
                                {results.length > 0 && (
                                    <div style={{ width: '160px', marginLeft: '16px' }}>
                                        <ViewToggleBar viewMode={hotelViewMode} onChange={setHotelViewMode} />
                                    </div>
                                )}
                            </div>
                            {isSearching ? <SkeletonGrid /> : (
                                !searchPerformed ? <DashboardWelcome activeTab={activeTab} /> : (
                                    results.length === 0 ? <NoResults /> : (
                                        <div className={`v6-results-container v6-view-${hotelViewMode}`}>
                                            {results.map((hotel, idx) => (
                                                <HotelCard 
                                                    key={hotel.id} 
                                                    hotel={hotel} 
                                                    index={idx} 
                                                    onViewOptions={() => handleViewOptions(hotel)} 
                                                    viewMode={hotelViewMode} 
                                                />
                                            ))}
                                        </div>
                                    )
                                )
                            )}
                        </main>
                    </div>
                ) : (
                    <div className="v6-standard-results-layout" style={{ width: '100%' }}>
                        {isSearching ? <SkeletonGrid /> : (
                            <>
                                {activeTab === 'package' && <PackageWizard onComplete={() => setShowExport(true)} />}
                                
                                {!searchPerformed && activeTab !== 'package' ? <DashboardWelcome activeTab={activeTab} /> : (
                                    <div className="v6-results-stack" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {activeTab === 'flight' && (
                                            flightResults.length === 0 ? <NoResults /> : 
                                            flightResults.map((f, i) => <FlightCard key={f.id} flight={f} index={i} paxTotal={totalPax} onBook={handleFlightBook} />)
                                        )}
                                        {activeTab === 'charter' && (
                                            charterResults.length === 0 ? <NoResults /> :
                                            <div className="v6-results-grid">{charterResults.map((c, i) => <CharterCard key={c.id} charter={c} index={i} />)}</div>
                                        )}
                                        {activeTab === 'car' && (
                                            carResults.length === 0 ? <NoResults /> :
                                            <div className="v6-results-grid">{carResults.map((c, i) => <CarCard key={c.id} car={c} index={i} />)}</div>
                                        )}
                                        {activeTab === 'transfer' && (
                                            transferResults.length === 0 ? <NoResults /> :
                                            <div className="v6-results-grid">{transferResults.map((t, i) => <TransferCard key={t.id} transfer={t} index={i} />)}</div>
                                        )}
                                        {activeTab === 'tour' && (
                                            tourResults.length === 0 ? <NoResults /> :
                                            <div className="v6-results-grid">{tourResults.map((t, i) => <TourCard key={t.id} tour={t} index={i} />)}</div>
                                        )}
                                        {activeTab === 'things-to-do' && (
                                            activityResults.length === 0 ? <NoResults /> :
                                            <div className="v6-results-grid">{activityResults.map((a, i) => <ActivityCard key={a.id} activity={a} index={i} pax={totalPax} />)}</div>
                                        )}
                                        {activeTab === 'cruise' && (
                                            cruiseResults.length === 0 ? <NoResults /> :
                                            <div className="v6-results-grid">{cruiseResults.map((c, i) => <CruiseCard key={c.id} cruise={c} index={i} pax={totalPax} />)}</div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .v6-silent-scroll {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .v6-silent-scroll::-webkit-scrollbar {
                    display: none;
                }
                
                /* VIEW MODES LAYOUTS */
                .v6-results-container.v6-view-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 24px;
                }
                .v6-results-container.v6-view-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .v6-results-container.v6-view-notepad {
                    display: flex;
                    flex-direction: column;
                    gap: 4px; /* Tight for notepad */
                    background: var(--v6-bg-section);
                    padding: 8px;
                    border-radius: var(--v6-radius-lg);
                }

                .v6-sidebar-dynamic-header .v6-header-content {
                    background: var(--v6-accent);
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 4px 12px rgba(99, 179, 237, 0.2);
                }

                .v6-view-btn {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    border: 2px solid transparent !important;
                    background: transparent;
                    color: var(--v6-text-muted);
                    opacity: 0.6;
                }
                .v6-view-btn:hover {
                    opacity: 1;
                    background: rgba(255,255,255,0.05);
                }
                .v6-view-btn.active {
                    opacity: 1;
                    background: var(--v6-bg-card);
                    color: var(--v6-accent);
                    border-color: var(--v6-accent) !important;
                    box-shadow: 0 0 15px rgba(99, 179, 237, 0.2);
                    transform: scale(1.02);
                }
            `}</style>

            <PackageBasketBar onExport={() => setShowExport(true)} />
            {showPackageCheckout && <DynamicPackageCheckout />}
            {showExport && <ItineraryExport onClose={() => setShowExport(false)} />}
            {showBookingModal && pendingBookingData && (
                <BookingModal 
                    isOpen={showBookingModal} onClose={() => setShowBookingModal(false)}
                    provider="solvex" bookingData={pendingBookingData}
                    onSuccess={handleBookingSuccess} onError={() => {}}
                />
            )}
            <SavedOffersPanel />
            <SmartConcierge activeHotelCity={selectedHotel?.location.city} />
             <MilicaChat />
             
             {/* Floating Milica Toggle */}
             <motion.button
                 className="v6-milica-fab"
                 initial={{ scale: 0, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 whileHover={{ scale: 1.1, y: -5 }}
                 whileTap={{ scale: 0.9 }}
                 onClick={() => useAppStore.getState().setMilicaChatOpen(true)}
                 style={{
                     position: 'fixed',
                     bottom: '30px',
                     right: '30px',
                     width: '64px',
                     height: '64px',
                     borderRadius: '20px',
                     background: 'linear-gradient(135deg, #8E24AC, #6A1B9A)',
                     border: '2px solid rgba(255,255,255,0.2)',
                     boxShadow: '0 12px 32px rgba(142, 36, 172, 0.4)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     zIndex: 9999,
                     cursor: 'pointer',
                     color: 'white'
                 }}
             >
                 <Bot size={32} />
                 <motion.div 
                     className="v6-fab-badge"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     style={{
                         position: 'absolute',
                         top: '-5px',
                         right: '-5px',
                         background: '#ef4444',
                         borderRadius: '50%',
                         width: '20px',
                         height: '20px',
                         display: 'flex',
                         alignItems: 'center',
                         justifyContent: 'center',
                         fontSize: '10px',
                         fontWeight: 900,
                         border: '2px solid white'
                     }}
                 >
                     AI
                 </motion.div>
             </motion.button>
         </div>
    );
};

export default PrimeSmartSearch;
