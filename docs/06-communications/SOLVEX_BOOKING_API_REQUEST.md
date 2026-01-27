Subject: API Integration Request - Booking/Reservation SOAP Method Documentation

Dear Solvex IT Support Team,

We are currently integrating the Solvex API into our travel booking platform (Olympic Hub) and have successfully implemented the hotel search functionality using the following methods:
- Connect (authentication)
- GetHotels (hotel directory)
- SearchHotelServices (availability search)

However, we need documentation for the **booking/reservation creation** functionality to complete our integration.

Could you please provide the following information:

## 1. SOAP Method Name
What is the correct SOAP method name for creating a hotel booking/reservation?
Examples: CreateBooking, MakeReservation, BookHotel, ReserveHotel, CreateReservation

## 2. Required Parameters
Please provide the complete list of required and optional parameters for the booking method, including:
- Guest information (name, email, phone, passport, etc.)
- Hotel/Room identifiers (HotelKey, RoomTypeKey, etc.)
- Date range (check-in, check-out)
- Number of guests (adults, children, ages)
- Meal plan/board type
- Special requests
- Payment information (if applicable)
- Any other required fields

## 3. Request Example
Could you provide a sample SOAP request XML for creating a booking? This would help us ensure we format the request correctly.

## 4. Response Format
What does the response look like when:
- Booking is successful (confirmation number, status, etc.)
- Booking fails (error codes, messages)
- Booking is pending confirmation

## 5. Booking Status & Management
Are there additional methods for:
- Checking booking status (GetBookingStatus, CheckReservation, etc.)
- Canceling a booking (CancelBooking, CancelReservation, etc.)
- Modifying a booking (ModifyBooking, UpdateReservation, etc.)

## 6. WSDL Documentation
If available, could you provide:
- Updated WSDL file that includes booking methods
- API documentation (PDF, online portal, etc.)
- Integration guide or developer manual

## Current Integration Status
✅ Authentication (Connect) - Working
✅ Hotel Search (SearchHotelServices) - Working
✅ Hotel Directory (GetHotels) - Working
❌ Booking Creation - Pending documentation
❌ Booking Management - Pending documentation

## Our Technical Details
- API URL: https://evaluation.solvex.bg/iservice/integrationservice.asmx
- Login: sol611s
- Integration Type: SOAP/XML
- Environment: Evaluation/Testing

We would appreciate your assistance in completing this integration. Please let us know if you need any additional information from our side.

Thank you for your support!

Best regards,
[Your Name]
[Your Company - Olympic Hub]
[Your Contact Information]
