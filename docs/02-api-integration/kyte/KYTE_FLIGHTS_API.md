# Kyte Flight API Integration Guide

## Overview
Kyte provides a modern RESTful API for searching and booking flights through NDC (New Distribution Capability) and GDS connections. This guide outlines the integration process for the Olympic Hub platform.

## Authentication
Authentication is handled via an API Key passed in the request headers.

- **Header Name**: `x-api-key`
- **Value**: Your Kyte API Key

Additional optional headers for tracking:
- `x-request-id`: Unique identifier for each request.
- `x-transaction-id`: Unique identifier for a series of requests in a workflow (e.g., from search to book).

## Environments
1. **Sandbox**: `https://api.sandbox.gokyte.com/` (Verify in docs as it might vary)
2. **Live**: `https://api.live.gokyte.com/`

*Note: Sandbox results rely on airline test systems and may occasionally return offers that cannot be booked.*

## Core Integration Flow

### 1. Search (Shop Flights)
- **Endpoint**: `POST /air/offers`
- **Purpose**: Search for flight availability and pricing.
- **Key Parameters**: Origin, Destination, Dates, Passengers.

### 2. Offer Details
- **Endpoint**: `GET /air/offers/{offer_id}`
- **Purpose**: Get detailed information about a selected flight offer, including fare rules and bundle details.

### 3. Ancillaries (Bags, Seats)
- **Endpoint**: `POST /air/ancillaries/shop`
- **Purpose**: Retrieve available paid extras like baggage and seat selection for the specific offer.

### 4. Booking (Order Creation)
- **Endpoint**: `POST /air/orders`
- **Purpose**: Create a booking (held or confirmed depending on payment).
- **Required Data**: Passenger information, contact details, and selected ancillaries.

### 5. Payment
- **Endpoint**: `POST /air/payments`
- **Purpose**: Process payment for the booking. Kyte supports 3DSecure flows.

## Analysis & Integration Considerations

### Feasibility
Successfully connecting to Kyte is highly feasible. The API follows industry standards (REST/JSON) and is significantly easier to implement than legacy SOAP-based systems.

### Identified Potential Issues
1. **Offer Volatility (TTL)**: NDC prices and availability can change in seconds. The UI must handle "Offer Expired" scenarios gracefully.
2. **Airline Variation**: Not all airlines support all features (e.g., some don't allow seat selection via API). The integration must be flexible enough to handle missing ancillary data.
3. **Certification Process**: Moving to production requires a certification step where Kyte verifies the integration's compliance with their standards.
4. **3DSecure Complexity**: Handling asynchronous payment verification (3DS) might require frontend adjustments to handle redirects or modals.
5. **Sandbox Limitations**: Since it relies on carrier test beds, some failures in Sandbox are false positives that won't happen in Production.

## Implementation Status (Implemented in Olympic Hub)
✅ **Search Implementation**: Completed using `KyteApiService.searchFlights()`.
✅ **Normalization**: Unified mapping implemented in `kyteMapper.ts`.
✅ **Order Creation**: Implemented in `KyteApiService.createOrder()`.
✅ **Unified Integration**: Connected to `FlightProviderManager` and `FlightBooking` page.

## References
- [Official API Reference](https://docs.gokyte.com/)
- [Integration Guide](https://docs.gokyte.com/integration_guide.html)
- [Integration Process Pattern](./INTEGRATION_PROCESS.md)
