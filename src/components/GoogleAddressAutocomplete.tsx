import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

interface GoogleAddressAutocompleteProps {
    value: string;
    onChange: (address: string, placeDetails?: google.maps.places.PlaceResult) => void;
    placeholder?: string;
    className?: string;
    label?: string;
}

// Load Google Maps script
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (typeof google !== 'undefined' && google.maps) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=sr`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps script'));
        document.head.appendChild(script);
    });
};

export const GoogleAddressAutocomplete: React.FC<GoogleAddressAutocompleteProps> = ({
    value,
    onChange,
    placeholder = 'Unesite adresu...',
    className = '',
    label
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Google Maps API Key from environment variable
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    useEffect(() => {
        const initAutocomplete = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Load Google Maps script
                await loadGoogleMapsScript(GOOGLE_MAPS_API_KEY);

                if (!inputRef.current) return;

                // Initialize autocomplete
                autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
                    types: ['address'],
                    componentRestrictions: { country: ['rs', 'me', 'hr', 'ba', 'si'] }, // Balkan countries
                    fields: ['address_components', 'formatted_address', 'geometry', 'name']
                });

                // Add place changed listener
                autocompleteRef.current.addListener('place_changed', () => {
                    const place = autocompleteRef.current?.getPlace();

                    if (!place || !place.formatted_address) {
                        return;
                    }

                    // Extract address components
                    const addressComponents = place.address_components || [];
                    let street = '';
                    let city = '';
                    let country = '';
                    let postalCode = '';

                    addressComponents.forEach(component => {
                        const types = component.types;

                        if (types.includes('route')) {
                            street = component.long_name;
                        }
                        if (types.includes('street_number')) {
                            street = component.long_name + ' ' + street;
                        }
                        if (types.includes('locality')) {
                            city = component.long_name;
                        }
                        if (types.includes('country')) {
                            country = component.long_name;
                        }
                        if (types.includes('postal_code')) {
                            postalCode = component.long_name;
                        }
                    });

                    // Call onChange with formatted address and details
                    onChange(place.formatted_address, place);
                });

                setIsLoading(false);
            } catch (err) {
                console.error('Error initializing Google Autocomplete:', err);
                setError('Greška pri učitavanju Google Maps. Koristite ručni unos.');
                setIsLoading(false);
            }
        };

        initAutocomplete();

        return () => {
            if (autocompleteRef.current) {
                google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, []);

    return (
        <div className="google-address-autocomplete">
            {label && <label>{label}</label>}
            <div className="address-input-wrapper">
                <MapPin size={16} className="address-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={isLoading ? 'Učitavanje Google Maps...' : placeholder}
                    className={className}
                    disabled={isLoading}
                />
            </div>
            {error && (
                <div className="address-error">
                    <small>{error}</small>
                </div>
            )}
        </div>
    );
};

// Fallback component if Google Maps fails or API key is not set
export const SimpleAddressInput: React.FC<GoogleAddressAutocompleteProps> = ({
    value,
    onChange,
    placeholder = 'Unesite adresu...',
    className = '',
    label
}) => {
    return (
        <div className="simple-address-input">
            {label && <label>{label}</label>}
            <div className="address-input-wrapper">
                <MapPin size={16} className="address-icon" />
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className={className}
                />
            </div>
        </div>
    );
};
