// Solvex Booking Adapter
// Implements BookingAdapter interface for Solvex API

import type { BookingAdapter } from '../../types/booking.types';
import type { BookingRequest, BookingResponse } from '../../types/booking.types';
import { makeSoapRequest } from '../../utils/solvexSoapClient';
import SolvexAuth from '../../services/solvex/solvexAuthService';

export class SolvexBookingAdapter implements BookingAdapter {
    /**
     * Create a booking in Solvex system
     * 
     * NOTE: This implementation is based on assumptions about Solvex API structure.
     * The actual SOAP method name and parameters need to be verified in Solvex WSDL documentation.
     * 
     * Possible SOAP methods (to be confirmed):
     * - CreateBooking
     * - MakeReservation
     * - BookHotel
     * - ReserveHotel
     */
    async createBooking(data: BookingRequest): Promise<BookingResponse> {
        try {
            // 1. Get authentication token
            const authResult = await SolvexAuth.connect();
            if (!authResult.success || !authResult.data) {
                return {
                    success: false,
                    error: 'Failed to authenticate with Solvex API'
                };
            }

            const guid = authResult.data;

            // 2. Transform generic booking request to Solvex format
            const solvexRequest = this.transformToSolvexFormat(data, guid);

            console.log('[Solvex Booking] Attempting booking with request:', JSON.stringify(solvexRequest, null, 2));

            // 3. TEMPORARY: Return mock response until we get correct SOAP method from Solvex WSDL
            // TODO: Replace with actual SOAP call once we have the correct method name
            console.warn('[Solvex Booking] MOCK MODE: Returning simulated booking response');
            console.warn('[Solvex Booking] Reason: Booking SOAP method not yet documented in Solvex WSDL');
            console.warn('[Solvex Booking] Request would be sent to: CreateBooking (unverified)');

            // Simulate successful booking
            const mockBookingId = `SOLVEX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            return {
                success: true,
                bookingId: mockBookingId,
                status: 'pending',
                providerResponse: {
                    message: 'MOCK BOOKING - Waiting for Solvex WSDL documentation',
                    note: 'This is a simulated booking response. Real API integration pending.',
                    requestData: solvexRequest
                }
            };

            /* UNCOMMENT THIS WHEN WE HAVE THE CORRECT SOAP METHOD:
            // 3. Call Solvex SOAP API
            // Possible method names (to be verified in WSDL):
            // - CreateBooking
            // - MakeReservation  
            // - BookHotel
            // - ReserveHotel
            // - CreateReservation
            const response = await makeSoapRequest('CreateBooking', solvexRequest);

            // 4. Transform Solvex response to generic format
            return this.transformFromSolvexFormat(response);
            */
        } catch (error) {
            console.error('[Solvex Booking] Error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }

    /**
     * Transform generic booking request to Solvex-specific format
     */
    private transformToSolvexFormat(data: BookingRequest, guid: string): any {
        const mainGuest = data.guests[0];
        const additionalGuests = data.guests.slice(1);

        // Extract hotel and room keys from providerSpecificData
        // The structure comes from Solvex search results: { hotel: { id: ... }, room: { roomType: { id: ... } } }
        const hotelKey = data.providerSpecificData?.hotel?.id ||
            parseInt(data.hotelId) ||
            0;

        const roomTypeKey = data.providerSpecificData?.room?.roomType?.id ||
            parseInt(data.roomTypeId) ||
            0;

        console.log('[Solvex Booking] Hotel Key:', hotelKey, 'Room Type Key:', roomTypeKey);
        console.log('[Solvex Booking] Provider Data:', data.providerSpecificData);

        // Solvex-specific request structure (to be verified)
        return {
            guid: guid,
            hotelKey: hotelKey,
            roomTypeKey: roomTypeKey,
            dateFrom: data.checkIn,
            dateTo: data.checkOut,

            // Main guest (lead passenger)
            mainGuest: {
                firstName: mainGuest.firstName,
                lastName: mainGuest.lastName,
                email: mainGuest.email,
                phone: mainGuest.phone,
                dateOfBirth: mainGuest.dateOfBirth,
                passportNumber: mainGuest.passportNumber,
                nationality: mainGuest.nationality
            },

            // Additional guests
            additionalGuests: additionalGuests.map((guest: any) => ({
                firstName: guest.firstName,
                lastName: guest.lastName,
                dateOfBirth: guest.dateOfBirth,
                passportNumber: guest.passportNumber,
                nationality: guest.nationality
            })),

            // Special requests
            specialRequests: data.specialRequests || '',

            // Pricing
            totalPrice: data.totalPrice,
            currency: data.currency
        };
    }

    /**
     * Transform Solvex response to generic format
     */
    private transformFromSolvexFormat(response: any): BookingResponse {
        // TODO: Verify actual Solvex response structure
        // Current assumption based on common SOAP patterns

        if (response && response.success !== false) {
            return {
                success: true,
                bookingId: response.bookingId || response.reservationId || response.id,
                status: this.mapSolvexStatus(response.status),
                providerResponse: response
            };
        }

        return {
            success: false,
            error: response.error || response.message || 'Booking failed',
            providerResponse: response
        };
    }

    /**
     * Map Solvex-specific status to generic status
     */
    private mapSolvexStatus(solvexStatus: string): 'confirmed' | 'pending' | 'on-request' {
        if (!solvexStatus) return 'pending';

        const status = solvexStatus.toUpperCase();

        // Map Solvex statuses (to be verified)
        switch (status) {
            case 'CONFIRMED':
            case 'OK':
            case 'SUCCESS':
                return 'confirmed';

            case 'PENDING':
            case 'PROCESSING':
            case 'IN_PROGRESS':
                return 'pending';

            case 'ON_REQUEST':
            case 'REQUEST':
            case 'WAITING':
                return 'on-request';

            default:
                return 'pending';
        }
    }

    /**
     * Validate booking before submission
     */
    async validateBooking(data: BookingRequest): Promise<{ isValid: boolean; errors?: string[] }> {
        const errors: string[] = [];

        // Validate hotel and room IDs
        if (!data.hotelId || isNaN(parseInt(data.hotelId))) {
            errors.push('Invalid hotel ID');
        }

        if (!data.roomTypeId || isNaN(parseInt(data.roomTypeId))) {
            errors.push('Invalid room type ID');
        }

        // Validate dates
        const checkIn = new Date(data.checkIn);
        const checkOut = new Date(data.checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkIn < today) {
            errors.push('Check-in date cannot be in the past');
        }

        if (checkOut <= checkIn) {
            errors.push('Check-out date must be after check-in date');
        }

        // Validate guests
        if (!data.guests || data.guests.length === 0) {
            errors.push('At least one guest is required');
        }

        // Validate main guest has email and phone
        const mainGuest = data.guests[0];
        if (!mainGuest.email || !mainGuest.phone) {
            errors.push('Main guest must have email and phone');
        }

        return {
            isValid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }

    /**
     * Get booking status (optional - if Solvex supports it)
     */
    async getBookingStatus(bookingId: string): Promise<{ status: string; details?: any }> {
        try {
            // Get auth token
            const authResult = await SolvexAuth.connect();
            if (!authResult.success || !authResult.data) {
                throw new Error('Authentication failed');
            }

            const response: any = await makeSoapRequest('GetBookingStatus', {
                guid: authResult.data,
                bookingId: bookingId
            });

            return {
                status: this.mapSolvexStatus(response.status),
                details: response
            };
        } catch (error) {
            console.error('Failed to get booking status:', error);
            return {
                status: 'unknown',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }
}
