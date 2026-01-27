# 🌐 API Integration Patterns - Kompletni Vodič

## 📋 Pregled

Ovaj dokument pokriva **SVE** vrste API komunikacija i kako ih integrisati u OlympicHub aplikaciju koristeći TCT template kao osnovu.

---

# 📡 HTTP METODE

## 1. GET - Preuzimanje Podataka

### **Opis:**
- Preuzima podatke sa servera
- **Idempotent** - isti zahtev uvek vraća isti rezultat
- **Bezbedno** - ne menja stanje na serveru
- Parametri se šalju u URL-u

### **Primer - TCT Style:**
```typescript
// GET zahtev za listu hotela
const getHotels = async (city: string) => {
  const response = await fetch(
    `${baseUrl}/hotels?city=${encodeURIComponent(city)}&limit=10`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    }
  );
  
  return response.json();
};
```

### **Primer - Sa Query Parametrima:**
```typescript
// Helper za kreiranje query string-a
const buildQueryString = (params: Record<string, any>) => {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

const searchHotels = async (params: {
  city?: string;
  checkin?: string;
  checkout?: string;
  adults?: number;
}) => {
  const queryString = buildQueryString(params);
  const url = `${baseUrl}/hotels?${queryString}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders()
  });
  
  return response.json();
};
```

---

## 2. POST - Kreiranje/Slanje Podataka

### **Opis:**
- Kreira nove resurse ili šalje podatke
- **Nije idempotent** - isti zahtev može kreirati više resursa
- Podaci se šalju u body-u
- Koristi se za: kreiranje, pretragu, login

### **Primer - TCT Style (Pretraga):**
```typescript
const searchHotels = async (params: HotelSearchParams) => {
  const response = await fetch(`${baseUrl}/v1/hotel/searchSync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${username}:${password}`)}`,
      'API-SOURCE': 'B2B'
    },
    body: JSON.stringify({
      search_type: 'city',
      location: params.location,
      checkin: params.checkin,
      checkout: params.checkout,
      rooms: params.rooms,
      currency: params.currency,
      nationality: params.nationality
    })
  });
  
  return response.json();
};
```

### **Primer - Kreiranje Rezervacije:**
```typescript
const createBooking = async (bookingData: BookingData) => {
  const response = await fetch(`${baseUrl}/v1/hotel/book`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'SESSIONID': sessionId // TCT specifično
    },
    body: JSON.stringify({
      solution_id: bookingData.solutionId,
      guests: bookingData.guests,
      contact: bookingData.contact,
      payment: bookingData.payment
    })
  });
  
  return response.json();
};
```

---

## 3. PUT - Ažuriranje Kompletnog Resursa

### **Opis:**
- Zamenjuje **ceo** resurs
- **Idempotent** - isti zahtev uvek daje isti rezultat
- Mora da sadrži **sve** podatke resursa

