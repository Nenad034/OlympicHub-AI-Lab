/**
 * Travelsoft NDC - XML Builder & Parser
 * 
 * Gradi NDC 19.2 XML request poruke i parsira XML response poruke.
 * Koristi fast-xml-parser (već instaliran u projektu).
 */

import { XMLParser } from 'fast-xml-parser';
import type {
    NDCAirShoppingRequest,
    NDCOffer,
    NDCItinerary,
    NDCSegment,
    NDCOfferPriceRequest,
    NDCOrderCreateRequest,
    NDCPassengerDetail,
    NDCSeatAvailabilityRequest,
    NDCServiceListRequest,
    NDCError
} from '../types/travelsoftTypes';

// ============================================================================
// XML PARSER KONFIGURACIJA
// ============================================================================

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
    allowBooleanAttributes: true
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const NS_LOGIN = 'http://www.travelsoft.fr/orchestra/ndc/login';
const NS_SHOPPING = 'http://www.iata.org/IATA/2015/00/2019.2/IATA_AirShoppingRQ';
const NS_OFFER_PRICE = 'http://www.iata.org/IATA/2015/00/2019.2/IATA_OfferPriceRQ';
const NS_ORDER_CREATE = 'http://www.iata.org/IATA/2015/00/2019.2/IATA_OrderCreateRQ';
const NS_SERVICE_LIST = 'http://www.iata.org/IATA/2015/00/2019.2/IATA_ServiceListRQ';
const NS_SEAT_AVAIL = 'http://www.iata.org/IATA/2015/00/2019.2/IATA_SeatAvailabilityRQ';
const NS_ORDER_RETRIEVE = 'http://www.iata.org/IATA/2015/00/2019.2/IATA_OrderRetrieveRQ';
const NS_ORDER_CANCEL = 'http://www.iata.org/IATA/2015/00/2019.2/IATA_OrderCancelRQ';
const NS_ORDER_RESHOP = 'http://www.iata.org/IATA/2015/00/2019.2/IATA_OrderReshopRQ';
const NS_ORDER_CHANGE = 'http://www.iata.org/IATA/2015/00/2019.2/IATA_OrderChangeRQ';

function correlationId(): string {
    return `ctt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function timestamp(): string {
    return new Date().toISOString();
}

// Mapping cabin class
function mapCabinClass(cabin?: string): string {
    const map: Record<string, string> = {
        'economy': 'ECONOMY',
        'premium_economy': 'PREMIUM_ECONOMY',
        'business': 'BUSINESS',
        'first': 'FIRST'
    };
    return map[cabin?.toLowerCase() || ''] || 'ECONOMY';
}

// ============================================================================
// LOGIN
// ============================================================================

/**
 * Gradi XML za Login request
 */
export function buildLoginXml(username: string, password: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<LoginRQ xmlns="${NS_LOGIN}">
  <PayloadAttributes>
    <CorrelationID>${correlationId()}</CorrelationID>
    <Timestamp>${timestamp()}</Timestamp>
  </PayloadAttributes>
  <Login>
    <Username>${escapeXml(username)}</Username>
    <Password>${escapeXml(password)}</Password>
  </Login>
</LoginRQ>`;
}

/**
 * Parsira Login response XML
 */
export function parseLoginResponse(xml: string): { token: string; expiresAt?: string } {
    checkForErrors(xml, 'LoginRS');
    const parsed = xmlParser.parse(xml);

    // Pokušaj različite putanje gde može biti token
    const rs = parsed?.LoginRS || parsed?.['ns5:LoginRS'] || parsed;
    const token =
        rs?.AuthToken ||
        rs?.Response?.AuthToken ||
        rs?.Login?.AuthToken ||
        extractTag(xml, 'AuthToken');

    const expiresAt =
        rs?.ExpirationDateTime ||
        rs?.Response?.ExpirationDateTime ||
        extractTag(xml, 'ExpirationDateTime');

    if (!token) {
        console.error('[Travelsoft] Login response:', xml.substring(0, 500));
        throw new Error('[Travelsoft] Login response missing AuthToken');
    }

    return { token, expiresAt: expiresAt || undefined };
}

