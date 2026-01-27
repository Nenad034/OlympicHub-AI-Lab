/**
 * ORS API Booking Service
 * 
 * Handles all booking operations with ORS API
 * - Register (test/wire transfer)
 * - Booking (confirmed)
 * - Option (hold)
 * - Cancel
 * - Get booking info
 */

import { orsAuthService } from './orsAuthService';
import { ORS_ENDPOINTS } from './orsConstants';
import type {
    OrsAvailabilityRequest,
    OrsAvailabilityResponse,
    OrsPassenger,
    OrsCustomer,
    OrsExtraService,
} from '../../types/ors.types';

export interface OrsBookingRequest {
    passengers: OrsPassenger[];
    customer: OrsCustomer;
    extraServices?: OrsExtraService[];
    comments?: string;
    internalRemark?: string;
}

export interface OrsBookingResponse extends OrsAvailabilityResponse {
    BookingCode?: string;
    VoucherURL?: string;
    OptionDate?: string;
}

export interface OrsCancellationRequest {
    reason?: string;
    penaltyAccepted?: boolean;
}

export class OrsBookingService {
    /**
     * Check availability before booking
     * This should ALWAYS be called before creating a booking
     */
    async checkAvailability(
        tourOperator: string,
        hashCode: string,
        request: OrsBookingRequest,
        language: string = 'en'
    ): Promise<OrsAvailabilityResponse> {
        console.log('[ORS Booking] Checking availability:', {
            tourOperator,
            hashCode,
            passengersCount: request.passengers.length,
        });

        const endpoint = ORS_ENDPOINTS.VERIFY(tourOperator, hashCode);

        const payload: OrsAvailabilityRequest = {
            Passengers: request.passengers,
            Customer: request.customer,
            ExtraServices: request.extraServices,
        };

        try {
            const response = await orsAuthService.post<OrsAvailabilityResponse>(
                endpoint,
                payload,
                language
            );

            console.log('[ORS Booking] Availability check result:', {
                status: response.StatusCode.Status,
                statusText: response.StatusCode.Text,
                totalPrice: response.Price?.TotalPrice,
                currency: response.Price?.Currency,
            });

            return response;
        } catch (error) {
            console.error('[ORS Booking] Availability check failed:', error);
            throw error;
        }
    }

    /**
     * Check if optional booking is possible
     */
    async checkOption(
        tourOperator: string,
        hashCode: string,
        request: OrsBookingRequest,
        language: string = 'en'
    ): Promise<OrsAvailabilityResponse> {
        console.log('[ORS Booking] Checking option availability:', {
            tourOperator,
            hashCode,
        });

        const endpoint = ORS_ENDPOINTS.OPTION_CHECK(tourOperator, hashCode);

        const payload: OrsAvailabilityRequest = {
            Passengers: request.passengers,
            Customer: request.customer,
            ExtraServices: request.extraServices,
        };

        try {
            const response = await orsAuthService.post<OrsAvailabilityResponse>(
                endpoint,
                payload,
                language
            );

            console.log('[ORS Booking] Option check result:', {
                status: response.StatusCode.Status,
                optionDate: response.OptionDate,
            });

            return response;
        } catch (error) {
            console.error('[ORS Booking] Option check failed:', error);
            throw error;
        }
    }

    /**
     * Register booking (recommended for testing and wire transfers)
     * Creates entry in ORS but does NOT send to tour operator yet
     * Agent can review and manually confirm later
     */
    async register(
        tourOperator: string,
        hashCode: string,
        request: OrsBookingRequest,
        options: {
            test?: boolean;
            language?: string;
        } = {}
    ): Promise<OrsBookingResponse> {
        console.log('[ORS Booking] Registering booking:', {
            tourOperator,
            hashCode,
            test: options.test,
            passengersCount: request.passengers.length,
        });

        const endpoint = ORS_ENDPOINTS.REGISTER(tourOperator, hashCode);
        const url = options.test ? `${endpoint}?test=true` : endpoint;

        const payload: OrsAvailabilityRequest = {
            Passengers: request.passengers,
            Customer: request.customer,
            ExtraServices: request.extraServices,
        };

        try {
            const response = await orsAuthService.post<OrsBookingResponse>(
                url,
                payload,
                options.language || 'en'
            );

            console.log('[ORS Booking] Registration successful:', {
                status: response.StatusCode.Status,
                statusText: response.StatusCode.Text,
                bookingCode: response.BookingCode,
                totalPrice: response.Price?.TotalPrice,
            });

            return response;
        } catch (error) {
            console.error('[ORS Booking] Registration failed:', error);
            throw error;
        }
    }

    /**
     * Create confirmed booking
     * IMMEDIATELY sends to tour operator and affects stock
     * Use with caution - may create cancellation fees
     */
    async createBooking(
        tourOperator: string,
        hashCode: string,
        request: OrsBookingRequest,
        language: string = 'en'
    ): Promise<OrsBookingResponse> {
        console.log('[ORS Booking] Creating confirmed booking:', {
            tourOperator,
            hashCode,
            passengersCount: request.passengers.length,
        });

        const endpoint = ORS_ENDPOINTS.BOOKING(tourOperator, hashCode);

        const payload: OrsAvailabilityRequest = {
            Passengers: request.passengers,
            Customer: request.customer,
            ExtraServices: request.extraServices,
        };

        try {
            const response = await orsAuthService.post<OrsBookingResponse>(
                endpoint,
                payload,
                language
            );

            console.log('[ORS Booking] Booking created:', {
                status: response.StatusCode.Status,
                statusText: response.StatusCode.Text,
                bookingCode: response.BookingCode,
                voucherURL: response.VoucherURL,
                totalPrice: response.Price?.TotalPrice,
            });

            return response;
        } catch (error) {
            console.error('[ORS Booking] Booking creation failed:', error);
            throw error;
        }
    }

