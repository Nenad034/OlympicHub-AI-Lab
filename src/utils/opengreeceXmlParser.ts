// Open Greece XML Parser
// Helper functions to parse OTA XML responses

import type {
    OpenGreeceHotel,
    OpenGreeceError,
    OpenGreeceResponse,
    StartPushProcessResponse,
    OpenGreeceHotelDetails,
    OpenGreeceAddress,
    OpenGreeceContact,
    OpenGreeceImage,
    OpenGreecePosition,
    OpenGreeceRoom,
    OpenGreeceRoomRate,
    OpenGreeceMealPlan,
    OpenGreecePrice,
    OpenGreeceCancellationPolicy,
    OpenGreeceHotelResult,
    OpenGreeceAvailabilityResponse,
    OpenGreeceBooking,
    OpenGreeceCancellationResponse,
} from '../types/opengreece.types';

import { MEAL_PLAN_CODES } from '../types/opengreece.types';

// ============================================================================
// XML Parser Helpers
// ============================================================================

function parseXML(xmlString: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(xmlString, 'text/xml');
}

function getElementText(element: Element | null, tagName: string): string | undefined {
    if (!element) return undefined;
    const el = element.getElementsByTagName(tagName)[0];
    return el?.textContent || undefined;
}

function getAttribute(element: Element, attrName: string): string | undefined {
    return element.getAttribute(attrName) || undefined;
}

// ============================================================================
// Error Parser
// ============================================================================

export function parseErrors(xmlDoc: Document): OpenGreeceError[] {
    const errors: OpenGreeceError[] = [];
    const errorElements = xmlDoc.getElementsByTagName('Error');

    for (let i = 0; i < errorElements.length; i++) {
        const errorEl = errorElements[i];
        errors.push({
            type: getAttribute(errorEl, 'Type') || 'Unknown',
            code: getAttribute(errorEl, 'Code'),
            message: getAttribute(errorEl, 'ShortText') || 'Unknown error',
        });
    }

    return errors;
}

// ============================================================================
// Success Check
// ============================================================================

export function isSuccessResponse(xmlDoc: Document): boolean {
    const successEl = xmlDoc.getElementsByTagName('Success')[0];
    const errorsEl = xmlDoc.getElementsByTagName('Errors')[0];
    return !!successEl && !errorsEl;
}

// ============================================================================
// StartPushProcessRS Parser
// ============================================================================

export function parseStartPushProcessRS(xmlString: string): OpenGreeceResponse<StartPushProcessResponse> {
    const xmlDoc = parseXML(xmlString);
    const timestamp = new Date().toISOString();

    // Check for errors
    const errors = parseErrors(xmlDoc);
    if (errors.length > 0) {
        return {
            success: false,
            errors,
            timestamp,
        };
    }

    // Parse hotels
    const hotels: OpenGreeceHotel[] = [];
    const hotelElements = xmlDoc.getElementsByTagName('Hotel');

    let newCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    for (let i = 0; i < hotelElements.length; i++) {
        const hotelEl = hotelElements[i];
        const status = getAttribute(hotelEl, 'Status') as 'NEW' | 'UPDATED' | 'DELETED' || 'NEW';

        const hotel: OpenGreeceHotel = {
            hotelCode: getAttribute(hotelEl, 'HotelCode') || '',
            hotelName: getAttribute(hotelEl, 'HotelName') || '',
            contractEndDate: getAttribute(hotelEl, 'ContractEndDate') || '',
            status,
        };

        hotels.push(hotel);

        // Count by status
        if (status === 'NEW') newCount++;
        else if (status === 'UPDATED') updatedCount++;
        else if (status === 'DELETED') deletedCount++;
    }

    return {
        success: true,
        data: {
            success: true,
            hotels,
            totalCount: hotels.length,
            newCount,
            updatedCount,
            deletedCount,
        },
        timestamp,
    };
}

// ============================================================================
// OTA_HotelSearchRS Parser
// ============================================================================