// ============================================================================
// AIR SHOPPING
// ============================================================================

/**
 * Gradi XML za AirShopping request
 */
export function buildAirShoppingXml(params: NDCAirShoppingRequest): string {
    const paxList = params.passengers.map((p, i) =>
        `<Pax>
      <PaxID>PAX${i + 1}</PaxID>
      <PTC>${p.Code}</PTC>
      ${p.Age !== undefined ? `<Age><Value>${p.Age}</Value></Age>` : ''}
    </Pax>`
    ).join('\n');

    const paxRefList = params.passengers.map((p, i) =>
        `<PaxRefID>PAX${i + 1}</PaxRefID>`
    ).join('\n');

    const returnLeg = params.returnDate ? `
    <OriginDest>
      <Dest>
        <IATALocationCode>${escapeXml(params.origin)}</IATALocationCode>
      </Dest>
      <OriginDestID>OD2</OriginDestID>
      <Origin>
        <IATALocationCode>${escapeXml(params.destination)}</IATALocationCode>
      </Origin>
      <DepartureDate>${params.returnDate}</DepartureDate>
    </OriginDest>` : '';

    const cabinPref = params.cabinPreference ? `
    <CabinType>
      <CabinTypeCode>${mapCabinClass(params.cabinPreference)}</CabinTypeCode>
    </CabinType>` : '';

    const directOnly = params.directOnly ? `
    <FlightPreferences>
      <MaxConnectionQty>0</MaxConnectionQty>
    </FlightPreferences>` : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<IATA_AirShoppingRQ xmlns="${NS_SHOPPING}">
  <PayloadAttributes>
    <CorrelationID>${correlationId()}</CorrelationID>
    <Timestamp>${timestamp()}</Timestamp>
    <VersionNumber>19.2</VersionNumber>
  </PayloadAttributes>
  <Request>
    <FlightCriteria>
      <OriginDest>
        <Dest>
          <IATALocationCode>${escapeXml(params.destination)}</IATALocationCode>
        </Dest>
        <OriginDestID>OD1</OriginDestID>
        <Origin>
          <IATALocationCode>${escapeXml(params.origin)}</IATALocationCode>
        </Origin>
        <DepartureDate>${params.departureDate}</DepartureDate>
      </OriginDest>
      ${returnLeg}
    </FlightCriteria>
    ${cabinPref}
    ${directOnly}
    <PaxList>
      ${paxList}
    </PaxList>
    <ShoppingCriteria>
      <CurrencyCode>${params.currency || 'EUR'}</CurrencyCode>
      ${paxRefList}
    </ShoppingCriteria>
  </Request>
</IATA_AirShoppingRQ>`;
}

/**
 * Parsira AirShopping response XML i vraća listu NDCOffer
 */
export function parseAirShoppingResponse(xml: string): { offers: NDCOffer[]; shoppingResponseId: string } {
    checkForErrors(xml, 'IATA_AirShoppingRS');
    const parsed = xmlParser.parse(xml);

    const rs =
        parsed?.IATA_AirShoppingRS ||
        parsed?.['ns5:IATA_AirShoppingRS'] ||
        {};

    const shoppingResponseId =
        rs?.ShoppingResponse?.ShoppingResponseID ||
        rs?.Response?.ShoppingResponseID ||
        extractTag(xml, 'ShoppingResponseID') ||
        `sr-${Date.now()}`;

    // Izvlačimo offere iz raznih mogućih putanja
    const rawOffers = extractAsArray(
        rs?.Response?.OffersGroup?.AirlineOffers?.AirlineOffer ||
        rs?.OffersGroup?.AirlineOffers?.AirlineOffer ||
        rs?.Response?.Offer ||
        []
    );

    const offers: NDCOffer[] = rawOffers.map((raw: any) => parseNDCOffer(raw)).filter((o): o is NDCOffer => o !== null);

    return { offers, shoppingResponseId };
}

// ============================================================================
// OFFER PRICE
// ============================================================================

export function buildOfferPriceXml(params: NDCOfferPriceRequest): string {
    const offerRefs = params.offerIds.map(id =>
        `<OfferRefID>${escapeXml(id)}</OfferRefID>`
    ).join('\n');

    const paxRefs = params.passengers.map((p, i) =>
        `<PaxRefID>PAX${i + 1}</PaxRefID>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<IATA_OfferPriceRQ xmlns="${NS_OFFER_PRICE}">
  <PayloadAttributes>
    <CorrelationID>${correlationId()}</CorrelationID>
    <Timestamp>${timestamp()}</Timestamp>
    <VersionNumber>19.2</VersionNumber>
  </PayloadAttributes>
  <Request>
    <ShoppingResponseRefID>${escapeXml(params.shoppingResponseId)}</ShoppingResponseRefID>
    <SelectedOffer>
      ${offerRefs}
      ${paxRefs}
    </SelectedOffer>
  </Request>
</IATA_OfferPriceRQ>`;
}

export function parseOfferPriceResponse(xml: string): NDCOffer[] {
    checkForErrors(xml, 'IATA_OfferPriceRS');
    const parsed = xmlParser.parse(xml);
    const rs = parsed?.IATA_OfferPriceRS || parsed?.['ns5:IATA_OfferPriceRS'] || {};
    const rawOffers = extractAsArray(rs?.Response?.PricedOffer || rs?.PricedOffer || []);
    return rawOffers.map((raw: any) => parseNDCOffer(raw)).filter((o): o is NDCOffer => o !== null);
}

// ============================================================================
// SERVICE LIST
// ============================================================================

export function buildServiceListXml(params: NDCServiceListRequest): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<IATA_ServiceListRQ xmlns="${NS_SERVICE_LIST}">
  <PayloadAttributes>
    <CorrelationID>${correlationId()}</CorrelationID>
    <Timestamp>${timestamp()}</Timestamp>
    <VersionNumber>19.2</VersionNumber>
  </PayloadAttributes>
  <Request>
    <ShoppingResponseRefID>${escapeXml(params.shoppingResponseId)}</ShoppingResponseRefID>
    <OfferRefID>${escapeXml(params.offerId)}</OfferRefID>
  </Request>
</IATA_ServiceListRQ>`;
}

