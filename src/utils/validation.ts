/**
 * Input Validation & Sanitization Utilities
 * Zaštita od XSS, SQL Injection i drugih napada
 */

import DOMPurify from 'dompurify';
import validator from 'validator';

/**
 * Validacija email adrese
 */
export const validateEmail = (email: string): boolean => {
    return validator.isEmail(email);
};

/**
 * Validacija imena grada (samo slova, razmaci i crtice)
 */
export const validateCity = (city: string): boolean => {
    return /^[a-zA-ZčćžšđČĆŽŠĐ\s-]+$/.test(city);
};

/**
 * Validacija datuma (YYYY-MM-DD format)
 */
export const validateDate = (date: string): boolean => {
    return validator.isDate(date, { format: 'YYYY-MM-DD' });
};

/**
 * Validacija broja (pozitivan broj)
 */
export const validatePositiveNumber = (value: string | number): boolean => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return !isNaN(num) && num > 0;
};

/**
 * Validacija telefonskog broja
 */
export const validatePhone = (phone: string): boolean => {
    return validator.isMobilePhone(phone, 'any');
};

/**
 * Sanitizacija HTML-a (dozvoljeni samo osnovni tagovi)
 */
export const sanitizeHTML = (html: string): string => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: []
    });
};

/**
 * Sanitizacija običnog teksta (uklanja sve HTML tagove)
 */
export const sanitizeText = (text: string): string => {
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

/**
 * Sanitizacija input-a (escape special characters)
 */
export const sanitizeInput = (input: string): string => {
    let sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

    // Escape special characters
    sanitized = sanitized
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');

    return sanitized.trim();
};

/**
 * Validacija i sanitizacija imena
 */
export const validateAndSanitizeName = (name: string): { valid: boolean; sanitized: string; error?: string } => {
    // Validacija
    if (!name || name.trim().length === 0) {
        return { valid: false, sanitized: '', error: 'Name is required' };
    }

    if (name.length > 100) {
        return { valid: false, sanitized: '', error: 'Name is too long (max 100 characters)' };
    }

    if (!/^[a-zA-ZčćžšđČĆŽŠĐ\s-]+$/.test(name)) {
        return { valid: false, sanitized: '', error: 'Name contains invalid characters' };
    }

    // Sanitizacija
    const sanitized = sanitizeInput(name);

    return { valid: true, sanitized };
};

/**
 * Validacija i sanitizacija email-a
 */
export const validateAndSanitizeEmail = (email: string): { valid: boolean; sanitized: string; error?: string } => {
    // Sanitizacija prvo
    const sanitized = sanitizeInput(email);

    // Validacija
    if (!validateEmail(sanitized)) {
        return { valid: false, sanitized: '', error: 'Invalid email address' };
    }

    return { valid: true, sanitized };
};

/**
 * Validacija i sanitizacija grada
 */
export const validateAndSanitizeCity = (city: string): { valid: boolean; sanitized: string; error?: string } => {
    // Validacija
    if (!city || city.trim().length === 0) {
        return { valid: false, sanitized: '', error: 'City is required' };
    }

    if (!validateCity(city)) {
        return { valid: false, sanitized: '', error: 'City name contains invalid characters' };
    }

    // Sanitizacija
    const sanitized = sanitizeInput(city);

    return { valid: true, sanitized };
};

/**
 * Validacija search parametara
 */
export const validateSearchParams = (params: {
    city?: string;
    checkin?: string;
    checkout?: string;
    adults?: number;
}): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Validacija grada
    if (params.city) {
        const cityResult = validateAndSanitizeCity(params.city);
        if (!cityResult.valid) {
            errors.push(cityResult.error!);
        }
    }

    // Validacija checkin datuma
    if (params.checkin && !validateDate(params.checkin)) {
        errors.push('Invalid check-in date');
    }

    // Validacija checkout datuma
    if (params.checkout && !validateDate(params.checkout)) {
        errors.push('Invalid check-out date');
    }

    // Validacija broja odraslih
    if (params.adults !== undefined && !validatePositiveNumber(params.adults)) {
        errors.push('Invalid number of adults');
    }

    // Provera da je checkout posle checkin-a
    if (params.checkin && params.checkout) {
        const checkinDate = new Date(params.checkin);
        const checkoutDate = new Date(params.checkout);

        if (checkoutDate <= checkinDate) {
            errors.push('Check-out date must be after check-in date');
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Rate Limiter za zaštitu od spam-a
 */
export class RateLimiter {
    private requests: Map<string, number[]> = new Map();

    constructor(
        private maxRequests: number = 100,
        private windowMs: number = 60000 // 1 minut
    ) { }

    isAllowed(key: string): boolean {
        const now = Date.now();
        const requests = this.requests.get(key) || [];

        // Ukloni stare zahteve
        const recentRequests = requests.filter(
            time => now - time < this.windowMs
        );

        if (recentRequests.length >= this.maxRequests) {
            return false; // Rate limit exceeded
        }

        recentRequests.push(now);
        this.requests.set(key, recentRequests);

        return true;
    }

    getRemainingRequests(key: string): number {
        const now = Date.now();
        const requests = this.requests.get(key) || [];

        const recentRequests = requests.filter(
            time => now - time < this.windowMs
        );

        return Math.max(0, this.maxRequests - recentRequests.length);
    }
}

// Export singleton instance
export const rateLimiter = new RateLimiter(100, 60000); // 100 zahteva po minuti