export function parseHotelSearchRS(xmlString: string): OpenGreeceResponse<OpenGreeceHotel[]> {
    const xmlDoc = parseXML(xmlString);
    const timestamp = new Date().toISOString();

    // Check for errors
    const errors = parseErrors(xmlDoc);
    if (errors.length > 0) {
        return {
            success: false,
            errors,
            timestamp,
        };
    }

    // Parse hotels
    const hotels: OpenGreeceHotel[] = [];
    const hotelElements = xmlDoc.getElementsByTagName('Hotel');

    for (let i = 0; i < hotelElements.length; i++) {
        const hotelEl = hotelElements[i];
        hotels.push({
            hotelCode: getAttribute(hotelEl, 'HotelCode') || '',
            hotelName: getAttribute(hotelEl, 'HotelName') || '',
            contractEndDate: getAttribute(hotelEl, 'ContractEndDate') || '',
            status: getAttribute(hotelEl, 'Status') as 'NEW' | 'UPDATED' | 'DELETED' || 'NEW',
        });
    }

    return {
        success: true,
        data: hotels,
        timestamp,
    };
}

// ============================================================================
// Generic Response Parser
// ============================================================================

export function parseGenericResponse<T>(
    xmlString: string,
    dataParser?: (xmlDoc: Document) => T
): OpenGreeceResponse<T> {
    const xmlDoc = parseXML(xmlString);
    const timestamp = new Date().toISOString();

    // Check for errors
    const errors = parseErrors(xmlDoc);
    if (errors.length > 0) {
        return {
            success: false,
            errors,
            timestamp,
        };
    }

    // Parse data if parser provided
    const data = dataParser ? dataParser(xmlDoc) : undefined;

    return {
        success: true,
        data,
        timestamp,
    };
}

// ============================================================================
// Debug Helper
// ============================================================================

export function debugXML(xmlString: string): void {
    console.group('🔍 XML Debug');
    console.log('Raw XML:', xmlString);

    const xmlDoc = parseXML(xmlString);
    console.log('Parsed Document:', xmlDoc);

    const errors = parseErrors(xmlDoc);
    if (errors.length > 0) {
        console.error('Errors found:', errors);
    } else {
        console.log('✅ No errors');
    }

    const success = isSuccessResponse(xmlDoc);
    console.log('Success:', success);

    console.groupEnd();
}

// ============================================================================
// OTA_HotelDescriptiveInfoRS Parser
// ============================================================================

export function parseHotelDescriptiveInfoRS(xmlString: string): OpenGreeceResponse<OpenGreeceHotelDetails> {
    const xmlDoc = parseXML(xmlString);
    const timestamp = new Date().toISOString();

    // Check for errors
    const errors = parseErrors(xmlDoc);
    if (errors.length > 0) {
        return { success: false, errors, timestamp };
    }

    // Parse hotel descriptive info
    const hotelInfo = xmlDoc.getElementsByTagName('HotelDescriptiveContent')[0];
    if (!hotelInfo) {
        return {
            success: false,
            errors: [{ type: 'PARSE', message: 'No HotelDescriptiveContent found' }],
            timestamp,
        };
    }

    // Basic info
    const hotelCode = getAttribute(hotelInfo, 'HotelCode') || '';
    const hotelName = getAttribute(hotelInfo, 'HotelName') || '';

    // Address
    const addressInfo = hotelInfo.getElementsByTagName('Address')[0];
    const address: OpenGreeceAddress | undefined = addressInfo ? {
        addressLine1: getElementText(addressInfo, 'AddressLine'),
        cityName: getElementText(addressInfo, 'CityName'),
        postalCode: getElementText(addressInfo, 'PostalCode'),
        countryCode: getAttribute(addressInfo, 'CountryCode'),
    } : undefined;

    // Contact
    const contactInfo = hotelInfo.getElementsByTagName('ContactInfo')[0];
    const contact: OpenGreeceContact | undefined = contactInfo ? {
        phone: getElementText(contactInfo, 'Phone') || getAttribute(contactInfo.getElementsByTagName('Phone')[0], 'PhoneNumber'),
        email: getElementText(contactInfo, 'Email'),
        website: getElementText(contactInfo, 'URL'),
    } : undefined;

    // Position
    const positionInfo = hotelInfo.getElementsByTagName('Position')[0];
    const position: OpenGreecePosition | undefined = positionInfo ? {
        latitude: parseFloat(getAttribute(positionInfo, 'Latitude') || '0'),
        longitude: parseFloat(getAttribute(positionInfo, 'Longitude') || '0'),
    } : undefined;

    // Images
    const images: OpenGreeceImage[] = [];
    const imageElements = hotelInfo.getElementsByTagName('ImageItem');
    for (let i = 0; i < imageElements.length; i++) {
        const imgEl = imageElements[i];
        const url = getElementText(imgEl, 'URL') || getAttribute(imgEl, 'URL');
        if (url) {
            images.push({
                url,
                category: getAttribute(imgEl, 'Category'),
                description: getElementText(imgEl, 'Description'),
            });
        }
    }

    // Amenities
    const amenities: string[] = [];
    const amenityElements = hotelInfo.getElementsByTagName('Amenity');
    for (let i = 0; i < amenityElements.length; i++) {
        const amenity = amenityElements[i].textContent || getAttribute(amenityElements[i], 'AmenityCode');
        if (amenity) amenities.push(amenity);
    }

    // Description
    const descEl = hotelInfo.getElementsByTagName('Description')[0];
    const description = descEl?.textContent || getElementText(hotelInfo, 'TextDescription');

    const hotelDetails: OpenGreeceHotelDetails = {
        hotelCode,
        hotelName,
        contractEndDate: '',
        status: 'NEW',
        description,
        address,
        contact,
        amenities,
        images,
        position,
    };

    return { success: true, data: hotelDetails, timestamp };
}