### **Primer:**
```typescript
const updateHotel = async (hotelId: string, hotelData: HotelData) => {
  const response = await fetch(`${baseUrl}/hotels/${hotelId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      // SVI podaci hotela moraju biti uključeni
      id: hotelId,
      name: hotelData.name,
      address: hotelData.address,
      city: hotelData.city,
      country: hotelData.country,
      stars: hotelData.stars,
      description: hotelData.description,
      facilities: hotelData.facilities,
      images: hotelData.images
      // ... svi ostali podaci
    })
  });
  
  return response.json();
};
```

---

## 4. PATCH - Parcijalno Ažuriranje

### **Opis:**
- Ažurira **samo određena polja** resursa
- **Može biti idempotent** (zavisi od implementacije)
- Šalje samo polja koja se menjaju

### **Primer:**
```typescript
const updateBookingStatus = async (bookingId: string, status: string) => {
  const response = await fetch(`${baseUrl}/bookings/${bookingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      // Samo polja koja se menjaju
      status: status,
      updated_at: new Date().toISOString()
    })
  });
  
  return response.json();
};
```

### **Primer - Parcijalno Ažuriranje Gosta:**
```typescript
const updateGuestInfo = async (bookingId: string, guestId: string, updates: Partial<Guest>) => {
  const response = await fetch(`${baseUrl}/bookings/${bookingId}/guests/${guestId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(updates) // Samo promenjena polja
  });
  
  return response.json();
};
```

---

## 5. DELETE - Brisanje Resursa

### **Opis:**
- Briše resurs
- **Idempotent** - brisanje istog resursa više puta daje isti rezultat
- Obično ne šalje body

### **Primer - TCT Style (Cancel Booking):**
```typescript
const cancelBooking = async (bookingCode: string) => {
  const response = await fetch(`${baseUrl}/v1/hotel/cancel`, {
    method: 'DELETE', // ili POST sa action: 'cancel'
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'SESSIONID': sessionId
    },
    body: JSON.stringify({
      code: bookingCode,
      reason: 'Customer request'
    })
  });
  
  return response.json();
};
```

### **Primer - Standardni DELETE:**
```typescript
const deleteHotel = async (hotelId: string) => {
  const response = await fetch(`${baseUrl}/hotels/${hotelId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  // DELETE često vraća 204 No Content
  if (response.status === 204) {
    return { success: true };
  }
  
  return response.json();
};
```

---

## 6. HEAD - Provera Postojanja

### **Opis:**
- Isti kao GET, ali **bez body-a** u response-u
- Koristi se za proveru postojanja ili meta podataka
- Vraća samo headers

### **Primer:**
```typescript
const checkHotelExists = async (hotelId: string) => {
  const response = await fetch(`${baseUrl}/hotels/${hotelId}`, {
    method: 'HEAD',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return {
    exists: response.ok,
    lastModified: response.headers.get('Last-Modified'),
    contentLength: response.headers.get('Content-Length')
  };
};
```

---

## 7. OPTIONS - Provera Dozvoljenih Metoda

### **Opis:**
- Vraća dozvoljene HTTP metode za resurs
- Koristi se za **CORS preflight** zahteve
- Retko se poziva ručno

### **Primer:**
```typescript
const getAvailableMethods = async (endpoint: string) => {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'OPTIONS'
  });
  
  const allowedMethods = response.headers.get('Allow');
  return allowedMethods?.split(',').map(m => m.trim());
};
```

---

# 🔐 AUTENTIFIKACIJA

## 1. Basic Authentication

### **Opis:**
- Username i password u Base64
- Šalje se u svakom zahtevu
- **Nesigurno** bez HTTPS

### **Primer - TCT Style:**
```typescript
const getAuthHeaders = () => {
  const credentials = btoa(`${username}:${password}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'API-SOURCE': 'B2B'
  };
};

const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });
};
```

---

## 2. Bearer Token (JWT)

### **Opis:**
- Token se dobija nakon login-a
- Token se šalje u svakom zahtevu
- Token ima **expiration time**

### **Primer:**
```typescript
// Login i dobijanje tokena
const login = async (username: string, password: string) => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  // Sačuvaj token
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  
  return data;
};

// Korišćenje tokena
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Authorization': `Bearer ${token}`
  };
};

// Refresh token kada istekne
const refreshToken = async () => {
  const refreshToken = localStorage.getItem('refresh_token');
  
  const response = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  
  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  
  return data.access_token;
};

