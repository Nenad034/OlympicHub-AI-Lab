
import { useState, useEffect } from 'react';
import { tctApi } from '../../services/tctApi';
import { aiMonitor } from '../../services/aiMonitor';
import { businessHealthMonitor } from '../../services/businessHealthMonitor';
import type { HotelSearchParams } from '../../services/tctApiService';
import './HotelSearch.css';

export default function HotelSearch() {
    const [searchParams, setSearchParams] = useState<Partial<HotelSearchParams>>({
        search_type: 'city',
        location: '',
        checkin: '',
        checkout: '',
        rooms: [{ adults: 2, children: 0 }],
        currency: 'EUR',
        nationality: 'RS',
        residence: 'RS'
    });

    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // REAL location search
    useEffect(() => {
        let timeoutId: any;
        if (searchParams.location && searchParams.location.length > 2 && !searchParams.location_id) {
            timeoutId = setTimeout(async () => {
                try {
                    const res = await tctApi.getNationalities(); // Testiranje auth-a prvo

                    // Pozivamo geografiju sa TCT-a
                    const geoRes = await tctApi.getGeography();
                    if (geoRes.success && geoRes.data) {
                        // Ovde bismo mapirali prave rezultate
                        // Ali pošto TCT Geography vraća ceo svet, za početak ćemo samo filtrirati
                        console.log("Geography data connected!");
                    }

                    // Dinamički predlozi (Mockujmo ih iz onoga što TCT prepoznaje)
                    const results = [
                        { id: '1154', name: 'Hurghada', type: 'city' },
                        { id: '1155', name: 'Sharm El Sheikh', type: 'city' },
                        { id: '1156', name: 'Cairo', type: 'city' }
                    ].filter(l => l.name.toLowerCase().includes(searchParams.location!.toLowerCase()));

                    setSuggestions(results);
                    setShowSuggestions(true);
                } catch (e) {
                    console.error("Connectivity test fail", e);
                }
            }, 500);
        }
        return () => clearTimeout(timeoutId);
    }, [searchParams.location]);

    const handleInputChange = (field: string, value: any) => {
        setSearchParams(prev => ({ ...prev, [field]: value }));
        if (field === 'location') {
            setSearchParams(prev => ({ ...prev, location_id: undefined }));
        }
    };

    const selectSuggestion = (s: any) => {
        setSearchParams(prev => ({
            ...prev,
            location: s.name,
            location_id: s.id
        }));
        setShowSuggestions(false);
    };

    const handleRoomChange = (index: number, field: string, value: any) => {
        const newRooms = [...(searchParams.rooms || [])];
        newRooms[index] = { ...newRooms[index], [field]: value };
        setSearchParams(prev => ({ ...prev, rooms: newRooms }));
    };

    const addRoom = () => {
        setSearchParams(prev => ({
            ...prev,
            rooms: [...(prev.rooms || []), { adults: 2, children: 0 }]
        }));
    };

    const removeRoom = (index: number) => {
        const newRooms = (searchParams.rooms || []).filter((_, i) => i !== index);
        setSearchParams(prev => ({ ...prev, rooms: newRooms }));
    };

    const handleSearch = async () => {
        setSearching(true);
        setError(null);
        setResults(null);

        // -- AI MONITOR START --
        const monitorId = aiMonitor.startRequest('searchHotelsSync');
        const startTime = Date.now();

        try {
            // Validacija
            if (!searchParams.location) {
                throw new Error('Please enter a destination');
            }
            if (!searchParams.checkin || !searchParams.checkout) {
                throw new Error('Please select check-in and check-out dates');
            }

            // Beleži pretragu za Business Health Monitor
            businessHealthMonitor.recordSearch();

            // Pozovi TCT API kroz Secure Proxy
            const response = await tctApi.searchHotelsSync(searchParams as any);

            if (!response.success) {
                throw new Error(response.error || 'TCT API returns failure');
            }

            // -- AI MONITOR SUCCESS --
            aiMonitor.endRequest(monitorId, true, Date.now() - startTime);

            // Mock servis vraća 'groups', Real API vraća 'hotels'
            // Transformišemo oba formata u jedinstven UI format
            const rawData = response.data?.data || response.data;
            const groups = rawData?.groups || [];
            const rooms = rawData?.rooms || {};

            // Transformacija u UI-friendly format
            const hotels = groups.map((g: any) => ({
                id: g.hid || g.id,
                name: g.hotel_name || `Hotel ${g.hid || g.id}`,
                stars: g.hotel_stars || 5,
                city: g.hotel_city || 'Unknown',
                country: g.hotel_country || '',
                image: g.hotel_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
                description: g.hotel_description || '',
                price: g.price,
                currency: g.cur || 'EUR',
                refundable: g.refundable === '1',
                roomType: rooms[g.rooms?.['1']]?.name || 'Standard Room',
                mealPlan: rooms[g.rooms?.['1']]?.meal || 'All Inclusive',
                code: g.code
            }));

            setResults({
                hotels: hotels,
                total: hotels.length,
                searchId: rawData?.search_session
            });


        } catch (err: any) {
            setError(err.message || 'Search failed');

            // -- AI MONITOR FAILURE --
            aiMonitor.endRequest(monitorId, false, Date.now() - startTime, err.message);
            aiMonitor.reportFailure('TCT_API', err.message);

        } finally {
            setSearching(false);
        }
    };

    return (
        <div className="hotel-search">
            <div className="search-header">
                <h1>🏨 Hotel Search</h1>
                <p>Search for hotels using TCT API</p>
            </div>

            <div className="search-form">
                {/* Search Type */}
                <div className="form-group">
                    <label>Search Type</label>
                    <select
                        value={searchParams.search_type}
                        onChange={(e) => handleInputChange('search_type', e.target.value)}
                    >
                        <option value="city">City</option>
                        <option value="region">Region</option>
                        <option value="country">Country</option>
                        <option value="hotel">Specific Hotel</option>
                    </select>
                </div>

                {/* Destination */}
                <div className="form-group" style={{ position: 'relative' }}>
                    <label>Destination *</label>
                    <input
                        type="text"
                        placeholder="e.g., Hurghada"
                        value={searchParams.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        autoComplete="off"
                    />

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="suggestions-dropdown">
                            {suggestions.map(s => (
                                <div
                                    key={s.id}
                                    className="suggestion-item"
                                    onClick={() => selectSuggestion(s)}
                                >
                                    <span className="sug-icon">📍</span>
                                    <span className="sug-name">{s.name}</span>
                                    <span className="sug-type">{s.type}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Dates */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Check-in *</label>
                        <input
                            type="date"
                            value={searchParams.checkin}
                            onChange={(e) => handleInputChange('checkin', e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>

                    <div className="form-group">
                        <label>Check-out *</label>
                        <input
                            type="date"
                            value={searchParams.checkout}
                            onChange={(e) => handleInputChange('checkout', e.target.value)}
                            min={searchParams.checkin || new Date().toISOString().split('T')[0]}
                        />
                    </div>
                </div>

                {/* Rooms */}
                <div className="form-group">
                    <label>Rooms</label>
                    {searchParams.rooms?.map((room, index) => (
                        <div key={index} className="room-config">
                            <div className="room-header">
                                <span>Room {index + 1}</span>
                                {searchParams.rooms!.length > 1 && (
                                    <button
                                        type="button"
                                        className="remove-room"
                                        onClick={() => removeRoom(index)}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            <div className="room-inputs">
                                <div className="form-group-inline">
                                    <label>Adults</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="4"
                                        value={room.adults}
                                        onChange={(e) => handleRoomChange(index, 'adults', parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="form-group-inline">
                                    <label>Children</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="3"
                                        value={room.children || 0}
                                        onChange={(e) => {
                                            const count = parseInt(e.target.value) || 0;
                                            const newRooms = [...(searchParams.rooms || [])];
                                            const currentRoom = newRooms[index];
                                            const currentAges = currentRoom.children_ages || [];

                                            // Resize ages array
                                            let newAges = [...currentAges];
                                            if (count > currentAges.length) {
                                                // Add default age 7
                                                for (let i = currentAges.length; i < count; i++) {
                                                    newAges.push(7);
                                                }
                                            } else {
                                                // Trim
                                                newAges = newAges.slice(0, count);
                                            }

                                            newRooms[index] = { ...currentRoom, children: count, children_ages: newAges };
                                            setSearchParams(prev => ({ ...prev, rooms: newRooms }));
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Children Ages Inputs */}
                            {room.children && room.children > 0 && (
                                <div className="children-ages-container">
                                    {room.children_ages?.map((age, ageIndex) => (
                                        <div key={ageIndex} className="age-input-group">
                                            <label>Child {ageIndex + 1}</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="17"
                                                value={age}
                                                onChange={(e) => {
                                                    const newAge = parseInt(e.target.value) || 0;
                                                    const newRooms = [...(searchParams.rooms || [])];
                                                    const currentRoom = newRooms[index];
                                                    const newAges = [...(currentRoom.children_ages || [])];
                                                    newAges[ageIndex] = newAge;

                                                    newRooms[index] = { ...currentRoom, children_ages: newAges };
                                                    setSearchParams(prev => ({ ...prev, rooms: newRooms }));
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    <button type="button" className="add-room" onClick={addRoom}>
                        + Add Room
                    </button>
                </div>

                {/* Currency & Nationality */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Currency</label>
                        <select
                            value={searchParams.currency}
                            onChange={(e) => handleInputChange('currency', e.target.value)}
                        >
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                            <option value="GBP">GBP</option>
                            <option value="RSD">RSD</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Nationality</label>
                        <select
                            value={searchParams.nationality}
                            onChange={(e) => handleInputChange('nationality', e.target.value)}
                        >
                            <option value="RS">Serbia</option>
                            <option value="DE">Germany</option>
                            <option value="GB">United Kingdom</option>
                            <option value="US">United States</option>
                        </select>
                    </div>
                </div>

                {/* Search Button */}
                <button
                    className="search-button"
                    onClick={handleSearch}
                    disabled={searching}
                >
                    {searching ? '🔍 Searching...' : '🔍 Search Hotels'}
                </button>

                {/* Error */}
                {error && (
                    <div className="search-error">
                        ❌ {error}
                    </div>
                )}
            </div>

            {/* Results */}
            {results && (
                <div className="search-results">
                    <h2>Search Results ({results.total} hotels found)</h2>

                    <div className="hotels-grid">
                        {results.hotels.map((hotel: any) => (
                            <div key={hotel.id} className="hotel-card">
                                <div className="hotel-image-container">
                                    <img src={hotel.image} alt={hotel.name} />
                                    {hotel.refundable && (
                                        <span className="refundable-badge">✓ Free Cancellation</span>
                                    )}
                                </div>
                                <div className="hotel-info">
                                    <h3>{hotel.name}</h3>
                                    <div className="hotel-stars">
                                        {'⭐'.repeat(hotel.stars || 5)}
                                    </div>
                                    <p className="hotel-location">📍 {hotel.city}{hotel.country ? `, ${hotel.country}` : ''}</p>
                                    {hotel.description && (
                                        <p className="hotel-description">{hotel.description}</p>
                                    )}
                                    <div className="hotel-details-row">
                                        <span className="room-type">🛏️ {hotel.roomType}</span>
                                        <span className="meal-plan">🍽️ {hotel.mealPlan}</span>
                                    </div>
                                    <div className="hotel-price">
                                        <span className="price-amount">{hotel.price} {hotel.currency}</span>
                                        <span className="price-label">per night</span>
                                    </div>
                                    <button className="view-details">View Details</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
