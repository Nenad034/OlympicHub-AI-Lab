# 🔴 Mars API Integration - Quick Start

**Provider:** Neolab  
**Protocol:** REST/JSON  
**Auth:** HTTP Basic Authentication

---

## 🚀 Quick Start

### 1. **Configuration**

Add to `.env`:
```bash
# Production
VITE_MARS_BASE_URL=https://yourMarsDomain
VITE_MARS_USERNAME=your_username
VITE_MARS_PASSWORD=your_password

# OR use mock server
VITE_MARS_USE_MOCK=true
```

### 2. **Test Page**

Visit: `http://localhost:5173/mars-test`

### 3. **Usage Example**

```typescript
import { marsContentService } from './services/mars/marsContentService';
import { marsPriceCalculator } from './services/mars/marsPriceCalculator';

// Get all accommodations
const accommodations = await marsContentService.getAllAccommodations();

// Search by place
const hotels = await marsContentService.searchByPlace('Pula');

// Calculate price
const accommodation = await marsContentService.getDetails(119);
const unit = accommodation.units[0];

const price = marsPriceCalculator.calculatePrice(
  unit,
  accommodation.commonItems,
  {
    unitId: unit.id,
    checkIn: '2026-07-01',
    checkOut: '2026-07-08',
    adults: 2,
  }
);

console.log('Total:', price.totalPrice, price.currency);
```

---

## 📁 Files Created

```
src/
├── services/mars/
│   ├── marsConstants.ts          - Configuration
│   ├── marsAuthService.ts        - Authentication
│   ├── marsContentService.ts     - Content fetching
│   └── marsPriceCalculator.ts    - Price calculations
├── types/
│   └── mars.types.ts             - TypeScript types
└── pages/
    ├── MarsTest.tsx              - Test page
    └── MarsTest.css              - Styles

docs/02-api-integration/mars/
└── MARS_INTEGRATION_SUMMARY.md   - Full documentation
```

---

## 🔗 Links

- **API Docs:** https://marsapi.stoplight.io/docs/mars-api-v1/
- **Contact:** info@neolab.hr
- **Full Documentation:** [MARS_INTEGRATION_SUMMARY.md](./MARS_INTEGRATION_SUMMARY.md)

---

## ⚠️ Important Notes

- Mars API is a **Content Provider** (not a booking API)
- No built-in search endpoint (client-side search implemented)
- No booking functionality (use ORS/Solvex for bookings)
- Best used for: content, images, pricing, amenities

---

**Status:** ✅ Ready for testing with mock server!