// Automatski refresh pri 401 greški
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
  let response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });
  
  // Ako je token istekao, refresh i pokušaj ponovo
  if (response.status === 401) {
    await refreshToken();
    response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers
      }
    });
  }
  
  return response;
};
```

---

## 3. API Key

### **Opis:**
- Statički ključ za autentifikaciju
- Može biti u header-u ili query parametru
- Jednostavno ali manje sigurno

### **Primer - Header:**
```typescript
const getAuthHeaders = () => ({
  'X-API-Key': apiKey,
  'X-API-Secret': apiSecret
});
```

### **Primer - Query Parameter:**
```typescript
const makeRequest = async (endpoint: string) => {
  const url = `${baseUrl}${endpoint}?api_key=${apiKey}`;
  return fetch(url);
};
```

---

## 4. OAuth 2.0

### **Opis:**
- Najsigurniji metod
- Koristi **access token** i **refresh token**
- Podržava različite **grant types**

### **Primer - Client Credentials Flow:**
```typescript
// Dobijanje tokena
const getOAuthToken = async () => {
  const response = await fetch(`${authUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'read write'
    })
  });
  
  const data = await response.json();
  
  // Sačuvaj token i expiration
  tokenCache = {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in * 1000)
  };
  
  return data.access_token;
};

// Korišćenje tokena sa auto-refresh
const getValidToken = async () => {
  if (!tokenCache || Date.now() >= tokenCache.expires_at) {
    return await getOAuthToken();
  }
  return tokenCache.access_token;
};

const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getValidToken();
  
  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });
};
```

---

## 5. Session-Based (Cookies)

### **Opis:**
- Server kreira session nakon login-a
- Session ID se čuva u cookie-u
- Browser automatski šalje cookie

### **Primer:**
```typescript
// Login
const login = async (username: string, password: string) => {
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    credentials: 'include', // Važno za cookies!
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  // Session cookie se automatski čuva
  return response.json();
};

// Svi zahtevi
const makeRequest = async (endpoint: string, options: RequestInit = {}) => {
  return fetch(`${baseUrl}${endpoint}`, {
    ...options,
    credentials: 'include' // Šalje cookies automatski
  });
};
```

---

# 🔄 KOMUNIKACIONI PROTOKOLI

## 1. REST API (JSON)

### **Opis:**
- Najčešći format
- HTTP metode + JSON
- Stateless

### **Primer - Kompletan REST Servis:**
```typescript
class RestAPIService {
  private baseUrl: string;
  private headers: Record<string, string>;
  
  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
  }
  
  // GET - Lista resursa
  async getAll<T>(resource: string, params?: Record<string, any>): Promise<T[]> {
    const queryString = params ? `?${buildQueryString(params)}` : '';
    const response = await fetch(`${this.baseUrl}/${resource}${queryString}`, {
      method: 'GET',
      headers: this.headers
    });
    
    return response.json();
  }
  
  // GET - Pojedinačni resurs
  async getOne<T>(resource: string, id: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${resource}/${id}`, {
      method: 'GET',
      headers: this.headers
    });
    
    return response.json();
  }
  
  // POST - Kreiranje
  async create<T>(resource: string, data: Partial<T>): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${resource}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    
    return response.json();
  }
  
  // PUT - Kompletno ažuriranje
  async update<T>(resource: string, id: string, data: T): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${resource}/${id}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    
    return response.json();
  }
  
  // PATCH - Parcijalno ažuriranje
  async patch<T>(resource: string, id: string, data: Partial<T>): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${resource}/${id}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(data)
    });
    
    return response.json();
  }
  
  // DELETE - Brisanje
  async delete(resource: string, id: string): Promise<void> {
    await fetch(`${this.baseUrl}/${resource}/${id}`, {
      method: 'DELETE',
      headers: this.headers
    });
  }
}

// Korišćenje
const api = new RestAPIService('https://api.example.com', 'your-api-key');

// GET lista hotela
const hotels = await api.getAll('hotels', { city: 'Hurghada', stars: 5 });

// GET pojedinačni hotel
const hotel = await api.getOne('hotels', '12345');

// POST nova rezervacija
const booking = await api.create('bookings', {
  hotel_id: '12345',
  checkin: '2026-02-15',
  checkout: '2026-02-22'
});

// PATCH ažuriranje statusa
await api.patch('bookings', booking.id, { status: 'confirmed' });

// DELETE otkazivanje
await api.delete('bookings', booking.id);
```

---

## 2. GraphQL

### **Opis:**
- Jedan endpoint za sve
- Klijent definiše šta želi
- Smanjuje over-fetching

### **Primer:**
```typescript
class GraphQLAPIService {
  private endpoint: string;
  private headers: Record<string, string>;
  
  constructor(endpoint: string, token: string) {
    this.endpoint = endpoint;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }
  
  async query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ query, variables })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    return result.data;
  }
  
  async mutate<T>(mutation: string, variables?: Record<string, any>): Promise<T> {
    return this.query<T>(mutation, variables);
  }
}

// Korišćenje
const graphql = new GraphQLAPIService('https://api.example.com/graphql', 'token');

