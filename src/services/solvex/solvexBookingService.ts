import { makeSoapRequest, formatSolvexDate } from '../../utils/solvexSoapClient';
import { connect } from './solvexAuthService';
import { SOLVEX_SOAP_METHODS } from './solvexConstants';
import type {
    SolvexApiResponse,
    SolvexTourist,
    SolvexService,
    SolvexReservation
} from '../../types/solvex.types';

/**
 * Creates a real reservation in the Solvex system using CreateReservation
 */
export async function createReservation(params: {
    services: SolvexService[];
    tourists: SolvexTourist[];
    countryId: number;
    cityId: number;
}): Promise<SolvexApiResponse<SolvexReservation>> {
    try {
        const auth = await connect();
        if (!auth.success || !auth.data) {
            return { success: false, error: auth.error };
        }

        // Map tourists to service bindings (TouristServices)
        // Structure: <TouristServices><TouristService>...</TouristService><TouristService>...</TouristService></TouristServices>
        const touristServicesList = params.tourists.flatMap((t, tIdx) =>
            params.services.map((s, sIdx) => ({
                TouristRoomNumber: 1,
                TouristID: -(tIdx + 1), // -1, -2, -3...
                ServiceID: -(sIdx + 1)  // -1, -2...
            }))
        );

        // Map services
        // Structure: <Services><Service>...</Service></Services>
        const servicesList = params.services.map((s, idx) => ({
            '@_xsi:type': 'HotelService',
            ExternalID: 0,
            NMen: s.nMen,
            StartDate: formatSolvexDate(s.startDate) + 'T00:00:00',
            Duration: s.duration,
            ID: -(idx + 1),
            Hotel: { ID: s.hotelId },
            Room: {
                RoomTypeID: s.room?.roomTypeId,
                RoomCategoryID: s.room?.roomCategoryId,
                RoomAccomodationID: s.room?.roomAccommodationId
            },
            PansionID: s.pansionId
        }));

        // Map tourists data
        // Structure: <Tourists><Tourist>...</Tourist></Tourists>
        const touristsList = params.tourists.map((t, idx) => ({
            '@_Sex': t.sex === 'Female' ? 'Female' : 'Male',
            '@_BirthDate': formatSolvexDate(t.birthDate) + 'T00:00:00',
            '@_FirstNameLat': t.firstNameLat,
            '@_SurNameLat': t.surNameLat,
            '@_AgeType': t.ageType || 'Adult',
            '@_IsMain': t.isMain ? 'true' : 'false',
            '@_ExternalID': 0,
            '@_ID': -(idx + 1),
            '@_Phone': t.phone || '',
            '@_Email': t.email || ''
        }));

        const soapParams = {
            guid: auth.data,
            reserv: {
                '@_HasInvoices': 'false',
                Rate: { ID: 1 },
                TouristServices: { TouristService: touristServicesList },
                Services: { Service: servicesList },
                CountryID: params.countryId,
                CityID: params.cityId,
                Tourists: { Tourist: touristsList },
                TourOperatorID: 0,
                TourOperatorCode: 0,
                ID: 0,
                ExternalID: 0
            }
        };

        const result = await makeSoapRequest<any>(SOLVEX_SOAP_METHODS.CREATE_RESERVATION, soapParams);

        // Master-Interlook result mapping
        if (result && (result.ExternalID || result.ID)) {
            return {
                success: true,
                data: {
                    externalId: result.ExternalID || result.ID,
                    name: result.Name || result.Number || '',
                    status: 'WaitingConfirmation',
                    brutto: parseFloat(result.Brutto || '0'),
                    rate: { id: 0, name: 'EUR', code: 'EUR' },
                    services: [],
                    tourists: params.tourists,
                    startDate: params.services[0].startDate,
                    endDate: '',
                    creationDate: new Date().toISOString()
                }
            };
        }

        return { success: false, error: result.Message || 'Neuspešan upis rezervacije - proverite podatke putnika.' };
    } catch (error) {
        console.error('[Solvex Booking] CreateReservation failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Rezervacija nije uspela' };
    }
}

/**
 * Checks quota for a hotel service
 */
export async function checkQuota(params: {
    hotelId: number;
    startDate: string;
    duration: number;
    roomTypeId: number;
    roomCategoryId: number;
    roomAccommodationId: number;
}): Promise<SolvexApiResponse<boolean>> {
    try {
        const auth = await connect();
        if (!auth.success || !auth.data) return { success: false, error: auth.error };

        const soapParams = {
            guid: auth.data,
            hotelKey: params.hotelId,
            dateFrom: formatSolvexDate(params.startDate) + 'T00:00:00',
            dateTo: formatSolvexDate(new Date(new Date(params.startDate).getTime() + params.duration * 86400000)) + 'T00:00:00',
            rtKey: params.roomTypeId,
            rcKey: params.roomCategoryId,
            acKey: params.roomAccommodationId
        };

        const result = await makeSoapRequest<any>(SOLVEX_SOAP_METHODS.CHECK_QUOTA, soapParams);
        return { success: true, data: result === true || result === 'true' || result?.Result === true };
    } catch (error) {
        console.error('[Solvex Quota] CheckQuota failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Quota check failed' };
    }
}

/**
 * Retrieves reservation details from Solvex
 */
export async function getReservation(bookingId: string): Promise<SolvexApiResponse<any>> {
    try {
        const auth = await connect();
        if (!auth.success || !auth.data) return { success: false, error: auth.error };

        // Try searching by ID (Solvex ID)
        const soapParams = {
            guid: auth.data,
            reserv: {
                ID: bookingId
            }
        };

        const result = await makeSoapRequest<any>(SOLVEX_SOAP_METHODS.GET_RESERVATION, soapParams);

        // If result is found
        if (result && (result.ID || result.ExternalID)) {
            return {
                success: true,
                data: result
            };
        }

        return { success: false, error: 'Rezervacija nije pronađena u Solvex sistemu.' };
    } catch (error) {
        console.error('[Solvex] GetReservation failed:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Dohvatanje rezervacije nije uspelo' };
    }
}

export default {
    createReservation,
    checkQuota,
    getReservation
};