// ============================================================================
// SEAT AVAILABILITY
// ============================================================================

export function buildSeatAvailabilityXml(params: NDCSeatAvailabilityRequest): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<IATA_SeatAvailabilityRQ xmlns="${NS_SEAT_AVAIL}">
  <PayloadAttributes>
    <CorrelationID>${correlationId()}</CorrelationID>
    <Timestamp>${timestamp()}</Timestamp>
    <VersionNumber>19.2</VersionNumber>
  </PayloadAttributes>
  <Request>
    <ShoppingResponseRefID>${escapeXml(params.shoppingResponseId)}</ShoppingResponseRefID>
    <OfferRefID>${escapeXml(params.offerId)}</OfferRefID>
  </Request>
</IATA_SeatAvailabilityRQ>`;
}

// ============================================================================
// ORDER CREATE
// ============================================================================

export function buildOrderCreateXml(params: NDCOrderCreateRequest): string {
    const passengers = params.passengers.map(p => buildPassengerXml(p)).join('\n');

    const seatSelections = (params.selectedSeats || []).map(s =>
        `<SeatSelection>
      <PaxRefID>${escapeXml(s.PassengerID)}</PaxRefID>
      <SegmentRefID>${escapeXml(s.SegmentID)}</SegmentRefID>
      <SeatID>${escapeXml(s.SeatNumber)}</SeatID>
    </SeatSelection>`
    ).join('\n');

    const serviceSelections = (params.selectedServices || []).map(s =>
        `<ServiceSelection>
      <PaxRefID>${escapeXml(s.PassengerID)}</PaxRefID>
      <ServiceRefID>${escapeXml(s.ServiceID)}</ServiceRefID>
      <Qty>${s.Quantity}</Qty>
      ${s.SegmentID ? `<SegmentRefID>${escapeXml(s.SegmentID)}</SegmentRefID>` : ''}
    </ServiceSelection>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<IATA_OrderCreateRQ xmlns="${NS_ORDER_CREATE}">
  <PayloadAttributes>
    <CorrelationID>${correlationId()}</CorrelationID>
    <Timestamp>${timestamp()}</Timestamp>
    <VersionNumber>19.2</VersionNumber>
  </PayloadAttributes>
  <Request>
    <CreateOrder>
      <ShoppingResponseRefID>${escapeXml(params.shoppingResponseId)}</ShoppingResponseRefID>
      <OfferRefID>${escapeXml(params.offerId)}</OfferRefID>
      <PaxList>
        ${passengers}
      </PaxList>
      ${seatSelections ? `<SeatList>${seatSelections}</SeatList>` : ''}
      ${serviceSelections ? `<ServiceList>${serviceSelections}</ServiceList>` : ''}
      <ContactInfo>
        <EmailAddress>${escapeXml(params.contactEmail)}</EmailAddress>
        <Phone>${escapeXml(params.contactPhone)}</Phone>
      </ContactInfo>
      ${params.agentReference ? `<AgentReference>${escapeXml(params.agentReference)}</AgentReference>` : ''}
    </CreateOrder>
  </Request>