// Query - Pretraga hotela
const hotels = await graphql.query(`
  query SearchHotels($city: String!, $checkin: Date!, $checkout: Date!) {
    hotels(city: $city, checkin: $checkin, checkout: $checkout) {
      id
      name
      price
      stars
      images {
        url
        caption
      }
      facilities {
        name
        icon
      }
    }
  }
`, {
  city: 'Hurghada',
  checkin: '2026-02-15',
  checkout: '2026-02-22'
});

// Mutation - Kreiranje rezervacije
const booking = await graphql.mutate(`
  mutation CreateBooking($input: BookingInput!) {
    createBooking(input: $input) {
      id
      code
      status
      total_price
    }
  }
`, {
  input: {
    hotel_id: '12345',
    checkin: '2026-02-15',
    checkout: '2026-02-22',
    guests: [
      { first_name: 'John', last_name: 'Doe', age: 30 }
    ]
  }
});
```

---

## 3. SOAP (XML)

### **Opis:**
- XML format
- WSDL za definiciju servisa
- Često u legacy sistemima (Sabre, Amadeus)

### **Primer:**
```typescript
class SOAPAPIService {
  private endpoint: string;
  private namespace: string;
  
  constructor(endpoint: string, namespace: string) {
    this.endpoint = endpoint;
    this.namespace = namespace;
  }
  
