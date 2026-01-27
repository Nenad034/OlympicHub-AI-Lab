import React from 'react';
import { MapPin, Calendar, X, Plus } from 'lucide-react';
import CustomDatePicker from './CustomDatePicker';
import AirportAutocomplete from './AirportAutocomplete';
import './MultiCityFlightForm.css';

export interface FlightLeg {
    id: string;
    origin: string;
    destination: string;
    departureDate: string;
}

interface MultiCityFlightFormProps {
    legs: FlightLeg[];
    onLegsChange: (legs: FlightLeg[]) => void;
    maxLegs?: number;
}

const MultiCityFlightForm: React.FC<MultiCityFlightFormProps> = ({
    legs,
    onLegsChange,
    maxLegs = 5
}) => {
    const handleAddLeg = () => {
        if (legs.length >= maxLegs) return;

        const newLeg: FlightLeg = {
            id: `leg-${Date.now()}`,
            origin: legs[legs.length - 1]?.destination || '',
            destination: '',
            departureDate: ''
        };

        onLegsChange([...legs, newLeg]);
    };

    const handleRemoveLeg = (legId: string) => {
        if (legs.length <= 2) return; // Minimum 2 legs for multi-city
        onLegsChange(legs.filter(leg => leg.id !== legId));
    };

    const handleLegChange = (legId: string, field: keyof FlightLeg, value: string) => {
        onLegsChange(
            legs.map(leg =>
                leg.id === legId ? { ...leg, [field]: value } : leg
            )
        );
    };

    const getMinDate = (legIndex: number): string | undefined => {
        if (legIndex === 0) {
            // First leg: tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        }

        // Subsequent legs: after previous leg's departure
        const previousLeg = legs[legIndex - 1];
        if (previousLeg?.departureDate) {
            const prevDate = new Date(previousLeg.departureDate);
            prevDate.setDate(prevDate.getDate() + 1);
            return prevDate.toISOString().split('T')[0];
        }

        return undefined;
    };

    return (
        <div className="multi-city-flight-form">
            <div className="multi-city-header">
                <h3>Letovi na više destinacija</h3>
                <span className="leg-counter">{legs.length} / {maxLegs} destinacija</span>
            </div>

            <div className="flight-legs-container">
                {legs.map((leg, index) => (
                    <div key={leg.id} className="flight-leg-card">
                        <div className="leg-number">
                            <span>Let {index + 1}</span>
                        </div>

                        <div className="leg-inputs-row">
                            {/* Origin */}
                            <div className="leg-input-group">
                                <AirportAutocomplete
                                    label={index === 0 ? 'Polazište' : 'Od'}
                                    value={leg.origin}
                                    onChange={code => handleLegChange(leg.id, 'origin', code)}
                                    placeholder="Unesite grad"
                                />
                            </div>

                            {/* Destination */}
                            <div className="leg-input-group">
                                <AirportAutocomplete
                                    label={index === legs.length - 1 ? 'Krajnje odredište' : 'Do'}
                                    value={leg.destination}
                                    onChange={code => handleLegChange(leg.id, 'destination', code)}
                                    placeholder="Unesite grad"
                                />
                            </div>

                            {/* Departure Date */}
                            <div className="leg-input-group">
                                <CustomDatePicker
                                    label={index === 0 ? 'Datum polaska' : 'Datum'}
                                    selectedDate={leg.departureDate}
                                    onDateSelect={date => handleLegChange(leg.id, 'departureDate', date)}
                                    minDate={getMinDate(index)}
                                />
                            </div>

                            {/* Remove Button */}
                            {legs.length > 2 && (
                                <button
                                    type="button"
                                    className="remove-leg-btn"
                                    onClick={() => handleRemoveLeg(leg.id)}
                                    title="Ukloni let"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {/* Connection indicator */}
                        {index < legs.length - 1 && (
                            <div className="leg-connection">
                                <div className="connection-line"></div>
                                <div className="connection-dot"></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Leg Button */}
            {legs.length < maxLegs && (
                <button
                    type="button"
                    className="add-leg-btn"
                    onClick={handleAddLeg}
                >
                    <Plus size={18} />
                    Dodaj destinaciju ({legs.length}/{maxLegs})
                </button>
            )}

            {/* Info */}
            <div className="multi-city-info">
                <p>
                    💡 <strong>Savet:</strong> Letovi na više destinacija omogućavaju vam da posetite
                    više gradova u jednom putovanju bez potrebe za povratnom kartom.
                </p>
            </div>
        </div>
    );
};

export default MultiCityFlightForm;
