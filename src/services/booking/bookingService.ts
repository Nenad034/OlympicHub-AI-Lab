// Generic Booking Service
// Provides interface for all booking adapters

import type { BookingRequest, BookingResponse } from '../../types/booking.types';

/**
 * Booking adapter interface
 * All provider adapters must implement this
 */
export interface BookingAdapter {
    createBooking(data: BookingRequest): Promise<BookingResponse>;
    validateBooking(data: BookingRequest): Promise<{ isValid: boolean; errors?: string[] }>;
    getBookingStatus?(bookingId: string): Promise<{ status: string; details?: any }>;
}

/**
 * Get booking adapter for a specific provider
 */
export const getBookingAdapter = async (provider: 'solvex' | 'tct' | 'opengreece'): Promise<BookingAdapter> => {
    switch (provider) {
        case 'solvex': {
            const { SolvexBookingAdapter } = await import('./solvexBookingAdapter');
            return new SolvexBookingAdapter();
        }
        case 'tct': {
            // TODO: Implement TCT adapter
            throw new Error('TCT booking adapter not yet implemented');
        }
        case 'opengreece': {
            // TODO: Implement OpenGreece adapter
            throw new Error('OpenGreece booking adapter not yet implemented');
        }
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
};

/**
 * Create a booking using the appropriate adapter
 */
export const createBooking = async (request: BookingRequest): Promise<BookingResponse> => {
    try {
        const adapter = await getBookingAdapter(request.provider);

        // Validate before creating
        const validation = await adapter.validateBooking(request);
        if (!validation.isValid) {
            return {
                success: false,
                error: `Validation failed: ${validation.errors?.join(', ')}`
            };
        }

        // Create booking
        return await adapter.createBooking(request);
    } catch (error) {
        console.error('Booking service error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};

/**
 * Get booking status
 */
export const getBookingStatus = async (
    provider: 'solvex' | 'tct' | 'opengreece',
    bookingId: string
): Promise<{ status: string; details?: any }> => {
    try {
        const adapter = await getBookingAdapter(provider);

        if (!adapter.getBookingStatus) {
            return {
                status: 'unknown',
                details: { error: 'Provider does not support status check' }
            };
        }

        return await adapter.getBookingStatus(bookingId);
    } catch (error) {
        console.error('Get booking status error:', error);
        return {
            status: 'error',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
        };
    }
};