  private buildSOAPEnvelope(action: string, body: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
      <soap:Envelope 
        xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:ns="${this.namespace}">
        <soap:Header/>
        <soap:Body>
          <ns:${action}>
            ${body}
          </ns:${action}>
        </soap:Body>
      </soap:Envelope>`;
  }
  
  private parseSOAPResponse(xml: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    // Extract data from SOAP response
    const body = doc.getElementsByTagNameNS('*', 'Body')[0];
    
    // Convert XML to JSON (simplified)
    return this.xmlToJson(body);
  }
  
  private xmlToJson(xml: Element): any {
    // Simplified XML to JSON conversion
    const obj: any = {};
    
    if (xml.children.length === 0) {
      return xml.textContent;
    }
    
    for (let i = 0; i < xml.children.length; i++) {
      const child = xml.children[i];
      const tagName = child.tagName.split(':').pop()!;
      obj[tagName] = this.xmlToJson(child);
    }
    
    return obj;
  }
  
  async call(action: string, params: Record<string, any>): Promise<any> {
    // Build XML body from params
    const bodyXML = Object.entries(params)
      .map(([key, value]) => `<${key}>${value}</${key}>`)
      .join('\n');
    
    const soapEnvelope = this.buildSOAPEnvelope(action, bodyXML);
    
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml',
        'SOAPAction': action
      },
      body: soapEnvelope
    });
    
    const xmlText = await response.text();
    return this.parseSOAPResponse(xmlText);
  }
}

// Korišćenje
const soap = new SOAPAPIService(
  'https://api.example.com/soap',
  'http://example.com/hotel/v1'
);

// SOAP poziv
const hotels = await soap.call('HotelAvailRQ', {
  City: 'Hurghada',
  CheckIn: '2026-02-15',
  CheckOut: '2026-02-22',
  Adults: 2
});
```

---

## 4. WebSocket (Real-Time)

### **Opis:**
- Dvosmerna komunikacija
- Real-time updates
- Perzistentna konekcija

### **Primer:**
```typescript
class WebSocketAPIService {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private requestId = 0;
  
  constructor(private url: string) {}
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        resolve();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
      
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const handler = this.messageHandlers.get(message.request_id);
        
        if (handler) {
          handler(message.data);
          this.messageHandlers.delete(message.request_id);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
      };
    });
  }
  
  async send<T>(action: string, data: any): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }
    
    return new Promise((resolve, reject) => {
      const requestId = `req_${++this.requestId}`;
      
      this.messageHandlers.set(requestId, (responseData) => {
        resolve(responseData);
      });
      
      this.ws!.send(JSON.stringify({
        request_id: requestId,
        action,
        data
      }));
      
      // Timeout nakon 30 sekundi
      setTimeout(() => {
        if (this.messageHandlers.has(requestId)) {
          this.messageHandlers.delete(requestId);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }
  
  subscribe(event: string, callback: (data: any) => void) {
    this.messageHandlers.set(event, callback);
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Korišćenje
const ws = new WebSocketAPIService('wss://api.example.com/ws');

await ws.connect();

// Request-Response
const hotels = await ws.send('search_hotels', {
  city: 'Hurghada',
  checkin: '2026-02-15',
  checkout: '2026-02-22'
});

// Subscribe na real-time updates
ws.subscribe('price_update', (data) => {
  console.log('Price updated:', data);
});

// Disconnect
ws.disconnect();
```

---

## 5. Server-Sent Events (SSE)

### **Opis:**
- Jednosmerna komunikacija (server → client)
- Real-time updates
- Jednostavnije od WebSocket-a

### **Primer:**
```typescript
class SSEAPIService {
  private eventSource: EventSource | null = null;
  
  constructor(private url: string) {}
  
  connect(token: string) {
    const urlWithAuth = `${this.url}?token=${token}`;
    this.eventSource = new EventSource(urlWithAuth);
    
    this.eventSource.onopen = () => {
      console.log('SSE connected');
    };
    
    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
    };
  }
  
  on(eventType: string, callback: (data: any) => void) {
    if (!this.eventSource) {
      throw new Error('Not connected');
    }
    
    this.eventSource.addEventListener(eventType, (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      callback(data);
    });
  }
  
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

// Korišćenje
const sse = new SSEAPIService('https://api.example.com/events');

sse.connect('your-token');

// Slušaj price updates
sse.on('price_update', (data) => {
  console.log('New price:', data.price);
  updateUI(data);
});

// Slušaj booking confirmations
sse.on('booking_confirmed', (data) => {
  console.log('Booking confirmed:', data.code);
  showNotification(data);
});

// Disconnect
sse.disconnect();
```

---

## 6. gRPC (Protocol Buffers)

### **Opis:**
- Binary protocol
- Vrlo brz
- Koristi Protocol Buffers

### **Primer:**
```typescript
// hotel.proto
/*
syntax = "proto3";

service HotelService {
  rpc SearchHotels (SearchRequest) returns (SearchResponse);
  rpc GetHotel (GetHotelRequest) returns (Hotel);
  rpc CreateBooking (BookingRequest) returns (Booking);
}

message SearchRequest {
  string city = 1;
  string checkin = 2;
  string checkout = 3;
  int32 adults = 4;
}

message SearchResponse {
  repeated Hotel hotels = 1;
}

message Hotel {
  string id = 1;
  string name = 2;
  double price = 3;
  int32 stars = 4;
}
*/

// TypeScript client (generisan iz .proto fajla)
import { HotelServiceClient } from './generated/hotel_grpc_web_pb';
import { SearchRequest, GetHotelRequest, BookingRequest } from './generated/hotel_pb';

class GRPCAPIService {
  private client: HotelServiceClient;
  
  constructor(endpoint: string) {
    this.client = new HotelServiceClient(endpoint);
  }
  
  async searchHotels(city: string, checkin: string, checkout: string, adults: number) {
    const request = new SearchRequest();
    request.setCity(city);
    request.setCheckin(checkin);
    request.setCheckout(checkout);
    request.setAdults(adults);
    
    return new Promise((resolve, reject) => {
      this.client.searchHotels(request, {}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response.getHotelsList());
        }
      });
    });
  }
  
  async getHotel(hotelId: string) {
    const request = new GetHotelRequest();
    request.setId(hotelId);
    
    return new Promise((resolve, reject) => {
      this.client.getHotel(request, {}, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Korišćenje
const grpc = new GRPCAPIService('https://api.example.com:50051');

const hotels = await grpc.searchHotels('Hurghada', '2026-02-15', '2026-02-22', 2);
```

---

# 🔄 PAGINATION PATTERNS

## 1. Offset-Based Pagination

### **Opis:**
- Koristi `offset` i `limit`
- Jednostavno ali može biti sporo

### **Primer:**
```typescript
const getHotels = async (page: number, pageSize: number = 20) => {
  const offset = (page - 1) * pageSize;
  
  const response = await fetch(
    `${baseUrl}/hotels?offset=${offset}&limit=${pageSize}`,
    {
      headers: getAuthHeaders()
    }
  );
  
  const data = await response.json();
  
  return {
    items: data.hotels,
    total: data.total,
    page,
    pageSize,
    totalPages: Math.ceil(data.total / pageSize)
  };
};

// Korišćenje
const page1 = await getHotels(1, 20); // Hoteli 1-20
const page2 = await getHotels(2, 20); // Hoteli 21-40
```

---

## 2. Cursor-Based Pagination

### **Opis:**
- Koristi cursor (ID poslednjeg elementa)
- Brže i konzistentnije

### **Primer:**
```typescript
const getHotels = async (cursor?: string, limit: number = 20) => {
  const params = new URLSearchParams({
    limit: limit.toString()
  });
  
  if (cursor) {
    params.append('cursor', cursor);
  }
  
  const response = await fetch(
    `${baseUrl}/hotels?${params}`,
    {
      headers: getAuthHeaders()
    }
  );
  
  const data = await response.json();
  
  return {
    items: data.hotels,
    nextCursor: data.next_cursor,
    hasMore: data.has_more
  };
};

// Korišćenje
let cursor: string | undefined;
let allHotels: any[] = [];

do {
  const result = await getHotels(cursor, 20);
  allHotels = [...allHotels, ...result.items];
  cursor = result.nextCursor;
} while (cursor);
```

---

## 3. Page-Based Pagination

### **Opis:**
- Koristi `page` i `per_page`
- Najčešći format

### **Primer:**
```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

const getHotels = async (page: number = 1, perPage: number = 20): Promise<PaginatedResponse<Hotel>> => {
  const response = await fetch(
    `${baseUrl}/hotels?page=${page}&per_page=${perPage}`,
    {
      headers: getAuthHeaders()
    }
  );
  
  return response.json();
};

// Korišćenje sa auto-load more
const loadAllHotels = async () => {
  let page = 1;
  let allHotels: Hotel[] = [];
  let hasMore = true;
  
  while (hasMore) {
    const result = await getHotels(page);
    allHotels = [...allHotels, ...result.data];
    
    hasMore = result.meta.current_page < result.meta.total_pages;
    page++;
  }
  
  return allHotels;
};
```

---

# 🔍 FILTERING & SORTING

## 1. Query Parameters Filtering

### **Primer:**
```typescript
interface HotelFilters {
  city?: string;
  stars?: number[];
  minPrice?: number;
  maxPrice?: number;
  facilities?: string[];
  mealPlan?: string;
}

const searchHotels = async (filters: HotelFilters) => {
  const params = new URLSearchParams();
  
  if (filters.city) {
    params.append('city', filters.city);
  }
  
  if (filters.stars && filters.stars.length > 0) {
    filters.stars.forEach(star => {
      params.append('stars[]', star.toString());
    });
  }
  
  if (filters.minPrice !== undefined) {
    params.append('min_price', filters.minPrice.toString());
  }
  
  if (filters.maxPrice !== undefined) {
    params.append('max_price', filters.maxPrice.toString());
  }
  
  if (filters.facilities && filters.facilities.length > 0) {
    params.append('facilities', filters.facilities.join(','));
  }
  
  if (filters.mealPlan) {
    params.append('meal_plan', filters.mealPlan);
  }
  
  const response = await fetch(`${baseUrl}/hotels?${params}`, {
    headers: getAuthHeaders()
  });
  
  return response.json();
};

// Korišćenje
const hotels = await searchHotels({
  city: 'Hurghada',
  stars: [4, 5],
  minPrice: 500,
  maxPrice: 1500,
  facilities: ['pool', 'spa', 'wifi'],
  mealPlan: 'all-inclusive'
});
```

---

## 2. Sorting

### **Primer:**
```typescript
type SortOrder = 'asc' | 'desc';

interface SortOptions {
  field: string;
  order: SortOrder;
}

const getHotels = async (sort?: SortOptions) => {
  const params = new URLSearchParams();
  
  if (sort) {
    params.append('sort_by', sort.field);
    params.append('sort_order', sort.order);
  }
  
  const response = await fetch(`${baseUrl}/hotels?${params}`, {
    headers: getAuthHeaders()
  });
  
  return response.json();
};

// Korišćenje
const hotelsByPrice = await getHotels({ field: 'price', order: 'asc' });
const hotelsByRating = await getHotels({ field: 'rating', order: 'desc' });
```

---

# 📤 FILE UPLOAD

## 1. Single File Upload

### **Primer:**
```typescript
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('description', 'Hotel image');
  
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Ne postavljaj Content-Type - browser će automatski
    },
    body: formData
  });
  
  return response.json();
};

// Korišćenje
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const file = fileInput.files![0];
const result = await uploadFile(file);
```

---

## 2. Multiple Files Upload

### **Primer:**
```typescript
const uploadMultipleFiles = async (files: File[]) => {
  const formData = new FormData();
  
  files.forEach((file, index) => {
    formData.append(`files[${index}]`, file);
  });
  
  formData.append('hotel_id', '12345');
  
  const response = await fetch(`${baseUrl}/upload/multiple`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};
```

---

## 3. Chunked Upload (Large Files)

### **Primer:**
```typescript
const uploadLargeFile = async (file: File, chunkSize: number = 1024 * 1024) => {
  const totalChunks = Math.ceil(file.size / chunkSize);
  const uploadId = `upload_${Date.now()}`;
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('upload_id', uploadId);
    formData.append('chunk_index', chunkIndex.toString());
    formData.append('total_chunks', totalChunks.toString());
    
    await fetch(`${baseUrl}/upload/chunk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    // Progress callback
    const progress = ((chunkIndex + 1) / totalChunks) * 100;
    console.log(`Upload progress: ${progress.toFixed(2)}%`);
  }
  
