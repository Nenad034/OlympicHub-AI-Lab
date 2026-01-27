// Booking form validation utilities
import type { GenericGuest, GuestValidationErrors } from '../types/booking.types';

/**
 * Validate a single guest
 * @param guest Guest data to validate
 * @param isMainGuest Whether this is the main guest (requires email/phone)
 * @param isChild Whether this is a child (different age validation)
 * @returns Object with validation errors (empty if valid)
 */
export const validateGuest = (
    guest: GenericGuest,
    isMainGuest: boolean,
    isChild: boolean
): GuestValidationErrors => {
    const errors: GuestValidationErrors = {};

    // First name validation
    if (!guest.firstName || guest.firstName.trim().length < 2) {
        errors.firstName = 'Ime mora sadržati minimum 2 slova';
    } else if (!/^[a-zA-ZčćžšđČĆŽŠĐ\s\-']+$/.test(guest.firstName)) {
        errors.firstName = 'Ime može sadržati samo slova';
    }

    // Last name validation
    if (!guest.lastName || guest.lastName.trim().length < 2) {
        errors.lastName = 'Prezime mora sadržati minimum 2 slova';
    } else if (!/^[a-zA-ZčćžšđČĆŽŠĐ\s\-']+$/.test(guest.lastName)) {
        errors.lastName = 'Prezime može sadržati samo slova';
    }

    // Email validation (only for main guest)
    if (isMainGuest) {
        if (!guest.email || guest.email.trim().length === 0) {
            errors.email = 'Email je obavezan za nosioca rezervacije';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
            errors.email = 'Unesite validnu email adresu';
        }

        // Phone validation (only for main guest)
        if (!guest.phone || guest.phone.trim().length === 0) {
            errors.phone = 'Telefon je obavezan za nosioca rezervacije';
        } else if (!/^\+?[0-9\s\-()]{7,20}$/.test(guest.phone)) {
            errors.phone = 'Unesite validan broj telefona (min 7 cifara)';
        }
    }

    // Date of birth validation
    if (!guest.dateOfBirth) {
        errors.dateOfBirth = 'Datum rođenja je obavezan';
    } else {
        const birthDate = new Date(guest.dateOfBirth);
        const today = new Date();

        // Check if date is valid
        if (isNaN(birthDate.getTime())) {
            errors.dateOfBirth = 'Unesite validan datum';
        } else {
            const age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            const dayDiff = today.getDate() - birthDate.getDate();

            // Adjust age if birthday hasn't occurred this year
            const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

            // Main guest must be 18+
            if (isMainGuest && actualAge < 18) {
                errors.dateOfBirth = 'Nosilac rezervacije mora biti punoletan (18+)';
            }

            // Child must be under 18
            if (isChild && actualAge >= 18) {
                errors.dateOfBirth = 'Datum rođenja ne odgovara kategoriji deteta';
            }

            // Date cannot be in the future
            if (birthDate > today) {
                errors.dateOfBirth = 'Datum rođenja ne može biti u budućnosti';
            }

            // Reasonable age limit (max 120 years)
            if (actualAge > 120) {
                errors.dateOfBirth = 'Unesite validan datum rođenja';
            }
        }
    }

    // Passport number validation
    if (!guest.passportNumber || guest.passportNumber.trim().length < 6) {
        errors.passportNumber = 'Broj pasoša mora imati minimum 6 karaktera';
    } else if (!/^[A-Z0-9\s\-]+$/i.test(guest.passportNumber)) {
        errors.passportNumber = 'Broj pasoša može sadržati samo slova i brojeve';
    }

    // Nationality validation
    if (!guest.nationality || guest.nationality.trim().length === 0) {
        errors.nationality = 'Nacionalnost je obavezna';
    }

    return errors;
};

/**
 * Validate all guests in a booking
 * @param mainGuest Main guest data
 * @param additionalGuests Additional guests data
 * @param childrenCount Number of children in booking
 * @returns Object with validation errors indexed by guest number
 */
export const validateAllGuests = (
    mainGuest: GenericGuest,
    additionalGuests: GenericGuest[],
    childrenCount: number
): Record<number, GuestValidationErrors> => {
    const allErrors: Record<number, GuestValidationErrors> = {};

    // Validate main guest (guest 0)
    const mainGuestErrors = validateGuest(mainGuest, true, false);
    if (Object.keys(mainGuestErrors).length > 0) {
        allErrors[0] = mainGuestErrors;
    }

    // Validate additional guests
    additionalGuests.forEach((guest, index) => {
        // Determine if this guest is a child
        // Last N guests are children (where N = childrenCount)
        const guestNumber = index + 1;
        const totalAdults = additionalGuests.length - childrenCount + 1; // +1 for main guest
        const isChild = guestNumber >= totalAdults;

        const guestErrors = validateGuest(guest, false, isChild);
        if (Object.keys(guestErrors).length > 0) {
            allErrors[guestNumber] = guestErrors;
        }
    });

    return allErrors;
};

/**
 * Check if there are any validation errors
 */
export const hasValidationErrors = (errors: Record<number, GuestValidationErrors>): boolean => {
    return Object.keys(errors).length > 0;
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '');
    return cleaned;
};

/**
 * Format date for display (DD/MM/YYYY)
 */
export const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
};

/**
 * Format date for input (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};