// ============================================================================
// OTA_HotelAvailRS Parser
// ============================================================================

export function parseHotelAvailRS(xmlString: string): OpenGreeceResponse<OpenGreeceAvailabilityResponse> {
    const xmlDoc = parseXML(xmlString);
    const timestamp = new Date().toISOString();

    // Check for errors
    const errors = parseErrors(xmlDoc);
    if (errors.length > 0) {
        return { success: false, errors, timestamp };
    }

    // Parse room stays
    const roomStays = xmlDoc.getElementsByTagName('RoomStay');
    const hotelResultsMap = new Map<string, OpenGreeceHotelResult>();

    let checkIn = '';
    let checkOut = '';

    for (let i = 0; i < roomStays.length; i++) {
        const roomStay = roomStays[i];

        // Get date range
        const timeSpan = roomStay.getElementsByTagName('TimeSpan')[0];
        if (timeSpan && !checkIn) {
            checkIn = getAttribute(timeSpan, 'Start') || '';
            checkOut = getAttribute(timeSpan, 'End') || '';
        }

        // Get hotel info
        const basicPropertyInfo = roomStay.getElementsByTagName('BasicPropertyInfo')[0];
        const hotelCode = basicPropertyInfo ? getAttribute(basicPropertyInfo, 'HotelCode') || '' : '';
        const hotelName = basicPropertyInfo ? getAttribute(basicPropertyInfo, 'HotelName') || '' : '';

        // Get or create hotel result
        if (!hotelResultsMap.has(hotelCode)) {
            hotelResultsMap.set(hotelCode, {
                hotelCode,
                hotelName,
                rooms: [],
                available: true,
            });
        }
        const hotelResult = hotelResultsMap.get(hotelCode)!;

        // Parse room types
        const roomTypes = roomStay.getElementsByTagName('RoomType');
        const ratePlans = roomStay.getElementsByTagName('RatePlan');
        const roomRates = roomStay.getElementsByTagName('RoomRate');

        for (let j = 0; j < roomTypes.length; j++) {
            const roomType = roomTypes[j];
            const roomTypeCode = getAttribute(roomType, 'RoomTypeCode') || '';
            const roomName = getAttribute(roomType, 'RoomType') || getElementText(roomType, 'RoomDescription') || '';

            // Find matching rate
            const rates: OpenGreeceRoomRate[] = [];
            for (let k = 0; k < roomRates.length; k++) {
                const roomRate = roomRates[k];
                if (getAttribute(roomRate, 'RoomTypeCode') !== roomTypeCode) continue;

                const ratePlanCode = getAttribute(roomRate, 'RatePlanCode') || '';

                // Find rate plan info
                let ratePlanName = '';
                let mealPlanCode = 'RO';
                for (let l = 0; l < ratePlans.length; l++) {
                    if (getAttribute(ratePlans[l], 'RatePlanCode') === ratePlanCode) {
                        ratePlanName = getAttribute(ratePlans[l], 'RatePlanName') || '';
                        mealPlanCode = getAttribute(ratePlans[l], 'MealPlanCode') || 'RO';
                        break;
                    }
                }

                // Parse rates
                const ratesEl = roomRate.getElementsByTagName('Rates')[0];
                const baseEl = ratesEl?.getElementsByTagName('Base')[0];
                const amount = parseFloat(getAttribute(baseEl, 'AmountAfterTax') || getAttribute(baseEl, 'Amount') || '0');
                const currency = getAttribute(baseEl, 'CurrencyCode') || 'EUR';

                const mealPlan: OpenGreeceMealPlan = {
                    code: mealPlanCode,
                    name: MEAL_PLAN_CODES[mealPlanCode] || mealPlanCode,
                };

                const price: OpenGreecePrice = {
                    amount,
                    currency,
                    perNight: false,
                    totalAmount: amount,
                };

                rates.push({
                    ratePlanCode,
                    ratePlanName,
                    mealPlan,
                    price,
                });
            }

            // Add room to hotel result
            const room: OpenGreeceRoom = {
                roomCode: roomTypeCode,
                roomTypeCode,
                roomName,
                maxOccupancy: parseInt(getAttribute(roomType, 'MaxOccupancy') || '2'),
                rates,
                available: true,
            };

            // Check if room already exists
            const existingRoom = hotelResult.rooms.find(r => r.roomTypeCode === roomTypeCode);
            if (existingRoom) {
                existingRoom.rates.push(...rates);
            } else {
                hotelResult.rooms.push(room);
            }
        }

        // Calculate lowest price for hotel
        let lowestPrice: OpenGreecePrice | undefined;
        for (const room of hotelResult.rooms) {
            for (const rate of room.rates) {
                if (!lowestPrice || rate.price.amount < lowestPrice.amount) {
                    lowestPrice = rate.price;
                }
            }
        }
        hotelResult.lowestPrice = lowestPrice;
    }

    // Calculate nights
    const nights = checkIn && checkOut
        ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const hotelResults = Array.from(hotelResultsMap.values());

    const availabilityResponse: OpenGreeceAvailabilityResponse = {
        checkIn,
        checkOut,
        nights,
        hotelResults,
        totalHotelsFound: hotelResults.length,
    };

    return { success: true, data: availabilityResponse, timestamp };
}