</IATA_OrderCreateRQ>`;
}

function buildPassengerXml(p: NDCPassengerDetail): string {
    const doc = p.Document ? `
    <IdentityDoc>
      <IdentityDocID>${escapeXml(p.Document.Number)}</IdentityDocID>
      <IdentityDocTypeCode>${p.Document.Type}</IdentityDocTypeCode>
      <ExpiryDate>${p.Document.ExpiryDate}</ExpiryDate>
      <IssuingCountryCode>${escapeXml(p.Document.IssuingCountry)}</IssuingCountryCode>
      <ResidenceCountryCode>${escapeXml(p.Document.Nationality)}</ResidenceCountryCode>
    </IdentityDoc>` : '';

    return `<Pax>
    <PaxID>${escapeXml(p.PassengerID)}</PaxID>
    <PTC>${p.Type}</PTC>
    <Individual>
      ${p.Title ? `<TitleName>${escapeXml(p.Title)}</TitleName>` : ''}
      <GivenName>${escapeXml(p.FirstName)}</GivenName>
      <Surname>${escapeXml(p.LastName)}</Surname>
      <BirthDate>${p.DateOfBirth}</BirthDate>
      <GenderCode>${p.Gender === 'Male' ? 'M' : 'F'}</GenderCode>
      ${p.Nationality ? `<NationalityCountryCode>${escapeXml(p.Nationality)}</NationalityCountryCode>` : ''}
      ${p.ContactEmail ? `<EmailAddress>${escapeXml(p.ContactEmail)}</EmailAddress>` : ''}
      ${p.ContactPhone ? `<Phone>${escapeXml(p.ContactPhone)}</Phone>` : ''}
    </Individual>
    ${doc}
    ${p.FrequentFlyer ? `
    <LoyaltyProgramAccount>
      <CarrierCode>${escapeXml(p.FrequentFlyer.CarrierCode)}</CarrierCode>
      <AccountNumber>${escapeXml(p.FrequentFlyer.AccountNumber)}</AccountNumber>
    </LoyaltyProgramAccount>` : ''}
  </Pax>`;
}

export function parseOrderCreateResponse(xml: string): {
    orderId: string;
    pnr?: string;
    status: string;
    ticketNumbers?: string[];
} {
    checkForErrors(xml, 'IATA_OrderCreateRS');
    const parsed = xmlParser.parse(xml);
    const rs = parsed?.IATA_OrderCreateRS || parsed?.['ns5:IATA_OrderCreateRS'] || {};

    const orderId =
        rs?.Response?.Order?.OrderID ||
        rs?.Order?.OrderID ||
        extractTag(xml, 'OrderID') ||
        `ORD-${Date.now()}`;

    const pnr =
        rs?.Response?.Order?.BookingRef?.BookingRefID ||
        rs?.Order?.BookingRef?.BookingRefID ||
        extractTag(xml, 'BookingRefID');

    const status =
        rs?.Response?.Order?.StatusCode ||
        rs?.Order?.StatusCode ||
        extractTag(xml, 'StatusCode') ||
        'PENDING';

    const rawTickets = rs?.Response?.Order?.TicketDocInfos?.TicketDocInfo ||
        rs?.Order?.TicketDocInfos?.TicketDocInfo;
    const ticketNumbers = rawTickets
        ? extractAsArray(rawTickets).map((t: any) => t?.TicketDocNbr || t)
        : undefined;

    return { orderId, pnr, status, ticketNumbers };
}

// ============================================================================
// ORDER RETRIEVE
// ============================================================================

export function buildOrderRetrieveXml(orderId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<IATA_OrderRetrieveRQ xmlns="${NS_ORDER_RETRIEVE}">
  <PayloadAttributes>
    <CorrelationID>${correlationId()}</CorrelationID>
    <Timestamp>${timestamp()}</Timestamp>
    <VersionNumber>19.2</VersionNumber>
  </PayloadAttributes>
  <Request>
    <Order>
      <OrderID>${escapeXml(orderId)}</OrderID>
    </Order>
  </Request>
</IATA_OrderRetrieveRQ>`;
}

