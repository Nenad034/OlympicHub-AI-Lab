-- Olympic Hub Supabase Schema Setup

-- 1. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('Hotel', 'DMC', 'Airline', 'Transport', 'Insurance')),
    contact JSONB,
    address JSONB,
    bankDetails JSONB,
    contractStatus TEXT DEFAULT 'Pending' CHECK (contractStatus IN ('Active', 'Pending', 'Expired')),
    rating INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    document JSONB,
    preferences JSONB,
    loyaltyPoints INTEGER DEFAULT 0,
    totalBookings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Properties (Hotels) Table
CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    propertyType TEXT CHECK (propertyType IN ('Hotel', 'Apartment', 'Villa', 'Resort', 'Hostel', 'GuestHouse')),
    starRating INTEGER,
    isActive BOOLEAN DEFAULT TRUE,
    address JSONB,
    geoCoordinates JSONB,
    pointsOfInterest JSONB,
    content JSONB,
    images JSONB,
    roomTypes JSONB,
    propertyAmenities JSONB,
    ratePlans JSONB,
    taxes JSONB,
    houseRules JSONB,
    keyCollection JSONB,
    hostProfile JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Application Config Table
CREATE TABLE IF NOT EXISTS app_config (
    id TEXT PRIMARY KEY DEFAULT 'main',
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Deep Archive Table (Immutable logs)
CREATE TABLE IF NOT EXISTS deep_archive (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    entityType TEXT NOT NULL,
    entityId TEXT NOT NULL,
    oldData JSONB,
    changedBy TEXT,
    userEmail TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    summary TEXT
);

-- 6. User Accounts Table
CREATE TABLE IF NOT EXISTS user_accounts (
    id TEXT PRIMARY KEY,
    firstName TEXT,
    lastName TEXT,
    email TEXT UNIQUE,
    fixedPhone TEXT,
    mobilePhone TEXT,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Access Rules Table
CREATE TABLE IF NOT EXISTS access_rules (
    id INTEGER PRIMARY KEY, -- level number
    modules JSONB NOT NULL
);

-- Insert Default Access Rules
INSERT INTO access_rules (id, modules) VALUES
(1, '["dashboard", "search"]'),
(2, '["dashboard", "search", "customers"]'),
(3, '["dashboard", "search", "customers", "suppliers", "production-hub"]'),
(4, '["dashboard", "search", "customers", "suppliers", "production-hub", "mars-analysis"]'),
(5, '["dashboard", "search", "customers", "suppliers", "production-hub", "mars-analysis", "settings"]'),
(6, '["dashboard", "search", "customers", "suppliers", "production-hub", "mars-analysis", "settings", "master-access"]')
ON CONFLICT (id) DO UPDATE SET modules = EXCLUDED.modules;

-- 8. Tours Table (Group Travels, Cruises, etc.)
CREATE TABLE IF NOT EXISTS tours (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT CHECK (category IN ('Grupno', 'Individualno', 'Krstarenje', 'StayAndCruise')),
    status TEXT DEFAULT 'Draft' CHECK (status IN ('Draft', 'Published', 'Archived')),
    startDate DATE,
    endDate DATE,
    durationDays INTEGER,
    basePrice NUMERIC(12, 2),
    currency TEXT DEFAULT 'EUR',
    shortDescription TEXT,
    longDescription TEXT,
    highlights JSONB,
    mainImage JSONB,
    gallery JSONB,
    itinerary JSONB, -- The dynamic timeline
    supplements JSONB,
    logistics JSONB, -- Seats, occupancy, transport info
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
