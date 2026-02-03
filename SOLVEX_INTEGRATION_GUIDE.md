# Solvex B2B Integration Guide

## 1. Credentials Configuration
To enable Solvex B2B integration (Status Check & Auto-Login), you must configure credentials in your `.env` file:
```env
VITE_SOLVEX_LOGIN=your_username
VITE_SOLVEX_PASSWORD=your_password
```
*Note: Changes to `.env` require a server restart.*

## 2. Features Implemented

### A. Reservation Status Verification
- **Function**: `getReservation(bookingId)` in `solvexBookingService.ts`.
- **Method**: SOAP `GetReservation`.
- **Usage**: Automatically fetches the real-time status (Confirmed/Pending) and reservation number from Solvex.

### B. Auto-Login to B2B Portal
- **Mechanism**: The system authenticates via SOAP API to get a Session GUID.
- **Link**: Generates a dynamic link: `https://incomingnew.solvex.bg/Default.aspx?guid={SESSION_GUID}`.
- **Benefit**: Allows the agent to enter the B2B portal directly logged in (if supported by portal) without re-typing passwords.

## 3. UI Integration
In `ReservationArchitect.tsx`, a special button was added to the Trip Item footer:
1.  **Check Status**: First validates the reservation exists via API.
2.  **Feedback**: Displays "✅ REZERVACIJA PRONAĐENA" or error.
3.  **Open Portal**: Offers to open the B2B portal using the Auto-Login link.

## 4. Troubleshooting
- **Link redirects to Login**: The Session GUID might have expired or the portal doesn't support deep-linking via GUID.
- **Verification fails**: Check if `REF BROJ` matches the Solvex ID format (e.g., `2315789`).