  // Finalize upload
  const response = await fetch(`${baseUrl}/upload/finalize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ upload_id: uploadId })
  });
  
  return response.json();
};
```

---

# 📥 FILE DOWNLOAD

## 1. Simple Download

### **Primer:**
```typescript
const downloadFile = async (fileId: string) => {
  const response = await fetch(`${baseUrl}/files/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'download';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
```

---

## 2. Download with Progress

### **Primer:**
```typescript
const downloadFileWithProgress = async (
  fileId: string,
  onProgress: (progress: number) => void
) => {
  const response = await fetch(`${baseUrl}/files/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const contentLength = response.headers.get('Content-Length');
  const total = parseInt(contentLength!, 10);
  let loaded = 0;
  
  const reader = response.body!.getReader();
  const chunks: Uint8Array[] = [];
  
  while (true) {
    const { done, value } = await reader.read();
    
    if (done) break;
    
    chunks.push(value);
    loaded += value.length;
    
    const progress = (loaded / total) * 100;
    onProgress(progress);
  }
  
  const blob = new Blob(chunks);
  const url = window.URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `file_${fileId}`;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Korišćenje
await downloadFileWithProgress('12345', (progress) => {
  console.log(`Download progress: ${progress.toFixed(2)}%`);
  updateProgressBar(progress);
});
```

---

# 🔄 RETRY & ERROR HANDLING

## 1. Automatic Retry

### **Primer:**
```typescript
const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<Response> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Retry na 5xx greške
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        console.log(`Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Exponential backoff
        retryDelay *= 2;
      }
    }
  }
  