// ============================================================================
// OTA_HotelResRS Parser (Booking Confirmation)
// ============================================================================

export function parseHotelResRS(xmlString: string): OpenGreeceResponse<OpenGreeceBooking> {
    const xmlDoc = parseXML(xmlString);
    const timestamp = new Date().toISOString();

    // Check for errors
    const errors = parseErrors(xmlDoc);
    if (errors.length > 0) {
        return { success: false, errors, timestamp };
    }

    // Parse reservation
    const hotelRes = xmlDoc.getElementsByTagName('HotelReservation')[0];
    if (!hotelRes) {
        return {
            success: false,
            errors: [{ type: 'PARSE', message: 'No HotelReservation found in response' }],
            timestamp,
        };
    }

    // Get reservation IDs
    const resIdList = hotelRes.getElementsByTagName('HotelReservationID');
    let bookingId = '';
    let confirmationNumber = '';

    for (let i = 0; i < resIdList.length; i++) {
        const resId = resIdList[i];
        const type = getAttribute(resId, 'ResID_Type');
        const value = getAttribute(resId, 'ResID_Value') || '';

        if (type === '14' || type === 'Booking') {
            bookingId = value;
        } else if (type === '10' || type === 'Confirmation') {
            confirmationNumber = value;
        }

        if (!bookingId) bookingId = value;
        if (!confirmationNumber) confirmationNumber = value;
    }

    // Get status
    const resStatus = getAttribute(hotelRes, 'ResStatus') || 'Pending';
    let status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'ON_REQUEST' = 'PENDING';
    if (resStatus.toLowerCase().includes('confirm')) status = 'CONFIRMED';
    else if (resStatus.toLowerCase().includes('cancel')) status = 'CANCELLED';
    else if (resStatus.toLowerCase().includes('request')) status = 'ON_REQUEST';

    // Get room stay details
    const roomStay = hotelRes.getElementsByTagName('RoomStay')[0];
    const basicPropertyInfo = roomStay?.getElementsByTagName('BasicPropertyInfo')[0];
    const timeSpan = roomStay?.getElementsByTagName('TimeSpan')[0];

    const hotelCode = getAttribute(basicPropertyInfo, 'HotelCode') || '';
    const hotelName = getAttribute(basicPropertyInfo, 'HotelName') || '';
    const checkIn = getAttribute(timeSpan, 'Start') || '';
    const checkOut = getAttribute(timeSpan, 'End') || '';

    // Calculate nights
    const nights = checkIn && checkOut
        ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    // Get total
    const total = roomStay?.getElementsByTagName('Total')[0];
    const totalAmount = parseFloat(getAttribute(total, 'AmountAfterTax') || getAttribute(total, 'Amount') || '0');
    const currency = getAttribute(total, 'CurrencyCode') || 'EUR';

    const booking: OpenGreeceBooking = {
        bookingId,
        confirmationNumber,
        status,
        hotelCode,
        hotelName,
        checkIn,
        checkOut,
        nights,
        rooms: 1, // Default, should be parsed from request
        totalPrice: {
            amount: totalAmount,
            currency,
            perNight: false,
            totalAmount,
        },
        confirmationDate: timestamp,
    };

    return { success: true, data: booking, timestamp };
}

