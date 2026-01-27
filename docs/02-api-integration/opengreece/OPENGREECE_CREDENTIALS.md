# 🇬🇷 OpenGreece API - Credentials & Configuration

**Provider:** OpenGreece  
**Date Received:** 2026-01-25  
**Status:** ✅ Active Production Credentials

---

## 🔑 **CREDENTIALS**

### **API Access (XML Web Services):**

#### **Push Endpoint:**
```
URL: https://online.open-greece.com/nsCallWebService_Push/handlerequest.aspx
Method: StartPushProcessRQ
Purpose: Initiate Push process for contract updates
```

#### **Pull Endpoint:**
```
URL: https://online.open-greece.com/nsCallWebServices/handlerequest.aspx
Methods: All methods (static data download & booking flow)
Purpose: Hotel search, availability, booking, cancellation
```

#### **Authentication:**
```
Username: olympictravel
Password: olympic2025!
Auth Type: HTTP Basic Authentication
```

---

### **FTP Access:**

```
Host: ftp://ftp.open-greece.com
Port: 21
Username: olympictravel
Password: 0Fu7GD0znftX
Purpose: File downloads, bulk data sync
```

---

## ⚙️ **CONFIGURATION**

### **Environment Variables (.env):**

```bash
# API Endpoints
VITE_OPENGREECE_PULL_URL=https://online.open-greece.com/nsCallWebServices/handlerequest.aspx
VITE_OPENGREECE_PUSH_URL=https://online.open-greece.com/nsCallWebService_Push/handlerequest.aspx

# Authentication (Production)
VITE_OPENGREECE_USERNAME=olympictravel
VITE_OPENGREECE_PASSWORD=olympic2025!

# FTP Access (Production)
VITE_OPENGREECE_FTP_HOST=ftp.open-greece.com
VITE_OPENGREECE_FTP_PORT=21
VITE_OPENGREECE_FTP_USERNAME=olympictravel
VITE_OPENGREECE_FTP_PASSWORD=0Fu7GD0znftX

# Settings
VITE_OPENGREECE_USE_MOCK=false
```

---

## 🚀 **USAGE**

### **1. Update .env File:**

Copy credentials from `.env.example` to `.env`:
```bash
cp .env.example .env
```

Or manually update `.env` with the credentials above.

---

### **2. Test Connection:**

Visit test page:
```
http://localhost:5173/opengreece-test
```

Or on production:
```
https://olympichub034.vercel.app/opengreece-test
```

---

### **3. Run Tests:**

```typescript
import { OpenGreeceAPI } from './services/opengreeceApiService';

// Test Push Process
const pushResult = await OpenGreeceAPI.startPushProcess(false);

// Search Hotels
const searchResult = await OpenGreeceAPI.searchHotels();

// Get Hotel Details
const detailsResult = await OpenGreeceAPI.getHotelDetails('HOTEL_CODE');

// Check Availability
const availResult = await OpenGreeceAPI.checkAvailability({
  hotelCode: 'HOTEL_CODE',
  checkIn: '2026-07-01',
  checkOut: '2026-07-08',
  adults: 2,
  children: 0,
});
```

---

## 📋 **AVAILABLE METHODS**

### **Push API:**
- `startPushProcess(isFullPush)` - Get contract updates (full/delta)

### **Pull API:**
- `searchHotels(hotelCode?)` - Search hotels
- `getHotelDetails(hotelCode)` - Get hotel details
- `checkAvailability(params)` - Check availability
- `createBooking(params)` - Create booking
- `cancelBooking(bookingId)` - Cancel booking

---

## 🔒 **SECURITY NOTES**

### **⚠️ IMPORTANT:**

1. **Never commit `.env` file to Git**
   - `.env` is in `.gitignore`
   - Only `.env.example` should be committed

2. **Credentials are sensitive**
   - Production credentials
   - Do not share publicly
   - Do not expose in client-side code

3. **Use environment variables**
   - Access via `import.meta.env.VITE_*`
   - Never hardcode credentials

4. **Vercel Environment Variables**
   - Add credentials to Vercel dashboard
   - Settings → Environment Variables
   - Add all `VITE_OPENGREECE_*` variables

---

## 📊 **API FEATURES**

### **OpenGreece API Capabilities:**

✅ **Hotel Search** - Search Greek hotels  
✅ **Real-time Availability** - Check room availability  
✅ **Instant Booking** - Create reservations  
✅ **Cancellation** - Cancel bookings  
✅ **Push Updates** - Delta sync for contract updates  
✅ **FTP Access** - Bulk data downloads  
✅ **OTA Standard** - XML-based OTA protocol  

---

## 🔗 **RESOURCES**

### **Documentation:**
- API Docs: (Request from OpenGreece if needed)
- OTA Standard: http://www.opentravel.org/

### **Support:**
- Contact OpenGreece support for API questions
- Technical issues: Check logs in browser console

### **Test Page:**
- Local: http://localhost:5173/opengreece-test
- Production: https://olympichub034.vercel.app/opengreece-test

---

## ✅ **VERIFICATION CHECKLIST**

- [x] Credentials received
- [x] `.env.example` updated
- [ ] `.env` file updated locally
- [ ] Vercel environment variables added
- [ ] Test connection successful
- [ ] Search hotels working
- [ ] Availability check working
- [ ] Booking flow tested

---

## 🎯 **NEXT STEPS**

1. **Update Local .env:**
   ```bash
   # Copy credentials to .env
   cp .env.example .env
   ```

2. **Add to Vercel:**
   ```
   Vercel Dashboard → olympichub034 → Settings → Environment Variables
   Add all VITE_OPENGREECE_* variables
   ```

3. **Test Locally:**
   ```bash
   npm run dev
   # Visit: http://localhost:5173/opengreece-test
   ```

4. **Deploy to Vercel:**
   ```bash
   git push origin main
   # Vercel will auto-deploy with new env vars
   ```

5. **Verify Production:**
   ```
   Visit: https://olympichub034.vercel.app/opengreece-test
   Run tests
   ```

---

**Status:** ✅ **CREDENTIALS CONFIGURED - READY FOR TESTING!**

**Date:** 2026-01-25  
**Provider:** OpenGreece  
**Account:** olympictravel  
**Environment:** Production  

---

**⚠️ SECURITY REMINDER:**
These are production credentials. Keep them secure and never commit to public repositories!