  throw lastError!;
};
```

---

## 2. Circuit Breaker Pattern

### **Primer:**
```typescript
class CircuitBreaker {
  private failureCount = 0;
  private successCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private nextAttempt = Date.now();
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private monitoringPeriod: number = 10000
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }
  
  private onFailure() {
    this.failureCount++;
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}

// Korišćenje
const breaker = new CircuitBreaker(5, 60000);

const getHotels = async () => {
  return breaker.execute(async () => {
    const response = await fetch(`${baseUrl}/hotels`);
    return response.json();
  });
};
```

---

# 🎯 UNIFIED API ADAPTER

## Kompletan Primer - Sve u Jednom

```typescript
/**
 * Unified API Adapter
 * Podržava sve vrste API-ja i protokola
 */

interface APIConfig {
  baseUrl: string;
  type: 'REST' | 'GraphQL' | 'SOAP' | 'WebSocket' | 'gRPC';
  auth: {
    type: 'Basic' | 'Bearer' | 'OAuth2' | 'APIKey' | 'Session';
    credentials: any;
  };
  retry?: {
    maxRetries: number;
    retryDelay: number;
  };
  timeout?: number;
}

class UnifiedAPIAdapter {
  private config: APIConfig;
  private circuitBreaker: CircuitBreaker;
  
