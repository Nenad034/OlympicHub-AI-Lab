import React, { useState, useEffect } from 'react';
import {
    Hotel as HotelIcon, Search, Loader2, MapPin, Star,
    Check, AlertCircle, Info, Image as ImageIcon,
    Calendar, Moon, Users
} from 'lucide-react';
import { tctApi } from '../../../services/tctApi';
import OpenGreeceAPI from '../../../services/opengreeceApiService';
import type {
    BasicInfoData,
    HotelSelectionData,
    Hotel,
    HotelRoom,
    MealPlan
} from '../../../types/packageSearch.types';

interface Step3Props {
    basicInfo: BasicInfoData | null;
    data: HotelSelectionData[];
    onUpdate: (data: HotelSelectionData[]) => void;
    onNext: () => void;
    onBack: () => void;
}

interface InternalHotelResult {
    id: string;
    source: 'TCT' | 'OpenGreece';
    name: string;
    location: string;
    price: number;
    currency: string;
    image: string;
    stars: number;
    mealPlanName: string;
    mealPlanCode: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
    latitude?: number;
    longitude?: number;
    rooms: any[];
    originalData: any;
}

const Step3_HotelSelection: React.FC<Step3Props> = ({
    basicInfo,
    data,
    onUpdate,
    onNext,
    onBack
}) => {
    const [activeDestIndex, setActiveDestIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState<InternalHotelResult[]>([]);
    const [selectedHotels, setSelectedHotels] = useState<HotelSelectionData[]>(data || []);
    const [searchPerformed, setSearchPerformed] = useState<Record<number, boolean>>({});

    const currentDest = basicInfo?.destinations[activeDestIndex];

    // Search for hotels when destination index changes
    useEffect(() => {
        if (currentDest && !searchPerformed[activeDestIndex]) {
            handleSearch();
        } else if (searchPerformed[activeDestIndex]) {
            handleSearch(); // Refresh search for now
        }
    }, [activeDestIndex]);

    const handleSearch = async () => {
        if (!currentDest || !basicInfo) return;

        setIsLoading(true);
        setResults([]);

        try {
            // TCT Search
            const tctResponse = await tctApi.searchHotelsSync({
                location: currentDest.city,
                checkin: currentDest.checkIn,
                checkout: currentDest.checkOut,
                rooms: [{
                    adults: basicInfo.travelers.adults,
                    children: basicInfo.travelers.children,
                    children_ages: basicInfo.travelers.childrenAges || []
                }],
                search_type: 'city',
                currency: 'EUR',
                nationality: 'RS',
                residence: 'RS'
            });

            // OpenGreece Search (simplified for now or use checkAvailability)
            const ogResponse = await OpenGreeceAPI.checkAvailability({
                checkIn: currentDest.checkIn,
                checkOut: currentDest.checkOut,
                adults: basicInfo.travelers.adults,
                children: basicInfo.travelers.children,
                rooms: 1
            });

            // Normalize results from TCT
            const tctData = tctResponse.success ? tctResponse.data : null;
            const rawTctHotels = tctData ? (tctData.hotels || tctData.groups || []) : [];

            const normalizedTCT: InternalHotelResult[] = rawTctHotels.map((h: any) => ({
                id: String(h.hotel_id || h.id || h.hid),
                source: 'TCT',
                name: h.hotel_name || h.name,
                location: h.address || h.hotel_city || currentDest.city,
                price: h.min_rate || h.price || 0,
                currency: h.currency || h.cur || 'EUR',
                image: (h.images && h.images[0]) || h.hotel_image || '',
                stars: parseInt(h.stars || h.hotel_stars) || 0,
                mealPlanName: h.meal_plan || h.meal || 'N/A',
                mealPlanCode: (h.meal_plan_code || h.meal_code || 'RO') as any,
                latitude: h.geoCodes?.lat ? Number(h.geoCodes.lat) : (h.latitude ? Number(h.latitude) : 0),
                longitude: h.geoCodes?.long ? Number(h.geoCodes.long) : (h.longitude ? Number(h.longitude) : 0),
                rooms: h.rooms || [],
                originalData: h
            }));

            // Normalize results from OpenGreece
            const normalizedOG: InternalHotelResult[] = [];
            if (ogResponse.success && ogResponse.data?.hotelResults) {
                ogResponse.data.hotelResults.forEach((h: any) => {
                    normalizedOG.push({
                        id: String(h.hotelCode),
                        source: 'OpenGreece',
                        name: h.hotelName,
                        location: h.address?.cityName || currentDest.city,
                        price: h.lowestPrice?.amount || 0,
                        currency: h.lowestPrice?.currency || 'EUR',
                        image: h.mainImage || '',
                        stars: h.starRating || 0,
                        mealPlanName: h.rooms?.[0]?.rates?.[0]?.mealPlan?.name || 'N/A',
                        mealPlanCode: (h.rooms?.[0]?.rates?.[0]?.mealPlan?.code as any) || 'RO',
                        latitude: h.position?.latitude ? Number(h.position.latitude) : 0,
                        longitude: h.position?.longitude ? Number(h.position.longitude) : 0,
                        rooms: h.rooms || [],
                        originalData: h
                    });
                });
            }

            setResults([...normalizedTCT, ...normalizedOG].sort((a, b) => a.price - b.price));
            setSearchPerformed(prev => ({ ...prev, [activeDestIndex]: true }));
        } catch (error) {
            console.error('Hotel search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectHotel = (hotelResult: InternalHotelResult) => {
        if (!currentDest) return;

        // Construct Hotel object
        const hotel: Hotel = {
            id: hotelResult.id,
            name: hotelResult.name,
            stars: hotelResult.stars,
            address: hotelResult.location,
            city: currentDest.city,
            country: currentDest.country,
            latitude: Number(hotelResult.latitude) || 0,
            longitude: Number(hotelResult.longitude) || 0,
            images: [hotelResult.image],
            description: hotelResult.originalData?.description || hotelResult.name,
            amenities: [],
            rooms: [],
            reviews: { rating: 0, count: 0 }
        };

        // Construct Room object
        const room: HotelRoom = {
            id: hotelResult.rooms?.[0]?.id || 'room-1',
            name: hotelResult.rooms?.[0]?.name || 'Standard Room',
            description: '',
            capacity: { adults: basicInfo?.travelers.adults || 2, children: basicInfo?.travelers.children || 0 },
            bedType: 'Double Bed',
            size: 0,
            amenities: [],
            mealPlans: [],
            images: []
        };

        // Construct MealPlan object
        const mealPlan: MealPlan = {
            id: 'meal-1',
            code: hotelResult.mealPlanCode,
            name: hotelResult.mealPlanName,
            description: '',
            price: 0
        };

        const hotelSelection: HotelSelectionData = {
            destinationId: currentDest.id,
            hotel,
            room,
            mealPlan,
            checkIn: currentDest.checkIn,
            checkOut: currentDest.checkOut,
            nights: currentDest.nights,
            totalPrice: hotelResult.price
        };

        const updated = [...selectedHotels];
        updated[activeDestIndex] = hotelSelection;
        setSelectedHotels(updated);
        onUpdate(updated);
    };

    const isStepComplete = () => {
        return basicInfo?.destinations.every((_, idx) => selectedHotels[idx]);
    };

    const selectedForCurrent = selectedHotels[activeDestIndex];

    return (
        <div className="step-content">
            <div className="step-header">
                <h2><HotelIcon size={24} /> Izbor Hotela</h2>
                <p>Izaberite smeštaj za svaku destinaciju na vašem putovanju</p>
            </div>

            {/* Destination Selector */}
            {basicInfo && basicInfo.destinations.length > 1 && (
                <div className="destination-tabs">
                    {basicInfo.destinations.map((dest, idx) => (
                        <button
                            key={idx}
                            className={`dest-tab ${activeDestIndex === idx ? 'active' : ''} ${selectedHotels[idx] ? 'complete' : ''}`}
                            onClick={() => setActiveDestIndex(idx)}
                        >
                            <span className="dest-city">{dest.city}</span>
                            <span className="dest-status">
                                {selectedHotels[idx] ? <Check size={14} /> : `${dest.nights} noći`}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {currentDest && (
                <div className="current-dest-info">
                    <div className="info-item">
                        <Calendar size={16} />
                        <span>{currentDest.checkIn} - {currentDest.checkOut}</span>
                    </div>
                    <div className="info-item">
                        <Moon size={16} />
                        <span>{currentDest.nights} noćenja</span>
                    </div>
                    <div className="info-item">
                        <Users size={16} />
                        <span>{basicInfo!.travelers.adults + basicInfo!.travelers.children} osoba</span>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="loading-state">
                    <Loader2 size={48} className="animate-spin" />
                    <p>Pretražujemo hotele u gradu {currentDest?.city}...</p>
                </div>
            ) : results.length > 0 ? (
                <div className="hotel-results-grid">
                    {results.map(hotel => (
                        <div
                            key={`${hotel.source}-${hotel.id}`}
                            className={`hotel-card ${selectedForCurrent?.hotel.id === hotel.id ? 'selected' : ''}`}
                            onClick={() => handleSelectHotel(hotel)}
                        >
                            <div className="hotel-image">
                                {hotel.image ? (
                                    <img src={hotel.image} alt={hotel.name} />
                                ) : (
                                    <div className="image-placeholder"><ImageIcon size={32} /></div>
                                )}
                                <div className="hotel-source-tag">{hotel.source}</div>
                            </div>
                            <div className="hotel-info">
                                <div className="hotel-header">
                                    <h3>{hotel.name}</h3>
                                    <div className="stars">
                                        {[...Array(hotel.stars)].map((_, i) => (
                                            <Star key={i} size={14} fill="#fb8c00" color="#fb8c00" />
                                        ))}
                                    </div>
                                </div>
                                <div className="hotel-location">
                                    <MapPin size={14} />
                                    <span>{hotel.location}</span>
                                </div>
                                <div className="hotel-meal">
                                    <Info size={14} />
                                    <span>{hotel.mealPlanName}</span>
                                </div>
                                <div className="hotel-footer">
                                    <div className="hotel-price">
                                        <span className="amount">{hotel.price.toFixed(2)}</span>
                                        <span className="currency">€</span>
                                        <span className="total-label">ukupno</span>
                                    </div>
                                    <button
                                        className={`select-hotel-btn ${selectedForCurrent?.hotel.id === hotel.id ? 'selected' : ''}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectHotel(hotel);
                                        }}
                                    >
                                        {selectedForCurrent?.hotel.id === hotel.id ? <Check size={18} /> : 'Izaberi'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : searchPerformed[activeDestIndex] ? (
                <div className="no-results">
                    <Info size={48} />
                    <p>Nismo pronašli dostupne hotele u gradu {currentDest?.city}.</p>
                    <button onClick={handleSearch} className="retry-btn">Pokušaj ponovo</button>
                </div>
            ) : (
                <div className="initial-state">
                    <button onClick={handleSearch} className="search-btn">
                        <Search size={18} />
                        Pretraži Hotele
                    </button>
                </div>
            )}

            <div className="hotel-actions">
                <button className="step-back-btn" onClick={onBack}>Nazad</button>
                {activeDestIndex < (basicInfo?.destinations.length || 0) - 1 ? (
                    <button
                        className="step-next-btn"
                        onClick={() => setActiveDestIndex(activeDestIndex + 1)}
                        disabled={!selectedForCurrent}
                    >
                        Sledeća Destinacija
                    </button>
                ) : (
                    <button
                        className="step-next-btn"
                        onClick={onNext}
                        disabled={!isStepComplete()}
                    >
                        Nastavi na Transfere
                    </button>
                )}
            </div>
        </div>
    );
};

export default Step3_HotelSelection;