// ============================================================================
// ORDER CANCEL
// ============================================================================

export function buildOrderCancelXml(orderId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<IATA_OrderCancelRQ xmlns="${NS_ORDER_CANCEL}">
  <PayloadAttributes>
    <CorrelationID>${correlationId()}</CorrelationID>
    <Timestamp>${timestamp()}</Timestamp>
    <VersionNumber>19.2</VersionNumber>
  </PayloadAttributes>
  <Request>
    <Order>
      <OrderID>${escapeXml(orderId)}</OrderID>
    </Order>
  </Request>
</IATA_OrderCancelRQ>`;
}

// ============================================================================
// ORDER RESHOP (naknada za otkazivanje)
// ============================================================================

export function buildOrderReshopXml(orderId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<IATA_OrderReshopRQ xmlns="${NS_ORDER_RESHOP}">
  <PayloadAttributes>
    <CorrelationID>${correlationId()}</CorrelationID>
    <Timestamp>${timestamp()}</Timestamp>
    <VersionNumber>19.2</VersionNumber>
  </PayloadAttributes>
  <Request>
    <OrderRefID>${escapeXml(orderId)}</OrderRefID>
    <ReshopCriteria>
      <Cancel/>
    </ReshopCriteria>
  </Request>
</IATA_OrderReshopRQ>`;
}

// ============================================================================
// ORDER CHANGE (ticketing)
// ============================================================================