    /**
     * Create optional booking (hold)
     * Can be cancelled without fees until OptionDate
     * Automatically confirmed or cancelled after expiration
     */
    async createOption(
        tourOperator: string,
        hashCode: string,
        request: OrsBookingRequest,
        language: string = 'en'
    ): Promise<OrsBookingResponse> {
        console.log('[ORS Booking] Creating optional booking:', {
            tourOperator,
            hashCode,
            passengersCount: request.passengers.length,
        });

        const endpoint = ORS_ENDPOINTS.OPTION(tourOperator, hashCode);

        const payload: OrsAvailabilityRequest = {
            Passengers: request.passengers,
            Customer: request.customer,
            ExtraServices: request.extraServices,
        };

        try {
            const response = await orsAuthService.post<OrsBookingResponse>(
                endpoint,
                payload,
                language
            );

            console.log('[ORS Booking] Option created:', {
                status: response.StatusCode.Status,
                statusText: response.StatusCode.Text,
                bookingCode: response.BookingCode,
                optionDate: response.OptionDate,
                totalPrice: response.Price?.TotalPrice,
            });

            return response;
        } catch (error) {
            console.error('[ORS Booking] Option creation failed:', error);
            throw error;
        }
    }

    /**
     * Get booking information by booking code
     */
    async getBooking(
        bookingCode: string,
        language: string = 'en'
    ): Promise<OrsBookingResponse> {
        console.log('[ORS Booking] Fetching booking:', { bookingCode });

        const endpoint = `/booking/by-id/${bookingCode}`;

        try {
            const response = await orsAuthService.get<OrsBookingResponse>(
                endpoint,
                language
            );

            console.log('[ORS Booking] Booking fetched:', {
                status: response.StatusCode.Status,
                totalPrice: response.Price?.TotalPrice,
            });

            return response;
        } catch (error) {
            console.error('[ORS Booking] Failed to fetch booking:', error);
            throw error;
        }
    }

    /**
     * Cancel booking
     */
    async cancelBooking(
        tourOperator: string,
        hashCode: string,
        request?: OrsCancellationRequest,
        language: string = 'en'
    ): Promise<OrsBookingResponse> {
        console.log('[ORS Booking] Cancelling booking:', {
            tourOperator,
            hashCode,
            reason: request?.reason,
        });

        const endpoint = ORS_ENDPOINTS.CANCEL(tourOperator, hashCode);

        try {
            const response = await orsAuthService.post<OrsBookingResponse>(
                endpoint,
                request || {},
                language
            );

            console.log('[ORS Booking] Booking cancelled:', {
                status: response.StatusCode.Status,
                statusText: response.StatusCode.Text,
            });

            return response;
        } catch (error) {
            console.error('[ORS Booking] Cancellation failed:', error);
            throw error;
        }
    }

    /**
     * Get cancellation penalties before cancelling
     */
    async getCancellationPenalties(
        tourOperator: string,
        hashCode: string,
        language: string = 'en'
    ): Promise<any> {
        console.log('[ORS Booking] Getting cancellation penalties:', {
            tourOperator,
            hashCode,
        });

        // This would use a specific endpoint if available in the API
        // For now, we can get this info from the availability check
        const endpoint = ORS_ENDPOINTS.VERIFY(tourOperator, hashCode);

        try {
            const response = await orsAuthService.post<OrsAvailabilityResponse>(
                endpoint,
                { Passengers: [] }, // Minimal request just to get policies
                language
            );

            return {
                cancellationPolicies: response.CancellationPolicies,
                penaltyCost: response.ServiceDesc?.[0]?.['PenaltyCost'],
            };
        } catch (error) {
            console.error('[ORS Booking] Failed to get penalties:', error);
            throw error;
        }
    }

    /**
     * Helper: Create passenger object
     */
    createPassenger(data: {
        type: 'D' | 'H' | 'C' | 'I'; // Adult, Adult, Child, Infant
        firstName: string;
        lastName: string;
        birthDate?: string;
        age?: number;
    }): OrsPassenger {
        return {
            PassengerType: data.type,
            FirstName: data.firstName,
            LastName: data.lastName,
            BirthDate: data.birthDate,
            Age: data.age,
        };
    }

    /**
     * Helper: Create customer object
     */
    createCustomer(data: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        address?: string;
        city?: string;
        zipCode?: string;
        country?: string;
    }): OrsCustomer {
        return {
            FirstName: data.firstName,
            LastName: data.lastName,
            Email: data.email,
            Phone: data.phone,
            Address: data.address,
            City: data.city,
            ZIPCode: data.zipCode,
            Country: data.country,
        };
    }

    /**
     * Helper: Validate booking request
     */
    validateBookingRequest(request: OrsBookingRequest): {
        valid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        // Check passengers
        if (!request.passengers || request.passengers.length === 0) {
            errors.push('At least one passenger is required');
        }

        // Check customer
        if (!request.customer) {
            errors.push('Customer information is required');
        } else {
            if (!request.customer.FirstName) errors.push('Customer first name is required');
            if (!request.customer.LastName) errors.push('Customer last name is required');
            if (!request.customer.Email) errors.push('Customer email is required');
            if (!request.customer.Phone) errors.push('Customer phone is required');
        }

        // Validate passengers
        request.passengers?.forEach((passenger, index) => {
            if (!passenger.FirstName) {
                errors.push(`Passenger ${index + 1}: First name is required`);
            }
            if (!passenger.LastName) {
                errors.push(`Passenger ${index + 1}: Last name is required`);
            }
        });

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}

// Singleton instance
export const orsBookingService = new OrsBookingService();