// ============================================================================
// OTA_CancelRS Parser
// ============================================================================

export function parseCancelRS(xmlString: string): OpenGreeceResponse<OpenGreeceCancellationResponse> {
    const xmlDoc = parseXML(xmlString);
    const timestamp = new Date().toISOString();

    // Check for errors
    const errors = parseErrors(xmlDoc);
    if (errors.length > 0) {
        return { success: false, errors, timestamp };
    }

    // Parse cancellation response
    const cancelRS = xmlDoc.getElementsByTagName('OTA_CancelRS')[0] || xmlDoc.documentElement;

    // Get status
    const statusEl = cancelRS.getElementsByTagName('Status')[0];
    const statusText = getAttribute(statusEl, 'Status') || 'Cancelled';

    // Get unique ID
    const uniqueId = cancelRS.getElementsByTagName('UniqueID')[0];
    const bookingId = getAttribute(uniqueId, 'ID') || '';

    // Get cancellation ID
    const cancelInfoRS = cancelRS.getElementsByTagName('CancelInfoRS')[0];
    const cancellationNumber = getAttribute(cancelInfoRS?.getElementsByTagName('UniqueID')[0], 'ID') || '';

    // Get cancellation fee if any
    const cancelRules = cancelRS.getElementsByTagName('CancelRule');
    let cancellationFee: OpenGreecePrice | undefined;

    for (let i = 0; i < cancelRules.length; i++) {
        const rule = cancelRules[i];
        const amount = parseFloat(getAttribute(rule, 'Amount') || '0');
        if (amount > 0) {
            cancellationFee = {
                amount,
                currency: getAttribute(rule, 'CurrencyCode') || 'EUR',
                perNight: false,
            };
            break;
        }
    }

    let status: 'CANCELLED' | 'PENDING_CANCELLATION' | 'CANCELLATION_FAILED' = 'CANCELLED';
    if (statusText.toLowerCase().includes('pending')) status = 'PENDING_CANCELLATION';
    else if (statusText.toLowerCase().includes('fail')) status = 'CANCELLATION_FAILED';

    const cancellationResponse: OpenGreeceCancellationResponse = {
        success: true,
        bookingId,
        cancellationNumber,
        cancellationDate: timestamp,
        cancellationFee,
        status,
    };

    return { success: true, data: cancellationResponse, timestamp };
}