export function buildOrderChangeXml(orderId: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<IATA_OrderChangeRQ xmlns="${NS_ORDER_CHANGE}">
  <PayloadAttributes>
    <CorrelationID>${correlationId()}</CorrelationID>
    <Timestamp>${timestamp()}</Timestamp>
    <VersionNumber>19.2</VersionNumber>
  </PayloadAttributes>
  <Request>
    <OrderRefID>${escapeXml(orderId)}</OrderRefID>
    <Action>
      <ActionCode>ISSUE_TICKET</ActionCode>
    </Action>
  </Request>
</IATA_OrderChangeRQ>`;
}

// ============================================================================
// INTERNAL: NDC OFFER PARSER
// ============================================================================

function parseNDCOffer(raw: any): NDCOffer | null {
    if (!raw) return null;

    try {
        const offerItems = extractAsArray(raw?.OfferItem || raw?.AirlineOffer?.OfferItem || []);

        // Izvlačimo cenu
        const totalPrice = raw?.TotalPrice?.SimpleCurrencyPrice ||
            raw?.TotalPrice ||
            raw?.Price ||
            offerItems[0]?.TotalPriceDetail?.TotalAmount?.SimpleCurrencyPrice;

        const totalAmount = parseFloat(
            totalPrice?.['@_Amt'] || totalPrice?.Amt || totalPrice?.Amount ||
            totalPrice?.TotalAmount || '0'
        );

        const currency =
            totalPrice?.['@_Code'] || totalPrice?.Code ||
            totalPrice?.CurrencyCode || 'EUR';

        // Izvlačimo ValidatingCarrier
        const validatingCarrier =
            raw?.ValidatingCarrier?.['@_AirlineID'] ||
            raw?.ValidatingCarrier?.AirlineID ||
            raw?.OwnerCode ||
            '';

        // Itinerary/segment info
        const originDestRefs = extractAsArray(raw?.FlightsOverview?.FlightRef || []);

        return {
            OfferID: raw?.OfferID || raw?.['@_OfferID'] || `offer-${Date.now()}`,
            OwnerCode: validatingCarrier,
            ValidatingCarrier: validatingCarrier,
            TotalPrice: {
                TotalAmount: totalAmount,
                CurrencyCode: currency,
                BaseAmount: parseFloat(raw?.TotalPrice?.Breakdown?.FareAmount?.['@_Amt'] || '0') || totalAmount * 0.8,
                TaxAmount: parseFloat(raw?.TotalPrice?.Breakdown?.TaxAmount?.['@_Amt'] || '0') || totalAmount * 0.2
            },
            Itineraries: [],  // Popunjava se naknadno iz Flight/Leg podataka
            ShoppingResponseID: raw?.ShoppingResponseID
        };
    } catch (err) {
        console.error('[Travelsoft] Error parsing offer:', err, raw);
        return null;
    }
}

// ============================================================================
// ERROR CHECKER
// ============================================================================

/**
 * Proverava da li response sadrži NDC Error element i baca Exception
 */
function checkForErrors(xml: string, rootElement: string): void {
    if (xml.includes('<Error>') || xml.includes('<Errors>')) {
        const parsed = xmlParser.parse(xml);
        const rs = parsed?.[rootElement] || parsed?.[`ns5:${rootElement}`] || {};
        const errors = extractAsArray(rs?.Errors?.Error || rs?.Error || []);

        if (errors.length > 0) {
            const firstErr = errors[0];
            const code = firstErr?.Code || firstErr?.['@_Code'] || 'UNKNOWN';
            const desc = firstErr?.DescText || firstErr?.['#text'] || 'Unknown error';
            throw new Error(`[Travelsoft NDC Error] ${code}: ${desc}`);
        }
    }

    if (xml.toLowerCase().includes('soap:fault') || xml.toLowerCase().includes('soapenv:fault')) {
        const faultMsg = extractTag(xml, 'faultstring') || extractTag(xml, 'FaultString') || 'SOAP Fault';
        throw new Error(`[Travelsoft SOAP Fault] ${faultMsg}`);
    }
}

// ============================================================================
// UTILS
// ============================================================================

/**
 * XML escape za string vrednosti
 */
export function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Regex-based tag extraction (fallback)
 */
function extractTag(xml: string, tag: string): string | undefined {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)<\\/${tag}>`));
    return match ? match[1].trim() : undefined;
}

/**
 * Osigurava da je vrednost uvek array
 */
function extractAsArray(val: any): any[] {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
}
