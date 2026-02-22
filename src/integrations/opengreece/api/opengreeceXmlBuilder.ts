// Open Greece XML Builder
// Helper functions to build OTA XML requests

import { OPENGREECE_CONFIG, getOTATimestamp, generateEchoToken } from '../config/opengreeceConfig';
import type { OTARequestOptions, POSAuthentication } from '../types/opengreece.types';

// ============================================================================
// POS (Point of Sale) Authentication Builder
// ============================================================================

export function buildPOSAuthentication(auth?: POSAuthentication): string {
  const username = auth?.username || OPENGREECE_CONFIG.USERNAME;
  const password = auth?.password || OPENGREECE_CONFIG.PASSWORD;
  const requestorType = auth?.requestorType || '1';

  return `
  <POS>
    <Source>
      <RequestorID Type="${requestorType}" ID="${username}" MessagePassword="${password}"/>
    </Source>
  </POS>`;
}

// ============================================================================
// Common OTA Attributes Builder
// ============================================================================

export function buildOTAAttributes(options?: OTARequestOptions): string {
  const echoToken = options?.echoToken || generateEchoToken();
  const timestamp = options?.timestamp || getOTATimestamp();
  const version = options?.version || OPENGREECE_CONFIG.OTA_VERSION;

  return `xmlns="${OPENGREECE_CONFIG.OTA_NAMESPACE}" 
          EchoToken="${echoToken}" 
          TimeStamp="${timestamp}" 
          Version="${version}"`;
}

// ============================================================================
// StartPushProcessRQ Builder
// ============================================================================

export function buildStartPushProcessRQ(isFullPush: boolean, options?: OTARequestOptions): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<StartPushProcessRQ ${buildOTAAttributes(options)} 
                    IsFullPush="${isFullPush}">
${buildPOSAuthentication()}
</StartPushProcessRQ>`;
}

// ============================================================================
// OTA_HotelSearchRQ Builder
// ============================================================================

export function buildHotelSearchRQ(hotelCode?: string, options?: OTARequestOptions): string {
  const code = hotelCode || '*'; // * = all hotels

  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelSearchRQ ${buildOTAAttributes(options)}>
${buildPOSAuthentication()}
  <Criteria>
    <Criterion>
      <HotelRef HotelCode="${code}"/>
    </Criterion>
  </Criteria>
</OTA_HotelSearchRQ>`;
}

// ============================================================================
// OTA_HotelDescriptiveInfoRQ Builder
// ============================================================================

export function buildHotelDescriptiveInfoRQ(hotelCode: string, options?: OTARequestOptions): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelDescriptiveInfoRQ ${buildOTAAttributes(options)}>
${buildPOSAuthentication()}
  <HotelDescriptiveInfos>
    <HotelDescriptiveInfo HotelCode="${hotelCode}"/>
  </HotelDescriptiveInfos>
</OTA_HotelDescriptiveInfoRQ>`;
}

// ============================================================================
// OTA_HotelAvailRQ Builder
// ============================================================================

export interface HotelAvailParams {
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  adults: number;
  children?: number;
  childrenAges?: number[];
  rooms?: number;
  hotelCode?: string;
}

export function buildHotelAvailRQ(params: HotelAvailParams, options?: OTARequestOptions): string {
  const childrenCount = params.children || 0;

  // HotelSearchCriteria with HotelRef - must be inside Criterion element per OTA schema
  const hotelSearchCriteria = params.hotelCode
    ? `<HotelSearchCriteria>
        <Criterion>
          <HotelRef HotelCode="${params.hotelCode}"/>
        </Criterion>
      </HotelSearchCriteria>`
    : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelAvailRQ ${buildOTAAttributes(options)}>
${buildPOSAuthentication()}
  <AvailRequestSegments>
    <AvailRequestSegment>
      <StayDateRange Start="${params.checkIn}" End="${params.checkOut}"/>
      <RoomStayCandidates>
        <RoomStayCandidate>
          <GuestCounts>
            <GuestCount AgeQualifyingCode="10" Count="${params.adults}"/>
            ${childrenCount > 0 ? `<GuestCount AgeQualifyingCode="8" Count="${childrenCount}"/>` : ''}
          </GuestCounts>
        </RoomStayCandidate>
      </RoomStayCandidates>
      ${hotelSearchCriteria}
    </AvailRequestSegment>
  </AvailRequestSegments>
</OTA_HotelAvailRQ>`;
}

// ============================================================================
// OTA_HotelResRQ Builder (Booking)
// ============================================================================

export interface HotelBookingParams {
  hotelCode: string;
  roomCode: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guestFirstName: string;
  guestLastName: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
}

export function buildHotelResRQ(params: HotelBookingParams, options?: OTARequestOptions): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_HotelResRQ ${buildOTAAttributes(options)}>
${buildPOSAuthentication()}
  <HotelReservations>
    <HotelReservation>
      <RoomStays>
        <RoomStay>
          <RoomTypes>
            <RoomType RoomTypeCode="${params.roomCode}"/>
          </RoomTypes>
          <RatePlans>
            <RatePlan RatePlanCode="DEFAULT"/>
          </RatePlans>
          <GuestCounts>
            <GuestCount AgeQualifyingCode="10" Count="1"/>
          </GuestCounts>
          <TimeSpan Start="${params.checkIn}" End="${params.checkOut}"/>
          <BasicPropertyInfo HotelCode="${params.hotelCode}"/>
          ${params.specialRequests ? `<SpecialRequests><SpecialRequest><Text>${params.specialRequests}</Text></SpecialRequest></SpecialRequests>` : ''}
        </RoomStay>
      </RoomStays>
      <ResGuests>
        <ResGuest>
          <Profiles>
            <ProfileInfo>
              <Profile>
                <Customer>
                  <PersonName>
                    <GivenName>${params.guestFirstName}</GivenName>
                    <Surname>${params.guestLastName}</Surname>
                  </PersonName>
                  ${params.guestEmail ? `<Email>${params.guestEmail}</Email>` : ''}
                  ${params.guestPhone ? `<Telephone PhoneNumber="${params.guestPhone}"/>` : ''}
                </Customer>
              </Profile>
            </ProfileInfo>
          </Profiles>
        </ResGuest>
      </ResGuests>
    </HotelReservation>
  </HotelReservations>
</OTA_HotelResRQ>`;
}

// ============================================================================
// OTA_CancelRQ Builder
// ============================================================================

export function buildCancelRQ(bookingId: string, options?: OTARequestOptions): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<OTA_CancelRQ ${buildOTAAttributes(options)}>
${buildPOSAuthentication()}
  <UniqueID Type="14" ID="${bookingId}"/>
</OTA_CancelRQ>`;
}
