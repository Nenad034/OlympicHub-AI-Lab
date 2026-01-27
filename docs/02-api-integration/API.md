# Olympic Hub API Documentation

> **Version:** 1.1.0  
> **Last Updated:** 2025-12-29  
> **Base URL:** `https://your-supabase-url.supabase.co/rest/v1`

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Properties API](#properties-api)
4. [Suppliers API](#suppliers-api)
5. [Customers API](#customers-api)
6. [Gemini AI API](#gemini-ai-api) ✨ NEW
7. [Configuration API](#configuration-api)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Webhooks](#webhooks)


---

## Overview

Olympic Hub API provides RESTful endpoints for managing tourism-related data including hotels, suppliers, customers, and bookings. The API is built on Supabase and follows PostgreSQL Row Level Security (RLS) patterns.

### Technology Stack
- **Database:** PostgreSQL (Supabase)
- **Authentication:** Supabase Auth (JWT)
- **Real-time:** Supabase Realtime subscriptions
- **Storage:** Supabase Storage for media files

### Response Format

All API responses follow this structure:

```json
{
  "data": [...] | {...} | null,
  "error": null | { "message": "Error description", "code": "ERROR_CODE" },
  "success": true | false
}
```

---

## Authentication

### Headers

All authenticated requests require:

```http
Authorization: Bearer <your-jwt-token>
apikey: <your-supabase-anon-key>
Content-Type: application/json
```

### User Levels

| Level | Name | Permissions |
|-------|------|-------------|
| 1 | Gost | Read-only access |
| 2 | Osnovni | Read + Create |
| 3 | Standardni | Read + Create + Update |
| 4 | Napredni | Full CRUD |
| 5 | Ekspert | Full CRUD + Reports |
| 6 | Master Admin | Full access + System config |

---

## Properties API

Manage hotel and accommodation properties.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/properties` | List all properties |
| GET | `/properties?id=eq.{id}` | Get single property |
| POST | `/properties` | Create property |
| PATCH | `/properties?id=eq.{id}` | Update property |
| DELETE | `/properties?id=eq.{id}` | Delete property |

### Property Object

```typescript
interface Property {
  id: string;
  name: string;
  propertyType: 'Hotel' | 'Apartment' | 'Villa' | 'Resort';
  starRating: number; // 1-5
  isActive: boolean;
  
  // Location
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postalCode: string;
    countryCode: string; // ISO 3166-1 alpha-2
  };
  
  geoCoordinates: {
    latitude: number;
    longitude: number;
    coordinateSource: 'GPS' | 'MAP_PIN' | 'ADDRESS_LOOKUP';
  };
  
  // Content (multi-language)
  content: {
    languageCode: string; // e.g., 'sr', 'en'
    officialName: string;
    displayName: string;
    shortDescription: string;
    longDescription: string; // HTML allowed
  }[];
  
  // Media
  images: {
    url: string;
    caption?: string;
    isPrimary: boolean;
    sortOrder: number;
  }[];
  
  // Room Types
  roomTypes: RoomType[];
  
  // Amenities
  propertyAmenities: string[];
  
  // Policies
  houseRules: {
    checkInStart: string; // HH:mm
    checkInEnd: string;
    checkOutTime: string;
    smokingAllowed: boolean;
    petsAllowed: boolean;
    partiesAllowed: boolean;
  };
  
  // Timestamps
  created_at: string; // ISO 8601
  updated_at: string;
}
```

### List Properties

```http
GET /properties
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `select` | string | Fields to return (default: `*`) |
| `order` | string | Sort order (e.g., `created_at.desc`) |
| `limit` | number | Max records (default: 100) |
| `offset` | number | Pagination offset |
| `isActive` | boolean | Filter by status |

**Example Request:**

```bash
curl -X GET \
  'https://api.supabase.co/rest/v1/properties?isActive=eq.true&order=name.asc&limit=10' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'apikey: YOUR_API_KEY'
```

**Example Response:**

```json
[
  {
    "id": "abc123",
    "name": "Hotel Iberostar Bellevue",
    "propertyType": "Hotel",
    "starRating": 4,
    "isActive": true,
    "address": {
      "city": "Bečići",
      "countryCode": "ME"
    }
  }
]
```

### Create Property

```http
POST /properties
```

**Request Body:**

```json
{
  "name": "New Hotel",
  "propertyType": "Hotel",
  "starRating": 4,
  "address": {
    "addressLine1": "Main Street 1",
    "city": "Belgrade",
    "postalCode": "11000",
    "countryCode": "RS"
  }
}
```

### Update Property

```http
PATCH /properties?id=eq.abc123
```

**Request Body:**

```json
{
  "isActive": true,
  "starRating": 5
}
```

### Delete Property

```http
DELETE /properties?id=eq.abc123
```

> ⚠️ **Note:** Only Master Admin (Level 6) can permanently delete properties.

---

## Suppliers API

Manage supplier/partner relationships.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/suppliers` | List suppliers |
| GET | `/suppliers?id=eq.{id}` | Get supplier |
| POST | `/suppliers` | Create supplier |
| PATCH | `/suppliers?id=eq.{id}` | Update supplier |

### Supplier Object

```typescript
interface Supplier {
  id: string;
  name: string;
  type: 'Hotel' | 'DMC' | 'Airline' | 'Transport' | 'Insurance';
  
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  
  address: {
    street: string;
    city: string;
    country: string;
  };
  
  bankDetails?: {
    bankName: string;
    iban: string;
    swift: string;
  };
  
  contractStatus: 'Active' | 'Pending' | 'Expired';
  rating: number; // 1-5
  
  created_at: string;
  updated_at: string;
}
```

---

## Customers API

Manage customer records.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/customers` | List customers |
| GET | `/customers?id=eq.{id}` | Get customer |
| POST | `/customers` | Create customer |
| PATCH | `/customers?id=eq.{id}` | Update customer |

### Customer Object

```typescript
interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  
  document: {
    type: 'Passport' | 'ID_Card';
    number: string;
    expiryDate: string;
    countryOfIssue: string;
  };
  
  preferences: {
    language: 'sr' | 'en';
    currency: 'EUR' | 'RSD';
    newsletter: boolean;
  };
  
  loyaltyPoints: number;
  totalBookings: number;
  
  created_at: string;
  updated_at: string;
}
```

---

## Gemini AI API

Securely interact with Google Gemini AI through the Edge Function proxy.

### Edge Function Endpoint

```http
POST /functions/v1/gemini-proxy
```

### Request Body

```json
{
  "prompt": "What is the capital of France?",
  "model": "gemini-1.5-flash",
  "maxTokens": 2048,
  "temperature": 0.7,
  "context": "Optional conversation context"
}
```

### Response

```json
{
  "success": true,
  "response": "The capital of France is Paris.",
  "model": "gemini-1.5-flash",
  "usage": {
    "promptTokenCount": 10,
    "candidatesTokenCount": 8
  }
}
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `prompt` | string | required | User's question or request |
| `model` | string | `gemini-1.5-flash` | Model to use |
| `maxTokens` | number | 2048 | Maximum response tokens |
| `temperature` | number | 0.7 | Creativity (0.0-1.0) |
| `context` | string | - | Conversation history |

### Available Models

| Model | Best For |
|-------|----------|
| `gemini-1.5-flash` | Fast responses, general use |
| `gemini-1.5-pro` | Complex reasoning, longer context |
| `gemini-1.0-pro` |Legacy compatibility |

### Frontend Service Usage

```typescript
import { askGemini, chatWithGemini } from '@/services/gemini';

// Simple query
const result = await askGemini('Explain hotel pricing');

// With options
const result = await askGemini('Create description for hotel', {
  model: 'gemini-1.5-pro',
  temperature: 0.8,
});

// Multi-turn chat
const result = await chatWithGemini([
  { role: 'user', content: 'Hello!' },
  { role: 'assistant', content: 'Hi! How can I help?' },
  { role: 'user', content: 'Tell me about Montenegro hotels' },
]);
```

> 🔒 **Security:** See [docs/SECURITY.md](./SECURITY.md) for API key configuration.

---

## Configuration API

Application configuration management.

### Get Config

```http
GET /app_config?id=eq.main
```

### Update Config

```http
PATCH /app_config?id=eq.main
```

**Request Body:**

```json
{
  "content": {
    "geminiApiKey": "encrypted_key",
    "defaultAIModel": "gemini-1.5-pro",
    "defaultUserLevel": 3,
    "features": {
      "aiAssistant": true,
      "darkMode": true,
      "prismMode": false
    }
  }
}
```

> ⚠️ **Security:** API keys are encrypted and only accessible to Level 6 users.

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTH_REQUIRED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `DUPLICATE_ENTRY` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

### Error Response Format

```json
{
  "data": null,
  "error": {
    "message": "Property with this name already exists",
    "code": "DUPLICATE_ENTRY",
    "details": {
      "field": "name",
      "value": "Hotel Example"
    }
  },
  "success": false
}
```

---

## Rate Limiting

| Tier | Requests/min | Requests/day |
|------|--------------|--------------|
| Free | 60 | 10,000 |
| Pro | 300 | 100,000 |
| Enterprise | Unlimited | Unlimited |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

---

## Webhooks

Configure webhooks for real-time notifications.

### Available Events

| Event | Description |
|-------|-------------|
| `property.created` | New property added |
| `property.updated` | Property modified |
| `property.deleted` | Property removed |
| `booking.created` | New booking made |
| `booking.confirmed` | Booking confirmed |
| `booking.cancelled` | Booking cancelled |

### Webhook Payload

```json
{
  "event": "property.created",
  "timestamp": "2025-12-29T08:30:00Z",
  "data": {
    "id": "abc123",
    "name": "New Hotel"
  },
  "signature": "sha256=..."
}
```

---

## SDK Usage

### JavaScript/TypeScript

```typescript
import { api } from '@olympichub/sdk';

// Initialize
api.init({
  baseUrl: 'https://your-project.supabase.co',
  apiKey: 'your-api-key',
});

// Get all properties
const { data, error } = await api.properties.getAll();

// Create property
const { data: newProperty } = await api.properties.create({
  name: 'New Hotel',
  propertyType: 'Hotel',
});

// Update property
await api.properties.update('abc123', {
  isActive: true,
});

// Delete property
await api.properties.delete('abc123');
```

---

## Changelog

### v1.0.0 (2025-12-29)
- Initial API release
- Properties CRUD endpoints
- Suppliers management
- Customers management
- Real-time subscriptions
- Webhook support

---

## Support

- **Documentation:** https://docs.olympichub.rs
- **GitHub:** https://github.com/Nenad034/olympichub034
- **Email:** support@olympictravel.rs

---

*Built with ❤️ by Olympic Travel Team*
