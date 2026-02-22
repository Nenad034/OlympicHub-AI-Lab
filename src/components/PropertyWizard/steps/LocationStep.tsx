import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import type { StepProps } from '../types';
import LocationPicker, { type LocationData } from '../../LocationPicker';

const LocationStep: React.FC<StepProps> = ({ data, onChange }) => {
    // Transform Property data to LocationData for the picker
    const pickerData: LocationData = {
        address: data.address?.addressLine1 || '',
        addressLine2: data.address?.addressLine2 || '',
        city: data.address?.city || '',
        postalCode: data.address?.postalCode || '',
        countryCode: data.address?.countryCode || '',
        stateProvince: data.address?.stateProvince || '',
        latitude: data.geoCoordinates?.latitude || 0,
        longitude: data.geoCoordinates?.longitude || 0,
        googlePlaceId: data.geoCoordinates?.googlePlaceId
    };

    const handleLocationChange = (newData: LocationData) => {
        onChange({
            address: {
                addressLine1: newData.address,
                addressLine2: newData.addressLine2,
                city: newData.city,
                postalCode: newData.postalCode,
                countryCode: newData.countryCode,
                stateProvince: newData.stateProvince
            } as any,
            geoCoordinates: {
                latitude: newData.latitude,
                longitude: newData.longitude,
                coordinateSource: 'MAP_PIN',
                googlePlaceId: newData.googlePlaceId
            } as any
        });
    };

    const addPoi = () => {
        const newPoi = { poiName: '', distanceMeters: 0, poiType: 'CityCenter' };
        onChange({ pointsOfInterest: [...(data.pointsOfInterest || []), newPoi as any] });
    };

    const updatePoi = (index: number, field: string, value: any) => {
        const newPois = [...(data.pointsOfInterest || [])];
        newPois[index] = { ...newPois[index], [field]: value };
        onChange({ pointsOfInterest: newPois });
    };

    const removePoi = (index: number) => {
        onChange({ pointsOfInterest: data.pointsOfInterest?.filter((_, i) => i !== index) });
    };

    return (
        <div>
            {/* The LocationPicker handles all map logic including auto-search by name */}
            <LocationPicker
                data={pickerData}
                onChange={handleLocationChange}
            />

            <div className="form-section" style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                <h3 className="form-section-title">Tačke Interesa (Udaljenosti)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(data.pointsOfInterest || []).map((poi, index) => (
                        <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-card)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <input
                                className="form-input"
                                placeholder="Naziv tačke (npr. Centar)"
                                value={poi.poiName}
                                onChange={e => updatePoi(index, 'poiName', e.target.value)}
                                style={{ flex: 1 }}
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="Distanca"
                                    value={poi.distanceMeters}
                                    onChange={e => updatePoi(index, 'distanceMeters', parseInt(e.target.value) || 0)}
                                    style={{ width: '100px' }}
                                />
                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>m</span>
                            </div>
                            <select
                                className="form-select"
                                value={poi.poiType}
                                onChange={e => updatePoi(index, 'poiType', e.target.value)}
                                style={{ width: '150px' }}
                            >
                                <option value="CityCenter">Centar</option>
                                <option value="Airport">Aerodrom</option>
                                <option value="TrainStation">Stanica</option>
                                <option value="Beach">Plaža</option>
                                <option value="SkiLift">Ski Lift</option>
                                <option value="Restaurant">Restoran</option>
                                <option value="Shop">Prodavnica</option>
                            </select>
                            <button onClick={() => removePoi(index)} className="btn-icon" style={{ color: '#ef4444', padding: '8px' }}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button onClick={addPoi} className="btn-secondary" style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
                        <Plus size={16} /> Dodaj Tačku
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationStep;
