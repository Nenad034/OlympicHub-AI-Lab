import React from 'react';
import type { GenericGuest, GuestValidationErrors } from '../../types/booking.types';
import { NATIONALITIES } from '../../constants/nationalities';
import './GuestForm.css';

interface GuestFormProps {
    guestNumber: number; // 1, 2, 3...
    isMainGuest: boolean; // true for main guest
    isChild: boolean; // true for child
    guestData: GenericGuest;
    onChange: (data: GenericGuest) => void;
    errors?: GuestValidationErrors;
}

export const GuestForm: React.FC<GuestFormProps> = ({
    guestNumber,
    isMainGuest,
    isChild,
    guestData,
    onChange,
    errors = {}
}) => {
    const handleChange = (field: keyof GenericGuest, value: any) => {
        onChange({
            ...guestData,
            [field]: value
        });
    };

    const getGuestTitle = () => {
        if (isMainGuest && guestData.isLeadPassenger) return '👑 NOSILAC PUTOVANJA & UGOVARAČ (Putnik 1)';
        if (isMainGuest) return '👤 NOSILAC REZERVACIJE (Putnik 1)';
        if (isChild) return `👶 DETE ${guestNumber}`;
        return `👥 PUTNIK ${guestNumber}`;
    };

    return (
        <div className="guest-form">
            <div className="guest-form-header">
                <h3>{getGuestTitle()}</h3>
            </div>

            <div className="guest-form-grid">
                {/* First Name */}
                <div className="form-field">
                    <label htmlFor={`guest-${guestNumber}-firstName`}>
                        Ime <span className="required">*</span>
                    </label>
                    <input
                        id={`guest-${guestNumber}-firstName`}
                        type="text"
                        value={guestData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        className={errors.firstName ? 'error' : ''}
                        placeholder="Unesite ime"
                    />
                    {errors.firstName && (
                        <span className="error-message">{errors.firstName}</span>
                    )}
                </div>

                {/* Last Name */}
                <div className="form-field">
                    <label htmlFor={`guest-${guestNumber}-lastName`}>
                        Prezime <span className="required">*</span>
                    </label>
                    <input
                        id={`guest-${guestNumber}-lastName`}
                        type="text"
                        value={guestData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        className={errors.lastName ? 'error' : ''}
                        placeholder="Unesite prezime"
                    />
                    {errors.lastName && (
                        <span className="error-message">{errors.lastName}</span>
                    )}
                </div>

                {/* Email (only for main guest or potential lead) */}
                {(isMainGuest || guestData.isLeadPassenger) && (
                    <div className="form-field">
                        <label htmlFor={`guest-${guestNumber}-email`}>
                            Email <span className="required">*</span>
                        </label>
                        <input
                            id={`guest-${guestNumber}-email`}
                            type="email"
                            value={guestData.email || ''}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className={errors.email ? 'error' : ''}
                            placeholder="primer@email.com"
                        />
                        {errors.email && (
                            <span className="error-message">{errors.email}</span>
                        )}
                    </div>
                )}

                {/* Phone (only for main guest or potential lead) */}
                {(isMainGuest || guestData.isLeadPassenger) && (
                    <div className="form-field">
                        <label htmlFor={`guest-${guestNumber}-phone`}>
                            Telefon <span className="required">*</span>
                        </label>
                        <input
                            id={`guest-${guestNumber}-phone`}
                            type="tel"
                            value={guestData.phone || ''}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className={errors.phone ? 'error' : ''}
                            placeholder="+381 60 123 4567"
                        />
                        {errors.phone && (
                            <span className="error-message">{errors.phone}</span>
                        )}
                    </div>
                )}

                {/* Date of Birth */}
                <div className="form-field">
                    <label htmlFor={`guest-${guestNumber}-dob`}>
                        Datum rođenja <span className="required">*</span>
                    </label>
                    <input
                        id={`guest-${guestNumber}-dob`}
                        type="date"
                        value={guestData.dateOfBirth}
                        onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                        className={errors.dateOfBirth ? 'error' : ''}
                        max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.dateOfBirth && (
                        <span className="error-message">{errors.dateOfBirth}</span>
                    )}
                </div>

                {/* Passport Number */}
                <div className="form-field">
                    <label htmlFor={`guest-${guestNumber}-passport`}>
                        Broj pasoša <span className="required">*</span>
                    </label>
                    <input
                        id={`guest-${guestNumber}-passport`}
                        type="text"
                        value={guestData.passportNumber}
                        onChange={(e) => handleChange('passportNumber', e.target.value.toUpperCase())}
                        className={errors.passportNumber ? 'error' : ''}
                        placeholder="AB1234567"
                    />
                    {errors.passportNumber && (
                        <span className="error-message">{errors.passportNumber}</span>
                    )}
                </div>

                {/* Gender */}
                <div className="form-field">
                    <label htmlFor={`guest-${guestNumber}-gender`}>
                        Pol <span className="required">*</span>
                    </label>
                    <select
                        id={`guest-${guestNumber}-gender`}
                        value={guestData.gender || ''}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className={errors.gender ? 'error' : ''}
                    >
                        <option value="">Izaberite pol</option>
                        <option value="M">Muški</option>
                        <option value="F">Ženski</option>
                    </select>
                </div>

                {/* Nationality */}
                <div className="form-field">
                    <label htmlFor={`guest-${guestNumber}-nationality`}>
                        Nacionalnost <span className="required">*</span>
                    </label>
                    <select
                        id={`guest-${guestNumber}-nationality`}
                        value={guestData.nationality}
                        onChange={(e) => handleChange('nationality', e.target.value)}
                        className={errors.nationality ? 'error' : ''}
                    >
                        <option value="">Izaberite nacionalnost</option>
                        {NATIONALITIES.map((nat) => (
                            <option key={nat.code} value={nat.code}>
                                {nat.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Lead Passenger Checkbox and Address */}
            <div className="guest-footer" style={{ marginTop: '16px', padding: '12px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px dashed rgba(59, 130, 246, 0.3)' }}>
                <label className="checkbox-flex" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: 'var(--accent)' }}>
                    <input
                        type="checkbox"
                        checked={guestData.isLeadPassenger || (isMainGuest && guestNumber === 1)}
                        onChange={(e) => handleChange('isLeadPassenger', e.target.checked)}
                        style={{ width: '18px', height: '18px' }}
                    />
                    <span>Ovaj putnik je nosilac putovanja (Ugovarač/Platilaac)</span>
                </label>

                {(guestData.isLeadPassenger || (isMainGuest && guestNumber === 1)) && (
                    <div className="lead-passenger-details" style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                        <div className="form-field">
                            <label style={{ fontSize: '13px', opacity: 0.8 }}>Adresa stanovanja</label>
                            <input
                                type="text"
                                value={guestData.address || ''}
                                onChange={(e) => handleChange('address', e.target.value)}
                                placeholder="Zmaj Jovina 1"
                                style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '4px' }}
                            />
                        </div>
                        <div className="form-field">
                            <label style={{ fontSize: '13px', opacity: 0.8 }}>Grad</label>
                            <input
                                type="text"
                                value={guestData.city || ''}
                                onChange={(e) => handleChange('city', e.target.value)}
                                placeholder="Beograd"
                                style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '4px' }}
                            />
                        </div>
                        <div className="form-field">
                            <label style={{ fontSize: '13px', opacity: 0.8 }}>Država</label>
                            <select
                                value={guestData.country || 'Srbija'}
                                onChange={(e) => handleChange('country', e.target.value)}
                                style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '4px', background: 'white', color: 'black' }}
                            >
                                {NATIONALITIES.map(n => (
                                    <option key={n.code} value={n.name}>{n.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