  constructor(config: APIConfig) {
    this.config = config;
    this.circuitBreaker = new CircuitBreaker();
  }
  
  async request<T>(
    endpoint: string,
    options: {
      method?: string;
      params?: any;
      body?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    return this.circuitBreaker.execute(async () => {
      switch (this.config.type) {
        case 'REST':
          return this.restRequest<T>(endpoint, options);
        case 'GraphQL':
          return this.graphqlRequest<T>(endpoint, options);
        case 'SOAP':
          return this.soapRequest<T>(endpoint, options);
        case 'WebSocket':
          return this.wsRequest<T>(endpoint, options);
        default:
          throw new Error(`Unsupported API type: ${this.config.type}`);
      }
    });
  }
  
  private async restRequest<T>(endpoint: string, options: any): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers = await this.getAuthHeaders();
    
    const response = await fetchWithRetry(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    }, this.config.retry?.maxRetries);
    
    return response.json();
  }
  
  private async graphqlRequest<T>(query: string, options: any): Promise<T> {
    const url = `${this.config.baseUrl}/graphql`;
    const headers = await this.getAuthHeaders();
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        query,
        variables: options.params
      })
    });
    
    const result = await response.json();
    
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    
    return result.data;
  }
  
  private async soapRequest<T>(action: string, options: any): Promise<T> {
    // SOAP implementation
    throw new Error('SOAP not implemented yet');
  }
  
  private async wsRequest<T>(action: string, options: any): Promise<T> {
    // WebSocket implementation
    throw new Error('WebSocket not implemented yet');
  }
  
  private async getAuthHeaders(): Promise<Record<string, string>> {
    switch (this.config.auth.type) {
      case 'Basic':
        return {
          'Authorization': `Basic ${btoa(`${this.config.auth.credentials.username}:${this.config.auth.credentials.password}`)}`
        };
      
      case 'Bearer':
        return {
          'Authorization': `Bearer ${this.config.auth.credentials.token}`
        };
      
      case 'OAuth2':
        const token = await this.getOAuthToken();
        return {
          'Authorization': `Bearer ${token}`
        };
      
      case 'APIKey':
        return {
          'X-API-Key': this.config.auth.credentials.apiKey
        };
      
      default:
        return {};
    }
  }
  
  private async getOAuthToken(): Promise<string> {
    // OAuth2 token logic
    return this.config.auth.credentials.token;
  }
}

// Korišćenje
const tctApi = new UnifiedAPIAdapter({
  baseUrl: 'https://imc-dev.tct.travel',
  type: 'REST',
  auth: {
    type: 'Basic',
    credentials: {
      username: 'user',
      password: 'pass'
    }
  },
  retry: {
    maxRetries: 3,
    retryDelay: 1000
  }
});

// REST poziv
const hotels = await tctApi.request('/v1/hotel/searchSync', {
  method: 'POST',
  body: {
    search_type: 'city',
    location: '647126'
  }
});
```

---

# 📚 ZAKLJUČAK

Ovaj dokument pokriva:

✅ **HTTP Metode:** GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS  
✅ **Autentifikacija:** Basic, Bearer, API Key, OAuth2, Session  
✅ **Protokoli:** REST, GraphQL, SOAP, WebSocket, SSE, gRPC  
✅ **Pagination:** Offset, Cursor, Page-based  
✅ **Filtering & Sorting**  
✅ **File Upload/Download**  
✅ **Retry & Error Handling**  
✅ **Circuit Breaker Pattern**  
✅ **Unified API Adapter**  

**Sve što vam treba za bilo koju API integraciju!** 🎉

---

**Poslednje ažuriranje:** 2026-01-04  
**Verzija:** 1.0  
**Status:** Kompletno
